/**
 * 「換個位置，看見學習」Google Sheets 後端
 * 安裝方式：Google 試算表 -> 擴充功能 -> Apps Script -> 貼上本檔 -> 部署為網頁應用程式。
 * 網頁應用程式：「執行身分」選我，「誰可以存取」選任何人。
 *
 * 注意：公開網頁表單並不是防濫用的認證系統；適合受控課堂及小型研習。
 * 請要求填暱稱，勿收集真實學生姓名、診斷資料或其他敏感資料。
 */
const WORKSHOP = {
  API_VERSION: '6.0.0',
  // 若 Apps Script 不是從試算表的「擴充功能」建立，可在這裡填入該試算表 ID；繫結式專案留空即可。
  SPREADSHEET_ID: '',
  DIAGNOSTIC_SHEET: 'DeliveryLog',
  RESPONSE_SHEET: 'Responses',
  COMMENT_SHEET: 'Comments',
  // false: 回應送出後立即上牆；true: 先寫為 PENDING，教師於試算表改為 VISIBLE 後上牆。
  MODERATE_NEW_POSTS: false,
  MODERATE_NEW_REPLIES: false,
  MAX_RETURNED_POSTS: 300,
  MAX_RETURNED_REPLIES: 600
};
const RESPONSE_HEADERS = [
  'CreatedAt', 'ID', 'Nickname', 'StudentID', 'Observation',
  'Adjustment', 'Question', 'StrategiesJSON', 'ExperienceJSON', 'Status'
];
const COMMENT_HEADERS = [
  'CreatedAt', 'ID', 'ParentID', 'Nickname', 'Message', 'Status'
];
const ROLE_MAP = { vision:true, hearing:true, adhd:true, reading:true };

