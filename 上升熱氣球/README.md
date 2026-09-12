# 🎈 熱氣球升空挑戰 (Rising Hot Air Balloon)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20GitHub%20Pages-orange.svg)

一款基於 HTML5 Canvas 與 Web Audio API 開發的極速敲擊反應網頁遊戲。玩家透過交替快速敲擊鍵盤上的 `F` 鍵與 `J` 鍵，點燃熱氣球噴射火焰，衝破大氣層直達璀璨太空！

---

## 🌟 遊戲亮點 (Features)

- 🎮 **雙核心遊戲模式**：
  - **無盡模式 (Endless Mode)**：極限挑戰！嚴格的 0.8s 連擊與按錯判定，一旦失誤立即結束。
  - **限時模式 (Time Attack Mode)**：提供 20 秒、40 秒與 60 秒三種時限選擇，允許失誤並考驗穩定的爆發力。
- 🎨 **動態海拔視覺系統 (Dynamic Atmosphere Canvas)**：
  - 隨著高度爬升，背景實時轉換：**白天晴空 (0m) ➔ 金黃夕陽 (1,500m) ➔ 暮光紫霞 (5,000m) ➔ 璀璨平流層 (12,000m) ➔ 極光深空 (30,000m+)**。
  - 具備熱氣球動態搖擺、噴火粒子特效、雲層滾動與 Combo 震撼震動。
- 🔊 **Web Audio API 聲效合成器**：無須額外下載音效檔案，即時合成連撃音階、火焰噴射聲與倒數提示聲。
- 🏆 **Firebase Firestore 多榜單整合**：
  - 獨立紀錄無盡模式、20s、40s、60s 四種分頁排行榜。
  - 自動防護離線模式：若無網路連線自動啟用 LocalStorage 保存歷史高分。
- ⚙️ **管理者後台 (Admin Panel)**：
  - 支援管理者登入，可瀏覽、編輯分數/暱稱與刪除作弊紀錄。

---

## 🕹️ 遊戲操作 (Controls)

| 操作方式 | 鍵盤 / 觸控按鈕 | 說明 |
| :--- | :--- | :--- |
| **推進上升** | `F` 鍵與 `J` 鍵 | **必須交替點擊 (`F -> J -> F -> J`)** |
| **Combo 加成** | 連續正確點擊 | 提升每次點擊獲得的海拔加成 (+1m ➔ +2m ➔ +4m ➔ +7m) |

---

## 🚀 部署至 GitHub Pages (GitHub Pages Deployment)

本專案採用零編譯費用的原生 HTML/CSS/JS 架構，可直接免費託管至 GitHub Pages：

1. 將本專案推送至 GitHub 儲存庫：
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Rising Hot Air Balloon Game"
   git branch -M main
   git remote add origin https://github.com/your-username/rising-hot-air-balloon.git
   git push -u origin main
   ```
2. 進入 GitHub 專案頁面：`Settings` ➔ `Pages`。
3. 在 **Source** 選項選擇 `Deploy from a branch`。
4. Branch 選擇 `main` / `root` (`/`) 並點擊 **Save**。
5. 約 1~2 分鐘後即可透過 `https://your-username.github.io/rising-hot-air-balloon/` 開啟遊戲！

---

## 🔧 Firebase 與管理者配置 (Firebase & Admin Config)

### 1. Firebase 預設配置 (`js/firebase-config.js`)
專案已內建 Firebase 配置：
- **Project ID**: `rising-hot-air-balloon-283a6`
- **Collection**: `leaderboard`

### 2. 管理者登入資訊 (Admin Credentials)
點擊畫面右下角 **「⚙️ 管理者後台」** 按鈕登入：
- **管理者帳號**：`linjyunruei` (系統會映射為 `linjyunruei@admin.com`)
- **管理者密碼**：`meps786039`

---

## 📁 專案目錄結構 (Project Structure)

```
.
├── index.html              # 遊戲主頁面 (含所有畫面與 Modal)
├── css/
│   └── style.css           # Modern Glassmorphism 樣式與響應式佈局
├── js/
│   ├── firebase-config.js  # Firebase Firestore 與 Auth 服務 (含 LocalStorage 備用)
│   ├── audio.js            # Web Audio 聲效合成器 Engine
│   ├── render-engine.js    # Canvas 大氣背景、熱氣球與火焰粒子渲染器
│   ├── game-engine.js      # 按鍵判定、Combo 機制與遊戲循環
│   ├── ui.js               # UI 畫面切換與排行榜 Tab 邏輯
│   └── admin.js            # 管理者後台資料編輯與刪除邏輯
├── README.md               # 專案說明文件
└── LICENSE                 # MIT 授權條款
```

---

## 📄 授權條款 (License)

本專案基於 [MIT License](LICENSE) 開源發行。
