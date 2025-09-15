# 啟用 CORS 支援的 TON Storage 啟動方法

## 問題說明

GitHub Pages 使用 HTTPS，但本地 TON Storage API 使用 HTTP，導致瀏覽器阻止跨域請求。

## 解決方案

### 1. 使用 HTTP 版本（推薦）

直接下載並在本地打開 `index-http.html`：
```bash
# 下載檔案到本地
curl -O https://awesome-doge.github.io/tonutils-storage/index-http.html
curl -O https://awesome-doge.github.io/tonutils-storage/styles.css  
curl -O https://awesome-doge.github.io/tonutils-storage/script.js

# 在瀏覽器中開啟 index-http.html
```

### 2. 啟動支援 CORS 的 TON Storage

如果你想要使用 HTTPS 版本，需要修改 TON Storage 服務器以支援 CORS。

#### 方法 A：使用反向代理

創建一個支援 CORS 的代理服務器：

```javascript
// proxy-server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// 啟用 CORS
app.use(cors({
  origin: ['https://awesome-doge.github.io', 'http://localhost:3000'],
  credentials: true
}));

// 代理到 TON Storage API
app.use('/api', createProxyMiddleware({
  target: 'http://127.0.0.1:11699',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  }
}));

app.listen(3001, () => {
  console.log('CORS代理服務器運行在 http://localhost:3001');
});
```

安裝並運行：
```bash
npm install express http-proxy-middleware cors
node proxy-server.js
```

然後在網頁中使用 `http://localhost:3001` 作為服務器地址。

#### 方法 B：修改 TON Storage 源碼

如果你可以編譯 TON Storage，可以在 HTTP 服務器響應中添加 CORS 標頭：

```go
// 在 storage/server.go 的 HTTP 處理器中添加
w.Header().Set("Access-Control-Allow-Origin", "*")
w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
```

### 3. 本地開發服務器

使用本地 HTTP 服務器托管網頁：

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve -s . -p 8080

# PHP
php -S localhost:8080
```

然後訪問 `http://localhost:8080`

## 推薦解決方案

**最簡單的方法**：直接使用 HTTP 版本
1. 下載 `index-http.html` 到本地
2. 在瀏覽器中開啟該檔案
3. 輸入你的 TON Storage 服務器 IP 和端口（例如 127.0.0.1:11699）

這樣就可以正常連接和管理你的 TON Storage 下載了！