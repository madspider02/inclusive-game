# 換個位置，看見學習｜融合教育沉浸式教室

可部署在 GitHub Pages 的純前端互動網站，配合 Google Apps Script + Google Sheets 儲存課後反思與公開討論。

## 網站已包含的功能

- **進教室**：填寫姓名或暱稱（建議使用暱稱）；以方向鍵／WASD／畫面上的方向鍵移動角色，或直接點選學生座位。
- **四種學生視角**：小晴（弱視）、小廷（輕度聽損）、小宇（ADHD 注意力調節）、小禾（閱讀理解困難）。
- **三項任務**：朗讀〈鏡頭下的家鄉〉、選取兩句重點、回答比喻理解選擇題。
- **可試用的教師調整**：不同學生分別提供三種與需求相關的支持做法；套用後可直接比較課堂差異。
- **反思紀錄**：觀察、具體調整策略、可複選的支持做法、想和同儕討論的問題；可選擇公開交流或僅存入教師試算表。
- **獨立交流牆**：分享者暱稱、按學生篩選、策略統計、對分享內容留言回覆。
- **可調降視覺特效**、遇到困難可跳過課堂任務、手機觸控操作、鍵盤操作及減少動態偏好支援。
- **Google Sheets 儲存**：`Responses`（反思）、`Comments`（留言）；教師可將狀態設為 `HIDDEN` 隱藏內容，也可設定先審核再公開。

## 專案檔案

```text
index.html                主體驗：首頁、走進教室、課堂、反思
wall.html                 獨立反思與討論交流牆
config.js                 Google Apps Script /exec 網址設定
assets/style.css          視覺設計及學生體驗特效
assets/app.js             教室移動、學生體驗、三項學習任務、反思
assets/wall.js            交流牆、篩選與留言
assets/api.js             示範模式／Google Sheets 資料層
google-apps-script/Code.gs   試算表的 Apps Script 後端
```

## 一、先在本機試玩（不用 Google 帳號）

`config.js` 的 `API_URL: ''` 預設為**本機示範模式**：可以體驗完整課程、送出分享、留言；只會寫在目前瀏覽器的 `localStorage`，不同人、不同裝置不能互相看到，適合先測試。

由於網頁使用 JavaScript 模組，請勿直接雙擊以 `file://` 開啟。請從專案資料夾執行：

```bash
python3 -m http.server 8000
```

在瀏覽器造訪 `http://localhost:8000/`。部署到 GitHub Pages 後無須使用上述指令。

## 二、建立 Google Sheets 後端（讓大家看到彼此）

1. 在 Google 雲端硬碟建立一份全新的 **Google 試算表**，建議命名「融合教育沉浸式教室－研習回應」。
2. 開啟試算表的「**擴充功能 → Apps Script**」。請務必從**這份試算表**進入，建立繫結式 Apps Script。
3. 清空預設程式，把 `google-apps-script/Code.gs` 的**所有內容**貼上並儲存。
4. 在編輯器上方的函式清單選擇 `setupSheets`，按「**執行**」，依提示授權讀寫這份試算表。會自動建立 `Responses` 與 `Comments` 兩個工作表。
5. 點右上角「**部署 → 新增部署**」，類型選「**網頁應用程式**」；「**執行身分**」選 **我**，「**誰可以存取**」選 **任何人**。完成授權與部署。
6. 複製部署提供的網址，必須是 `https://script.google.com/macros/s/.../exec`（不是 `/dev`、不是 Apps Script 編輯器網址）。
7. 開啟網站的 `config.js`，修改成：

```javascript
window.CLASSROOM_CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/你部署後的代碼/exec',
  SITE_TITLE: '換個位置，看見學習'
});
```

8. 重載網頁測試：送出一份反思，確認試算表 `Responses` 新增資料；前往交流牆，確認能讀到內容；留言並確認 `Comments` 新增資料。

**重要：** `config.js` 公開在 GitHub 上，因此只能放 `/exec` 網址，**不能**放 API 密碼、OAuth Token、私鑰或任何機密。公開部署會允許匿名參與者送出資訊。若機構的 Google Workspace 管理員禁止「任何人」存取，需由管理員處理權限，或改用其他後端。

### 如果送出顯示「無法確認」

Google Apps Script 的內容服務會重新導向；本網站使用 `text/plain` 的跨網域 POST 發送，再以 **唯讀 JSONP** 查詢提交 ID，確認真的寫入。這比只發送 POST 就宣稱成功更可靠。

依序檢查：

- 試算表 `Responses` / `Comments` 是否已有資料。若已有，請勿一直重複提交；本站會用相同的 ID 避免重複寫入。
- `config.js` 是否是 `/exec` 網址、沒有多餘空白，是否已完成 `setupSheets` 授權。
- 部署是否選「執行身分：我」和「任何人可存取」。
- 若有修改 Apps Script 原始碼，請「**部署 → 管理部署作業 → 編輯 → 新版本**」再部署，僅儲存程式碼不會自動更新目前 `/exec` 版本。
- 用無痕視窗測試 `https://script.google.com/macros/s/.../exec?action=list`，應能看到 JSON（可能沒有任何貼文）。

## 三、上傳 GitHub Pages

