import { submitReflection, makeId, IS_DEMO } from './api.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const EXCERPT = [
  '這裡的十一月，陽光照耀滿園柳丁的景象，如金粉從天上落下般美麗。',
  '每當我經過那一大片的柳丁園，即使冷風陣陣，也能感受到一絲的溫暖。',
  '那一顆顆香甜飽滿的柳丁，都是農人深切的希望。',
  '這些年，我走過鄉間的泥土地、村裡的石子路，我下田看農事、上網推廣農特產。',
  '我拍下一張張照片，用鏡頭記錄家鄉的容顏。'
];
const TASKS = [
  { title: '跟著老師朗讀', subtitle: '跟著老師讀一遍〈鏡頭下的家鄉〉，注意老師的要求。', context: '國語課 · 朗讀課文', time: '10:25', direction: '試著跟上朗讀，並找出課文描寫的家鄉景象。', spoken: '請跟著老師朗讀課文，留意作者如何描寫十一月的柳丁園。', heard: '請跟著……課文，留意作者……柳丁園……' },
  { title: '請你畫出重點', subtitle: '老師請大家從課文中找出景象與情感的描寫。', context: '國語課 · 圈選重點', time: '10:32', direction: '選出兩句話：①一處描寫柳丁園景象的句子；②一處表現作者感受的句子。', spoken: '請找出兩個重點。一個是柳丁園的景象，另一個是作者走過柳丁園時的感受。', heard: '請找出……兩個……一個是……另一個是……感受。' },
  { title: '回答課文選擇題', subtitle: '老師想知道：你理解作者使用比喻的意思嗎？', context: '國語課 · 閱讀理解', time: '10:40', direction: '閱讀題目，選出一個你認為最適合的答案。', spoken: '請看選擇題。只有一個最適合的答案，完成後想一想作者為什麼這樣寫。', heard: '請看……只有……答案，完成後……為什麼……' }
];
const OPTIONS = [
  '作者想說明十一月的天氣很冷。',
  '作者想呈現陽光照耀柳丁園時的美麗景象。',
  '作者想表達農人收成時十分辛苦。',
  '作者想提醒讀者家鄉的道路很崎嶇。'
];
const ROLES = {
  vision: {
    name: '小晴', nameFull: '小晴 · 弱視', label: '弱視', letter: '晴', color: 'amber',
    desc: '遠處板書與紙本小字不容易辨認',
    barriers: [
      '坐在這個位置，黑板上的字與課本文字都不夠清楚。即使想跟上朗讀，也需要花更多力氣辨識。',
      '課文的字較小、對比較低，選取句子的過程更費力；看不清不等於不理解內容。',
      '題目與選項不容易辨識，作答困難可能出現在看清題目之前。'
    ],
    supports: [
      { label: '放大字體、提高對比', message: '字體與對比清楚後，可以將注意力放回課文意思，而不是只花力氣辨字。' },
      { label: '讓學生選擇適當座位', message: '調整觀看距離並提供清楚的板書與個人教材，可以減少遠距閱讀的障礙。' },
      { label: '提供清楚的個人講義', message: '讓學生拿到易閱讀版本，也能搭配老師口述黑板上的資訊。' }
    ],
    strategies: ['大字／高對比教材', '清楚板書與座位安排', '口述重要視覺資訊', '讓學生調整閱讀距離']
  },
  hearing: {
    name: '小廷', nameFull: '小廷 · 輕度聽損', label: '輕度聽損', letter: '廷', color: 'blue',
    desc: '尤其在背景雜音中，可能漏聽口語指令',
    barriers: [
      '老師一邊面向黑板一邊說話，你可能只聽到零碎的關鍵字，無法確定究竟要做什麼。',
      '只聽到「找兩個……感受」，可能不清楚圈選的兩個方向；這是訊息取得的障礙。',
      '若只依賴口頭說明，可能漏接「只能選一項」等規則，並非不知道課文答案。'
    ],
    supports: [
      { label: '面向學生、清楚說話', message: '讓學生看得到教師的臉部與口語線索，同時降低不必要的背景噪音。' },
      { label: '同步呈現文字指令', message: '指令被清楚寫出來後，就不必完全仰賴短暫的聲音訊息。' },
      { label: '確認理解、提供輔聽支持', message: '使用適合的溝通或輔聽方式，確認學生掌握活動要求，而不是只問「聽到了嗎」。' }
    ],
    strategies: ['面向學生並清楚說話', '口語＋文字同步指令', '降低噪音／輔聽支持', '確認學生理解任務']
  },
  adhd: {
    name: '小宇', nameFull: '小宇 · ADHD', label: '注意力調節', letter: '宇', color: 'coral',
    desc: '環境刺激與久坐要求可能增加注意力調節負荷',
    barriers: [
      '老師說話時，走廊聲音、旁邊同學動作與想站起來活動的需要，可能讓你反覆重新找回朗讀進度。',
      '需要一直維持注意並記住兩個要求。周遭刺激可能打斷正在判斷句子意思的思路。',
      '要先讀題、比較四個答案、記住問題，若不斷有干擾，可能增加完成作答的負擔。'
    ],
    supports: [
      { label: '一次給一個明確步驟', message: '先說明第一個動作，再提醒下一步，可以降低工作記憶負荷。' },
      { label: '減少干擾、允許彈性姿勢', message: '與學生討論適合的座位、站立或短暫活動方式，讓注意力更容易回到任務。' },
      { label: '分段任務、提供視覺提示', message: '把活動切成小段，以可見的流程和完成標記協助自我監控。' }
    ],
    strategies: ['分段且明確的活動指令', '彈性坐姿／短暫活動', '減少非必要干擾', '視覺提示與自我監控']
  },
  reading: {
    name: '小禾', nameFull: '小禾 · 閱讀理解困難', label: '閱讀理解', letter: '禾', color: 'purple',
    desc: '辨讀或理解較長句、比喻與文意整合可能費力',
    barriers: [
      '篇章中的長句、陌生詞語與「如金粉落下」等比喻，可能讓你需要反覆讀才能掌握整體意思。',
      '即使讀得出每個字，仍可能難以分辨「描寫景象」與「表達感受」分別是哪些句子。',
      '「金粉」並不是真正的金子；若缺少語境與詞義線索，可能難以選出最符合原文的解釋。'
    ],
    supports: [
      { label: '分段閱讀、標示核心訊息', message: '清楚分段並提示「景象」「感受」，能協助整理文章結構。' },
      { label: '圖像及詞語／比喻說明', message: '先釐清「金粉」是陽光下的比喻，讓學生把詞語和家鄉的畫面連起來。' },
      { label: '提供口語重述與思考時間', message: '不只看文字辨識速度，也讓學生透過解說、提問或圖像表達理解。' }
    ],
    strategies: ['分段閱讀與核心句提示', '比喻／關鍵詞語解說', '圖像或口語重述', '延長思考時間與多元作答']
  }
};

