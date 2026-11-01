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
// 「干擾程度」是教室聲學與指令完整度的教學情境，不等同聽損程度。
// 避免把輕度聽損誤描繪成聽不到所有聲音；重點是嘈雜環境中的口語理解。
const HEARING_TASKS = [
  {
    full: '請大家翻到鏡頭下的家鄉。跟著老師讀第一段，到農人深切的希望先停下來。',
    fragments: [
      '請大家翻到〈鏡頭下的家鄉〉。跟著……第一段，到……希望……停下來。',
      '請翻到……跟著老師……第一……農人……停……',
      '……翻到……第一……農人……' 
    ],
    samples: [
      '請大家翻到課文。跟著老師讀第一段。到農人深切的希望先停。',
      '請大家翻到課文。跟著老師讀。農人深切的希望。',
      '翻到課文。第一段。農人。'
    ],
    question: '剛剛老師請你跟讀到哪裡先停下來？',
    choices: ['跟讀到「農人深切的希望」先停。', '從頭一路朗讀到課文最後一句。', '只要默讀，不需要跟讀。'], correct:0,
    effect: '你可能跟著念了下去，卻沒聽見「先停下來」的要求。'
  },
  {
    full: '請畫出兩句重點。第一句找柳丁園的景象，第二句找作者經過柳丁園時的感受。只要兩句。',
    fragments: [
      '請畫……兩句。第一句……柳丁園……第二句……感受。',
      '……兩句……第一……柳丁園……第二……',
      '……畫……第一句……第二……' 
    ],
    samples: [
      '請畫出兩句重點。第一句找柳丁園景象。第二句找作者的感受。',
      '畫出兩句。第一句柳丁園。第二句。',
      '畫。第一句。第二句。'
    ],
    question: '你理解老師要畫出的「兩種重點」是什麼嗎？',
    choices: ['兩句都找介紹農特產推廣的內容。', '找柳丁園景象與作者感受，各一句。', '所有提到柳丁的句子都畫起來。'], correct:1,
    effect: '你可能知道要畫兩句，卻不知道該從哪兩個方向找。'
  },
  {
    full: '請看選擇題，只選一個最合適的答案，先想想如金粉從天上落下是形容什麼。',
    fragments: [
      '請看……選擇題。只選……答案，……如金粉……形容……',
      '請看……只選……金粉……形容……',
      '……選……答案……金粉……' 
    ],
    samples: [
      '請看選擇題。只選一個答案。想想金粉形容什麼。',
      '請看題目。選。金粉形容什麼。',
      '選擇題。金粉。'
    ],
    question: '老師剛剛強調的作答方式是什麼？',
    choices: ['先空著，等老師公布答案再寫。', '可以勾兩個以上的選項。', '選一個最合適的答案，依課文比喻判斷。'], correct:2,
    effect: '如果連作答規則都要猜，可能還沒開始思考文章就先卡住。'
  }
];
const HEARING_LEVELS = {
  1:{label:'低干擾', teacherVolume:.56, ambientGain:.065, hint:'周圍偶有翻書聲，重要字詞仍有機會漏接。'},
  2:{label:'較吵教室', teacherVolume:.35, ambientGain:.12, hint:'老師離座位較遠，翻頁、走動和同學交談一起出現。'},
  3:{label:'高干擾教室', teacherVolume:.22, ambientGain:.20, hint:'老師轉身說明，周遭連續出現雜音，關鍵活動要求更容易被遮蔽。'}
};
// 學習任務會因教室環境產生不同阻礙，但不代表同類障礙者的經驗完全一致。
const MOMENTS = {
  vision: [
    '老師指著黑板往下讀了，但遠處的小字仍然模糊。',
    '現在要畫重點了；你必須先花更多時間確認是哪一句。',
    '題目就在眼前，先看清選項已經花掉不少力氣。'
  ],
  hearing: [
    '後排的翻書聲和前方的語音重疊，你只收到部分指令。',
    '你知道老師要找重點，但「哪兩種重點」沒有聽完整。',
    '老師好像補充了作答規則，轉瞬即逝的語音難以確認。'
  ],
  adhd: [
    '走廊傳來腳步聲；剛跟到的朗讀位置又需要重新找。',
    '同學翻頁、筆掉落、門口聲音，讓你反覆回頭確認任務。',
    '四個答案還沒比較完，剛才想好的線索又被其他刺激打斷。'
  ],
  reading: [
    '句子很長；「如金粉」究竟是事實還是比喻？',
    '每句都好像重要，卻不容易分清「景象」與「感受」。',
    '讀懂個別詞語，還不等於抓到作者整段想表達的意思。'
  ]
};
const SUPPORT_MOMENTS = {
  vision: '放大字體與清楚的板書，讓注意力回到文章內容。',
  hearing: '有同步文字指令後，不需要只依賴短暫的口語資訊。',
  adhd: '任務分段、明確提示與較少干擾，讓你更容易接回當下的步驟。',
  reading: '關鍵詞與文章結構提示，讓閱讀理解更有可循的線索。'
};
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
      '老師說話時，走廊聲音、旁邊同學動作與想站起來活動的需要，甚至隔壁同學把聯絡簿與鉛筆盒壓到你課本邊緣，都可能讓你反覆重新找回朗讀進度。',
      '需要一直維持注意並記住兩個要求。當桌面被別人的物品擋住、旁邊又有動靜時，正在判斷句子意思的思路更容易被打斷。',
      '要先讀題、比較四個答案、記住問題；若課本與題目區一直被遮住一部分，又伴隨其他干擾，完成作答的負擔會更明顯。'
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
  reduceVisual: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), timerId: null, distractionTimeout: null, ambientOn:false,
  pendingRecord: null, hearingLevel:3, hearingAnswers:[null,null,null],
  adhd:{covered:true,recovered:false,lookAway:false,bumpCount:0,heardLong:false}, adhdTimers:[]
};
// 只有使用者點擊「開啟教室環境聲」才會播放；全程可關閉。
const environmentAudio = { context:null, source:null, gain:null, filter:null, lfo:null, lfoGain:null, eventTimer:null, auto:false, manual:false };
let speechSequence=0;
const VIEWS = ['welcomeView', 'classroomView', 'lessonView', 'reflectionView'];
function showView(id) {
  VIEWS.forEach(view => { document.getElementById(view).hidden = view !== id; });
  state.view = id;
  if (id !== 'lessonView') { stopAudio(); clearDistraction(); stopEnvironmentAudio(); }
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
  state.hearingAnswers = [null,null,null];
  resetAdhd();
  $('#reflectionForm').reset();
  showView('lessonView');
  renderStage();
}
function stopAudio() {
  speechSequence += 1;
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (_) { /* unavailable */ }
  const btn = $('#audioBtn');
  if (btn) btn.textContent = state.roleId === 'hearing' ? '♫ 播放老師指令＋教室聲' : '♫ 播放老師語音';
  $('#hearingWave')?.classList.remove('is-playing');
  if (environmentAudio.auto && !environmentAudio.manual) stopEnvironmentAudio();
}
function stopEnvironmentAudio() {
  const a = environmentAudio;
  if (a.eventTimer) clearInterval(a.eventTimer);
  a.eventTimer=null;
  if (a.source) {
    try { a.source.stop(); } catch (_) {}
    try { a.source.disconnect(); } catch (_) {}
  }
  if (a.lfo) {
    try { a.lfo.stop(); } catch (_) {}
    try { a.lfo.disconnect(); } catch (_) {}
  }
  for (const node of [a.filter,a.gain,a.lfoGain]) {
    try { node?.disconnect(); } catch (_) {}
  }
  a.source=null; a.filter=null; a.gain=null; a.lfo=null; a.lfoGain=null;
  a.auto=false; a.manual=false;
  state.ambientOn=false;
  const btn=$('#ambientToggle');
  if(btn){btn.textContent='◉ 開啟教室環境聲';btn.setAttribute('aria-pressed','false');}
}
// 分散的輕微翻書、桌面摩擦聲：由緩起緩落的合成聲組成，避免突發尖銳音效。
function playClassroomRustle() {
  const a=environmentAudio;
  if(!a.context || !a.source)return;
  const ctx=a.context;
  const dur=.27;
  const len=Math.floor(ctx.sampleRate*dur);
  const buffer=ctx.createBuffer(1,len,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<len;i++){
    const position=i/Math.max(1,len-1);
    const env=Math.pow(Math.sin(Math.PI*position),1.8);
    data[i]=(Math.random()*2-1)*.27*env;
  }
  const source=ctx.createBufferSource();source.buffer=buffer;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1850;
  const gain=ctx.createGain();
  gain.gain.value=state.roleId==='hearing'&&!state.supports[state.task] ? .15 : .045;
  source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
  source.onended=()=>{try{source.disconnect();filter.disconnect();gain.disconnect();}catch(_){}};
  source.start();
}
// 由使用者點擊啟動，不自動播放。使用限幅噪聲避免尖銳音效。
function startEnvironmentAudio({auto=false}={}) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    if (!auto) $('#ambientToggle').textContent='此裝置不支援環境聲';
    return false;
  }
  if (state.ambientOn) {
    if (!auto) environmentAudio.manual=true;
    refreshEnvironmentAudio();
    return true;
  }
  try {
    const a = environmentAudio;
    const context=a.context || new AudioContext();
    a.context=context;
    if(context.state==='suspended') context.resume().catch(()=>{});
    const length=Math.max(1,Math.round(context.sampleRate*3));
    const buffer=context.createBuffer(1,length,context.sampleRate);
    const data=buffer.getChannelData(0);
    // 頻率受限的緩慢雜音，用來象徵談話、翻書、通風等背景聲。
    // 不做尖銳爆音、不聲稱重現任何聽力圖或醫療聲學模型。
    let smoothed=0;
    for(let i=0;i<length;i++){
      smoothed=smoothed*.90+(Math.random()*2-1)*.10;
      const pulse=.68+.32*Math.sin(i/context.sampleRate*2*Math.PI*.62);
      data[i]=Math.max(-.6,Math.min(.6,(smoothed*.65+(Math.random()*2-1)*.19)*pulse));
    }
    const src=context.createBufferSource();src.buffer=buffer;src.loop=true;
    const filter=context.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1000;filter.Q.value=.65;
    const gain=context.createGain();gain.gain.value=.08;
    const lfo=context.createOscillator();lfo.type='sine';lfo.frequency.value=.38;
    const lfoGain=context.createGain();lfoGain.gain.value=.016;
    lfo.connect(lfoGain);lfoGain.connect(gain.gain);
    src.connect(filter);filter.connect(gain);gain.connect(context.destination);
    src.start();lfo.start();
    Object.assign(a,{source:src,filter,gain,lfo,lfoGain,auto,manual:!auto});
    state.ambientOn=true;
    a.eventTimer=window.setInterval(playClassroomRustle,2500);
    refreshEnvironmentAudio();
    $('#ambientToggle').textContent='■ 關閉教室環境聲';
    $('#ambientToggle').setAttribute('aria-pressed','true');
    return true;
  } catch(err) {
    console.warn('ambient audio failed',err);
    stopEnvironmentAudio();
    if (!auto) $('#ambientToggle').textContent='暫時無法播放環境聲';
    return false;
  }
}
function toggleEnvironmentAudio() {
  if (state.ambientOn) { stopEnvironmentAudio(); return; }
  startEnvironmentAudio({auto:false});
}
function refreshEnvironmentAudio() {
  const a=environmentAudio;
  if(!a.gain)return;
  const hearing = state.roleId==='hearing'&&!state.supports[state.task];
  const target=hearing ? HEARING_LEVELS[state.hearingLevel].ambientGain : .05;
  const now=a.context?.currentTime || 0;
  a.gain.gain.cancelScheduledValues(now);
  a.gain.gain.setTargetAtTime(target,now,.22);
}
function playAudio() {
  if (!('speechSynthesis' in window)) {
    $('#audioBtn').textContent = '此瀏覽器無法語音播放';
    $('#hearingResult').textContent='這台裝置無法播放語音。仍可使用片段指令與任務選擇，討論所缺的資訊。';
    return;
  }
  if (window.speechSynthesis.speaking) { stopAudio(); return; }
  const hearing = state.roleId==='hearing';
  const supported = Boolean(state.supports[state.task]);
  const level=HEARING_LEVELS[state.hearingLevel];
  let read=state.task===0?`${TASKS[0].spoken}。${EXCERPT.join('')}`:TASKS[state.task].spoken;
  if(hearing){
    // 由音量比例、較難聽完整的句段、背景聲三者共同構成課堂溝通障礙。
    read = supported ? HEARING_TASKS[state.task].full : HEARING_TASKS[state.task].samples[state.hearingLevel-1];
    if (state.task === 0) {
      // 朗讀活動不只播放指令，也要在對照前後聽到課文語句。
      const passage = supported
        ? EXCERPT.slice(0,3).join('')
        : [
            '這裡的十一月。陽光照耀滿園柳丁的景象。如金粉從天上落下般美麗。',
            '十一月。陽光照耀柳丁園。金粉。冷風。農人的希望。',
            '十一月。柳丁園。陽光。農人。'
          ][state.hearingLevel-1];
      read += '。' + passage;
    }
    startEnvironmentAudio({auto:true});
  }
  const utterance = new SpeechSynthesisUtterance(read);
  utterance.lang = 'zh-TW';
  utterance.rate = hearing && !supported ? 1.05 : .88;
  utterance.volume = hearing ? (supported ? .92 : level.teacherVolume) : .92;
  utterance.pitch=1;
  const seq=++speechSequence;
  const cleanup=()=>{
    if(seq!==speechSequence)return;
    $('#audioBtn').textContent = hearing ? '♫ 再聽一次老師指令' : '♫ 播放老師語音';
    $('#hearingWave')?.classList.remove('is-playing');
    if(environmentAudio.auto && !environmentAudio.manual) stopEnvironmentAudio();
  };
  utterance.onend=cleanup;utterance.onerror=cleanup;
  try{
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    $('#audioBtn').textContent='■ 停止老師語音';
    if(hearing) $('#hearingWave')?.classList.add('is-playing');
  }catch(err){cleanup();}
}
function clearDistraction() {
  if (state.timerId) window.clearInterval(state.timerId);
  if (state.distractionTimeout) window.clearTimeout(state.distractionTimeout);
  state.timerId = null; state.distractionTimeout = null;
  state.adhdTimers.forEach(id => window.clearTimeout(id)); state.adhdTimers=[];
  $('#distractionNotice').hidden = true;
}
// 四種班級干擾採事件式體驗：物品遮擋、桌面碰撞、長指令漏接、起身張望後找回進度。
// 這些是教學情境中的環境與任務負荷，不是 ADHD 學生一定會出現的行為。
const ADHD_LONG = [
  { full:'請先翻到〈鏡頭下的家鄉〉，跟著我念第一段，念到「農人深切的希望」停，再回頭找作者描寫柳丁園的句子，最後留意下一段。', fragment:'請先翻到……跟著……第一段……等一下，再回頭……剛才說到哪一項？', focus:'先讀第一段，找到「農人深切的希望」。' },
  { full:'請打開課文，找一個寫柳丁園景象的句子，再找一個寫作者感受的句子，只要畫兩句，畫好後把筆放下來。', fragment:'請打開……找……再找……只要……還有什麼要求？', focus:'第一步找景象，第二步找感受；各一句。' },
  { full:'請大家先把課文看完，再看這道選擇題，找出作者的比喻，想一下陽光和金粉的關係，只選一個最合適的答案。', fragment:'先把……再看……想一下……只……我剛剛聽到哪裡？', focus:'先讀題目，再選出一個最合適的答案。' }
];
function resetAdhd(){
  state.adhd={covered:true,recovered:false,lookAway:false,bumpCount:0,heardLong:false};
}
function queueAdhd(fn, ms){
  const id=window.setTimeout(fn,ms); state.adhdTimers.push(id);
}
function adhdSignal(message){
  const box=$('#adhdLiveEvent');
  if(box) box.textContent=message;
  $('#distractionText').textContent=message;
  $('#distractionNotice').hidden=false;
  state.distractedCount += 1;
  if(state.distractionTimeout)window.clearTimeout(state.distractionTimeout);
  state.distractionTimeout=window.setTimeout(()=>{$('#distractionNotice').hidden=true;},4300);
}
function bumpDesk(){
  if(state.roleId!=='adhd'||state.supports[state.task]||state.view!=='lessonView')return;
  state.adhd.bumpCount++;
  const root=$('#workspaceContent');
  root.classList.remove('adhd-desk-bump');
  void root.offsetWidth;
  if(!state.reduceVisual)root.classList.add('adhd-desk-bump');
  queueAdhd(()=>root.classList.remove('adhd-desk-bump'),650);
  adhdSignal('同學的手肘碰到你的桌子；課本晃了一下，剛剛看到的句子又需要重新找。');
}
function hearLongInstruction(){
  if(state.roleId!=='adhd'||state.supports[state.task])return;
  state.adhd.heardLong=true;
  const scene=$('#teacherCaption');
  scene.textContent=ADHD_LONG[state.task].full;
  adhdSignal('老師一口氣交代了好幾個步驟。你聽到前面，後半段卻有點接不上。');
  queueAdhd(()=>{
    if(state.roleId==='adhd'&&!state.supports[state.task]&&state.view==='lessonView'){
      scene.textContent=ADHD_LONG[state.task].fragment;
      const line=$('#adhdInstructionLine');
      if(line)line.textContent='剛剛有好幾個步驟，但現在只記得片段。可以請老師一次提示一個步驟嗎？';
    }
  },2700);
}
function lookAway(){
  if(state.roleId!=='adhd'||state.supports[state.task])return;
  state.adhd.lookAway=true;
  const root=$('#workspaceContent');
  if(!state.reduceVisual)root.classList.add('adhd-looking-away');
  adhdSignal('坐了好一陣子，你想起身看看窗外。回到座位時，老師已經往下進行了。');
  queueAdhd(()=>{
    root.classList.remove('adhd-looking-away');
    if(state.roleId==='adhd'&&!state.supports[state.task]){
      state.adhd.recovered=false;
      renderAdhdRecovery();
    }
  },1900);
}
function clearBook(){
  if(state.roleId!=='adhd'||state.supports[state.task])return;
  state.adhd.covered=false;
  state.adhd.recovered=false;
  const cover=$('#adhdBookCover'); if(cover)cover.remove();
  adhdSignal('你把擋住的聯絡簿移開了，但現在需要重新找到剛才讀到的位置。');
  renderAdhdRecovery();
}
function renderAdhdRecovery(){
  const box=$('#adhdRecovery');
  if(!box || state.roleId!=='adhd')return;
  box.hidden=false;
  const targets=[1,2,0];
  const correct=targets[state.task];
  const labels=state.task===2
    ? ['回到題目：「金粉」比喻主要想表達什麼？','從第一個選項重新開始比較','先想別的事情，等一下再作答']
    : ['先從第一句重新讀一遍','找回剛才在讀的「冷風中感到溫暖」一句','看一下第三句「農人深切的希望」'];
  const target=state.task===2?0:correct;
  box.replaceChildren();
  const title=document.createElement('strong'); title.textContent='剛剛讀到哪裡了？請重新定位。';box.appendChild(title);
  const desc=document.createElement('p'); desc.textContent='物品移開／站起來後，進度不一定能立刻接上。這裡不是考你記憶力，而是體會中斷後重新定位的負荷。';box.appendChild(desc);
  const group=document.createElement('div');group.className='adhd-recovery-options';
  labels.forEach((label,i)=>{
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.addEventListener('click',()=>{
      if(i===target){state.adhd.recovered=true;box.hidden=true;adhdSignal('你終於找回了進度，但整個過程花了額外的注意力與時間。');}
      else{desc.textContent='還沒有找回剛才的位置。試著觀察課文中的線索；也可以請老師給你定位提示。';}
    });
    group.appendChild(button);
  });
  box.appendChild(group);
}
function renderAdhdPanel(root){
  if(state.roleId!=='adhd')return;
  if(state.supports[state.task]){
    const tip=document.createElement('div');tip.className='adhd-supported-step';
    tip.textContent=`✓ 教師已協助清出課本空間、給明確的視覺步驟：${ADHD_LONG[state.task].focus} 學生也可以選擇短暫站立或活動。`;
    root.appendChild(tip);return;
  }
  if(state.adhd.covered){
    const overlay=document.createElement('div');overlay.id='adhdBookCover';
    overlay.className=`adhd-obstruction obstruction-task-${state.task}`;
    overlay.setAttribute('role','img');overlay.setAttribute('aria-label','有同學的物品遮住部分課本內容');
    const label=document.createElement('div');label.className='obstruction-label';
    label.textContent=['同學把聯絡簿和鉛筆盒放到你的課本上','同學的作業本擋住你要畫的句子','前排講義滑下來遮住題目'][state.task];
    overlay.appendChild(label);root.appendChild(overlay);
  }
  const panel=document.createElement('section');panel.className='adhd-event-panel';
  panel.innerHTML=`<strong>現在的教室不只在發生一件事</strong><p id="adhdInstructionLine">老師剛才一次說了好幾個要求；桌子又被碰到。你能順利跟上嗎？</p><div class="adhd-event-actions"><button type="button" id="adhdMoveBook">${state.adhd.covered?'把擋住課本的物品移開':'已移開物品'}</button><button type="button" id="adhdBumpDesk">重播：同學碰到桌子</button><button type="button" id="adhdLongCommand">聽：老師的長指令</button><button type="button" id="adhdStandUp">起身看向窗外</button></div><div id="adhdLiveEvent" class="adhd-event-live" aria-live="polite">留意剛才被遮住的位置，以及隨時冒出的另一個聲音。</div><div id="adhdRecovery" class="adhd-recovery" hidden></div>`;
  root.appendChild(panel);
  const button=panel.querySelector('#adhdMoveBook');button.disabled=!state.adhd.covered;
  button.addEventListener('click',()=>{clearBook();button.disabled=true;button.textContent='已移開物品';});
  panel.querySelector('#adhdBumpDesk').addEventListener('click',bumpDesk);
  panel.querySelector('#adhdLongCommand').addEventListener('click',hearLongInstruction);
  panel.querySelector('#adhdStandUp').addEventListener('click',lookAway);
  if(!state.adhd.covered && !state.adhd.recovered)renderAdhdRecovery();
}

