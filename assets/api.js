/** GitHub Pages 可直接使用的 Google Apps Script 讀寫層。 */
const CONFIG = window.CLASSROOM_CONFIG || {};
export const API_URL = String(CONFIG.API_URL || '').trim();
export const IS_DEMO = API_URL.length === 0;
const LOCAL_KEY = 'classroom-perspective-local-v1';
let sequence = 0;

function assertEndpoint() {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(API_URL)) {
    throw new Error('config.js 的 API_URL 格式不正確。請使用 Apps Script 部署後的 /exec 網址。');
  }
}

function loadDemo() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    return { posts: Array.isArray(data.posts) ? data.posts : [], replies: Array.isArray(data.replies) ? data.replies : [] };
  } catch (_) {
    return { posts: [], replies: [] };
  }
}
function storeDemo(data) { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); }

/** GAS 官方文件支援的 JSONP 讀取：只能用於不包含機密資訊的公開資料。 */
function jsonp(params = {}) {
  assertEndpoint();
  return new Promise((resolve, reject) => {
    const callback = `_classroomCallback_${Date.now()}_${++sequence}`;
    const script = document.createElement('script');
    const url = new URL(API_URL);
    for (const [key, val] of Object.entries(params)) url.searchParams.set(key, String(val));
    url.searchParams.set('prefix', callback);
    url.searchParams.set('_t', String(Date.now()));
    let done = false;
    const cleanup = () => { delete window[callback]; script.remove(); clearTimeout(timeoutId); };
    const settle = (fn, value) => { if (done) return; done = true; cleanup(); fn(value); };
    const timeoutId = window.setTimeout(() => settle(reject, new Error('讀取逾時，請檢查 Apps Script 網址與部署權限。')), 12000);
    window[callback] = value => settle(resolve, value);
    script.onerror = () => settle(reject, new Error('讀取 Google Sheets 失敗，請確認部署是否允許公開存取。'));
    script.src = url.toString();
    document.head.appendChild(script);
  });
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function postThenVerify(payload) {
  assertEndpoint();
  // text/plain + no-cors 可從 GitHub Pages 發送，不會觸發預檢要求；
  // no-cors 回應為 opaque，不能將「請求已發出」誤認成「資料已儲存」。
  // 因此用唯讀 GET / JSONP 依提交 ID 驗證寫入結果。
  await fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload)
  });
  for (const delay of [250, 650, 950, 1300, 1700, 2100, 2700]) {
    await sleep(delay);
    try {
      const res = await jsonp({ action: 'check', id: payload.id, kind: payload.action });
      if (res?.ok && res?.exists) return { ok: true, moderation: res.moderation || 'visible' };
      if (res?.ok === false) throw new Error(res.error || '伺服器拒絕提交');
    } catch (err) {
      // 網路有時短暫不穩，後續再次確認同一個 id，避免重複寫入。
      if (/伺服器拒絕|拒絕提交/.test(String(err))) throw err;
    }
  }
  throw new Error('已送出寫入請求，但無法確認 Google Sheets 是否成功儲存。請至試算表檢查後再操作。');
}

export async function submitReflection(record) {
  if (IS_DEMO) {
    const data = loadDemo();
    if (!data.posts.some(x => x.id === record.id)) data.posts.unshift({ ...record, createdAt: new Date().toISOString() });
    storeDemo(data);
    return { ok: true, demo: true, moderation: record.publish ? 'visible' : 'private' };
  }
  return postThenVerify({ action: 'submit', ...record });
}

export async function submitReply(record) {
  if (IS_DEMO) {
    const data = loadDemo();
    if (!data.replies.some(x => x.id === record.id)) data.replies.push({ ...record, createdAt: new Date().toISOString() });
    storeDemo(data);
    return { ok: true, demo: true, moderation: 'visible' };
  }
  return postThenVerify({ action: 'reply', ...record });
}

export async function loadWall() {
  if (IS_DEMO) {
    const data = loadDemo();
    const posts = data.posts.filter(p => p.publish === true);
    return { ok: true, posts, replies: data.replies.filter(r => posts.some(p => p.id === r.parentId)), demo: true };
  }
  const res = await jsonp({ action: 'list' });
  if (!res?.ok) throw new Error(res?.error || 'Google Sheets 讀取失敗。');
  return { ok: true, posts: res.posts || [], replies: res.replies || [], demo: false };
}

export function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 15)}`;
}
