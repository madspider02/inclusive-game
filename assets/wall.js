const APP = window.APP_CONFIG || {};
const ROLE_MAP = {
  vision:{label:'小晴・弱視', class:'amber'},
  hearing:{label:'小廷・輕度聽損', class:'blue'},
  adhd:{label:'小宇・ADHD', class:'coral'},
  reading:{label:'小禾・閱讀理解困難', class:'purple'}
};

const els = {
  postCount: q('#postCount'), replyCount: q('#replyCount'), commonStrategy: q('#commonStrategy'), filterRole: q('#filterRole'),
  refreshWall: q('#refreshWall'), postList: q('#postList'), loadStatus: q('#loadStatus'), wallNickname: q('#wallNickname'), backendBanner: q('#backendBanner')
};

let allPosts = [];
let allComments = [];

init();

function init(){
  els.filterRole?.addEventListener('change', render);
  els.refreshWall?.addEventListener('click', loadWall);
  loadWall();
}

async function loadWall(){
  els.loadStatus.textContent = '正在讀取交流內容……';
  const remote = await fetchRemoteWall();
  if(remote){
    allPosts = remote.responses || [];
    allComments = remote.comments || [];
    els.backendBanner.textContent = '目前顯示的是 Google Sheets 的公開回應。';
  }else{
    allPosts = JSON.parse(localStorage.getItem('immersiveResponses') || '[]').filter(x=>x.sharePublic);
    allComments = JSON.parse(localStorage.getItem('immersiveComments') || '[]');
    els.backendBanner.textContent = '目前無法連上 Google Sheets，以下顯示此瀏覽器中的本機示範資料。';
  }
  normalize();
  render();
}

async function fetchRemoteWall(){
  if(!APP.API_URL) return null;
  try{
    const [resp1, resp2] = await Promise.all([
      fetch(`${APP.API_URL}?action=listResponses`, {method:'GET', mode:'cors'}),
      fetch(`${APP.API_URL}?action=listComments`, {method:'GET', mode:'cors'})
    ]);
    if(!resp1.ok || !resp2.ok) throw new Error('bad response');
    const responses = await resp1.json();
    const comments = await resp2.json();
    return {
      responses: Array.isArray(responses?.data) ? responses.data : Array.isArray(responses) ? responses : [],
      comments: Array.isArray(comments?.data) ? comments.data : Array.isArray(comments) ? comments : []
    };
  }catch(err){
    console.warn('fetch wall failed', err);
    return null;
  }
}

function normalize(){
  allPosts = allPosts
    .filter(x=>x.sharePublic !== false && (x.sharePublic === true || x.sharePublic === 'TRUE' || x.sharePublic === 'true' || x.sharePublic === '是' || x.sharePublic === 'yes' || x.sharePublic === '1' || x.public === true || x.isPublic===true || x.Visibility==='public' || x['是否公開']==='是' || typeof x.sharePublic==='undefined'))
    .map((x,idx)=>(
      {
        id: x.id || x.ID || x.timestamp || x.createdAt || `local-${idx}`,
        participant: x.participant || x.name || x.nickname || x['姓名或暱稱'] || '匿名體驗者',
        student: x.student || x.role || x['學生代碼'] || 'vision',
        studentLabel: x.studentLabel || x.roleLabel || x['學生視角'] || ROLE_MAP[x.student || 'vision']?.label || '未分類',
        hardestMoment: x.hardestMoment || x['最困難環節'] || x.hardest || '',
        teacherAdjustments: x.teacherAdjustments || x['教師調整'] || x.adjustments || '',
        broaderBenefit: x.broaderBenefit || x['其他學生也受益'] || x.benefit || '',
        createdAt: x.createdAt || x.timestamp || x['建立時間'] || new Date().toISOString()
      }
    ))
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  allComments = allComments.map((x,idx)=>(
    {
      id: x.id || x.ID || `comment-${idx}`,
      responseId: x.responseId || x.postId || x['回應ID'] || x.parentId || '',
      nickname: x.nickname || x.name || x.participant || x['暱稱'] || '匿名',
      content: x.content || x.comment || x['留言內容'] || '',
      createdAt: x.createdAt || x.timestamp || x['建立時間'] || new Date().toISOString()
    }
  )).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
}

