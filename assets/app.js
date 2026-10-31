const APP = window.APP_CONFIG || {};

const TEXT = {
  passage: [
    '這裡的十一月，陽光照耀滿園柳丁的景象，如金粉從天上落下般美麗。',
    '每當我經過那一大片的柳丁園，即使冷風陣陣，也能感受到一絲的溫暖。',
    '那一顆顆香甜飽滿的柳丁，都是農人深切的希望。',
    '這些年，我走過鄉間的泥土地、村裡的石子路，我下田看農事、上網推廣農特產。',
    '我拍下一張張照片，用鏡頭記錄家鄉的容顏。'
  ],
  highlightTargets: [0, 2, 4],
  quiz: {
    question: '根據課文內容，下列何者最能表達作者的感受？',
    options: [
      '作者覺得家鄉景色普通，只是剛好經過。',
      '作者透過描寫柳丁園與農人，表達對家鄉的溫暖與珍惜。',
      '作者主要想介紹拍照器材的功能。',
      '作者不喜歡鄉間道路，認為生活很辛苦。'
    ],
    answer: 1
  }
};

const STUDENTS = {
  vision: {
    key:'vision', label:'小晴 · 弱視', short:'小晴', type:'弱視', avatar:'晴', color:'amber', effect:'effect-vision',
    desc:'看遠距板書與密集文字時較吃力，若呈現方式不友善，容易漏掉重點。',
    barrierBase:'黑板字太遠、字體偏小，老師快速指向課文時不容易跟上。',
    supportBase:'可提供靠前座位、大字版課文、重點投影、口語同步說明與板書留存。',
    ambient:'老師正在前方講解，但你的注意力得先花在辨認字和找位置上。'
  },
  hearing: {
    key:'hearing', label:'小廷 · 輕度聽損', short:'小廷', type:'輕度聽損', avatar:'廷', color:'blue', effect:'effect-hearing',
    desc:'在多人環境中，老師的語音會被背景聲覆蓋，重要指令可能只聽到部分。',
    barrierBase:'口頭指令一閃而過，教室裡還有翻書聲與同學聲音，容易漏掉關鍵訊息。',
    supportBase:'老師可面向學生說話、放慢速度、同步提供文字提示與重點投影。',
    ambient:'你似乎有聽到老師說了什麼，但環境聲與距離讓訊息變得片段。'
  },
  adhd: {
    key:'adhd', label:'小宇 · ADHD', short:'小宇', type:'ADHD', avatar:'宇', color:'coral', effect:'effect-adhd',
    desc:'周遭刺激很多時，注意力可能被快速拉走，任務切換與持續專注更加困難。',
    barrierBase:'外界動靜、身邊物品與腦中突然冒出的想法，都可能把你從任務拉開。',
    supportBase:'老師可將任務分段、給清楚提示、安排低干擾座位，並在關鍵時刻近身提醒。',
    ambient:'你知道現在在上課，但視線、聲音、動靜和腦中想法一直在搶你的注意力。'
  },
  reading: {
    key:'reading', label:'小禾 · 閱讀理解困難', short:'小禾', type:'閱讀理解困難', avatar:'禾', color:'purple', effect:'effect-reading',
    desc:'讀字、抓關鍵句與整合語意的負荷較高，若任務又快又密集，更容易卡住。',
    barrierBase:'文字很多、語句長，必須一邊辨認、一邊理解，讀到後面容易忘記前面。',
    supportBase:'可提供分段閱讀、關鍵句標記、詞語提示與範例引導，降低理解負荷。',
    ambient:'你正在努力讀懂每一句，但句子進入腦中時，不一定能立即整理成完整意思。'
  }
};

