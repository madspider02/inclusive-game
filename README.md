# 換個位置，看見學習｜融合教育沉浸式教室 V3（已做瀏覽器互動測試）

網頁設計者：**國教院黃彥融副研究員**

這個網站供師資培育課程、融合教育教師研習與班級經營討論使用。課文為〈鏡頭下的家鄉〉，四位學生分別是弱視、輕度聽損、ADHD 注意力調節困難、閱讀理解困難。每位學生都會經歷「跟著老師朗讀 → 畫重點 → 回答選擇題」。

> 重要教學提醒：這是課堂障礙及教學調整的情境模擬，不是障礙診斷工具，不代表所有障礙學生都有同樣的感官或認知經驗。閱讀文字漂動尤其只是用來象徵「閱讀負荷」的視覺設計，並不是閱讀理解困難的共通症狀。

## 這一版修正了什麼

1. 修正先前版本 **首頁按開始後仍顯示** 的頁面切換錯誤。首頁、教室、課堂、反思只會出現目前階段。
2. 三段任務都能透過「試用教師支持」比較前後差異；沒有因答案錯誤而卡住的過關門檻。
3. 每個角色在每一段活動都會顯示不同的課堂事件：
   - **弱視**：遠距板書與紙本字體不易辨識；可放大字體、提高對比。
   - **輕度聽損**：片段口語指令；點擊語音按鈕時降低 TTS 音量至 0.09（正常情境為 0.92）；可同步提供完整文字指令。
   - **ADHD**：走廊、同學動作與短暫中斷提示；可選擇分段任務與降低干擾，不強制計時。
   - **閱讀理解困難**：以適度文字漂動象徵閱讀負荷，並加入詞義及文章結構線索支持。
4. **教室環境聲**採自主開啟，可隨時關閉；瀏覽器不支援時不影響其他任務。動態效果也可選擇降低。
5. 可跳過目前無法完成的任務，仍能進入反思，不把模擬難題變成對學生能力的測驗。
6. 後端使用「送出 → 查詢唯一 ID → 確認寫入」策略，避免前端只發出請求就說資料已送出。
7. `Code.gs` 能辨識曾使用舊版九欄格式的 Google Sheets；執行 `setupSheets` 會安全建立新版工作表並複製舊資料，**不會刪除原始工作表**。

## 下載後的資料夾結構

```text
index.html                   首頁、教室、課堂、反思
wall.html                    教師回應交流牆
config.js                    已填入你提供的 Apps Script /exec URL
assets/
  app.js                     四位學生、三項任務與互動邏輯
  wall.js                    交流牆與留言
  api.js                     Sheets 讀寫、確認寫入、本機示範模式
  style.css                  網站視覺與體驗特效
google-apps-script/
  Code.gs                    Apps Script 後端（需手動更新部署）
README.md                    本文件
TEST_REPORT.md               具體測試清單
.nojekyll                    GitHub Pages 靜態網站設定
```

## 一、更新 Google Apps Script（需要執行）

你提供的網址已設定在 `config.js`：

`https://script.google.com/macros/s/AKfycbz5j6yhm7HX-cpy31sVWUAdTWg2dbFZ-84AWSb_hIvXBUwklPN1I67aUn3dPgnsSVwz2g/exec`

但 **網址已填入，不等於目前 Google 端已更新程式**。請操作：

1. 開啟原本對應這個 `/exec` 網址的 Google 試算表，選「擴充功能 → Apps Script」。
2. 將 `google-apps-script/Code.gs` 的程式完整貼上，取代之前的 `Code.gs`，然後儲存。
3. 在上方函式選單選 `setupSheets` 並執行一次，確認授權。**不要直接按 `doGet` 或 `doPost`**。這版直接按 `doGet` 也不會報未定義參數，但不是標準測試方法。
4. 點「部署 → 管理部署作業 → 編輯（鉛筆圖示）」，選「新增版本」，按部署。要維持原本 `/exec` 網址就必須**編輯原部署而不是另外建立新部署**。
5. 確認部署執行身分為「我」，存取權限為「任何人」。若 Google Workspace 政策禁止公開存取，需要另行處理。
6. 開啟以下兩個測試網址，應收到 JSON：
   - `你的/exec?action=list`
   - `你的/exec?action=list&prefix=myCallback`（將呈現 JavaScript callback 形式）

注意：如果舊版 `Responses` / `Comments` 欄位格式不同，會建立 `Responses_V3` / `Comments_V3` 來避免欄位錯位；舊資料會複製進去，原始工作表不會刪除。

## 二、上傳 GitHub Pages

1. 把 ZIP **解壓縮**。
2. 進入解壓縮後的資料夾，選取裡面的檔案和 `assets`、`google-apps-script` 目錄，**一起上傳到 GitHub 儲存庫根目錄**。`index.html` 應位於儲存庫根目錄，不要多包一層 `inclusive-classroom-v3-tested`。
3. GitHub 儲存庫 → `Settings` → `Pages` → `Deploy from a branch` → `main` → `/(root)` → `Save`。
4. 網頁網址形式：`https://帳號.github.io/儲存庫名稱/`，回應交流牆為同網址加 `/wall.html`。

## 三、正式研習前的驗收（非常重要）

請用兩台不同裝置或兩個不同的瀏覽器測試：

1. 在裝置 A 開首頁、輸入測試暱稱、體驗任一學生至反思頁。
2. 勾選公開分享，送出至少 10 字的觀察與教學調整。
3. 確認網站顯示「已存入 Google Sheets」的成功訊息。
4. 在試算表查看是否有新資料：新版欄位在 `Responses` 或 `Responses_V3`。
5. 在裝置 B 開 `wall.html`，確認能看到 A 的公開反思。
6. 在 B 留言，確認留言進入 `Comments` 或 `Comments_V3`，並在 A 重新整理交流牆後看得到。
7. 再送出一份**不勾選公開**的反思，確認試算表有資料但交流牆不顯示。
8. 如需人工審核，請在 Apps Script 中將 `MODERATE_NEW_POSTS` 改為 `true`，並建立新部署版本。

**注意：**後端讀寫需要你在 Google 帳戶中部署授權；本次工具環境不能直接替你操作或驗證這個線上 `/exec` 端點。不要把本機瀏覽器測試結果當成線上連線已通過。

## 四、本機示範模式（不修改你的 Google 網址）

如果只是要離線試玩，可以在一份複製的 `config.js` 中暫時將 `API_URL` 留空。此時回應只存於當前瀏覽器，不會傳至 Google Sheets。請使用本機 HTTP 伺服器或 GitHub Pages 開啟，不要直接用 `file://` 雙擊 HTML（ES module 可能被瀏覽器擋下）：

```bash
python3 -m http.server 8000
```

然後造訪 `http://localhost:8000/`。

## 安全與個資說明

- 不要在公開網站或 `config.js` 放入 Google API Token、密碼或其他機密。
- 建議使用暱稱，不蒐集學生的真實姓名、診斷或敏感個資。
- 「公開分享」採主動勾選；不勾選時仍能送出，僅主持人可在試算表查看。
- 公開匿名表單不能防止惡意留言；研習主持人可於試算表把貼文或留言的 `Status` 改成 `HIDDEN`，以停止公開顯示。
