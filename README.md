# 換個位置，看見學習｜融合教育沉浸式教室 V7.1

**網頁設計者：國教院黃彥融副研究員**

四位學生（弱視、輕度聽損、ADHD、閱讀理解困難）× 三項國語課活動（朗讀課文、畫重點、回答選擇題），接續課後反思與 Google Sheets 交流牆。

## V7.1 修正摘要

1. **語音停止狀態**：`speechSynthesis.cancel()` 產生的 `interrupted`、`canceled`／`cancelled` 不再誤報引擎故障。停止、切換活動、試用教師支持都不會顯示錯誤訊息。
2. **整篇朗讀分段**：將朗讀稿依中文標點與長度切成短片段，依序接續朗讀，降低桌面 Chrome 使用單個過長語音要求時中斷的可能性。**這不等於已驗證實際發音完整**；請仍以授課設備試聽。
3. **小廷的語音按鈕**：任務指令作答時，不再把播放中的「停止老師語音」按鈕重設成「播放」。
4. **鍵盤／輔具操作**：頁面切換會移動焦點至新畫面的標題；畫重點後焦點維持原句子；選擇題方向鍵可以連續切換；試用支持和聽障指令作答後會恢復到相應控制。
5. **交流牆草稿保留**：只要有展開的回覆欄、未送出的回覆文字，就不進行會重建整個清單的自動刷新；若讀取資料時開始留言，也不清除輸入。
6. **更新網站資源快取版本**：由 `?v=6` 改為 `?v=7.1`。
7. **支持前後可切換**：已選的教師支持再按一次，即可返回未調整的原始情境。切換不會改變前面已作答的學生選擇。
8. **小禾閱讀困難模擬的適切性**：預設先呈現文意整合、推論與選重點的理解負荷；原有的「字詞跳動／短暫消失」保留為使用者自行勾選的象徵性效果，預設關閉，選用時不影響螢幕報讀文字。
9. **診斷入口**：移除首頁與交流牆頁尾的診斷連結，只在反思頁保留問題排查的備援連結。`diagnostics.html` 仍是公開網址，移除連結**不是密碼保護**。
10. **CSS 清理**：只移除 42 處具有後續同名宣告覆蓋的重複屬性，不全面重排 500 多條樣式規則，以降低視覺回歸風險。後續大型版面改版仍建議完整重構。

## 完整目錄結構

```text
index.html
wall.html
config.js
.nojekyll
diagnostics.html
assets/
  app.js
  wall.js
  api.js
  diagnostics.js
  style.css
google-apps-script/
  Code.gs
README.md
TEST_REPORT.md
tests/
  test_browser.py
  test-results.json
  mobile-check.png
```

GitHub Pages 的網頁使用 `assets/app.js`、`assets/style.css`；**請刪除 repository 根目錄舊版 `app.js`、`style.css`**，避免日後改錯檔。

## GitHub Pages 安裝與升級

### 從 V7 升級

如果你的線上 repository 已有 V7，可只覆蓋以下六個檔案（路徑需完全相同）：

- `index.html`
- `wall.html`
- `diagnostics.html`
- `assets/app.js`
- `assets/wall.js`
- `assets/style.css`

其他檔案可保留。`config.js` 與 `google-apps-script/Code.gs` **沒有變更**，不需要只因本次前端更新而重新部署 Apps Script。

### 新增完整 repository

1. 解壓縮完整 ZIP。
2. 把 ZIP 裡**直接看到的檔案與資料夾**全部上傳 GitHub 儲存庫根目錄，不要額外多包一層資料夾。
3. 確認 `index.html` 位於根目錄、`assets/` 與 `google-apps-script/` 存在，並且 `.nojekyll` 已上傳。
4. GitHub repository：Settings → Pages → Deploy from a branch → main → /(root)。
5. 等待 GitHub Pages 重新發布後，重新整理頁面。CSS / JS 參數已更新為 `?v=7.1`。

### Google Sheets

本版本沿用 V6 的 Apps Script API 契約和原網址；**未進行真實 Google Sheets 線上寫入驗證**。如果回應無法送達，主持教師可以依 `README`、`diagnostics.html` 和 Apps Script 的執行紀錄排查。避免在公開頁面示範測試寫入功能，以免產生無效的試算表資料。

## 聲音與教學提醒

- 四位學生皆可播放老師語音與教室環境聲，並可隨時停止。朗讀引擎使用瀏覽器內建 `SpeechSynthesis`，背景音由 Web Audio 合成；部分瀏覽器／裝置可能不支援或限制音效。
- **iPhone／iPad 測試時**：若聽不到教室環境聲，先確認裝置的靜音與音訊播放設定。Web Audio 與語音朗讀可能受系統不同音訊路由控制；請在實際授課設備試聽。
- **關於輕度聽損**：目前仍使用語音引擎音量與背景聲、指令片段化呈現資訊遮蔽；此效果不等同輕度聽損的生理聽覺。若要使用 Web Audio 的低通濾波，須先取得**可供播放的老師錄音檔**，因為一般 `speechSynthesis` 不能直接當作 Web Audio 的來源進行穩定濾波。低通本身也不是每位聽損者的真實感受。
- **關於閱讀理解困難**：字詞跳動與消失不是閱讀理解困難的共同症狀，僅作為可選的教學比喻；應以理解負荷、提示策略和文意推論作為主要討論焦點。
- 每個障礙情境皆為教學用情境化示意，不能用來推論個別學生的實際能力與感官經驗。

## 自動化測試與限制

在本機以 headless Chromium、模擬 `SpeechSynthesis`、本機示範資料進行四角色情境測試：**56 項檢查全數通過**。請見 `TEST_REPORT.md` 和 `tests/test_browser.py`。

此次 Chromium 環境限制直接進入本機 HTTP／file URL，因此採 `set_content` 載入 HTML 與本機 CSS，將相同程式碼合併注入執行測試。這能驗證 DOM 互動與狀態流程，**不能**取代 GitHub Pages 實際部署、真實瀏覽器中文語音播放或 Google Sheets 跨網域寫入測試。