const els = {
  welcomeView: q('#welcomeView'), classroomView: q('#classroomView'), lessonView: q('#lessonView'), reflectionView: q('#reflectionView'),
  startForm: q('#startForm'), participantName: q('#participantName'), participantChip: q('#participantChip'),
  classroomMap: q('#classroomMap'), player: q('#player'), mapStatus: q('#mapStatus'), chooseNearBtn: q('#chooseNearBtn'),
  pickList: q('#pickList'), backToClass: q('#backToClass'), motionToggle: q('#motionToggle'),
  lessonTitle: q('#lessonTitle'), lessonSubtitle: q('#lessonSubtitle'), stageContext: q('#stageContext'), sceneTime: q('#sceneTime'),
  boardText: q('#boardText'), teacherCaption: q('#teacherCaption'), teacherMood: q('#teacherMood'), workspaceHeading: q('#workspaceHeading'),
  workspaceDirection: q('#workspaceDirection'), workspaceContent: q('#workspaceContent'), barrierText: q('#barrierText'), supportText: q('#supportText'),
  ambientText: q('#ambientText'), studentTag: q('#studentTag'), sidebarName: q('#sidebarName'), sidebarDesc: q('#sidebarDesc'), studentAvatar: q('#studentAvatar'),
  progressRail: q('#progressRail'), supportBtn: q('#supportBtn'), nextStepBtn: q('#nextStepBtn'), audioBtn: q('#audioBtn'),
  taskFeedback: q('#taskFeedback'), distractionNotice: q('#distractionNotice'), distractionText: q('#distractionText'), dismissDistraction: q('#dismissDistraction'),
  stageScene: q('#stageScene'), reflectionSummary: q('#reflectionSummary'), reflectionForm: q('#reflectionForm'), hardestMoment: q('#hardestMoment'), teacherAdjustments: q('#teacherAdjustments'),
  broaderBenefit: q('#broaderBenefit'), sharePublic: q('#sharePublic'), submitStatus: q('#submitStatus')
};

const state = {
  participant:'', currentStudent:null, currentTask:0, supportApplied:false, reducedMotion:false,
  player:{x:50,y:92}, completed:[false,false,false], localSaved:false, distractionTimer:null, clockTimer:null
};

const taskTemplates = [
  {
    id:'read', title:'讀課文', subtitle:'跟著老師朗讀課文，看看你是否能順利跟上內容。',
    teacherText:'請大家翻到課文〈鏡頭下的家鄉〉，我先帶大家一起朗讀第一到第三段。',
    teacherHearing:'……翻到……〈鏡頭下的……〉，我先……一起朗讀……第一……第三段。',
    direction:'請閱讀課文內容。如果需要，可以按「播放老師語音」聽聽現在的課堂指令。',
    supportHint:'先讓學生更容易取得資訊，再談是否能參與任務。'
  },
  {
    id:'highlight', title:'畫重點', subtitle:'老師要大家找出課文中的關鍵句，請你把重點畫出來。',
    teacherText:'請把最能表現家鄉景象、農人希望，以及作者用鏡頭記錄家鄉的句子畫出重點。',
    teacherHearing:'請把……表現家鄉……農人……作者……記錄家鄉……句子……畫重點。',
    direction:'請點選你認為應該畫重點的句子。至少選出三句。',
    supportHint:'重點標示與步驟分解，常能大幅降低任務負荷。'
  },
  {
    id:'quiz', title:'回答選擇題', subtitle:'請根據課文內容，回答一題閱讀理解題。',
    teacherText:'看完課文後，請回答：作者想透過這篇課文傳達什麼樣的感受？',
    teacherHearing:'看完課文後，請回答……作者……傳達……什麼感受？',
    direction:'請閱讀題目並選擇最合適的答案。',
    supportHint:'當理解門檻太高時，老師可以提供提示而不是直接給答案。'
  }
];

init();

function init(){
  bindStart();
  bindMovement();
  bindStudentButtons();
  bindLessonControls();
  bindReflection();
  renderProgress();
}

function bindStart(){
  els.startForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = els.participantName.value.trim();
    if(!name) return;
    state.participant = name;
    els.participantChip.textContent = `體驗者：${name}`;
    showView('classroom');
    els.classroomMap.focus();
  });
}

function bindMovement(){
  document.querySelectorAll('[data-move]').forEach(btn=>btn.addEventListener('click',()=>{
    const [dx,dy] = btn.dataset.move.split(',').map(Number);
    movePlayer(dx,dy);
  }));
  els.classroomMap.addEventListener('keydown',e=>{
    const keyMap={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    const move = keyMap[e.key];
    if(move){e.preventDefault();movePlayer(move[0],move[1]);}
    if(e.key==='Enter'){e.preventDefault();chooseNearby();}
  });
  els.chooseNearBtn.addEventListener('click', chooseNearby);
}

function bindStudentButtons(){
  document.querySelectorAll('.desk,[data-student]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const key = btn.dataset.student;
      if(STUDENTS[key]) openStudent(key);
    });
  });
}

function bindLessonControls(){
  els.backToClass.addEventListener('click',()=>{
    stopDistractions();
    showView('classroom');
    els.classroomMap.focus();
  });
  els.motionToggle.addEventListener('click',()=>{
    state.reducedMotion = !state.reducedMotion;
    document.body.classList.toggle('reduced-motion', state.reducedMotion);
    els.motionToggle.textContent = state.reducedMotion ? '恢復特效' : '減少特效';
  });
  els.supportBtn.addEventListener('click', applySupport);
  els.nextStepBtn.addEventListener('click', nextTask);
  els.audioBtn.addEventListener('click', playTeacherVoice);
  els.dismissDistraction.addEventListener('click',()=>{
    els.distractionNotice.hidden = true;
    showFeedback('你把注意力稍微拉回來了，但環境中的干擾仍可能再次出現。');
  });
}

