/* ──────────────────────────────────────────────────────────────────────────
   PPTX Silent Archiver — v1.0 JavaScript Logic
   Google Identity Services (GIS) Integration & Local HTTP Bridge Client
   ────────────────────────────────────────────────────────────────────────── */

// App State
const DEFAULT_CLIENT_ID = '758353138427-n4j93ju4shr6hcbj9vme905dm1ka25cq.apps.googleusercontent.com'; // Google Web Client ID'nizi buraya yapıştırırsanız tüm tarayıcılarda varsayılan olarak tanımlanır!
let clientId = localStorage.getItem('pptx_archiver_client_id') || DEFAULT_CLIENT_ID || '';
let accessToken = localStorage.getItem('pptx_archiver_access_token') || null;
let tokenExpiry = parseInt(localStorage.getItem('pptx_archiver_token_expiry') || '0', 10);
let tokenClient = null;
let currentFolderId = null;
let googleDriveFolders = []; // Cache of day folders
let currentFolderFiles = []; // Cache of files in current folder
let localFiles = [];         // Cache of local files

// DOM Elements
const badgeStatus = document.getElementById('service-status-badge');
const badgeStatusText = document.getElementById('status-text');
const sysComputer = document.getElementById('sys-computer');
const sysUptime = document.getElementById('sys-uptime');
const sysPlatform = document.getElementById('sys-platform');

const localCount = document.getElementById('local-count');
const localSearchInput = document.getElementById('local-search');
const localFilesPlaceholder = document.getElementById('local-files-placeholder');
const localFilesList = document.getElementById('local-files-list');

const btnSettings = document.getElementById('btn-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');
const inputClientId = document.getElementById('input-client-id');
const settingsModal = document.getElementById('settings-modal');

const btnGoogleAuth = document.getElementById('btn-google-auth');
const btnGoogleLogout = document.getElementById('btn-google-logout');
const cloudFilters = document.getElementById('cloud-filters');
const btnRefreshCloud = document.getElementById('btn-refresh-cloud');
const cloudSearchInput = document.getElementById('cloud-search');

const cloudAuthPlaceholder = document.getElementById('cloud-auth-placeholder');
const cloudLoading = document.getElementById('cloud-loading');
const cloudEmpty = document.getElementById('cloud-empty');
const cloudFilesView = document.getElementById('cloud-files-view');
const cloudFoldersGrid = document.getElementById('cloud-folders-grid');
const cloudFilesGrid = document.getElementById('cloud-files-grid');
const currentFolderTitle = document.getElementById('current-folder-title');
const btnBackToFolders = document.getElementById('btn-back-to-folders');

// Bridge API URL
const BRIDGE_API_URL = 'http://localhost:58291';

// ────────────────────────── INITIALIZATION ──────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // Populate Client ID field in settings modal
    if (clientId) {
        inputClientId.value = clientId;
    } else {
        // Highlight settings button or open settings modal on first run
        setTimeout(() => {
            openSettingsModal();
        }, 1000);
    }

    // Event Listeners
    btnSettings.addEventListener('click', openSettingsModal);
    btnCloseSettings.addEventListener('click', closeSettingsModal);
    btnSaveSettings.addEventListener('click', saveSettings);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });

    btnGoogleAuth.addEventListener('click', handleGoogleAuth);
    btnGoogleLogout.addEventListener('click', handleGoogleLogout);
    btnRefreshCloud.addEventListener('click', refreshCloudData);
    btnBackToFolders.addEventListener('click', showFoldersView);

    localSearchInput.addEventListener('input', filterLocalFiles);
    cloudSearchInput.addEventListener('input', filterCloudFiles);

    // Initial check and periodic status pings
    checkLocalServiceStatus();
    setInterval(checkLocalServiceStatus, 5000);

    // Google API başlatıcıyı çağır
    initGoogleClient();
});

// ──────────────────────── LOCAL BRIDGE INTEGRATION ──────────────────
async function checkLocalServiceStatus() {
    try {
        const response = await fetch(`${BRIDGE_API_URL}/status`, { signal: AbortSignal.timeout(3000) });
        if (!response.ok) throw new Error('Bridge server offline');
        
        const data = await response.json();
        
        // Update Status Badge to Active
        badgeStatus.className = 'status-badge status-active';
        badgeStatusText.textContent = 'Aktif (Lokal Program Açık)';
        
        // Populate system stats
        sysComputer.textContent = data.computer_name || 'Bilinmiyor';
        sysPlatform.textContent = formatPlatform(data.platform);
        sysUptime.textContent = formatUptime(data.uptime_seconds);

        // Load local files
        fetchLocalFiles();
    } catch (error) {
        // Update Status Badge to Passive
        badgeStatus.className = 'status-badge status-passive';
        badgeStatusText.textContent = 'Pasif (Lokal Program Kapalı)';
        
        sysComputer.textContent = '—';
        sysPlatform.textContent = '—';
        sysUptime.textContent = '—';

        // Clear local files view
        localFiles = [];
        renderLocalFiles();
    }
}

