# TON Storage Web UI

這是一個完整的 TON Storage 網頁管理介面，可以部署到 GitHub Pages。

## 功能特性

- 🌐 完整的網頁操作介面
- 📊 即時統計資訊展示
- 📥 下載管理和監控
- 🔧 連接設置和狀態檢查
- 📱 響應式設計，支援行動裝置
- 🎨 現代化 UI 設計

## 使用方法

### 1. GitHub Pages 部署

1. Fork 或 Clone 此專案
2. 在 GitHub 專案設置中啟用 GitHub Pages
3. 選擇 `master` 分支作為來源
4. 訪問 `https://你的用戶名.github.io/tonutils-storage`

### 2. 本地使用

直接在瀏覽器中開啟 `index.html` 檔案即可使用。

## 介面說明

### 連接設置
- **服務器 IP**: 輸入 TON Storage 服務器的 IP 位址
- **端口**: 輸入 API 端口（預設為 11699）
- **用戶名/密碼**: 如果啟用了 HTTP Basic Auth，請輸入對應資訊

### 統計概覽
- **正在下載**: 目前正在進行的下載數量
- **已完成**: 已完成的下載數量
- **總連接數**: 所有下載的總 peer 連接數
- **總速度**: 所有下載的總速度（MB/s）

### 下載管理
- **添加新下載**: 輸入 Bag ID 和下載路徑來添加新的下載項目
- **下載列表**: 顯示所有下載項目的詳細資訊和操作按鈕
- **操作功能**:
  - 繼續/暫停下載
  - 查看詳細資訊
  - 驗證文件完整性
  - 刪除下載項目

## API 相容性

此網頁介面支援所有 TON Storage HTTP API 功能：

- `GET /api/v1/list` - 獲取下載列表
- `POST /api/v1/add` - 添加下載
- `POST /api/v1/stop` - 停止下載
- `POST /api/v1/remove` - 刪除下載
- `POST /api/v1/verify` - 驗證文件
- `GET /api/v1/details` - 獲取詳細資訊

## 技術實現

- **純前端**: 僅使用 HTML、CSS、JavaScript
- **無需後端**: 直接與 TON Storage API 通信
- **自動刷新**: 每 3 秒自動更新狀態
- **本地儲存**: 記住連接設置
- **CORS 支援**: 支援跨域 API 請求

## 注意事項

1. **CORS 設置**: 確保 TON Storage 服務器允許跨域請求
2. **HTTPS**: 如果使用 HTTPS 部署，TON Storage 也需要支援 HTTPS
3. **網絡安全**: 建議僅在安全網絡環境中使用
4. **瀏覽器相容性**: 支援現代瀏覽器（Chrome、Firefox、Safari、Edge）

## 自定義配置

### 修改預設設置
可以在 `script.js` 中修改以下預設值：
```javascript
// 自動刷新間隔（毫秒）
refreshInterval = setInterval(refreshData, 3000);

// 預設服務器設置
const defaultServerIp = '127.0.0.1';
const defaultServerPort = '11699';
```

### 主題自定義
可以在 `styles.css` 中修改顏色主題：
```css
/* 主要漸層色 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 主要色彩 */
--primary-color: #667eea;
--secondary-color: #764ba2;
```