const distractions = ['走廊有人經過，腳步聲讓你轉過頭。', '隔壁同學的聯絡簿直接壓到你的課本上，你得先挪開。', '旁邊同學拿文具的聲音，讓你忘了剛才讀到哪裡。', '坐了很久，有點想站起來動一動。', '剛才老師說的第二個要求是什麼？需要重新想一下。'];
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
  if (state.roleId === 'adhd' && !state.supports[state.task]) {
    queueAdhd(bumpDesk,1900);
    queueAdhd(hearLongInstruction,6200);
    queueAdhd(lookAway,12100);
    state.timerId = window.setInterval(renderDistraction, 10000);
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
  $('#teacherOrientation').textContent = state.roleId === 'hearing' && !supported ? '老師轉向黑板說話；教室仍有聲響' : '老師正向全班說明';
  $('#teacherCaption').textContent = state.roleId === 'hearing' ? (supported ? HEARING_TASKS[state.task].full : HEARING_TASKS[state.task].fragments[state.hearingLevel-1]) : state.roleId === 'adhd' ? (supported ? ADHD_LONG[state.task].focus : ADHD_LONG[state.task].fragment) : task.spoken;
  const sceneEvent=$('#sceneEvent');
  sceneEvent.hidden=false;
  sceneEvent.textContent = supported ? SUPPORT_MOMENTS[state.roleId] : MOMENTS[state.roleId][state.task];
  $('#perspectiveBanner').textContent = `${role.name}的座位視角 · ${supported?'老師已提供支持':'原始課堂條件'}`;
  $('#experienceHint').textContent = supported
    ? `✓ 已試用教師調整。請比較現在的課堂與剛才有什麼不同。`
    : `情境 ${state.task+1}/3｜先按原本課堂條件試一試，再選擇一項教師支持。`;
  refreshEnvironmentAudio();
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
  renderHearingPanel();
  renderSupports();
  renderPrimaryAction();
  configureDistractions();
}
function renderHearingPanel() {
  const panel=$('#hearingPanel');
  const hearing=state.roleId==='hearing';
  panel.hidden=!hearing;
  if(!hearing)return;
  const supported=Boolean(state.supports[state.task]);
  const task=HEARING_TASKS[state.task];
  const level=HEARING_LEVELS[state.hearingLevel];
  // 同一項任務保留「支持前／支持後」兩次判斷，才有可比較的體驗。
  const answers=state.hearingAnswers[state.task] || {before:null,after:null};
  const current=supported?answers.after:answers.before;
  $('#hearingSetting').textContent=supported?'教師支持已啟用｜資訊更完整':`${level.label}｜訊息可能漏接`;
  $('#hearingSetting').classList.toggle('is-supported',supported);
  $('#hearingIntro').textContent=supported
    ? '老師面向學生、降低噪音，並同步提供完整指令。重新聽一次，再核對你剛剛的理解。'
    : `目前情境：${level.hint}。請先播放老師的指令，再根據你聽到的內容作答。`;
  $('#hearingTranscript').hidden=!supported;
  $('#hearingTranscript').textContent=supported?`老師的完整要求：${task.full}`:'';
  $('#hearingWave').classList.toggle('is-supported',supported);
  $$('#hearingLevelControls button').forEach(btn=>{
    const active=Number(btn.dataset.hearingLevel)===state.hearingLevel;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
  });
  $('#hearingQuestion').textContent=task.question;
  const root=$('#hearingChoices');root.replaceChildren();
  task.choices.forEach((choice,i)=>{
    const btn=document.createElement('button');
    const selected=current?.value===i;
    btn.type='button';btn.className=`hearing-choice ${selected?'is-selected':''}`;
    btn.setAttribute('aria-pressed',String(selected));
    btn.textContent=`${'ABC'[i]}．${choice}`;
    btn.addEventListener('click',()=>{
      const next=state.hearingAnswers[state.task] || {before:null,after:null};
      next[supported?'after':'before']={value:i,correct:i===task.correct};
      state.hearingAnswers[state.task]=next;
      renderHearingPanel();
    });
    root.appendChild(btn);
  });
  const feedback=$('#hearingResult');
  if(!current){
    feedback.textContent=supported && answers.before
      ? `你剛才選的是「${task.choices[answers.before.value]}」。現在有了完整指令，請再選一次作比較。`
      : '先聽一次，再選出你以為老師要做的事；即使猜錯也能繼續體驗。';
    feedback.className='hearing-result';
  }else if(!supported){
    feedback.textContent = current.correct
      ? '這次辨識到了關鍵要求；但你是否仍需反覆確認？試著套用教師支持再比較。'
      : `你根據不完整訊息做出推測。${task.effect} 點選右側教師支持後，再核對完整指令。`;
    feedback.className=`hearing-result ${current.correct?'':'is-missed'}`;
  }else if(current.correct){
    feedback.textContent=answers.before && !answers.before.correct
      ? `支持前你選的是「${task.choices[answers.before.value]}」；支持後，完整指令讓你能確認老師真正的要求。`
      : '現在有了完整指令，你可以確認老師真正的要求，將心力放回課文內容。';
    feedback.className='hearing-result is-clear';
  }else{
    feedback.textContent='現在可讀到完整要求。對照老師說的內容，再重新選一次即可；這不是能力測驗。';
    feedback.className='hearing-result is-missed';
  }
  $('#audioBtn').textContent=supported?'♫ 播放清楚指令＋較安靜環境':'♫ 播放受干擾指令＋教室聲';
}
function renderWorkspace() {
  const root = $('#workspaceContent');
  root.classList.remove('adhd-desk-bump','adhd-looking-away');
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
  renderAdhdPanel(root);
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
  if (state.task===0) { state.task=1; state.highlights=new Set(); state.taskChecked=false; resetAdhd(); }
  else if (state.task===1) {
    if (!state.taskChecked) { if (state.highlights.size!==2) return; state.taskChecked=true; renderTaskFeedback(); renderWorkspace(); renderPrimaryAction(); return; }
    state.task=2; state.quizAnswer=null; state.taskChecked=false; resetAdhd();
  } else {
    if (!state.taskChecked) { if (state.quizAnswer===null) return; state.taskChecked=true; renderTaskFeedback(); renderWorkspace(); renderPrimaryAction(); return; }
    showView('reflectionView'); renderReflection(); return;
  }
  renderStage(); window.scrollTo({top:0,behavior:'auto'});
}
function skipStage() {
  if (!state.skipped.includes(state.task)) state.skipped.push(state.task);
  if (state.task === 0) {
    state.task = 1; state.highlights = new Set(); state.taskChecked = false; resetAdhd();
  } else if (state.task === 1) {
    state.task = 2; state.quizAnswer = null; state.taskChecked = false; resetAdhd();
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
  const attempts=state.roleId==='hearing'?state.hearingAnswers.filter(Boolean):[];
  const compareInfo=attempts.length?`；聽取指令對照 ${attempts.filter(x=>x.before&&x.after).length} 項（原始情境判斷 ${attempts.filter(x=>x.before).length} 項）`:'';
  $('#usedSupportCount').textContent=`你試用了 ${state.supports.filter(Boolean).length} / 3 項活動的教師支持；${state.skipped.length ? `有 ${state.skipped.length} 項活動因遇到困難而選擇略過；` : ''}分心干擾提示出現 ${state.distractedCount} 次${compareInfo}。`;
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
    experience: { supports: state.supports.map((index,i)=>index?currentRole().supports[index-1].label:''), highlights:[...state.highlights].sort(), quizAnswer:state.quizAnswer, skippedTasks:state.skipped, distractions:state.distractedCount, hearingSetting:state.roleId==='hearing'?HEARING_LEVELS[state.hearingLevel].label:null, hearingAnswers:state.roleId==='hearing'?state.hearingAnswers:null }
  };
  state.pendingRecord=record;
  $('#submitStatus').textContent=IS_DEMO?'正在儲存這份示範反思……':'正在送出並確認 Google Sheets 已儲存……';
  const btn=$('#submitReflectionBtn'); btn.disabled=true;
  try {
    const result=await submitReflection(record);
    $('#reflectionForm').hidden=true; $('#reflectionSuccess').hidden=false;
    state.pendingRecord=null;
    $('#successText').textContent = result.demo
      ? result.moderation==='private' ? '本機示範模式：這份反思未公開，僅存在目前瀏覽器中，不會出現在交流牆。' : '目前是本機示範模式：公開反思只會儲存在這個瀏覽器。完成 Google Sheets 設定後，各裝置才會一起看到。'
      : result.moderation==='pending' ? '反思已成功存入 Google Sheets，等待老師於試算表審核後才會在交流牆公開。'
      : result.moderation==='hidden' ? '反思已存入 Google Sheets，但目前已被設為不公開，交流牆不會顯示。'
      : result.moderation==='private' ? '反思已存入 Google Sheets，只有主持教師可以在試算表中查看，不會公開到交流牆。'
      : '反思已存入 Google Sheets，也可以在交流牆閱讀並回覆其他老師的想法。';
  } catch(err) { $('#submitStatus').textContent=`尚未證實儲存成功，請保留此頁並勿重複生成不同的反思：${err.message}`; }
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
  $('#ambientToggle').addEventListener('click',toggleEnvironmentAudio);
  $$('#hearingLevelControls button').forEach(btn=>btn.addEventListener('click',()=>{
    if (state.roleId!=='hearing') return;
    state.hearingLevel=Number(btn.dataset.hearingLevel);
    renderStage();
  }));
  $('#dismissDistraction').addEventListener('click',()=>{$('#distractionNotice').hidden=true;});
  $('#stagePrimaryBtn').addEventListener('click',nextStage);
  $('#skipTaskBtn').addEventListener('click',skipStage);
  $('#chooseAnotherStudent').addEventListener('click',()=>{
    if (!confirm('返回教室選擇另一位學生？若尚未送出反思，換角色後會清除目前填寫內容。')) return;
    showView('classroomView');
  });
  $('#reflectionForm').addEventListener('submit',onReflectionSubmit);
  $('#copyReflectionBtn').addEventListener('click',async()=>{
    const backup=`換個位置，看見學習｜反思備份\n體驗者：${state.nickname}\n學生：${state.roleId ? currentRole().nameFull : ''}\n\n觀察：\n${$('#reflectionObservation').value}\n\n教學調整：\n${$('#reflectionAdjustment').value}\n\n討論問題：\n${$('#reflectionQuestion').value}`;
    try{await navigator.clipboard.writeText(backup);$('#submitStatus').textContent='反思文字已複製。你可以先貼到記事本保存，再進行連線診斷。';}
    catch(_){window.prompt('請複製以下反思文字並自行保存：',backup);}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAudio();stopEnvironmentAudio();}});
}
init();