function render(){
  const role = els.filterRole?.value || 'all';
  const posts = role==='all' ? allPosts : allPosts.filter(p=>p.student===role);
  els.postCount.textContent = posts.length;
  els.replyCount.textContent = allComments.filter(c=>posts.some(p=>String(p.id)===String(c.responseId))).length;
  els.commonStrategy.textContent = computeCommonStrategy(posts);
  els.loadStatus.textContent = posts.length ? `目前顯示 ${posts.length} 則公開分享。` : '目前還沒有公開回應。';
  els.postList.innerHTML = posts.length ? posts.map(renderPostCard).join('') : '<div class="post-card"><p>還沒有公開分享的內容。你可以先回到體驗頁面，完成一位學生的體驗並送出回應。</p></div>';
  bindCommentForms();
}

function computeCommonStrategy(posts){
  const bucket = {視覺提示:0, 分段任務:0, 座位安排:0, 口語加文字:0, 個別提醒:0};
  const source = posts.map(p=>`${p.teacherAdjustments} ${p.broaderBenefit}`.toLowerCase()).join(' ');
  if(!source) return '—';
  if(/視覺|板書|投影|文字/.test(source)) bucket['視覺提示']++;
  if(/分段|拆解|一步一步/.test(source)) bucket['分段任務']++;
  if(/座位|靠前|低干擾/.test(source)) bucket['座位安排']++;
  if(/文字|同步|口語|字幕/.test(source)) bucket['口語加文字']++;
  if(/提醒|巡視|近身/.test(source)) bucket['個別提醒']++;
  return Object.entries(bucket).sort((a,b)=>b[1]-a[1])[0]?.[1] ? Object.entries(bucket).sort((a,b)=>b[1]-a[1])[0][0] : '多元支持';
}

function renderPostCard(post){
  const role = ROLE_MAP[post.student] || ROLE_MAP.vision;
  const comments = allComments.filter(c=>String(c.responseId)===String(post.id));
  return `
    <article class="post-card">
      <div class="post-head">
        <div class="post-author">
          <div class="post-initial">${escapeHtml(post.participant.slice(0,1))}</div>
          <div>
            <strong>${escapeHtml(post.participant)}</strong>
            <div class="post-meta"><span>${formatDate(post.createdAt)}</span></div>
          </div>
        </div>
        <span class="role-badge"><span class="chip ${role.class}">${role.label[0]}</span>${escapeHtml(post.studentLabel || role.label)}</span>
      </div>
      <h3>最困難的環節</h3>
      <p>${escapeHtml(post.hardestMoment)}</p>
      <h3>我會怎麼調整</h3>
      <p>${escapeHtml(post.teacherAdjustments)}</p>
      <h3>這樣做對全班還有什麼幫助？</h3>
      <p>${escapeHtml(post.broaderBenefit)}</p>

      <div class="comments">
        ${comments.length ? comments.map(c=>`<div class="comment-item"><div class="comment-meta"><strong>${escapeHtml(c.nickname)}</strong><small>${formatDate(c.createdAt)}</small></div><p>${escapeHtml(c.content)}</p></div>`).join('') : '<div class="comment-item">還沒有留言。你可以成為第一位回應的人。</div>'}
        <form class="comment-form" data-post-id="${escapeHtml(String(post.id))}">
          <textarea placeholder="留下你的回應，例如：我同意這個做法，另外也可以……" required></textarea>
          <button class="btn btn-primary" type="submit">送出留言</button>
        </form>
      </div>
    </article>
  `;
}

function bindCommentForms(){
  document.querySelectorAll('.comment-form').forEach(form=>{
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const nickname = (els.wallNickname?.value || '').trim();
      if(!nickname){ alert('請先在右側填入留言暱稱。'); return; }
      const content = form.querySelector('textarea').value.trim();
      if(!content) return;
      const payload = {
        action:'submitComment',
        responseId: form.dataset.postId,
        nickname,
        content,
        createdAt: new Date().toISOString()
      };
      const ok = await submitComment(payload);
      if(ok){
        allComments.push(payload);
      }else{
        const arr = JSON.parse(localStorage.getItem('immersiveComments') || '[]');
        arr.push(payload);
        localStorage.setItem('immersiveComments', JSON.stringify(arr));
        allComments.push(payload);
      }
      form.reset();
      render();
    });
  });
}

async function submitComment(payload){
  if(!APP.API_URL) return false;
  try{
    const res = await fetch(APP.API_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(payload),
      mode:'cors'
    });
    if(!res.ok) throw new Error('bad response');
    return true;
  }catch(err){
    console.warn('submit comment failed', err);
    return false;
  }
}

function q(sel){return document.querySelector(sel)}
function formatDate(v){
  const d = new Date(v);
  if(Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function escapeHtml(str=''){return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
