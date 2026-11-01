# V6 測試紀錄｜2026-10-31

## 已完成

- JavaScript 語法：`assets/app.js`、`assets/api.js`、`assets/wall.js`、`assets/diagnostics.js` 均通過 `node --check`。
- Apps Script `Code.gs`：以 Node VM 的 Google Sheets 物件模擬器執行 `setupSheets()`、`testWriteFromEditor()`、`doGet` 與 `doPost`，確認：
  - `health` 回應版本 6.0.0 與實際分頁。
  - 純文字 JSON POST 與表單 `payload` POST 均能解析。
  - 以唯一 ID 檢查存在性、重送同一 ID 不重複新增。
  - PRIVATE 回應只存入試算表、不進公開列表，VISIBLE 回應可列出。
  - 無效資料在 `DeliveryLog` 產生 ERROR；正確資料有 RECEIVED / SAVED。
  - JSONP callback 讀取格式正確。
- Chromium 瀏覽器 DOM 操作（**模擬後端**；受環境限制，以 `set_content` 注入頁面及程式）：
  - 四角色各自從首頁輸入暱稱 → 選學生 → 朗讀 → 畫重點 → 選擇題 → 反思送出，全部完成。
  - ADHD 桌面遮擋、移開物品、重新找閱讀位置、碰桌、長指令、起身，皆能觸發；教師支持可移除遮擋。
  - ADHD 手機尺寸（390 x 844）完成相同流程。
  - 健康檢查 / 寫入 / ID 查核三階段 UI 成功（使用模擬回應）。
  - 模擬第一次 no-cors POST 遺失時，備援表單 POST 使用同一 ID，後續查核可成功。

## 尚未驗證

- 使用者實際 Google Apps Script 端點的部署版本與訪客權限。
- 實際 Google Sheets 的跨來源寫入與 Google Workspace 安全政策。
- 真正兩台裝置之間的資料同步與公開交流牆。
- 不同手機、瀏覽器的音量與環境聲聽感。

**以上未驗證項目必須由使用者部署後，從 `diagnostics.html` 依步驟測試。**

## 本版本與先前 ZIP 不同

V5 壓縮檔缺漏了 `config.js`、`assets/api.js`、`assets/wall.js` 和 `google-apps-script/Code.gs` 等必要檔案。V6 ZIP 將它們全部補齊，並包含新的 `diagnostics.html` 與 `assets/diagnostics.js`。
