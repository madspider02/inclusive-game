/** Google Apps Script integration for static GitHub Pages. V6. */
const CONFIG = window.CLASSROOM_CONFIG || {};
export const API_URL = String(CONFIG.API_URL || '').trim();
export const IS_DEMO = API_URL.length === 0;
export const REQUIRED_BACKEND_VERSION = '6.0.0';
const LOCAL_KEY = 'classroom-perspective-local-v1';
let sequence = 0;

function assertEndpoint() {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(API_URL)) {
    throw new Error('config.js 的 API_URL 格式錯誤，請填入 Google Apps Script 的 /exec 網址。');
  }
}
function loadDemo() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    return { posts: Array.isArray(data.posts) ? data.posts : [], replies: Array.isArray(data.replies) ? data.replies : [] };
  } catch (_) { return { posts: [], replies: [] }; }
}
function storeDemo(data) { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); }

// ContentService redirects responses to googleusercontent.com; use read-only JSONP only for
// non-sensitive data. NEVER transmit private reflection text via a GET query string.
function jsonp(params = {}, timeoutMs = 10000) {
  assertEndpoint();
  return new Promise((resolve,reject)=>{
    const callback = `_classroomCallback_${Date.now()}_${++sequence}`;
    const script = document.createElement('script');
    const url = new URL(API_URL);
    Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));
    url.searchParams.set('prefix',callback);
    url.searchParams.set('_t',String(Date.now()));
    let settled=false;
    let timeoutId;
    const cleanup=()=>{ delete window[callback];script.remove();clearTimeout(timeoutId); };
    const settle=(fn,val)=>{if(settled)return;settled=true;cleanup();fn(val);};
    timeoutId=window.setTimeout(()=>settle(reject,new Error('無法讀取 Apps Script；可能是部署網址、公開權限或網路問題。')),timeoutMs);
    window[callback]=val=>settle(resolve,val);
    script.onerror=()=>settle(reject,new Error('無法載入 Apps Script 的 JSONP 回應，請確認對「任何人」開放並重新部署。'));
    script.src=url.toString();
    document.head.appendChild(script);
  });
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

export async function checkBackendHealth(){
  if(IS_DEMO)return {ok:true,demo:true,apiVersion:'local-demo',message:'此瀏覽器為本機示範模式'};
  const res=await jsonp({action:'health'});
  if(!res || res.ok===false){
    throw new Error(`後端回應健康檢查失敗：${res?.error || '未知錯誤'}。請確認已更新 Code.gs 並編輯原部署為「新增版本」。`);
  }
  if(res.apiVersion!==REQUIRED_BACKEND_VERSION){
    throw new Error(`目前 /exec 不是 V6 後端（收到 ${res.apiVersion || '無版本號'}）。請將 Code.gs 更新並「管理部署作業 → 編輯 → 新增版本 → 部署」。`);
  }
  return res;
}

export async function checkSubmission(id,kind='submit'){
  if(IS_DEMO){
    const data=loadDemo();
    const row=kind==='reply'?data.replies.find(r=>r.id===id):data.posts.find(p=>p.id===id);
    return {ok:true,exists:!!row,moderation:row && kind==='submit'&&!row.publish?'private':'visible'};
  }
  const res=await jsonp({action:'check',id,kind},9500);
  if(!res || !res.ok)throw new Error(res?.error || '無法確認寫入結果。');
  if(res.apiVersion!==REQUIRED_BACKEND_VERSION)throw new Error('後端版本不一致，無法確認本次寫入。');
  return res;
}

async function postNoCors(payload){
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),12000);
  try {
    await fetch(API_URL,{
      method:'POST', mode:'no-cors', redirect:'follow',
      headers:{'Content-Type':'text/plain;charset=UTF-8'},
      body:JSON.stringify(payload),signal:controller.signal
    });
  } finally {clearTimeout(timeout);}
}