function bindReflection(){
  els.reflectionForm.addEventListener('submit', async e=>{
    e.preventDefault();
    const payload = {
      action:'submitResponse',
      participant: state.participant,
      student: state.currentStudent,
      studentLabel: STUDENTS[state.currentStudent].label,
      hardestMoment: els.hardestMoment.value.trim(),
      teacherAdjustments: els.teacherAdjustments.value.trim(),
      broaderBenefit: els.broaderBenefit.value.trim(),
      sharePublic: els.sharePublic.checked,
      createdAt: new Date().toISOString()
    };
    if(!payload.hardestMoment || !payload.teacherAdjustments || !payload.broaderBenefit){return;}
    const ok = await submitToBackend(payload);
    if(ok){
      els.submitStatus.textContent = '已成功送出回應。你可以前往交流牆，閱讀其他體驗者的想法。';
      els.submitStatus.className = 'submit-status';
      els.reflectionForm.reset();
      sessionStorage.removeItem('immersiveReflectionDraft');
    } else {
      saveLocalFallback('immersiveResponses', payload);
      els.submitStatus.textContent = '目前無法寫入 Google Sheets，已先暫存於此瀏覽器。你稍後仍可帶著這份內容前往交流牆或重新送出。';
      els.submitStatus.className = 'submit-status error';
    }
  });
}

function movePlayer(dx,dy){
  state.player.x = clamp(state.player.x + dx*6, 10, 90);
  state.player.y = clamp(state.player.y + dy*6, 15, 92);
  els.player.style.left = `${state.player.x}%`;
  els.player.style.top = `${state.player.y}%`;
  const nearest = getNearestStudent();
  if(nearest && nearest.distance < 15){
    els.mapStatus.textContent = `你現在靠近 ${STUDENTS[nearest.key].label} 的座位，按 Enter 或「選擇」即可開始體驗。`;
    document.querySelectorAll('.desk').forEach(d=>d.classList.toggle('active', d.dataset.student===nearest.key));
  } else {
    els.mapStatus.textContent = '繼續移動，靠近一位學生的座位。';
    document.querySelectorAll('.desk').forEach(d=>d.classList.remove('active'));
  }
}

function getNearestStudent(){
  const desks = [...document.querySelectorAll('.desk')].map(d=>({key:d.dataset.student, x:parseFloat(d.style.getPropertyValue('--x')), y:parseFloat(d.style.getPropertyValue('--y'))}));
  return desks.map(d=>({key:d.key, distance:Math.hypot(d.x-state.player.x, d.y-state.player.y)})).sort((a,b)=>a.distance-b.distance)[0];
}

function chooseNearby(){
  const nearest = getNearestStudent();
  if(nearest && nearest.distance < 15) openStudent(nearest.key);
  else els.mapStatus.textContent = '還沒有靠近任何座位，請再往前走一點。';
}

function openStudent(key){
  state.currentStudent = key;
  state.currentTask = 0;
  state.completed = [false,false,false];
  state.supportApplied = false;
  renderProgress();
  renderTask();
  showView('lesson');
}

function renderTask(){
  const student = STUDENTS[state.currentStudent];
  const task = taskTemplates[state.currentTask];
  clearTimers();
  els.lessonTitle.textContent = task.title;
  els.lessonSubtitle.textContent = task.subtitle;
  els.stageContext.textContent = `國語課 · ${task.title}`;
  els.studentTag.textContent = student.label;
  els.sidebarName.textContent = student.label;
  els.sidebarDesc.textContent = student.desc;
  els.barrierText.textContent = `${student.barrierBase} 現在的活動是「${task.title}」。`;
  els.supportText.textContent = `${student.supportBase} 這一關特別可以考慮：${task.supportHint}`;
  els.ambientText.textContent = student.ambient;
  els.studentAvatar.textContent = student.avatar;
  els.studentAvatar.className = `student-avatar ${student.color}`;
  els.workspaceHeading.textContent = task.title;
  els.workspaceDirection.textContent = task.direction;
  els.boardText.textContent = TEXT.passage[0];
  els.teacherMood.textContent = student.key==='hearing' ? '老師口頭講解中，環境聲較多' : '老師正在教室前方帶領活動';
  els.teacherCaption.textContent = student.key==='hearing' ? task.teacherHearing : task.teacherText;
  els.stageScene.className = `stage ${student.effect}`;
  if(state.supportApplied) els.stageScene.classList.add('support-applied');
  els.nextStepBtn.disabled = true;
  els.nextStepBtn.textContent = state.currentTask < 2 ? '完成這一步，前往下一項活動' : '完成體驗，前往課後反思';
  els.taskFeedback.hidden = true;
  els.distractionNotice.hidden = true;
  renderProgress();
  renderWorkspace(task.id);
  if(student.key==='adhd') startDistractions();
  startClock();
}

