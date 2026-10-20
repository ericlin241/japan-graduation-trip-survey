# 日本畢業旅行意向調查系統 (Japan Graduation Trip Survey)

專為畢業班級／大群組共同討論量身打造的日本畢業旅行意向調查網站。具備**跨裝置即時資料同步**、**雲端資料庫儲存**、**互動統計圖表**與**動態智慧行程提案演算法（Top 3）**。

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-68745D?style=flat-square)
![Cloudflare](https://img.shields.io/badge/Backend-Cloudflare%20Workers%20%7C%20D1%20%7C%20Durable%20Objects-B87956?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-Passing%20(13%2F13)-emerald?style=flat-square)

---

## 一、專案核心特色

1. **真實資料保證（Zero Mock Data）**：
   - 系統初始資料為 0 筆，絕無任何硬編碼示範數據或虛擬假人。
   - 所有圖表、票數、百分比與行程推薦皆 100% 來自真實填答。
2. **跨裝置即時同步（Real-time Multi-client Sync）**：
   - 採用 **Cloudflare Durable Objects + WebSocket** 實現多人即時更新。
   - 同學 A 在手機送出填答，同學 B 的電腦螢幕將自動即時更新圖表與名單，無須手動重新整理。
   - 內建斷線自動指數退避重連（Exponential Backoff）與 15 秒定時輪詢備援機制。
3. **動態智慧行程提案演算法（Top 3）**：
   - **提案 A（呼聲最高經典案）**：以全體最高票地區、最多人天數與共識風格打造。
   - **提案 B（自然慢活探索案）**：針對喜愛風景、溫泉的慢步調規劃；精確評估志願駕駛人力與行車安全。
   - **提案 C（城鄉折衷案）**：兼顧都會購物與近郊大景，動態調整天數與交通銜接。
   - **一鍵複製到 LINE**：一鍵將完整提案摘要與亮點路線排版複製至剪貼簿，直接轉傳大群組。
4. **日系 MUJI 簡約美學**：
   - 溫潤自然暖色調（背景 `#F6F4EF`、主色 `#68745D`、輔色 `#B87956`）。
   - 針對 iPhone 與 Android 手機專門優化，表格支援橫向流暢滑動。

---

## 二、技術架構

| 層級 | 技術選型 | 說明 |
| :--- | :--- | :--- |
| **前端框架** | React 18 + TypeScript + Vite | 現代化 SPA、型別安全、極速建置 |
| **樣式設計** | Tailwind CSS | MUJI 自然簡約配色、RWD 響應式佈局 |
| **統計圖表** | Chart.js + react-chartjs-2 | 橫向長條圖、甜甜圈圖、圓餅圖、人數對照圖 |
| **後端 API** | Cloudflare Workers | 高效能邊緣運算、無伺服器架構 |
| **雲端資料庫** | Cloudflare D1 (SQL / SQLite) | 參數化查詢、完全杜絕 SQL Injection |
| **即時通訊** | Cloudflare Durable Objects | 管理 WebSocket 全域狀態與事件廣播 |
| **靜態資源託管** | Cloudflare Workers Static Assets | 單一 Worker 同步託管前端 SPA 與後端 API |
| **版本管理** | GitHub | 包含 CI/CD 完整自動測試與部署流程 |

---

## 三、問卷功能與資料庫規格

### 填答欄位清單
1. **姓名**：必填，最長 40 字，自動去除前後空白，不可為純空白。
2. **參團意願**：單選（一定參加 / 高機率參加 / 觀望中），預設為「一定參加」。
3. **行程天數**：單選（5 天 / 7 天 / 9 天）。
4. **旅行風格**：單選（都市繁華 / 慢生活風景 / 城鄉各半）。
5. **交通方式**：單選（大眾運輸為主 / 租車自駕）。
6. **自駕支援**：核取方塊（我願意在日本擔任駕駛／換手開車）。
7. **想去地區**：複選，**嚴格限制最多三項**（東京及近郊、京阪神、北海道、福岡九州、青森東北、四國瀨戶內）。前後端雙重驗證。
8. **私心許願／備註**：非必填，最長 500 字，支援中日文與 Emoji，防止 XSS。

### 資料庫 Schema (`responses` 表)
```sql
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  intent TEXT NOT NULL,
  days TEXT NOT NULL,
  style TEXT NOT NULL,
  transport TEXT NOT NULL,
  driver INTEGER NOT NULL DEFAULT 0,
  regions TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_intent ON responses(intent);
```

---

## 四、安全防護與權限架構

1. **前端與後端雙重驗證**：後端嚴格檢驗所有字元長度、字串格式與陣列長度（超過三個地區直接返回 400）。
2. **防注入與 XSS**：所有 D1 資料庫操作均使用 `db.prepare(...).bind(...)` 參數化查詢。
3. **提交頻率限制（Rate Limiting）**：Worker 內建 IP 頻率監控，單一 IP 每分鐘最多提交 15 次，防止惡意洗票。
4. **受保護的管理 API**：
   - 公開頁面不提供直接刪除按鈕，保障填答不被隨意竄改。
   - 提供安全管理維護功能（`DELETE /api/responses/:id`），必須驗證 `x-admin-password` 管理員授權密碼。
5. **隱私說明**：本系統僅蒐集畢旅決策相關資料，不索取任何身分證、信用卡等機密個資。

---

## 五、本地開發與測試

### 1. 安裝相依套件
```bash
npm install
```

### 2. 執行自動化測試套件（13 項單元測試）
```bash
npm test
```

### 3. 本地建立與測試 D1 資料庫
```bash
# 執行本地資料庫 Migration
npm run db:migrate:local

# 啟動本地全端 Worker (包含前端資產、Miniflare D1 與 Durable Objects)
npx wrangler dev --port 8787
```

### 4. 啟動前端開發伺服器
```bash
npm run dev
```

---

## 六、Cloudflare 雲端部署步驟

### 步驟 1：建立 Cloudflare D1 資料庫
在終端機登入 Wrangler 並建立 D1 資料庫：
```bash
npx wrangler d1 create japan-trip-survey-db
```
執行後終端機會顯示產生的 `database_id`，請將其貼入 `wrangler.jsonc` 的 `database_id` 欄位。

### 步驟 2：執行線上 Migration
```bash
npx wrangler d1 migrations apply japan-trip-survey-db --remote
```

### 步驟 3：正式部署 Worker
```bash
# 建置前端 SPA 並部署 Worker
npm run deploy
```

部署完成後，Wrangler 會輸出正式公開訪問網址（例如 `https://japan-graduation-trip-survey.<your-subdomain>.workers.dev`）。

### 步驟 4：設定 GitHub Actions 自動部署
在 GitHub Repository 的 **Settings -> Secrets and variables -> Actions** 中新增以下兩組 Repository Secrets：
- `CLOUDFLARE_API_TOKEN`：具備 Workers, D1, Pages 編輯權限的 Cloudflare API Token。
- `CLOUDFLARE_ACCOUNT_ID`：您的 Cloudflare Account ID。

之後每次 `git push origin main`，GitHub Actions 將會自動執行測試、建置前端並部署至 Cloudflare。

---

## 七、資料匯出與備份

- **網頁一鍵匯出**：在「統計與提案」頁面點擊「匯出 CSV 報表」，即可下載 UTF-8 附帶 BOM 的 CSV 檔案（可直接以 Excel 或 Google 試算表正常開啟繁體中文）。
- **API 匯出**：直接訪問 `GET /api/export` 即可取得完整資料。
- **D1 雲端備份**：
  ```bash
  npx wrangler d1 export japan-trip-survey-db --remote --output backup_survey.sql
  ```
