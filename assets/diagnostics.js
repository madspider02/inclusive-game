import {API_URL,IS_DEMO,checkBackendHealth,submitReflection,checkSubmission,makeId} from './api.js';
const q=s=>document.querySelector(s);
let lastId=null;
q('#apiUrlDisplay').textContent=IS_DEMO?'API：目前是本機示範模式':'API：'+API_URL;
function show(id,text,status='info'){
  const node=q(id);node.textContent=text;node.dataset.status=status;
}
async function testHealth(){
  const btn=q('#testHealth');btn.disabled=true;
  show('#healthResult','正在讀取部署版本與工作表……');
  try{
    const x=await checkBackendHealth();
    if(x.demo)show('#healthResult','本機示範模式，沒有連接 Google Sheets。','warning');
    else show('#healthResult',`讀取正常 · 後端版本 ${x.apiVersion}。回應工作表：${x.sheets.responses}（${x.responseCount} 筆）；留言工作表：${x.sheets.comments}（${x.commentCount} 筆）。`, 'ok');
    return x;
  }catch(e){show('#healthResult',e.message,'error');throw e;}
  finally{btn.disabled=false;}
}
q('#testHealth').addEventListener('click',()=>testHealth().catch(()=>{}));
q('#testWrite').addEventListener('click',async()=>{
  const btn=q('#testWrite');btn.disabled=true;
  lastId=makeId();
  q('#testVerify').disabled=false;
  show('#writeResult',`測試 ID：${lastId}。正在確認後端版本並執行私密寫入……`);
  try{
    const res=await submitReflection({
      id:lastId,nickname:'系統連線測試',studentId:'adhd',publish:false,
      observation:'這是連線診斷頁產生的一筆測試資料，不屬於真實體驗者回應。',
      adjustment:'此筆用來驗證寫入與查核功能，確認完成後可由主持教師刪除。',
      question:'',strategies:[],experience:{source:'diagnostics.html',test:true}
    });
    show('#writeResult',res.demo?'本機示範寫入成功，不代表 Google Sheets 已接通。':`已確認寫入 Google Sheets，ID：${res.savedId}，狀態：${res.moderation}。`,'ok');
  }catch(e){show('#writeResult',`未確認成功（ID：${lastId}）：${e.message}`,'error');}
  finally{btn.disabled=false;}
});
q('#testVerify').addEventListener('click',async()=>{
  if(!lastId)return;
  const btn=q('#testVerify');btn.disabled=true;show('#verifyResult','正在查詢 ID：'+lastId);
  try{
    const r=await checkSubmission(lastId,'submit');
    show('#verifyResult',r.exists?`確實存在於工作表，狀態：${r.moderation}。ID：${lastId}`:`工作表中尚未找到這筆 ID：${lastId}` ,r.exists?'ok':'warning');
  }catch(e){show('#verifyResult',e.message,'error');}
  finally{btn.disabled=false;}
});