function renderWorkspace(taskId){
  if(taskId==='read'){
    const lines = TEXT.passage.map((line,i)=>`<span class="sentence">${transformLine(line,i)}</span>`).join('');
    els.workspaceContent.innerHTML = `<div class="reading-paper">${lines}</div><button class="btn btn-ghost" id="finishReadBtn">我已經嘗試讀完課文</button>`;
    q('#finishReadBtn').addEventListener('click',()=>completeTask('你完成了閱讀。接下來想想：剛剛是順利讀完，還是一路都在跟困難搏鬥？'));
  }
  if(taskId==='highlight'){
    els.workspaceContent.innerHTML = `<div class="highlight-grid">${TEXT.passage.map((line,i)=>`<button class="sentence-button" data-index="${i}"><span class="sentence-body">${transformLine(line,i)}</span></button>`).join('')}</div>`;
    [...els.workspaceContent.querySelectorAll('.sentence-button')].forEach(btn=>btn.addEventListener('click',()=>{
      btn.classList.toggle('is-selected');
      const selected = [...els.workspaceContent.querySelectorAll('.sentence-button.is-selected')].map(b=>Number(b.dataset.index));
      if(selected.length >= 3){
        const score = TEXT.highlightTargets.filter(t=>selected.includes(t)).length;
        if(score >= 2) completeTask('你完成了重點標示。可以感覺到：有些學生不是不會，而是找重點時需要更清楚的提示。');
      }
    }));
  }
  if(taskId==='quiz'){
    els.workspaceContent.innerHTML = `<div class="reading-paper"><strong>${TEXT.quiz.question}</strong></div><div class="quiz-list">${TEXT.quiz.options.map((opt,i)=>`<button class="quiz-option" data-index="${i}"><b>${String.fromCharCode(65+i)}.</b><span>${transformQuizOption(opt,i)}</span></button>`).join('')}</div>`;
    [...els.workspaceContent.querySelectorAll('.quiz-option')].forEach(btn=>btn.addEventListener('click',()=>{
      const idx = Number(btn.dataset.index);
      [...els.workspaceContent.querySelectorAll('.quiz-option')].forEach(b=>b.disabled=true);
      if(idx===TEXT.quiz.answer){
        btn.classList.add('correct');
        completeTask('答對了。理解不只是看懂字，還要抓到文本中的情感與重點。');
      }else{
        btn.classList.add('incorrect');
        showFeedback('這個選項不太符合課文意思。你可以先套用支持策略，再重新思考。', true);
        els.nextStepBtn.disabled = true;
        setTimeout(()=>{ [...els.workspaceContent.querySelectorAll('.quiz-option')].forEach(b=>b.disabled=false); }, 900);
      }
    }));
  }
}

function transformLine(line, idx){
  if(state.currentStudent==='reading' && !state.supportApplied){
    return line.replace(/，/g,' ， ').replace(/。/g,'。 ').replace(/的/g, idx%2===0 ? '的' : ' 的');
  }
  if(state.currentStudent==='vision' && !state.supportApplied){
    return `<span style="opacity:${0.85 - idx*0.03}">${line}</span>`;
  }
  return line;
}

function transformQuizOption(line, idx){
  if(state.currentStudent==='reading' && !state.supportApplied){
    return line.replace(/，/g,' 、 ');
  }
  return line;
}

function applySupport(){
  if(state.supportApplied){
    showFeedback('這項調整已經套用。請再次感受，任務是否更容易參與了？');
    return;
  }
  state.supportApplied = true;
  els.stageScene.classList.add('support-applied');
  if(state.currentStudent==='vision'){
    els.teacherCaption.textContent = '老師把重點放大投影，並口頭指出現在要看的句子。';
    els.boardText.textContent = TEXT.passage[0] + '（已放大顯示）';
  }
  if(state.currentStudent==='hearing'){
    els.teacherCaption.textContent = '老師面向全班、放慢語速，並在投影上同步打出關鍵指令。';
  }
  if(state.currentStudent==='adhd'){
    stopDistractions();
    els.teacherCaption.textContent = '老師把任務拆成一步一步，走到你旁邊輕聲提醒：先看第一句，再找重點。';
    els.distractionNotice.hidden = true;
  }
  if(state.currentStudent==='reading'){
    els.teacherCaption.textContent = '老師先圈出關鍵句，並提醒你先讀每段最重要的一句。';
  }
  showFeedback('已套用老師調整。現在再重新感受一次，看看任務是否變得更可參與。');
  renderWorkspace(taskTemplates[state.currentTask].id);
}

