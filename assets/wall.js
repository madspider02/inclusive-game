import { loadWall, submitReply, makeId, IS_DEMO } from './api.js';

const $ = selector => document.querySelector(selector);
const ROLE_LABELS = { vision:'小晴 · 弱視', hearing:'小廷 · 輕度聽損', adhd:'小宇 · 注意力調節', reading:'小禾 · 閱讀理解' };
const state={ posts:[], replies:[], loading:false, filter:'all' };
function el(tag,className,text) {
  const item=document.createElement(tag);
  if(className)item.className=className;
  if(text!==undefined)item.textContent=String(text);
  return item;
}
function formatDate(iso) {
  const date=new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-TW',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
}
function createSection(title,text,kind='') {
  const area=el('div',`post-section ${kind?'is-'+kind:''}`);
  area.append(el('span','post-label',title),el('p','',text));
  return area;
}
function renderStats() {
  $('#postCount').textContent=state.posts.length;
  $('#replyCount').textContent=state.replies.length;
  const counts={};
  state.posts.forEach(p=>{
    (Array.isArray(p.strategies)?p.strategies:[]).forEach(str=>{ if(str.length<75) counts[str]=(counts[str]||0)+1; });
  });
  const largest=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  $('#commonStrategy').textContent=largest?largest[0]:'—';
}
function renderPost(p) {
  const card=el('article','post-card');
  const meta=el('div','post-meta');
  const identity=el('div','post-identity');
  const initials=el('span','post-initial',Array.from(p.nickname||'師')[0]||'師');
  const display=el('div'); display.append(el('b','',p.nickname||'匿名參與者'),el('small','',formatDate(p.createdAt)));
  identity.append(initials,display);
  meta.append(identity,el('span','post-role',ROLE_LABELS[p.studentId]||'課堂體驗'));
  const body=el('div','post-body');
  body.append(createSection('觀察到的參與障礙',p.observation||''),createSection('打算如何調整教學與班級經營',p.adjustment||'','adjustment'));
  if(Array.isArray(p.strategies)&&p.strategies.length){
    const tags=el('div','post-tags');p.strategies.forEach(tag=>tags.appendChild(el('span','',tag)));body.append(tags);
  }
  if(p.question)body.append(createSection('想跟其他老師討論',p.question,'question'));
  card.append(meta,body);
  const replies=state.replies.filter(r=>r.parentId===p.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const replyBar=el('div','reply-bar');const count=el('span','',`${replies.length} 則延伸討論`);
  const toggle=el('button','reply-toggle','＋ 回覆這位老師');toggle.type='button';toggle.setAttribute('aria-expanded','false');
  replyBar.append(count,toggle);card.append(replyBar);
  if(replies.length){const list=el('div','replies');replies.forEach(reply=>{
    const row=el('div','reply-card');const header=el('div');header.append(el('strong','',reply.nickname||'匿名參與者'),el('small','',formatDate(reply.createdAt)));
    row.append(header,el('p','',reply.message||''));list.appendChild(row);
  });card.appendChild(list);}
  const form=el('form','reply-form');form.hidden=true;
  const label=el('label','',`回覆 ${p.nickname||'這位老師'} 的教學想法`);
  const input=el('textarea');input.id=`reply-${p.id}`;label.htmlFor=input.id;input.required=true;input.maxLength=600;input.minLength=3;
  input.placeholder='分享一個具體做法、追問或不同觀點……';
  const status=el('span','reply-form-status');status.setAttribute('role','status');
  const button=el('button','', '送出回覆 →');button.type='submit';
  form.append(label,input,status,button);card.appendChild(form);
  toggle.addEventListener('click',()=>{
    form.hidden=!form.hidden;
    toggle.textContent=form.hidden?'＋ 回覆這位老師':'－ 收起回覆欄';
    toggle.setAttribute('aria-expanded',String(!form.hidden));
    if(!form.hidden)input.focus();
  });
  let pendingReplyId=null;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const nickname=$('#wallNickname').value.trim();
    if(!nickname){ status.textContent='請先在右側（手機版為下方）填寫回覆暱稱。';$('#wallNickname').focus();return; }
    if(input.value.trim().length<3){status.textContent='回覆至少填寫 3 個字。';return;}
    sessionStorage.setItem('classroomNickname',nickname);
    const data={id:pendingReplyId||makeId(),parentId:p.id,nickname,message:input.value.trim()};
    pendingReplyId=data.id;button.disabled=true;status.textContent='正在送出並確認儲存……';
    try{
      const result=await submitReply(data);
      status.textContent=result.moderation==='pending'?'回覆已儲存，等待教師審核後顯示。':'回覆已送出！';
      pendingReplyId=null;
      input.value='';
      await refreshWall({quiet:true,force:true});
    }catch(error){status.textContent=`未能確認儲存：${error.message}`;}
    finally{button.disabled=false;}
  });
  return card;
}
function renderPosts() {
  const visible=state.filter==='all'?state.posts:state.posts.filter(p=>p.studentId===state.filter);
  const container=$('#postList');container.replaceChildren();
  if(!visible.length){
    const empty=el('div','empty-wall');empty.append(el('strong','',state.filter==='all'?'交流牆還沒有分享':'這個學生視角目前還沒有分享'),el('p','','完成一次體驗後，你可以成為第一位分享教學想法的老師。'));
    const link=el('a','primary-btn link-btn','去體驗一堂國語課 →');link.href='./index.html';empty.append(link);container.append(empty);return;
  }
  visible.forEach(p=>container.appendChild(renderPost(p)));
}
function hasUnsentReply() {
  return Array.from(document.querySelectorAll('.reply-form')).some(form=>!form.hidden || Boolean(form.querySelector('textarea')?.value.trim()));
}
async function refreshWall({quiet=false,force=false}={}) {
  if(state.loading)return;
  if(!force && hasUnsentReply()){
    if(!quiet){$('#loadStatus').hidden=false;$('#loadStatus').textContent='目前有尚未送出的留言；請先送出或收合後再更新。';}
    return;
  }
  state.loading=true;
  if(!quiet){$('#loadStatus').hidden=false;$('#loadStatus').textContent='正在讀取交流內容……';}
  try{
    const data=await loadWall();
    if(!force && hasUnsentReply())return; // 網路請求期間若開始打字，也不能清除草稿
    state.posts=(data.posts||[]).filter(p=>p&&ROLE_LABELS[p.studentId]).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    state.replies=(data.replies||[]).filter(r=>r&&r.parentId);
    renderStats();renderPosts();
    $('#loadStatus').hidden=true;
  }catch(error){
    $('#loadStatus').hidden=false;
    $('#loadStatus').textContent=`讀取失敗：${error.message}。請確認後按「重新整理」。`;
  }finally{state.loading=false;}
}
function init() {
  $('#backendBanner').textContent=IS_DEMO
    ? '目前為本機示範模式：可以完整體驗並測試回應／回覆，但資料只會保存在這個瀏覽器，其他使用者看不到。請依部署說明填入 Apps Script 網址，才能跨裝置共用。'
    : '';
  $('#wallNickname').value=sessionStorage.getItem('classroomNickname')||'';
  $('#wallNickname').addEventListener('change',()=>sessionStorage.setItem('classroomNickname',$('#wallNickname').value.trim().slice(0,24)));
  $('#filterRole').addEventListener('change',event=>{state.filter=event.target.value;renderPosts();});
  $('#refreshWall').addEventListener('click',()=>refreshWall());
  refreshWall();
  // 課堂中自動更新；有使用者正在輸入回覆時不重建畫面。
  setInterval(()=>{
    // 輸入暱稱時也要保留已展開的回覆；不能因 45 秒輪詢重建 DOM 而丟稿。
    if(document.hidden || document.activeElement?.tagName==='TEXTAREA' || hasUnsentReply())return;
    refreshWall({quiet:true});
  },45000);
}
init();