// Browser-native form POST is a fallback when cross-origin fetch fails / is silently discarded.
// The hidden iframe response is NOT read (cross-origin). Successful saving is verified by JSONP.
function postViaForm(payload){
  return new Promise((resolve,reject)=>{
    const iframe=document.createElement('iframe');
    const target=`classroom_post_${Date.now()}_${++sequence}`;
    iframe.name=target;iframe.title='Google Sheets 後端送出背景框架';iframe.hidden=true;
    const form=document.createElement('form');form.action=API_URL;
    form.target=target;form.method='POST';form.enctype='application/x-www-form-urlencoded';form.hidden=true;
    const field=document.createElement('input');field.type='hidden';field.name='payload';field.value=JSON.stringify(payload);
    form.append(field);document.body.append(iframe,form);
    try { form.submit(); resolve(); }
    catch(err){reject(new Error('備援表單無法送出：'+err.message));}
    finally { window.setTimeout(()=>{form.remove();iframe.remove();},20000); }
  });
}

async function verifyRepeatedly(id,kind,delays){
  for(const delay of delays){
    await sleep(delay);
    try {
      const answer=await checkSubmission(id,kind);
      if(answer.exists)return {ok:true,moderation:answer.moderation || 'visible',savedId:id};
    } catch(error){
      if(/版本不一致|後端版本/.test(String(error)))throw error;
      // Transient read failure: keep checking the same ID.
    }
  }
  return null;
}

async function postThenVerify(payload){
  await checkBackendHealth(); // Block old /exec deployments BEFORE sending data.
  const kind=payload.action;
  const exists=await checkSubmission(payload.id,kind);
  if(exists.exists)return {ok:true,moderation:exists.moderation,savedId:payload.id,alreadyExists:true};
  let initialError;
  try { await postNoCors(payload); }
  catch(error){ initialError=error; }
  if(!initialError){
    const verified=await verifyRepeatedly(payload.id,kind,[300,650,1200]);
    if(verified)return verified;
  }
  // Same ID is reused; backend uses a lock and de-duplication, so no duplicate rows.
  await postViaForm(payload);
  const verified=await verifyRepeatedly(payload.id,kind,[350,850,1300,1900,2600]);
  if(verified)return verified;
  throw new Error('後端 V6 可以讀取，但沒有找到本次寫入。請開啟「連線診斷」，並在試算表 DeliveryLog 查看是否有 RECEIVED / ERROR 紀錄。保留目前畫面後可以使用同一筆 ID 再送一次。');
}

export async function submitReflection(record){
  if(IS_DEMO){
    const data=loadDemo();
    if(!data.posts.some(p=>p.id===record.id))data.posts.unshift({...record,createdAt:new Date().toISOString()});
    storeDemo(data);
    return {ok:true,demo:true,moderation:record.publish?'visible':'private'};
  }
  return postThenVerify({action:'submit',...record});
}
export async function submitReply(record){
  if(IS_DEMO){
    const data=loadDemo();
    if(!data.replies.some(p=>p.id===record.id))data.replies.push({...record,createdAt:new Date().toISOString()});
    storeDemo(data);
    return {ok:true,demo:true,moderation:'visible'};
  }
  return postThenVerify({action:'reply',...record});
}
export async function loadWall(){
  if(IS_DEMO){
    const data=loadDemo();
    const posts=data.posts.filter(p=>p.publish===true);
    return {ok:true,posts,replies:data.replies.filter(r=>posts.some(p=>p.id===r.parentId)),demo:true};
  }
  const res=await jsonp({action:'list'});
  if(!res?.ok)throw new Error(res?.error||'Google Sheets 讀取失敗。');
  if(res.apiVersion!==REQUIRED_BACKEND_VERSION)throw new Error('交流牆後端版本未更新到 V6，請先更新部署。');
  return {ok:true,posts:res.posts||[],replies:res.replies||[],demo:false};
}
export function makeId(){
  if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
  return `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,15)}`;
}
