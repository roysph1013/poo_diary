# 嗯嗯日記（poo_diary）— 給 Claude 的專案說明

## 溝通規則
- **一律用繁體中文（臺灣）回覆**，包含長時間工作後的總結，不要用英文。
- 一律寫「臺灣」，不要寫「台灣」。
- 使用者是柏翰，App 是做給身邊一位自述有腸躁症的人用；使用者會用手機截圖回報問題。

## 專案是什麼
記錄每天的嗯嗯形態、肚子感覺、飲食、睡眠、心情、喝水，找出可能影響腸道的因素。
- 部署：GitHub Pages（`https://roysph1013.github.io/poo_diary/`，branch `main`、root）
- 不上架 Google Play / App Store，只用 PWA「加入主畫面」。
- 資料只存在使用者瀏覽器的 localStorage，不上傳任何伺服器。

## 檔案結構
- `index.html`：整個 App（HTML + CSS + JS 都在這一個檔案，沒有建置工具、沒有框架）
- `sw.js`：Service Worker，網路優先、離線用快取
- `manifest.webmanifest`、`icon-v2.svg`、`icon-v2-180/192/512.png`、`icon-v2-maskable-512.png`（圖示檔名帶 v2，是為了避開手機的舊圖示快取；下次換圖示請改成 v3）
- `README.md`：使用說明、參考文獻、版本紀錄

## 改版流程（每次都要做）
1. 版本號要同時改兩處：`index.html` 的 `APP_VERSION`、`sw.js` 的 `CACHE`（`poodiary-vX.Y.Z`）。
2. `index.html` 的 `CHANGELOG` 陣列最前面加一行；`README.md` 的「版本紀錄」也加一行。
3. commit 訊息用中文，例如 `v1.5.0：…`，並打 tag（`git tag vX.Y.Z && git push --follow-tags`）。
4. 版本號顯示在設定頁最底下的淺灰小字，點了會看到更新紀錄。

## 測試
用 Playwright（Python）開 `file:///…/index.html`，視窗 390×844 模擬手機，操作各頁並截圖檢查，確認沒有 `pageerror`。注意：
- 第一次開啟會跳出使用說明（`#sheet .ob`），要先按「略過」。
- 六項全填完會跳出慶祝視窗（`.celebrate`），要先關掉才能點別的。

## 資料模型（localStorage `poodiary.v1`）
```
{ days: { "YYYY-MM-DD": {
    stools: [{type:1-7, time:"HH:MM", tags:[]}], noPoop: bool,
    belly: {pain:0-3|null, bloat:0-3|null},        // 一天記一次，以最不舒服的時候為準
    meals: {breakfast|lunch|dinner|snack|latenight: {items:[食物名], habits:[], note:""}},
    sleep: {hours:number|null, q:1-5|null}, mood: {q:1-5|null, tags:[]},
    water: 杯數, note: "" } },
  customFoods: { 食物名: [大類 key] } }
```
其他 key：`poodiary.stickers.v1`（自訂貼圖，dataURL）、`poodiary.onboarded`、`poodiary.fx`（音效/震動開關）。

## 重要設計決定（使用者確認過的）
- **視覺風格**：奶茶色底 `#FFF6EC`、白色圓角卡片、三層柔和懸浮陰影、柔和配色。吉祥物是左上角那坨原創便便。
  - 使用者試過「粗描邊貼紙風」「原創角色小嗯」，都**不喜歡**，要維持一開始的簡約可愛風。
  - 使用者希望像吉伊卡哇的感覺，但**不能使用吉伊卡哇的角色或圖片**（版權）。替代做法是「自訂貼圖」：使用者在自己手機上換圖，圖片只存在本機。
  - 要像「給大人用的簡約 App」，避免幼稚、粗糙的大表情。
- **嗯嗯分類**：布里斯托分類法；依 Rome 標準，第 1–2 型便祕、**第 3–5 型正常**、第 6–7 型腹瀉。
- **飲食**：15 個大類（`CATS`）＋ 160 多種臺灣常見食物（`FOOD_SRC`，自動對應大類）。每餐預設收合，有搜尋、「你常吃的」、「更多食物」（分類用分頁標籤，和食物按鈕要明顯不同）、「跟昨天一樣」、「✓ 記好了」按鈕。
- **睡眠與心情**：方案 A 精簡雙欄。睡眠 5 個漸層小圓點＋兩端「差／好」；心情 5 個細線小表情＋兩端「很糟／超棒」。兩張卡片底色都會變：睡眠依時數（睡少灰紫 → 睡飽橘黃），心情依心情。
- **回饋**：每個卡片標題旁有勾勾（灰 → 綠），上方有「今天 n/6」進度列；打勾時有彩帶、音效（Web Audio 即時合成）、震動（只有 Android）、卡片彈跳；六項全完成時有全螢幕慶祝（彩帶雨、吉祥物跳動、連續天數）。都會尊重「減少動態效果」。
- **日期**：點日期跳出月曆；不能選未來日期。
- **強制淺色**：`color-scheme: only light`，避免手機深色模式把顏色反轉。

## 分析方法
- 比較「有這個因素的日子」和「其他日子」的不舒服比例，用 **Fisher 精確檢定（雙尾）**；兩邊各至少 5 天、p < 0.1 才列出，p < 0.05 標「差異較明顯」。
- 飲食看「吃完當天或隔天」（取兩天中較不正常者，對照組用同樣算法）；睡眠看睡醒那天；心情看同一天。只拿「有填該類資料」的日子當對照組。
- 可切換「看嗯嗯形態」或「看肚子痛／脹氣」（痛或脹氣 ≥ 2 分算明顯不舒服）。
- 介面上要標明「初步觀察」、「不等於因果、不能用來診斷」。
- 參考：Lewis & Heaton 1997（布里斯托分類法）；Clevers et al. 2024（大規模飲食症狀日記研究）。

## 可以考慮的後續方向（尚未決定）
- 肚子痛改成每次嗯嗯都記，看排便後是否減輕（使用者目前選一天一次）。
- 概念設計圖（Claude 設計畫布）：https://claude.ai/artifact/VZJ9ds6CVLCHYArtuPod79