async function fetchLocalFiles() {
    try {
        const response = await fetch(`${BRIDGE_API_URL}/local-files`);
        if (!response.ok) throw new Error('Failed to load local files');
        const data = await response.json();
        localFiles = data;
        renderLocalFiles();
    } catch (error) {
        console.error('Error fetching local files:', error);
    }
}

function renderLocalFiles() {
    if (localFiles.length === 0) {
        localFilesPlaceholder.classList.remove('hidden');
        localFilesList.classList.add('hidden');
        localCount.textContent = '0 Dosya';
        return;
    }

    localFilesPlaceholder.classList.add('hidden');
    localFilesList.classList.remove('hidden');
    localCount.textContent = `${localFiles.length} Dosya`;

    // Filter and Render
    const query = localSearchInput.value.toLowerCase().trim();
    const filtered = localFiles.filter(f => f.name.toLowerCase().includes(query));

    localFilesList.innerHTML = '';
    filtered.forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="file-info">
                <span class="file-name" title="${file.name}">${file.name}</span>
                <span class="file-meta">${formatBytes(file.size_bytes)} • ${file.modified_at}</span>
            </div>
            <div class="file-actions">
                <button class="icon-button icon-button-danger btn-delete-local" data-filename="${file.name}" title="Yerel Kopyayı Sil">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
        `;
        localFilesList.appendChild(li);
    });

    // Add delete listeners
    document.querySelectorAll('.btn-delete-local').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filename = e.currentTarget.getAttribute('data-filename');
            if (confirm(`"${filename}" yerel arşiv kopyasını kalıcı olarak silmek istediğinize emin misiniz? (Drive kopyası etkilenmez)`)) {
                deleteLocalFile(filename);
            }
        });
    });
}

async function deleteLocalFile(filename) {
    try {
        const response = await fetch(`${BRIDGE_API_URL}/delete-local?filename=${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Delete failed');
        // Refresh local files list
        fetchLocalFiles();
    } catch (error) {
        alert('Dosya silinirken bir hata oluştu: ' + error.message);
    }
}

function filterLocalFiles() {
    renderLocalFiles();
}

// ──────────────────────── GOOGLE DRIVE INTEGRATION ──────────────────
function initGoogleClient() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        setTimeout(initGoogleClient, 100);
        return;
    }
    
    if (!clientId) return;

    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
            callback: (tokenResponse) => {
                if (tokenResponse.error) {
                    console.error('Google Auth Error:', tokenResponse.error);
                    // Silent refresh hatasında çıkış yapıp butonu göster
                    if (tokenResponse.error === 'immediate_failed') {
                        onGoogleLogoutSuccess();
                    }
                    return;
                }
                if (tokenResponse.access_token) {
                    accessToken = tokenResponse.access_token;
                    const expiresIn = tokenResponse.expires_in || 3600;
                    tokenExpiry = Date.now() + (expiresIn - 60) * 1000; // 60sn güvenlik payı
                    
                    localStorage.setItem('pptx_archiver_access_token', accessToken);
                    localStorage.setItem('pptx_archiver_token_expiry', tokenExpiry.toString());
                    
                    onGoogleLoginSuccess();
                }
            },
        });

        // Eğer yerel hafızada geçerli (süresi dolmamış) token varsa doğrudan giriş yap
        if (accessToken && Date.now() < tokenExpiry) {
            onGoogleLoginSuccess();
        } else {
            // Arka planda sessizce giriş yapmayı dene (Kullanıcıya popup göstermeden)
            tokenClient.requestAccessToken({ prompt: 'none' });
        }
    } catch (e) {
        console.error('Google Client Init Error:', e);
    }
}

function handleGoogleAuth() {
    if (!clientId) {
        alert('Lütfen önce ayarlardan Google OAuth Web Client ID değerinizi girin.');
        openSettingsModal();
        return;
    }

    if (!tokenClient) {
        initGoogleClient();
        // Google kütüphanesinin yüklenmesini bekle
        setTimeout(() => {
            if (tokenClient) tokenClient.requestAccessToken();
        }, 200);
    } else {
        tokenClient.requestAccessToken(); // Popup açar
    }
}

