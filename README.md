# 換個位置，看見學習｜V6 完整版

網頁設計者：**國教院黃彥融副研究員**

這是一套可直接放在 GitHub Pages 的融合教育沉浸式體驗網站。使用者先輸入暱稱、在教室中選擇學生，再依序體驗〈鏡頭下的家鄉〉的朗讀、畫重點與選擇題，最後反思並交流。

四位學生：弱視（小晴）、輕度聽損（小廷）、ADHD 注意力調節困難（小宇）、閱讀理解困難（小禾）。

## V6 核心更新

### A. 小宇（ADHD）的課堂干擾不再只是文字提醒

在朗讀、畫重點、選擇題三個活動中，都會出現環境與活動要求互相干擾的情境：

- **同學碰到桌子**：課本畫面發生短暫震動。可按「重播：同學碰到桌子」再次觀察。
- **老師一次交代太長的指令**：完整指令會出現一段時間，接著畫面只留下片段。可按「聽：老師的長指令」比較。
- **起身與張望**：回來後需要再次確認剛才的閱讀位置。
- **桌面物品直接遮擋課本**：必須先移開遮擋物，再進行「找回剛剛讀到哪裡」的操作。

每個活動都可試用不同教師支持；支持後會呈現清楚的步驟、可見的任務提示與較低干擾的桌面。這是**情境與環境障礙模擬**，不是宣稱每個 ADHD 學生都會出現同樣的行為。避免強迫過關，也提供「減少視覺模擬特效」功能。

### B. Google Sheets 無法寫入的問題已加入診斷與備援

先前版本的 `no-cors` 寫入是**無法直接讀取回應內容**的。V6 改為：

1. **先確認部署版本**：GET `?action=health` 要取得 `apiVersion: "6.0.0"`，否則不送資料，直接顯示部署未更新的訊息。
2. **帶唯一 ID 寫入**：先用 `fetch` / `no-cors` 送出 JSON。
3. **以 JSONP 查詢 ID 是否存在**：只有 Google Sheets 後端回傳 `exists:true`，前端才顯示「已存入」。
4. **寫入未確認時，改用表單 POST 備援**：不改變 ID，避免重複寫入；之後再次查核。
5. **新增 `DeliveryLog` 工作表**：記錄 `RECEIVED`、`SAVED`、`ERROR`，便於判斷是沒有進到後端還是儲存發生錯誤。此紀錄**不存放使用者回答文字**。
6. **增加 `diagnostics.html`**：可直接從網頁測試健康檢查、送出一筆不公開測試、以及查核確實寫入。
7. **反思備份**：若現場網路仍不穩，反思頁可按「複製我的反思備份」，避免失去輸入內容。

V6 的 Sheets 工作表通常是 `Responses`、`Comments`、`DeliveryLog`；若你之前曾部署過不同欄位架構，資料會寫到 **`Responses_V3` / `Comments_V3`**。**請確認你看的不是舊版 `Responses` 工作表。**

## 完整檔案結構

```text
index.html                   網站首頁、教室、三項學習活動、反思
wall.html                    交流牆
diagnostics.html            主持教師連線診斷（在根目錄）
config.js                    已填入原本提供的 Apps Script /exec 網址
assets/
  style.css                  畫面樣式與情境特效
  app.js                     四角色、三任務、干擾事件、反思流程
  api.js                     後端讀寫、版本檢查、查核與表單備援
  wall.js                    交流牆、回覆與篩選
  diagnostics.js             連線診斷操作
google-apps-script/
  Code.gs                    試算表後端（**務必在 Apps Script 編輯器更新**）
.nojekyll                    GitHub Pages 靜態網站設定
README.md                    本說明
TEST_REPORT.md               測試範圍與限制
```

以上樹狀排版中 `diagnostics.html` 與 `google-apps-script/` 都位於儲存庫**根目錄**。

## 一、先修好 Google Apps Script（重點）

你原本提供的 `/exec` 已寫在 `config.js`：

`https://script.google.com/macros/s/AKfycbz5j6yhm7HX-cpy31sVWUAdTWg2dbFZ-84AWSb_hIvXBUwklPN1I67aUn3dPgnsSVwz2g/exec`

請務必在**原本對應該網址的 Apps Script 專案**操作；只更新 GitHub 檔案，不會改變 Google 伺服器上的程式。

