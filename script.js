let apiEndpoint = '';
let isConnected = false;
let refreshInterval = null;

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="removeToast(this)"><i class="fas fa-times"></i></button>
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        removeToast(toast.querySelector('button'));
    }, 5000);
}

function removeToast(button) {
    const toast = button.parentElement;
    toast.remove();
}

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

async function makeApiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${apiEndpoint}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

async function testConnection() {
    const serverIp = document.getElementById('serverIp').value.trim();
    const serverPort = document.getElementById('serverPort').value.trim();
    
    if (!serverIp || !serverPort) {
        showToast('請輸入服務器 IP 和端口', 'error');
        return;
    }
    
    const testEndpoint = `http://${serverIp}:${serverPort}`;
    showLoading(true);
    
    try {
        const response = await fetch(`${testEndpoint}/api/v1/list`, {
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            showToast('連接測試成功', 'success');
        } else {
            showToast(`連接測試失敗: HTTP ${response.status}`, 'error');
        }
    } catch (error) {
        if (error.message.includes('CORS')) {
            showToast('CORS 錯誤：請確保 TON Storage 允許跨域請求', 'error');
        } else if (error.message.includes('Mixed Content')) {
            showToast('安全限制：HTTPS 頁面無法連接 HTTP API', 'error');
        } else {
            showToast(`連接測試失敗: ${error.message}`, 'error');
        }
        console.error('Connection test error:', error);
    } finally {
        showLoading(false);
    }
}

async function connectToServer() {
    const serverIp = document.getElementById('serverIp').value.trim();
    const serverPort = document.getElementById('serverPort').value.trim();
    
    if (!serverIp || !serverPort) {
        showToast('請輸入服務器 IP 和端口', 'error');
        return;
    }
    
    apiEndpoint = `http://${serverIp}:${serverPort}`;
    showLoading(true);
    
    try {
        await makeApiCall('/api/v1/list');
        isConnected = true;
        updateConnectionStatus('已連接', 'connected');
        showMainContent();
        startAutoRefresh();
        showToast('連接成功', 'success');
        await refreshData();
    } catch (error) {
        isConnected = false;
        updateConnectionStatus('連接失敗', 'error');
        
        let errorMsg = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg = 'CORS 或網路錯誤：請檢查服務器設置和跨域權限';
        } else if (error.message.includes('Mixed Content')) {
            errorMsg = '安全限制：HTTPS 頁面無法連接 HTTP API，請使用 HTTP 版本的頁面';
        }
        
        showToast(`連接失敗: ${errorMsg}`, 'error');
        console.error('Connection error:', error);
    } finally {
        showLoading(false);
    }
}

function updateConnectionStatus(text, status) {
    const statusElement = document.getElementById('connectionStatus');
    const icon = statusElement.querySelector('i');
    const span = statusElement.querySelector('span');
    
    span.textContent = text;
    icon.className = `fas fa-circle status-${status}`;
}