function handleGoogleLogout() {
    if (accessToken) {
        try {
            google.accounts.oauth2.revokeToken(accessToken, () => {});
        } catch (e) {
            console.error('Revoke error:', e);
        }
    }
    accessToken = null;
    tokenExpiry = 0;
    localStorage.removeItem('pptx_archiver_access_token');
    localStorage.removeItem('pptx_archiver_token_expiry');
    onGoogleLogoutSuccess();
}

function onGoogleLoginSuccess() {
    btnGoogleAuth.classList.add('hidden');
    btnGoogleLogout.classList.remove('hidden');
    cloudFilters.classList.remove('hidden');
    cloudAuthPlaceholder.classList.add('hidden');
    
    refreshCloudData();
}

function onGoogleLogoutSuccess() {
    btnGoogleAuth.classList.remove('hidden');
    btnGoogleLogout.classList.add('hidden');
    cloudFilters.classList.add('hidden');
    
    // Clear elements
    cloudFilesView.classList.add('hidden');
    cloudEmpty.classList.add('hidden');
    cloudLoading.classList.add('hidden');
    cloudAuthPlaceholder.classList.remove('hidden');
    
    googleDriveFolders = [];
    currentFolderFiles = [];
    currentFolderId = null;
}

async function refreshCloudData() {
    if (!accessToken) return;
    
    showCloudLoading(true);
    try {
        const rootFolderId = await getOrCreateRootFolder();
        if (!rootFolderId) {
            showCloudEmpty(true);
            return;
        }

        // Fetch day folders
        googleDriveFolders = await getDayFolders(rootFolderId);
        showCloudLoading(false);

        if (googleDriveFolders.length === 0) {
            showCloudEmpty(true);
        } else {
            showCloudEmpty(false);
            renderFoldersView();
        }
    } catch (e) {
        showCloudLoading(false);
        console.error(e);
        alert('Google Drive verileri çekilirken hata oluştu. Giriş token süresi dolmuş olabilir, lütfen tekrar giriş yapın.');
        onGoogleLogoutSuccess();
    }
}

// Drive API Fetch Wrappers
async function driveFetch(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }
    return response.json();
}

async function getOrCreateRootFolder() {
    // Check if folder exists
    const query = encodeURIComponent("name='PPTX_Archive' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const data = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`);
    
    if (data.files && data.files.length > 0) {
        return data.files[0].id;
    }
    
    // Create it if not found (matching script name)
    const body = {
        name: 'PPTX_Archive',
        mimeType: 'application/vnd.google-apps.folder'
    };
    const newFolder = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        body: JSON.stringify(body)
    });
    return newFolder.id;
}

async function getDayFolders(parentId) {
    const query = encodeURIComponent(`'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const data = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=name desc&fields=files(id, name, createdTime)`);
    return data.files || [];
}