1. 從正確的 Google 試算表選「**擴充功能 → Apps Script**」。如果原本是獨立建立的 Apps Script 專案，請在 `Code.gs` 的 `WORKSHOP.SPREADSHEET_ID` 填入該試算表的 ID，不能把整個試算表網址填進去。
2. 用本 ZIP 中 `google-apps-script/Code.gs` 的**全文**取代原有 `Code.gs`，按儲存。
3. Apps Script 函式選單選 `setupSheets`，按「執行」並完成 Google 授權。這一步會確保必要工作表存在。
4. 再執行 `testWriteFromEditor`。成功時，執行紀錄會列出測試資料寫進哪張工作表（`Responses` 或 `Responses_V3`）及測試 ID。這一步不需要 GitHub 網頁，能排除試算表權限、綁定錯誤。
5. 點「**部署 → 管理部署作業 → 目前網頁應用程式的編輯（鉛筆） → 版本選新增版本 → 部署**」。
6. 執行身分應為「**我**」，存取權限須允許任何訪客（匿名亦可）。若機關 Google Workspace 政策不允許匿名，請依單位資訊政策評估其他後端，不要讓參與者各自登入你的 Google 帳號。
7. 保持**原部署的 `/exec` 網址**，不要只按「測試部署」，也不要誤建一個新的部署卻沿用舊網址。如果部署網址確實變更，必須同步更新 `config.js`。

### 如何確認後端已更新？

在網址後面加 `?action=health`，例如：

`https://script.google.com/macros/s/AKfycbz5j6yhm7HX-cpy31sVWUAdTWg2dbFZ-84AWSb_hIvXBUwklPN1I67aUn3dPgnsSVwz2g/exec?action=health`

正常應看到類似：

```json
{"ok":true,"apiVersion":"6.0.0","sheets":{"responses":"Responses","comments":"Comments","deliveryLog":"DeliveryLog"}}
```

若得到不支援的動作、舊版本、登入頁面或權限錯誤，代表目前網址還**沒有指向可公開使用的 V6 後端**。程式不可能僅靠更新 GitHub 就修好 Google 端的部署。

## 二、把完整網站上傳到 GitHub Pages

1. 下載 ZIP 並解壓縮。
2. 把**解壓縮資料夾內的檔案與子資料夾**一次上傳至 GitHub repository 根目錄，確保 `index.html`、`config.js`、`diagnostics.html` 和 `assets/` 在同一層。
3. 到 `Settings → Pages → Deploy from a branch → main → /(root)`。
4. 開啟 `https://你的帳號.github.io/儲存庫名稱/`。
5. 在網址後加 `diagnostics.html`，例如 `https://你的帳號.github.io/儲存庫名稱/diagnostics.html`，依序點三項測試。

Google Sheets 後端需要進行**原部署的更新**，GitHub Pages 網站需要進行**根目錄全檔覆蓋**，兩邊缺一不可。

### 如果診斷頁結果仍是失敗

- **健康檢查失敗**：檢查 `/exec` 是否還是舊部署、權限是否允許匿名使用者、Google Workspace 是否封鎖匿名網頁應用程式。
- **健康檢查通過，寫入失敗**：打開正確試算表的 `DeliveryLog`。若有 `RECEIVED` 後接 `ERROR`，依 Detail 內容追查；若連 `RECEIVED` 都沒有，可能是跨來源 POST 被擋或網址指向另一個部署。
- **編輯器直接寫入成功，網站端失敗**：問題集中在網頁應用程式**部署版本、執行身分、訪客權限或跨來源寫入**，而非試算表無法存取。
- **試算表有資料，但看錯分頁**：檢查 `Responses_V3` / `Comments_V3`。

## 三、正式研習前驗收

請用兩個不同裝置測試。先在 A 完成小宇三項活動、提交**公開回應**，確認頁面顯示「已存入 Google Sheets」，再在試算表對應工作表找到該資料；用 B 開 `wall.html` 應看得到那則公開回應，再從 B 留言並回到 A 確認是否同步。最後送出一筆**不公開**反思，確認只在試算表出現而沒有上牆。

## 學生情境與研究倫理提醒

這是讓教師討論**課堂障礙與可調整的教學條件**的體驗設計，不是醫學或心理測驗。ADHD 注意力調節差異具有個別性，模擬中的桌面遮擋、起身、分心事件是具體教室情境，不代表每個 ADHD 學生一定如此。閱讀理解困難的文字漂動也是象徵性效果，不是閱讀障礙的通用症狀。應同時鼓勵研習者討論學生能力、優勢、偏好與支持方式。

網站建議使用暱稱，不要求蒐集學生個資。公開分享必須主動勾選；未勾選仍會存入 Google Sheets（`PRIVATE`），但不會公開。若有疑慮，可於 `Code.gs` 將 `MODERATE_NEW_POSTS` 改為 `true`，新增回應先標記 `PENDING` 待主持教師審核。

## 程式檢查與限制

見 `TEST_REPORT.md`。目前完成本機 JavaScript 語法、互動流程、**模擬後端**與 Apps Script 物件模型測試；**無法從本工作環境登入你的 Google 帳號或讀取目前正式 `/exec` 端點的真實回應，因此尚未完成線上端到端驗收**。