function showMainContent() {
    document.getElementById('connectionPanel').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(refreshData, 3000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

async function refreshData() {
    if (!isConnected) return;
    
    try {
        await Promise.all([
            refreshStats(),
            refreshDownloads()
        ]);
    } catch (error) {
        console.error('Refresh failed:', error);
    }
}

async function refreshStats() {
    try {
        const data = await makeApiCall('/api/v1/list');
        const bags = data.bags || [];
        
        let totalDownloading = 0;
        let totalCompleted = 0;
        let totalPeers = 0;
        let totalSpeed = 0;
        
        bags.forEach(bag => {
            if (!bag.completed && bag.active) totalDownloading++;
            if (bag.completed) totalCompleted++;
            totalPeers += bag.peers || 0;
            totalSpeed += (bag.download_speed || 0);
        });
        
        document.getElementById('totalDownloading').textContent = totalDownloading;
        document.getElementById('totalCompleted').textContent = totalCompleted;
        document.getElementById('totalPeers').textContent = totalPeers;
        document.getElementById('totalSpeed').textContent = (totalSpeed / 1024 / 1024).toFixed(2);
    } catch (error) {
        console.error('Failed to refresh stats:', error);
    }
}

async function refreshDownloads() {
    try {
        const data = await makeApiCall('/api/v1/list');
        const bags = data.bags || [];
        
        const container = document.getElementById('downloadsContainer');
        container.innerHTML = '';
        
        if (bags.length === 0) {
            container.innerHTML = '<div class="no-downloads">沒有下載項目</div>';
            return;
        }
        
        bags.forEach(bag => {
            const downloadItem = createDownloadItem(bag);
            container.appendChild(downloadItem);
        });
    } catch (error) {
        console.error('Failed to refresh downloads:', error);
    }
}

function createDownloadItem(bag) {
    const progress = bag.size > 0 ? (bag.downloaded / bag.size * 100) : 0;
    const downloadSpeed = (bag.download_speed || 0) / 1024 / 1024;
    const uploadSpeed = (bag.upload_speed || 0) / 1024 / 1024;
    
    const item = document.createElement('div');
    item.className = 'download-item';
    item.innerHTML = `
        <div class="download-header">
            <div class="download-info">
                <h3>${bag.description || 'Unknown'}</h3>
                <div class="bag-id">ID: ${bag.bag_id}</div>
            </div>
            <div class="download-status">
                <span class="status-badge status-${bag.completed ? 'completed' : bag.active ? 'active' : 'paused'}">
                    ${bag.completed ? '已完成' : bag.active ? '進行中' : '已暫停'}
                </span>
            </div>
        </div>
        <div class="download-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${progress.toFixed(1)}%</div>
        </div>
        <div class="download-details">
            <div class="detail-item">
                <i class="fas fa-download"></i>
                <span>${formatBytes(bag.downloaded)} / ${formatBytes(bag.size)}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-tachometer-alt"></i>
                <span>↓ ${downloadSpeed.toFixed(2)} MB/s ↑ ${uploadSpeed.toFixed(2)} MB/s</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-users"></i>
                <span>${bag.peers} 個連接</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-folder"></i>
                <span>${bag.files_count} 個文件</span>
            </div>
        </div>
        <div class="download-actions">
            ${!bag.completed && !bag.active ? `
                <button class="btn btn-small btn-success" onclick="resumeDownload('${bag.bag_id}')">
                    <i class="fas fa-play"></i> 繼續
                </button>
            ` : ''}
            ${bag.active ? `
                <button class="btn btn-small btn-warning" onclick="stopDownload('${bag.bag_id}')">
                    <i class="fas fa-pause"></i> 暫停
                </button>
            ` : ''}
            <button class="btn btn-small btn-info" onclick="viewDetails('${bag.bag_id}')">
                <i class="fas fa-info-circle"></i> 詳情
            </button>
            <button class="btn btn-small btn-secondary" onclick="verifyDownload('${bag.bag_id}')">
                <i class="fas fa-shield-alt"></i> 驗證
            </button>
            <button class="btn btn-small btn-danger" onclick="removeDownload('${bag.bag_id}')">
                <i class="fas fa-trash"></i> 刪除
            </button>
        </div>
    `;
    
    return item;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function addDownload() {
    const bagId = document.getElementById('bagId').value.trim();
    const downloadPath = document.getElementById('downloadPath').value.trim();
    
    if (!bagId) {
        showToast('請輸入 Bag ID', 'error');
        return;
    }
    
    if (!downloadPath) {
        showToast('請輸入下載路徑', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await makeApiCall('/api/v1/add', {
            method: 'POST',
            body: JSON.stringify({
                bag_id: bagId,
                path: downloadPath,
                download_all: true
            })
        });
        
        showToast('下載已添加', 'success');
        document.getElementById('bagId').value = '';
        await refreshDownloads();
    } catch (error) {
        showToast(`添加下載失敗: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function stopDownload(bagId) {
    showLoading(true);
    
    try {
        await makeApiCall('/api/v1/stop', {
            method: 'POST',
            body: JSON.stringify({ bag_id: bagId })
        });
        
        showToast('下載已暫停', 'success');
        await refreshDownloads();
    } catch (error) {
        showToast(`暫停失敗: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function resumeDownload(bagId) {
    showLoading(true);
    
    try {
        await makeApiCall('/api/v1/add', {
            method: 'POST',
            body: JSON.stringify({
                bag_id: bagId,
                download_all: true
            })
        });
        
        showToast('下載已恢復', 'success');
        await refreshDownloads();
    } catch (error) {
        showToast(`恢復失敗: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function removeDownload(bagId) {
    if (!confirm('確定要刪除此下載項目嗎？')) return;
    
    showLoading(true);
    
    try {
        await makeApiCall('/api/v1/remove', {
            method: 'POST',
            body: JSON.stringify({
                bag_id: bagId,
                with_files: false
            })
        });
        
        showToast('下載已刪除', 'success');
        await refreshDownloads();
    } catch (error) {
        showToast(`刪除失敗: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function verifyDownload(bagId) {
    showLoading(true);
    
    try {
        const result = await makeApiCall('/api/v1/verify', {
            method: 'POST',
            body: JSON.stringify({
                bag_id: bagId,
                only_files_existence: false
            })
        });
        
        if (result.ok) {
            showToast('文件驗證通過', 'success');
        } else {
            showToast('文件驗證失敗，正在重新下載', 'warning');
        }
        
        await refreshDownloads();
    } catch (error) {
        showToast(`驗證失敗: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function viewDetails(bagId) {
    showLoading(true);
    
    try {
        const details = await makeApiCall(`/api/v1/details?bag_id=${bagId}`);
        showDetailsModal(details);
    } catch (error) {
        showToast(`獲取詳情失敗: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function showDetailsModal(details) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${details.description || 'Unknown'}</h3>
                <button onclick="closeModal()" class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-row">
                            <span>Bag ID:</span>
                            <span class="bag-id-text">${details.bag_id}</span>
                        </div>
                        <div class="detail-row">
                            <span>大小:</span>
                            <span>${formatBytes(details.size)}</span>
                        </div>
                        <div class="detail-row">
                            <span>已下載:</span>
                            <span>${formatBytes(details.downloaded)}</span>
                        </div>
                        <div class="detail-row">
                            <span>文件數量:</span>
                            <span>${details.files_count}</span>
                        </div>
                        <div class="detail-row">
                            <span>路徑:</span>
                            <span>${details.path || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                ${details.files && details.files.length > 0 ? `
                    <div class="detail-section">
                        <h4>文件列表</h4>
                        <div class="files-list">
                            ${details.files.map(file => `
                                <div class="file-item">
                                    <i class="fas fa-file"></i>
                                    <span class="file-name">${file.name}</span>
                                    <span class="file-size">${formatBytes(file.size)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${details.peers && details.peers.length > 0 ? `
                    <div class="detail-section">
                        <h4>連接的節點</h4>
                        <div class="peers-list">
                            ${details.peers.map(peer => `
                                <div class="peer-item">
                                    <i class="fas fa-server"></i>
                                    <span class="peer-addr">${peer.addr}</span>
                                    <span class="peer-speed">↓ ${(peer.download_speed / 1024 / 1024).toFixed(2)} MB/s</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

async function clearCompleted() {
    if (!confirm('確定要清理所有已完成的下載嗎？')) return;
    
    showLoading(true);
    
    try {
        const data = await makeApiCall('/api/v1/list');
        const completedBags = data.bags.filter(bag => bag.completed);
        
        for (const bag of completedBags) {
            await makeApiCall('/api/v1/remove', {
                method: 'POST',
                body: JSON.stringify({
                    bag_id: bag.bag_id,
                    with_files: false
                })
            });
        }
        
        showToast(`已清理 ${completedBags.length} 個已完成的下載`, 'success');
        await refreshDownloads();
    } catch (error) {
        showToast(`清理失敗: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化時隱藏載入畫面
    showLoading(false);
    
    const savedIp = localStorage.getItem('tonStorage_serverIp');
    const savedPort = localStorage.getItem('tonStorage_serverPort');
    
    if (savedIp) document.getElementById('serverIp').value = savedIp;
    if (savedPort) document.getElementById('serverPort').value = savedPort;
    
    document.getElementById('serverIp').addEventListener('input', function() {
        localStorage.setItem('tonStorage_serverIp', this.value);
    });
    
    document.getElementById('serverPort').addEventListener('input', function() {
        localStorage.setItem('tonStorage_serverPort', this.value);
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // 檢查是否在 HTTPS 環境中
    if (location.protocol === 'https:') {
        const httpsNotice = document.getElementById('httpsNotice');
        if (httpsNotice) {
            httpsNotice.style.display = 'flex';
        }
    }
});

window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});