async function getFilesInFolder(folderId) {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const data = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=name desc&fields=files(id, name, size, createdTime, mimeType, webViewLink, webContentLink)`);
    return data.files || [];
}

// UI Render Helpers for Cloud View
function showCloudLoading(show) {
    if (show) {
        cloudLoading.classList.remove('hidden');
        cloudAuthPlaceholder.classList.add('hidden');
        cloudEmpty.classList.add('hidden');
        cloudFilesView.classList.add('hidden');
    } else {
        cloudLoading.classList.add('hidden');
    }
}

function showCloudEmpty(show) {
    if (show) {
        cloudEmpty.classList.remove('hidden');
        cloudAuthPlaceholder.classList.add('hidden');
        cloudLoading.classList.add('hidden');
        cloudFilesView.classList.add('hidden');
    } else {
        cloudEmpty.classList.add('hidden');
    }
}

function renderFoldersView() {
    cloudFilesView.classList.remove('hidden');
    cloudFoldersGrid.classList.remove('hidden');
    cloudFilesGrid.classList.add('hidden');
    currentFolderTitle.textContent = 'Günlük Klasörler';
    btnBackToFolders.classList.add('hidden');
    currentFolderId = null;

    cloudFoldersGrid.innerHTML = '';
    googleDriveFolders.forEach(folder => {
        const div = document.createElement('div');
        div.className = 'folder-card';
        div.innerHTML = `
            <svg class="folder-icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM22.5 12V9a3 3 0 00-3-3h-6.879a1.5 1.5 0 01-1.06-.44L7.439 4.44A2.999 2.999 0 005.318 3.5H4.5A3 3 0 001.5 6.5v5.5H22.5z"/>
            </svg>
            <div class="folder-info">
                <span class="folder-name" title="${folder.name}">${folder.name}</span>
                <span class="folder-count">Yedek Klasörü</span>
            </div>
        `;
        div.addEventListener('click', () => openFolder(folder.id, folder.name));
        cloudFoldersGrid.appendChild(div);
    });
}

async function openFolder(folderId, folderName) {
    currentFolderId = folderId;
    showCloudLoading(true);
    try {
        currentFolderFiles = await getFilesInFolder(folderId);
        showCloudLoading(false);
        cloudFilesView.classList.remove('hidden');
        cloudFoldersGrid.classList.add('hidden');
        cloudFilesGrid.classList.remove('hidden');
        currentFolderTitle.textContent = folderName;
        btnBackToFolders.classList.remove('hidden');
        
        renderFilesView();
    } catch (e) {
        showCloudLoading(false);
        alert('Klasör açılırken hata oluştu: ' + e.message);
    }
}

function showFoldersView() {
    renderFoldersView();
}

function renderFilesView() {
    cloudFilesGrid.innerHTML = '';
    
    // Filter by search
    const query = cloudSearchInput.value.toLowerCase().trim();
    const filtered = currentFolderFiles.filter(f => f.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
        cloudFilesGrid.innerHTML = `
            <div class="placeholder" style="grid-column: 1 / -1; padding: 2rem 0;">
                <p>Bu klasörde aranan kriterlere uygun dosya bulunamadı.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-card';
        
        // Format creation date
        const formattedDate = new Date(file.createdTime).toLocaleString('tr-TR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        div.innerHTML = `
            <div class="file-card-top">
                <div class="pptx-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </div>
                <div class="file-card-details">
                    <span class="file-card-title" title="${file.name}">${file.name}</span>
                    <span class="file-card-meta">${formatBytes(file.size)}</span>
                    <span class="file-card-meta">${formattedDate}</span>
                </div>
            </div>
            <div class="file-card-actions">
                <a href="${file.webViewLink}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" title="Önizle">
                    Önizle
                </a>
                <a href="${file.webContentLink}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" title="İndir">
                    İndir
                </a>
                <button class="btn btn-danger btn-sm btn-delete-cloud" data-id="${file.id}" data-name="${file.name}" title="Drive'dan Sil">
                    Sil
                </button>
            </div>
        `;
        cloudFilesGrid.appendChild(div);
    });

    // Add Cloud delete listeners
    document.querySelectorAll('.btn-delete-cloud').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileId = e.currentTarget.getAttribute('data-id');
            const fileName = e.currentTarget.getAttribute('data-name');
            if (confirm(`"${fileName}" dosyasını Google Drive arşivinden silmek istediğinize emin misiniz?`)) {
                deleteCloudFile(fileId, fileName);
            }
        });
    });
}

async function deleteCloudFile(fileId, fileName) {
    showCloudLoading(true);
    try {
        // Move file to trash (Google Drive PATCH metadata)
        await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'PATCH',
            body: JSON.stringify({ trashed: true })
        });
        
        // Remove from local cache and refresh files list
        currentFolderFiles = currentFolderFiles.filter(f => f.id !== fileId);
        showCloudLoading(false);
        renderFilesView();
    } catch (error) {
        showCloudLoading(false);
        alert('Bulut dosyası silinirken hata oluştu: ' + error.message);
    }
}

function filterCloudFiles() {
    if (currentFolderId) {
        renderFilesView();
    }
}

// ──────────────────────── SETTINGS MODAL ────────────────────────────
function openSettingsModal() {
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

function saveSettings() {
    const rawVal = inputClientId.value.trim();
    if (!rawVal) {
        alert('Lütfen geçerli bir Google OAuth Client ID girin.');
        return;
    }
    clientId = rawVal;
    localStorage.setItem('pptx_archiver_client_id', clientId);
    
    // Reset GIS token client so it gets re-initialized with new client ID
    tokenClient = null;
    accessToken = null;
    tokenExpiry = 0;
    localStorage.removeItem('pptx_archiver_access_token');
    localStorage.removeItem('pptx_archiver_token_expiry');
    
    onGoogleLogoutSuccess();
    initGoogleClient();
    
    closeSettingsModal();
    alert('Ayarlar kaydedildi.');
}

// ──────────────────────── UTILITY HELPERS ───────────────────────────
function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const b = parseInt(bytes, 10);
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    if (!seconds && seconds !== 0) return '—';
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor((seconds % (3600*24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    let parts = [];
    if (d > 0) parts.push(`${d}g`);
    if (h > 0) parts.push(`${h}s`);
    if (m > 0) parts.push(`${m}dk`);
    parts.push(`${s}sn`);
    return parts.join(' ');
}

function formatPlatform(platform) {
    if (!platform) return '—';
    if (platform === 'win32') return 'Windows';
    if (platform === 'darwin') return 'macOS';
    if (platform === 'linux') return 'Linux';
    return platform;
}