const state = {
  nickname: sessionStorage.getItem('classroomNickname') || '', view: 'welcomeView', roleId: null,
  x: 50, y: 93, task: 0, supports: [null,null,null], skipped: [],
  highlights: new Set(), quizAnswer: null, taskChecked: false, distractedCount: 0,
  reduceVisual: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), timerId: null, distractionTimeout: null,
  pendingRecord: null
};
const VIEWS = ['welcomeView', 'classroomView', 'lessonView', 'reflectionView'];
function showView(id) {
  VIEWS.forEach(view => { document.getElementById(view).hidden = view !== id; });
  state.view = id;
  if (id !== 'lessonView') { stopAudio(); clearDistraction(); }
  window.scrollTo({ top: 0, behavior: 'auto' });
}
function currentRole() { return ROLES[state.roleId]; }
function distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
const DESKS = { vision:{x:29,y:49}, hearing:{x:70,y:49}, adhd:{x:29,y:76}, reading:{x:70,y:76} };
function nearestRole() {
  return Object.entries(DESKS).map(([id,pos]) => ({ id, dist: distance(state,pos) })).sort((a,b) => a.dist-b.dist)[0];
}
function moveAvatar(dx,dy) {
  if (state.view !== 'classroomView') return;
  state.x = Math.min(91,Math.max(9,state.x+dx*5));
  state.y = Math.min(94,Math.max(36,state.y+dy*5));
  $('#playerAvatar').style.left = `${state.x}%`;
  $('#playerAvatar').style.top = `${state.y}%`;
  const nearest = nearestRole();
  $$('.student-desk').forEach(btn => btn.classList.toggle('is-near', btn.dataset.student === nearest.id && nearest.dist < 15));
  $('#mapStatus').textContent = nearest.dist < 15
    ? `你已經靠近${ROLES[nearest.id].name}的座位。按 Enter 或「選擇」開始體驗。`
    : '繼續走向其中一位學生；也可以直接點擊座位選擇。';
}
function chooseNear() {
  const nearest = nearestRole();
  if (nearest.dist < 17) chooseRole(nearest.id);
  else $('#mapStatus').textContent = '請先走近一張座位（或直接點選旁邊的學生卡片）。';
}
function chooseRole(id) {
  if (!ROLES[id]) return;
  state.roleId = id;
  state.task = 0;
  state.supports = [null,null,null];
  state.skipped = [];
  state.highlights = new Set();
  state.quizAnswer = null;
  state.taskChecked = false;
  state.distractedCount = 0;
  state.pendingRecord = null;
  $('#reflectionForm').reset();
  showView('lessonView');
  renderStage();
}
function stopAudio() {
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (_) { /* browser doesn't expose voices */ }
  $('#audioBtn').textContent = '♫ 播放老師語音';
}
function playAudio() {
  if (!('speechSynthesis' in window)) {
    $('#audioBtn').textContent = '此瀏覽器無法語音播放'; return;
  }
  if (window.speechSynthesis.speaking) { stopAudio(); return; }
  const read = state.task === 0 ? `${TASKS[0].spoken}。${EXCERPT.join('')}` : TASKS[state.task].spoken;
  const utterance = new SpeechSynthesisUtterance(read);
  utterance.lang = 'zh-TW';
  utterance.rate = .88;
  // 只做有限度的環境聲量示意，不是對「輕度聽損」的醫學聲學模擬。
  utterance.volume = state.roleId === 'hearing' && !state.supports[state.task] ? .25 : .96;
  utterance.onend = utterance.onerror = () => { $('#audioBtn').textContent = '♫ 播放老師語音'; };
  window.speechSynthesis.speak(utterance);
  $('#audioBtn').textContent = '■ 停止語音播放';
}
function clearDistraction() {
  if (state.timerId) window.clearInterval(state.timerId);
  if (state.distractionTimeout) window.clearTimeout(state.distractionTimeout);
  state.timerId = null; state.distractionTimeout = null;
  $('#distractionNotice').hidden = true;
}
const distractions = ['走廊有人經過，腳步聲讓你轉過頭。', '旁邊同學拿文具的聲音，讓你忘了剛才讀到哪裡。', '坐了很久，有點想站起來動一動。', '剛才老師說的第二個要求是什麼？需要重新想一下。'];
function renderDistraction() {
  if (state.roleId !== 'adhd' || state.supports[state.task] || state.reduceVisual || state.view !== 'lessonView') return;
  $('#distractionText').textContent = distractions[state.distractedCount % distractions.length];
  $('#distractionNotice').hidden = false;
  state.distractedCount += 1;
  if (state.distractionTimeout) clearTimeout(state.distractionTimeout);
  state.distractionTimeout = setTimeout(() => { $('#distractionNotice').hidden = true; }, 5000);
}
function configureDistractions() {
  clearDistraction();
  if (state.roleId === 'adhd' && !state.supports[state.task] && !state.reduceVisual) {
    state.timerId = window.setInterval(renderDistraction, 6500);
  }
}
function renderStage() {
  stopAudio();
  const role = currentRole();
  const task = TASKS[state.task];
  const supported = Boolean(state.supports[state.task]);
  $('#studentTag').textContent = role.nameFull;
  $('#lessonTitle').textContent = task.title;
  $('#lessonSubtitle').textContent = task.subtitle;
  $('#lessonStepLabel').textContent = `STEP 02 / ACTIVITY ${state.task+1} OF 3`;
  $('#stageContext').textContent = task.context;
  $('#stageClock').textContent = task.time;
  $('#teacherOrientation').textContent = state.roleId === 'hearing' && !supported ? '老師正在轉向黑板或走動，口語訊息不完整' : '老師正向全班說明';
  $('#teacherCaption').textContent = state.roleId === 'hearing' && !supported ? task.heard : task.spoken;
  $('#workspaceHeading').textContent = task.title;
  $('#workspaceDirection').textContent = state.roleId === 'hearing' && !supported
    ? '你可能沒聽清楚完整要求。請先根據你聽到的訊息嘗試參與，或試試教師調整。'
    : task.direction;
  $('#barrierText').textContent = role.barriers[state.task];
  $('#sidebarAvatar').textContent = role.letter;
  $('#sidebarAvatar').className = `big-avatar ${role.color}`;
  $('#sidebarName').textContent = role.name;
  $('#sidebarDesc').textContent = role.desc;
  $('#stageScene').parentElement.classList.remove('effect-vision','effect-hearing','effect-adhd','effect-reading','sim-effects-off');
  if (!supported) $('#stageScene').parentElement.classList.add(`effect-${state.roleId}`);
  if (state.reduceVisual) $('#stageScene').parentElement.classList.add('sim-effects-off');
  $('#motionToggle').setAttribute('aria-pressed', String(state.reduceVisual));
  $('#motionToggle').textContent = state.reduceVisual ? '已減少視覺模擬特效（點此恢復）' : '減少視覺模擬特效';
  $$('.progress-node').forEach((node,i) => { node.classList.toggle('active', i===state.task); node.classList.toggle('done',i<state.task); });
  $('#taskFeedback').hidden = !state.taskChecked;
  renderWorkspace();
  renderSupports();
  renderPrimaryAction();
  configureDistractions();
}
function renderWorkspace() {
  const root = $('#workspaceContent');
  root.replaceChildren();
  if (state.task === 0) {
    const paper = document.createElement('div'); paper.className = 'reading-paper';
    const paragraph1 = document.createElement('p'); const paragraph2 = document.createElement('p');
    EXCERPT.forEach((sentence,i) => {
      const span = document.createElement('span'); span.className = 'sentence'; span.textContent = sentence;
      (i<3 ? paragraph1 : paragraph2).appendChild(span);
    });
    paper.append(paragraph1,paragraph2);
    root.appendChild(paper);
    if (state.roleId === 'reading' && !state.supports[state.task]) {
      const reminder = document.createElement('p'); reminder.className = 'simulation-hint';
      reminder.textContent = '提醒：字句微幅漂動只是用來視覺化閱讀負荷的教學比喻，不代表所有閱讀困難學生都會看到文字漂移。';
      root.appendChild(reminder);
    }
  } else if (state.task === 1) {
    const instructions = document.createElement('div'); instructions.className = 'activity-callout';
    instructions.textContent = state.roleId === 'hearing' && !state.supports[1]
      ? '你聽見的關鍵字：兩個……景象……感受。'
      : '選取「描寫陽光下的柳丁園」和「表達作者感受」的句子，總共兩句。';
    root.appendChild(instructions);
    const list = document.createElement('div'); list.className = 'sentence-selects';
    EXCERPT.forEach((sentence,i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = `sentence-button ${state.highlights.has(i)?'is-selected':''}`;
      button.setAttribute('aria-pressed',String(state.highlights.has(i))); button.disabled = state.taskChecked;
      const mark = document.createElement('span'); mark.className='sentence-check'; mark.textContent='✓'; mark.setAttribute('aria-hidden','true');
      const body = document.createElement('span'); body.className = 'sentence-body'; body.textContent = sentence;
      button.append(mark,body);
      button.addEventListener('click',() => { if (state.taskChecked) return;
        if (state.highlights.has(i)) state.highlights.delete(i);
        else if (state.highlights.size<2) state.highlights.add(i);
        renderWorkspace(); renderPrimaryAction();
      }); list.appendChild(button);
    });
    root.appendChild(list);
    const counter = document.createElement('div'); counter.className = 'highlight-counter';
    counter.textContent = `已選取 ${state.highlights.size} / 2 句`; root.appendChild(counter);
  } else if (state.task === 2) {
    const question = document.createElement('div'); question.className = 'quiz-question';
    question.textContent = '「陽光照耀滿園柳丁的景象，如金粉從天上落下般美麗。」作者使用這個比喻，主要想表達什麼？';
    root.appendChild(question);
    const opts = document.createElement('div'); opts.className='quiz-options';
    OPTIONS.forEach((answer,i) => {
      const lab = document.createElement('label'); lab.className = `quiz-option ${state.quizAnswer===i?'is-selected':''}`;
      const input = document.createElement('input'); input.type='radio'; input.name='classroomQuiz'; input.value=String(i);
      input.checked = state.quizAnswer===i; input.disabled = state.taskChecked;
      input.addEventListener('change',() => { state.quizAnswer=i; renderWorkspace(); renderPrimaryAction(); });
      const letter = document.createElement('span'); letter.className='option-letter'; letter.textContent = `${'ABCD'[i]}.`;
      const text = document.createElement('span'); text.textContent=answer;
      lab.append(input,letter,text); opts.appendChild(lab);
    });
    root.appendChild(opts);
  }
  if (state.roleId === 'reading' && state.supports[state.task]) {
    const glossary = document.createElement('div'); glossary.className='word-support';
    glossary.innerHTML = '<strong>閱讀線索：</strong>「如」表示「好像」；「金粉從天上落下」是在形容陽光照耀柳丁園的美麗景象，並不是說真的有金粉掉下來。可先分別找「景象」和「作者感受」。';
    root.appendChild(glossary);
  }
  if (state.taskChecked) renderTaskFeedback();
}
function renderSupports() {
  const role = currentRole();
  const root = $('#supportChoices'); root.replaceChildren();
  role.supports.forEach((support,index) => {
    const active = state.supports[state.task]===index+1;
    const btn=document.createElement('button'); btn.type='button'; btn.className = `support-choice ${active?'is-active':''}`;
    btn.setAttribute('aria-pressed',String(active));
    const icon=document.createElement('span');icon.className='support-icon';icon.textContent=active?'✓':'+';
    const label=document.createElement('span');label.textContent=support.label;
    btn.append(icon,label);
    btn.addEventListener('click',()=>{state.supports[state.task]=index+1; renderStage();});
    root.appendChild(btn);
  });
  const chosen = state.supports[state.task];
  const fb = $('#supportFeedback'); fb.hidden = !chosen;
  if (chosen) fb.textContent = `✓ 已試用教師支持：${role.supports[chosen-1].message}`;
}
function renderPrimaryAction() {
  const btn = $('#stagePrimaryBtn');
  if (state.task===0) { btn.disabled=false; btn.innerHTML='已嘗試跟讀，前往畫重點 <span>→</span>'; $('#stageHelp').textContent='可先聽老師語音，再比較「有支持／無支持」的差異。'; }
  else if (state.task===1) {
    btn.disabled = !state.taskChecked && state.highlights.size!==2;
    btn.innerHTML=state.taskChecked?'前往選擇題 <span>→</span>':'確認選取的兩個重點 <span>→</span>';
    $('#stageHelp').textContent=state.taskChecked?'這是文本線索的討論，不是對學生能力的評分。':'請先選取兩句，再確認。';
  } else {
    btn.disabled=!state.taskChecked&&state.quizAnswer===null;
    btn.innerHTML=state.taskChecked?'完成體驗，進行反思 <span>→</span>':'確認答案，閱讀說明 <span>→</span>';
    $('#stageHelp').textContent='可先試用一種支持策略，再回答問題。';
  }
}
function renderTaskFeedback() {
  const box = $('#taskFeedback'); box.hidden=false;
  if (state.task===1) {
    const correct = state.highlights.has(0)&&state.highlights.has(1);
    box.innerHTML = correct
      ? '<strong>你找到了本題設定的兩個線索。</strong>第一句描寫柳丁園的景象；第二句藉由「冷風」與「溫暖」呈現作者的感受。其餘句子也有可供討論的意涵。'
      : '<strong>一起看看文本線索。</strong>這次題目建議選第 1 句（陽光下的柳丁園景象）與第 2 句（冷風中的溫暖感受）。你選的句子可以再從「景象」或「感受」的角度討論；不以本次作答推斷學生能力。';
  } else if (state.task===2) {
    box.innerHTML = state.quizAnswer===1
      ? '<strong>選擇 B：符合本題要理解的比喻。</strong>「金粉從天上落下」描寫陽光照耀柳丁園的美麗，不是在說真正的金粉。思考一下：有哪些教學支持讓你比較容易做出判斷？'
      : '<strong>文本解說：本題較適合選 B。</strong>作者以「金粉」比喻陽光照耀柳丁園的樣子。這次作答反映的是情境設計下的理解經驗，不能用來判斷任何障礙學生的實際能力。';
  }
}
function nextStage() {
  if (state.task===0) { state.task=1; state.highlights=new Set(); state.taskChecked=false; }
  else if (state.task===1) {
    if (!state.taskChecked) { if (state.highlights.size!==2) return; state.taskChecked=true; renderTaskFeedback(); renderWorkspace(); renderPrimaryAction(); return; }
    state.task=2; state.quizAnswer=null; state.taskChecked=false;
  } else {
    if (!state.taskChecked) { if (state.quizAnswer===null) return; state.taskChecked=true; renderTaskFeedback(); renderWorkspace(); renderPrimaryAction(); return; }
    showView('reflectionView'); renderReflection(); return;
  }
  renderStage(); window.scrollTo({top:0,behavior:'auto'});
}
function skipStage() {
  if (!state.skipped.includes(state.task)) state.skipped.push(state.task);
  if (state.task === 0) {
    state.task = 1; state.highlights = new Set(); state.taskChecked = false;
  } else if (state.task === 1) {
    state.task = 2; state.quizAnswer = null; state.taskChecked = false;
  } else {
    showView('reflectionView'); renderReflection(); return;
  }
  renderStage();
}
function renderReflection() {
  const role=currentRole();
  $('#reflectionRoleChip').textContent=role.nameFull;
  $('#summaryStudentName').textContent=`${role.name}的三段課堂經驗`;
  role.barriers.forEach((barrier,i) => { $(`#summaryBarrier${i}`).textContent=barrier; });
  $('#usedSupportCount').textContent=`你試用了 ${state.supports.filter(Boolean).length} / 3 項活動的教師支持；${state.skipped.length ? `有 ${state.skipped.length} 項活動因遇到困難而選擇略過；` : ''}分心干擾提示出現 ${state.distractedCount} 次。`;
  const root=$('#strategyChoices'); root.replaceChildren();
  [...role.strategies, '與學生討論並持續檢視調整'].forEach((strategy,i) => {
    const label=document.createElement('label');label.className='strategy-option';
    const input=document.createElement('input');input.type='checkbox';input.name='strategy';input.value=strategy;input.id=`strategy${i}`;
    const span=document.createElement('span');span.textContent=`＋ ${strategy}`;
    label.append(input,span);root.appendChild(label);
  });
  $('#reflectionForm').hidden=false; $('#reflectionSuccess').hidden=true;
  $('#submitStatus').textContent='';
}
async function onReflectionSubmit(event) {
  event.preventDefault();
  const observation=$('#reflectionObservation').value.trim();
  const adjustment=$('#reflectionAdjustment').value.trim();
  const question=$('#reflectionQuestion').value.trim();
  if (observation.length<10||adjustment.length<10) { $('#submitStatus').textContent='請在前兩題各填寫至少 10 個字。'; return; }
  const strategies=$$('input[name="strategy"]:checked').map(x=>x.value);
  const record={
    id: state.pendingRecord?.id || makeId(), nickname: state.nickname, studentId: state.roleId, publish: $('#publishConsent').checked,
    observation, adjustment, question, strategies,
    experience: { supports: state.supports.map((index,i)=>index?currentRole().supports[index-1].label:''), highlights:[...state.highlights].sort(), quizAnswer:state.quizAnswer, skippedTasks:state.skipped, distractions:state.distractedCount }
  };
  state.pendingRecord=record;
  $('#submitStatus').textContent=IS_DEMO?'正在儲存這份示範反思……':'正在送出並確認 Google Sheets 已儲存……';
  const btn=$('#submitReflectionBtn'); btn.disabled=true;
  try {
    const result=await submitReflection(record);
    $('#reflectionForm').hidden=true; $('#reflectionSuccess').hidden=false;
    $('#successText').textContent = result.demo
      ? result.moderation==='private' ? '本機示範模式：這份反思未公開，僅存在目前瀏覽器中，不會出現在交流牆。' : '目前是本機示範模式：公開反思只會儲存在這個瀏覽器。完成 Google Sheets 設定後，各裝置才會一起看到。'
      : result.moderation==='pending' ? '反思已成功存入 Google Sheets，等待老師於試算表審核後才會在交流牆公開。'
      : result.moderation==='hidden' ? '反思已存入 Google Sheets，但目前已被設為不公開，交流牆不會顯示。'
      : result.moderation==='private' ? '反思已存入 Google Sheets，只有主持教師可以在試算表中查看，不會公開到交流牆。'
      : '反思已存入 Google Sheets，也可以在交流牆閱讀並回覆其他老師的想法。';
  } catch(err) { $('#submitStatus').textContent=`送出尚未確認：${err.message}`; }
  finally { btn.disabled=false; }
}
function init() {
  $('#participantName').value=state.nickname;
  $('#startForm').addEventListener('submit',event=>{
    event.preventDefault();
    const name=$('#participantName').value.replace(/[\u0000-\u001f]/g,'').trim().slice(0,24);
    if (!name) { $('#participantName').focus(); return; }
    state.nickname=name; sessionStorage.setItem('classroomNickname',name);
    $('#participantChip').textContent=`體驗者：${name}`;
    showView('classroomView'); $('#classroomMap').focus({preventScroll:true});
  });
  $$('[data-student]').forEach(btn=>btn.addEventListener('click',()=>chooseRole(btn.dataset.student)));
  $$('[data-move]').forEach(btn=>btn.addEventListener('click',()=>{
    const [dx,dy]=btn.dataset.move.split(',').map(Number); moveAvatar(dx,dy);
    $('#classroomMap').focus({preventScroll:true});
  }));
  $('#chooseNearBtn').addEventListener('click',chooseNear);
  window.addEventListener('keydown',event=>{
    if (state.view!=='classroomView'||event.altKey||event.ctrlKey||event.metaKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
    const moves={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    if (moves[event.key]) { event.preventDefault(); moveAvatar(...moves[event.key]); }
    else if (event.key==='Enter' && (document.activeElement===$('#classroomMap') || document.activeElement===document.body)) { event.preventDefault(); chooseNear(); }
  });
  $('#backToClass').addEventListener('click',()=>showView('classroomView'));
  $('#motionToggle').addEventListener('click',()=>{state.reduceVisual=!state.reduceVisual;renderStage();});
  $('#audioBtn').addEventListener('click',playAudio);
  $('#dismissDistraction').addEventListener('click',()=>{$('#distractionNotice').hidden=true;});
  $('#stagePrimaryBtn').addEventListener('click',nextStage);
  $('#skipTaskBtn').addEventListener('click',skipStage);
  $('#chooseAnotherStudent').addEventListener('click',()=>{
    if (!confirm('返回教室選擇另一位學生？若尚未送出反思，換角色後會清除目前填寫內容。')) return;
    showView('classroomView');
  });
  $('#reflectionForm').addEventListener('submit',onReflectionSubmit);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio();});
}
init();