function doGet(e) {
  let out;
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'list';
    if (action === 'health') {
      const postsSheet=getSheet_(WORKSHOP.RESPONSE_SHEET,RESPONSE_HEADERS);
      const repliesSheet=getSheet_(WORKSHOP.COMMENT_SHEET,COMMENT_HEADERS);
      out = { ok:true, apiVersion:WORKSHOP.API_VERSION,
        sheets:{responses:postsSheet.getName(), comments:repliesSheet.getName(), deliveryLog:WORKSHOP.DIAGNOSTIC_SHEET},
        responseCount:Math.max(0,postsSheet.getLastRow()-1), commentCount:Math.max(0,repliesSheet.getLastRow()-1),
        message:'後端可讀取試算表；請再執行寫入測試確認 doPost。' };
    } else if (action === 'list') {
      const posts = listPublicPosts_();
      out = { ok:true, apiVersion:WORKSHOP.API_VERSION, posts:posts, replies:listPublicReplies_(posts) };
    } else if (action === 'check') {
      const id = normalizeId_(params.id);
      const kind = params.kind;
      if (!id || (kind !== 'submit' && kind !== 'reply')) throw new Error('無效的確認參數。');
      const name = kind === 'submit' ? WORKSHOP.RESPONSE_SHEET : WORKSHOP.COMMENT_SHEET;
      const headers = kind === 'submit' ? RESPONSE_HEADERS : COMMENT_HEADERS;
      const sheet = getSheet_(name, headers);
      const idRow = findIdRow_(sheet, id);
      const statusColumn = kind === 'submit' ? 10 : 6;
      const status = idRow ? String(sheet.getRange(idRow, statusColumn).getValue()) : '';
      out = { ok:true, apiVersion:WORKSHOP.API_VERSION, exists:!!idRow, moderation:status === 'PENDING' ? 'pending' : status === 'HIDDEN' ? 'hidden' : status === 'PRIVATE' ? 'private' : 'visible' };
    } else {
      throw new Error('不支援的讀取動作。');
    }
  } catch (error) {
    out = { ok:false, error:String(error && error.message ? error.message : error) };
  }
  const prefix = e && e.parameter ? String(e.parameter.prefix || '') : '';
  if (prefix) {
    // 只允許純函式識別符。JSONP *僅能* 回傳公開、非敏感資料。
    if (!/^[A-Za-z_$][A-Za-z0-9_$]{0,100}$/.test(prefix)) {
      return ContentService.createTextOutput('/* invalid callback */').setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(prefix + '(' + JSON.stringify(out) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse_(out);
}

function doPost(e) {
  let action='unknown', requestId='';
  try {
    // 支援 no-cors fetch (raw text/plain JSON) 與 HTML form fallback (payload 欄位)。
    const raw = e && e.parameter && e.parameter.payload
      ? String(e.parameter.payload)
      : e && e.postData ? String(e.postData.contents || '') : '';
    if (!raw || raw.length > 15000) throw new Error('無效或過長的資料。');
    const input = JSON.parse(raw);
    action=String(input.action || 'unknown');
    requestId=normalizeId_(input.id);
    audit_(action,requestId,'RECEIVED','Web request accepted for parsing');
    let response;
    if (action === 'submit') response = saveReflection_(input);
    else if (action === 'reply') response = saveComment_(input);
    else throw new Error('不支援的寫入動作：'+action);
    audit_(action,requestId,'SAVED',response.alreadyExists?'Already existed (idempotent)':'Stored in Google Sheets');
    return jsonResponse_(Object.assign({ apiVersion:WORKSHOP.API_VERSION },response));
  } catch (error) {
    const message=String(error && error.message ? error.message : error);
    audit_(action,requestId,'ERROR',message);
    console.error('doPost failed ('+action+'): '+message);
    return jsonResponse_({ ok:false, apiVersion:WORKSHOP.API_VERSION, error:message });
  }
}

function audit_(action,id,phase,detail) {
  // 僅記錄動作、ID、結果與錯誤代碼，不記錄暱稱或反思內容，避免額外存放個資。
  try {
    const book=openBook_();
    let sheet=book.getSheetByName(WORKSHOP.DIAGNOSTIC_SHEET);
    if(!sheet)sheet=book.insertSheet(WORKSHOP.DIAGNOSTIC_SHEET);
    if(sheet.getLastRow()===0)sheet.appendRow(['At','Action','RequestID','Phase','Detail']);
    sheet.appendRow([new Date(),String(action||''),String(id||''),String(phase||''),clean_(detail,180)]);
  } catch(error){console.warn('Audit log unavailable: '+error);}
}

function saveReflection_(input) {
  const id = normalizeId_(input.id);
  const studentId = String(input.studentId || '');
  const nickname = clean_(input.nickname, 24);
  const observation = clean_(input.observation, 800);
  const adjustment = clean_(input.adjustment, 1000);
  const question = clean_(input.question, 600);
  if (!id || !ROLE_MAP[studentId] || !nickname) throw new Error('參與者與學生欄位不完整。');
  if (observation.length < 10 || adjustment.length < 10) throw new Error('前兩題各至少需要 10 個字。');
  const strategies = Array.isArray(input.strategies) ? input.strategies.slice(0,8).map(v => clean_(v,80)) : [];
  const experience = input.experience && typeof input.experience === 'object' ? input.experience : {};
  const experienceText = JSON.stringify(experience).slice(0,2400);
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const sheet = getSheet_(WORKSHOP.RESPONSE_SHEET, RESPONSE_HEADERS);
    if (findIdRow_(sheet,id)) return { ok:true, alreadyExists:true };
    sheet.appendRow([
      new Date(), id, guardFormula_(nickname), studentId, guardFormula_(observation),
      guardFormula_(adjustment), guardFormula_(question), JSON.stringify(strategies), experienceText,
      input.publish === true ? (WORKSHOP.MODERATE_NEW_POSTS ? 'PENDING' : 'VISIBLE') : 'PRIVATE'
    ]);
    SpreadsheetApp.flush();
    return { ok:true };
  } finally { lock.releaseLock(); }
}

function saveComment_(input) {
  const id=normalizeId_(input.id);
  const parentId=normalizeId_(input.parentId);
  const nickname=clean_(input.nickname,24);
  const message=clean_(input.message,600);
  if (!id || !parentId || !nickname || message.length<3) throw new Error('回覆欄位不完整。');
  const lock=LockService.getScriptLock(); lock.waitLock(25000);
  try {
    const posts=getSheet_(WORKSHOP.RESPONSE_SHEET,RESPONSE_HEADERS);
    const parentRow=findIdRow_(posts,parentId);
    if (!parentRow || String(posts.getRange(parentRow,10).getValue())!=='VISIBLE') {
      throw new Error('原分享不存在或尚未公開。');
    }
    const comments=getSheet_(WORKSHOP.COMMENT_SHEET,COMMENT_HEADERS);
    if (findIdRow_(comments,id)) return { ok:true, alreadyExists:true };
    comments.appendRow([new Date(),id,parentId,guardFormula_(nickname),guardFormula_(message),
      WORKSHOP.MODERATE_NEW_REPLIES?'PENDING':'VISIBLE']);
    SpreadsheetApp.flush();
    return { ok:true };
  } finally { lock.releaseLock(); }
}

function listPublicPosts_() {
  const sheet=getSheet_(WORKSHOP.RESPONSE_SHEET,RESPONSE_HEADERS);
  const values=readRecentRows_(sheet,WORKSHOP.MAX_RETURNED_POSTS,RESPONSE_HEADERS.length);
  return values.filter(row => String(row[9])==='VISIBLE' && ROLE_MAP[String(row[3])]).map(row => {
    let strategies=[];
    try { strategies=JSON.parse(String(row[7]||'[]')); } catch (e) { strategies=[]; }
    return {
      createdAt:dateISO_(row[0]),id:String(row[1]),nickname:String(row[2]),studentId:String(row[3]),
      observation:String(row[4]),adjustment:String(row[5]),question:String(row[6]),
      strategies:Array.isArray(strategies)?strategies:[]
    };
  });
}
function listPublicReplies_(publicPosts) {
  const visibleParentIds = {};
  publicPosts.forEach(post => { visibleParentIds[post.id] = true; });
  const sheet=getSheet_(WORKSHOP.COMMENT_SHEET,COMMENT_HEADERS);
  const values=readRecentRows_(sheet,WORKSHOP.MAX_RETURNED_REPLIES,COMMENT_HEADERS.length);
  return values.filter(row=>String(row[5])==='VISIBLE' && visibleParentIds[String(row[2])]).map(row=>({
    createdAt:dateISO_(row[0]),id:String(row[1]),parentId:String(row[2]),
    nickname:String(row[3]),message:String(row[4])
  }));
}
function readRecentRows_(sheet,limit,numColumns) {
  const last=sheet.getLastRow();
  if(last<=1)return [];
  const first=Math.max(2,last-limit+1);
  return sheet.getRange(first,1,last-first+1,numColumns).getValues();
}
function dateISO_(value) {
  return value instanceof Date ? value.toISOString() : String(value || '');
}
function openBook_() {
  const book=WORKSHOP.SPREADSHEET_ID ? SpreadsheetApp.openById(WORKSHOP.SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if(!book)throw new Error('找不到試算表：請從試算表的「擴充功能 → Apps Script」建立專案，或設定 WORKSHOP.SPREADSHEET_ID。');
  return book;
}

function getSheet_(name,headers) {
  const book=openBook_();
  let sheet=book.getSheetByName(name);
  // 如果使用者曾經部署過舊版（id/createdAt/participant...），不能把新版十欄資料寫進舊版九欄。
  // 在不動到舊資料的前提下，自動改用 Responses_V3 / Comments_V3。
  if(sheet && sheet.getLastRow() > 0) {
    const actual=sheet.getRange(1,1,1,headers.length).getValues()[0].map(String);
    if(headers.some((h,i)=>actual[i]!==h)) sheet=book.getSheetByName(name+'_V3');
  }
  if(!sheet){
    const original=book.getSheetByName(name);
    let target=name;
    if(original && original.getLastRow()>0) {
      const actual=original.getRange(1,1,1,headers.length).getValues()[0].map(String);
      if(headers.some((h,i)=>actual[i]!==h)) target=name+'_V3';
    }
    sheet=book.getSheetByName(target)||book.insertSheet(target);
  }
  if(sheet.getLastRow()===0){
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#d7ebe5');
    sheet.autoResizeColumns(1,Math.min(headers.length,10));
  }
  return sheet;
}
function findIdRow_(sheet,id) {
  if(sheet.getLastRow()<2)return null;
  const hit=sheet.getRange(2,2,sheet.getLastRow()-1,1).createTextFinder(id)
    .matchEntireCell(true).findNext();
  return hit?hit.getRow():null;
}
function normalizeId_(value) {
  const id=String(value||'').trim();
  return /^[A-Za-z0-9_-]{8,90}$/.test(id)?id:'';
}
function clean_(value,max) {
  return String(value==null?'':value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')
    .trim().slice(0,max);
}
function guardFormula_(value) {
  // 防止使用者輸入被試算表解讀為公式。顯示時仍以純文字處理。
  return /^[=+\-@\t\r]/.test(value) ? "'"+value : value;
}
function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 安裝時在 Apps Script 編輯器手動執行一次，初始化工作表並完成 Google 授權。 */
function setupSheets() {
  getSheet_(WORKSHOP.RESPONSE_SHEET,RESPONSE_HEADERS);
  getSheet_(WORKSHOP.COMMENT_SHEET,COMMENT_HEADERS);
  audit_('setup','setupSheets','READY','v'+WORKSHOP.API_VERSION+' initialised');
  const migrated=migrateOldVersion_();
  return '新版工作表已就緒。舊版成功轉入 '+migrated+' 筆資料；不會刪除舊工作表。';
}

/** 直接在 Apps Script 編輯器執行，用同一寫入程式測試 Sheet 權限與欄位。 */
function testWriteFromEditor() {
  setupSheets();
  const id=Utilities.getUuid();
  const result=saveReflection_({
    id:id, action:'submit', studentId:'adhd', nickname:'系統連線測試',
    observation:'這是一筆由 Google Apps Script 編輯器產生的測試資料，用於確認可以寫入。',
    adjustment:'這筆資料僅供連線測試，確認完成後主持教師可從試算表刪除。',
    question:'', strategies:[], experience:{test:true}, publish:false
  });
  const sheet=getSheet_(WORKSHOP.RESPONSE_SHEET,RESPONSE_HEADERS);
  if(!findIdRow_(sheet,id))throw new Error('寫入 API 回傳成功，但無法找到測試 ID。');
  audit_('editor-test',id,'SAVED','testWriteFromEditor completed');
  Logger.log('測試成功，資料已寫入工作表：'+sheet.getName()+'；測試 ID：'+id);
  return result;
}

/** 可在編輯器中直接執行，避免誤按 doGet() 時出現 undefined.parameter。 */
function testDoGet(){
  const response=doGet({parameter:{action:'list'}});
  Logger.log(response.getContent());
}

/** 把曾經使用 Code_fixed.gs 的舊資料複製到新架構；重複執行不會重複匯入。 */
function migrateOldVersion_() {
  const book=openBook_();
  const oldPosts=book.getSheetByName('Responses');
  const oldComments=book.getSheetByName('Comments');
  const posts=getSheet_(WORKSHOP.RESPONSE_SHEET,RESPONSE_HEADERS);
  const replies=getSheet_(WORKSHOP.COMMENT_SHEET,COMMENT_HEADERS);
  let imported=0;
  if(oldPosts && oldPosts!==posts && oldPosts.getLastRow()>1){
    const header=oldPosts.getRange(1,1,1,oldPosts.getLastColumn()).getValues()[0].map(String);
    if(header[0]==='id' && header[2]==='participant'){
      oldPosts.getRange(2,1,oldPosts.getLastRow()-1,Math.max(9,oldPosts.getLastColumn())).getValues().forEach(row=>{
        const id=normalizeId_(row[0]);
        if(!id || findIdRow_(posts,id))return;
        const published=String(row[8]).toLowerCase()==='true';
        const observation=guardFormula_(clean_(row[5],800));
        const adjustment=guardFormula_(clean_(row[6],1000));
        posts.appendRow([new Date(row[1]||new Date()),id,guardFormula_(clean_(row[2],24)),String(row[3]||''),
          observation,adjustment,guardFormula_(clean_(row[7],600)),'[]','{}',published?'VISIBLE':'PRIVATE']);
        imported++;
      });
    }
  }
  if(oldComments && oldComments!==replies && oldComments.getLastRow()>1){
    const header=oldComments.getRange(1,1,1,oldComments.getLastColumn()).getValues()[0].map(String);
    if(header[0]==='id' && header[2]==='responseId'){
      oldComments.getRange(2,1,oldComments.getLastRow()-1,Math.max(5,oldComments.getLastColumn())).getValues().forEach(row=>{
        const id=normalizeId_(row[0]);
        const parentId=normalizeId_(row[2]);
        if(!id || !parentId || findIdRow_(replies,id) || !findIdRow_(posts,parentId))return;
        replies.appendRow([new Date(row[1]||new Date()),id,parentId,guardFormula_(clean_(row[3],24)),guardFormula_(clean_(row[4],600)),'VISIBLE']);
        imported++;
      });
    }
  }
  return imported;
}
