# V7 功能測試紀錄（2026-11-01）

**測試方式**：Chromium 144 的實際 DOM、CSS、Web Audio 節點及角色操作檢查。由於目前測試環境會阻擋 `file://` 和 `localhost` 導覽，因此使用瀏覽器 `set_content()` 及動態注入相同 HTML、CSS、JS 的方式測試，非正式 GitHub Pages 部署。為能確定程式確實對四位角色發出語音，Web Speech 使用測試替身紀錄 `SpeechSynthesisUtterance` 的文字、語言與音量；無法從這裡實際聆聽中文 TTS 聲線。

| 角色 | 背景聲源節點 | Web Audio 狀態 | 朗讀課文 | 三項活動推進 | 教師支持後背景聲維持 |
|---|---|---|---|---|---|
| 小晴／弱視 | 有 | running | 有 | 通過 | 有 |
| 小廷／輕度聽損 | 有 | running | 有（低語音音量） | 通過 | 有 |
| 小宇／ADHD | 有 | running | 有 | 通過 | 有 |
| 小禾／閱讀理解困難 | 有 | running | 有 | 通過 | 有 |

**小禾的文字**：朗讀時建置 31 個短暫消失字元、34 個跳動字元；畫重點與選擇題也都有字級動畫，教師支持後動畫字元為 0，手機顯示正常，減少視覺模擬特效後動畫停止。

**音量測試**：四個角色的 Web Audio source 和 gain 都建立成功，AudioContext 狀態顯示 `running`；Web Speech 已被呼叫，非聽障角色的語音音量參數為 `0.92`、高干擾輕度聽損角色為 `0.22`，並保留中文語音優先選取。背景音能由音量滑桿控制，朗讀停止時不會連帶停止背景音。

**未驗證**：實際設備聽感、不同 OS 的中文語音品質、GitHub 正式部署與使用者的 Google Sheets 線上寫入。這些需要在實際上課用的瀏覽器、喇叭或耳機上測試。

---

# V6 測試紀錄（舊版留存）

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