1. GitHub 建立一個儲存庫，例如 `inclusive-classroom-experience`，把本專案的**檔案內容放到儲存庫根目錄**（`index.html` 必須在最上層）。
2. 在 GitHub 儲存庫的 **Settings → Pages → Build and deployment** 選擇 **Deploy from a branch**、`main`、`/ (root)`，儲存。
3. GitHub Pages 網址通常是 `https://你的帳號.github.io/inclusive-classroom-experience/`。
4. 把網址／QR code 發給研習參與者。每個人填自己的**暱稱**、選學生、體驗並發表反思；同一份 Google Sheet 可讓不同裝置即時分享。
5. 第二個頁面的網址是 `https://你的帳號.github.io/inclusive-classroom-experience/wall.html`。

> 避免將整包 ZIP 直接當成一個檔案上傳。應先解壓縮，讓 HTML、JS、CSS 及資料夾以原來結構放到儲存庫中。

## 四、研習主持人的資料管理

`Responses` 欄位：

| 欄 | 用途 |
|---|---|
| CreatedAt | 送出日期時間 |
| ID | 每份回應的唯一 ID（避免重複送出） |
| Nickname | 體驗者姓名或暱稱（僅在同意公開時顯示） |
| StudentID | `vision` / `hearing` / `adhd` / `reading` |
| Observation | 觀察到的障礙（取得同意才公開） |
| Adjustment | 教師建議的調整（取得同意才公開） |
| Question | 想向其他老師提出的問題（取得同意才公開） |
| StrategiesJSON | 勾選的調整策略（取得同意才公開） |
| ExperienceJSON | 體驗過程摘要（**僅留在試算表，不會傳到交流牆**） |
| Status | `VISIBLE`：公開；`PRIVATE`：未同意公開（僅教師可見）；`PENDING`：待審；`HIDDEN`：隱藏 |

`Comments` 欄位：`CreatedAt`、`ID`、`ParentID`、`Nickname`、`Message`、`Status`。後三者中的暱稱與留言內容（狀態為 `VISIBLE` 時）會公開。

若需要**先審核後上牆**，把 `Code.gs` 開頭的 `MODERATE_NEW_POSTS`、`MODERATE_NEW_REPLIES` 改為 `true`，並部署新版本。教師進入試算表，把認可的回應／留言 `Status` 改成 `VISIBLE`，再請學員重新整理交流牆。直接改成 `HIDDEN` 可讓內容在下一次讀取時不顯示。**請勿將參與者未同意公開的 `PRIVATE` 回應改成 `VISIBLE`。**

### 資料保護與運作邊界

- **可填姓名或暱稱（建議使用暱稱），不要求 Email、學號或診斷資訊**。交流牆是**公開讀取**：知道網址的人理論上都能看到 `VISIBLE` 貼文。請課前先說清楚；建議全程使用暱稱。
- 本方案不提供登入或真正的防垃圾訊息身分驗證；公開 `/exec` 網址有被惡意灌入內容的可能。後端已做字數、欄位、角色、ID 檢查，並防範試算表公式注入，**但不能完全阻止濫用**。請於小型受控課堂採用，教師要能管理表單；正式跨校長期公開活動宜改用有認證與節流機制的後端，例如 Firebase。
- JSONP 是為了讓 GitHub Pages 從 Google Apps Script 讀取公開內容的相容方式，**禁止把敏感欄位加入讀取結果**。Google 官方也提醒 JSONP 只適用非機密資料。
- 回應寫入 Google Sheet 後，資料保留／刪除／授權依試算表擁有者的管理方式辦理。教師可以刪除資料列或整份試算表，向參與者告知資料用途與保留方式。
- 大班或長時間高併發情境可能觸及 Apps Script 配額，需評估更穩定的後端。

## 五、教學設計提醒（很重要）

這是**情境模擬，不是醫學或障礙經驗的重現**，也不應以一次答題表現推斷學生的認知能力。

1. 弱視學生的視覺功能差異很大；模糊效果只是說明看不清板書／小字可能妨礙接收課程內容。
2. 輕度聽損不等於把聲音變小；老師轉身說話與背景噪音是為了呈現口語訊息難以取得的教室情境，非精確聲學模擬。
3. ADHD 的注意力與活動調節表現高度多樣；畫面上的干擾與想活動的需要不代表所有 ADHD 學生都會有同樣行為。
4. **閱讀理解困難不表示字一定會漂移**；漂移是依教學需求選用的隱喻效果，重點放在長句、比喻、訊息統整與理解支持。這項動畫可以關閉，並遵循使用者的「減少動態效果」偏好。

**核心引導問題：**「教學要求是否清楚、可取得、可參與？」「不改變學習目標時，老師能調整哪些環境、溝通、材料和作答方式？」「如何詢問學生真正需要的支持，而不是把同一診斷視為相同需求？」

建議工作坊安排（可按時間自行調整）：3 分鐘引導、10 分鐘個人體驗、10 分鐘小組討論、10 分鐘交流牆共學。也可分四組各體驗一個角色，之後交叉閱讀所有組別的調整建議。

## 自訂內容

- 課文、三段活動及選擇題：`assets/app.js` 中的 `EXCERPT`、`TASKS`、`OPTIONS`。
- 四位學生的經驗與支持做法：`assets/app.js` 的 `ROLES`。
- 視覺顏色與版型：`assets/style.css`。
- 公開／待審與一次讀取數量：`google-apps-script/Code.gs` 的 `WORKSHOP`。

以上程式使用原生 HTML / CSS / JavaScript，不需要 Node.js 打包、付費前端框架，也不需要外部圖片或字型檔。
