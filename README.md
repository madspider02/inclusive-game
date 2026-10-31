# 換個位置，看見學習｜融合教育沉浸式教室（更新版）

這一版已經依照需求做了以下調整：

1. **畫面更美觀**：改成較完整的沉浸式視覺設計，包含玻璃卡片、燈光氛圍、教室舞台區、動態背景與更清楚的資訊層次。
2. **聽障情境更明顯**：
   - 老師語音播放音量降到更低。
   - 畫面上加入環境聲干擾提示。
   - 老師文字指令在體驗前會呈現「片段化」訊息。
3. **學障、情障干擾更明顯**：
   - ADHD 情境加入持續性干擾事件、畫面微震、分心提示跳出。
   - 閱讀理解困難情境加入較明顯的句子位移與閱讀負荷效果（並在畫面上保留提醒：這只是象徵性模擬，不代表所有學生的真實經驗）。
4. **更有沉浸感**：
   - 教室舞台區會顯示課堂時間、老師說明與黑板內容。
   - 體驗者要先走進教室，再選擇座位。
   - 每個任務都能「套用教師調整」，感受支持前後的差異。

---

## 目錄結構

- `index.html`：主體驗頁面
- `wall.html`：交流牆頁面
- `config.js`：網站設定，已寫入你的 Google Apps Script URL
- `assets/style.css`：樣式
- `assets/app.js`：主體驗邏輯
- `assets/wall.js`：交流牆邏輯
- `google-apps-script/Code.gs`：若你要重建或更新 Apps Script，可直接使用

---

## 已寫入的 Google Apps Script API

`config.js` 已經設定為：

```js
window.APP_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbz5j6yhm7HX-cpy31sVWUAdTWg2dbFZ-84AWSb_hIvXBUwklPN1I67aUn3dPgnsSVwz2g/exec'
};
```

如果你之後改了 Apps Script 網址，只要更新 `config.js` 即可。

---

## 如果你的 Google Apps Script 還沒支援新版動作

新版前端預設會使用這幾個 action：

- `POST action=submitResponse`
- `POST action=submitComment`
- `GET ?action=listResponses`
- `GET ?action=listComments`

如果你目前的 Apps Script 不是這個格式，請把 `google-apps-script/Code.gs` 貼到 Apps Script 編輯器中，執行 `setupSheets()` 一次，然後重新部署為「網頁應用程式」。

部署建議：
- 執行身分：**我**
- 存取權限：**任何人**

---

## GitHub Pages 上架步驟

1. 建立 GitHub repository。
2. 將本資料夾中的所有檔案上傳到 repository 根目錄。
3. 到 GitHub 的 **Settings → Pages**。
4. Source 選擇 **Deploy from a branch**。
5. Branch 選擇 **main**，資料夾選 **/(root)**。
6. 儲存後等待部署完成。

---

## 補充提醒

- 本體驗中的障礙呈現是**教學情境模擬**，目的在協助教師討論環境與教學支持，而不是把障礙簡化成固定樣貌。
- 閱讀理解困難的視覺效果屬於**象徵性模擬**，請在教學時搭配口頭說明。
- 若 Google Sheets 暫時無法連線，網站會自動改用本機暫存，避免現場完全不能用。

---

## 署名

網站首頁與交流牆頁尾已加入：

**網頁設計者：國教院黃彥融副研究員**