function completeTask(message){
  state.completed[state.currentTask] = true;
  els.nextStepBtn.disabled = false;
  showFeedback(message);
}

function nextTask(){
  if(!state.completed[state.currentTask]) return;
  if(state.currentTask < 2){
    state.currentTask += 1;
    state.supportApplied = false;
    renderTask();
  } else {
    stopDistractions();
    renderReflection();
    showView('reflection');
  }
}

function renderReflection(){
  const student = STUDENTS[state.currentStudent];
  els.reflectionSummary.innerHTML = `<strong>你剛剛體驗的是：</strong> ${student.label}。<span>請從「課堂哪裡形成障礙」與「老師可如何調整」兩個角度留下回應。</span>`;
}

async function submitToBackend(payload){
  const url = APP.API_URL;
  if(!url) return false;
  try{
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(payload),
      mode:'cors'
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  }catch(err){
    console.warn('submit failed', err);
    return false;
  }
}

function saveLocalFallback(key, payload){
  const rows = JSON.parse(localStorage.getItem(key) || '[]');
  rows.unshift(payload);
  localStorage.setItem(key, JSON.stringify(rows));
}

function playTeacherVoice(){
  if(!('speechSynthesis' in window)){
    showFeedback('目前瀏覽器不支援語音播放，但你仍可透過畫面與文字感受情境。', true);
    return;
  }
  const task = taskTemplates[state.currentTask];
  const utter = new SpeechSynthesisUtterance();
  utter.lang = 'zh-TW';
  utter.text = task.teacherText;
  utter.rate = state.currentStudent==='reading' && !state.supportApplied ? 1.05 : 0.92;
  utter.pitch = 1;
  utter.volume = state.currentStudent==='hearing' && !state.supportApplied ? 0.18 : 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function startDistractions(){
  stopDistractions();
  const messages = [
    '窗外傳來球場的吆喝聲。',
    '隔壁同學的鉛筆滾到地上了。',
    '你突然想到剛剛下課時還沒講完的事。',
    '前面同學翻書的聲音讓你分心。',
    '老師剛剛說到哪裡了？你一時有點斷線。'
  ];
  state.distractionTimer = setInterval(()=>{
    if(state.currentStudent !== 'adhd' || state.supportApplied) return;
    const msg = messages[Math.floor(Math.random()*messages.length)];
    els.distractionText.textContent = msg;
    els.distractionNotice.hidden = false;
  }, 4200);
}

function stopDistractions(){
  if(state.distractionTimer) clearInterval(state.distractionTimer);
  state.distractionTimer = null;
}

function clearTimers(){
  stopDistractions();
  if(state.clockTimer) clearInterval(state.clockTimer);
  state.clockTimer = null;
}

function startClock(){
  let minute = 25 + state.currentTask*4;
  els.sceneTime.textContent = `10:${String(minute).padStart(2,'0')}`;
  state.clockTimer = setInterval(()=>{
    minute += 1;
    els.sceneTime.textContent = `10:${String(minute).padStart(2,'0')}`;
    if(minute > 39) minute = 25;
  }, 10000);
}

function showFeedback(message, isError=false){
  els.taskFeedback.hidden = false;
  els.taskFeedback.textContent = message;
  els.taskFeedback.className = `task-feedback${isError ? ' error' : ''}`;
}

function renderProgress(){
  els.progressRail.innerHTML = taskTemplates.map((t,i)=>{
    const cls = i===state.currentTask ? 'active' : state.completed[i] ? 'done' : '';
    return `<span class="step-pill ${cls}">${i+1}. ${t.title}</span>`;
  }).join('');
}

function showView(which){
  els.welcomeView.hidden = which!=='welcome';
  els.classroomView.hidden = which!=='classroom';
  els.lessonView.hidden = which!=='lesson';
  els.reflectionView.hidden = which!=='reflection';
}

function q(sel){return document.querySelector(sel)}
function clamp(n,min,max){return Math.min(max,Math.max(min,n))}
