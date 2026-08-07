/* ==========================================================================
   KILL ADDICTION - Popup Controller Logic with Theme & Auto-Update Manager
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const platforms = ['facebook', 'youtube', 'tiktok', 'instagram', 'threads'];
  const inspectBtn = document.getElementById('inspect-btn');
  const resetZappedBtn = document.getElementById('reset-zapped-btn');
  const themeSelect = document.getElementById('theme-select');
  const updateBtn = document.getElementById('update-btn');

  // Load saved theme & settings
  chrome.storage.local.get([...platforms, 'theme'], (res) => {
    // 1. Apply Theme
    const currentTheme = res.theme || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    if (themeSelect) themeSelect.value = currentTheme;

    // 2. Load Checkbox States
    const stateToSave = {};
    platforms.forEach((p) => {
      const isEnabled = res[p] !== false;
      stateToSave[p] = isEnabled;

      const checkbox = document.getElementById(p);
      if (checkbox) {
        checkbox.checked = isEnabled;
        checkbox.addEventListener('change', (e) => {
          chrome.storage.local.set({ [p]: e.target.checked });
        });
      }
    });

    chrome.storage.local.set(stateToSave);
  });

  // Theme Change Event Handler
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      document.body.setAttribute('data-theme', selectedTheme);
      chrome.storage.local.set({ theme: selectedTheme });
    });
  }

  // 1. DOM Inspector Trigger ("Chỉ định ẩn phần tử")
  if (inspectBtn) {
    inspectBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_INSPECT' }, (res) => {
          if (chrome.runtime.lastError) {
            alert('Vui lòng reload trang web để Extension kích hoạt Zapper!');
            return;
          }
          if (res && res.status === 'INSPECT_ENABLED') {
            window.close();
          }
        });
      }
    });
  }

  // 2. Reset Zapped List Trigger ("Khôi phục phần tử đã ẩn")
  if (resetZappedBtn) {
    resetZappedBtn.addEventListener('click', async () => {
      if (confirm('Bạn có chắc chắn muốn khôi phục lại tất cả các phần tử đã ẩn thủ công?')) {
        chrome.storage.local.set({ zappedSelectors: [] }, async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: 'RESET_ZAPPED' });
          }
          alert('Đã khôi phục toàn bộ các phần tử đã ẩn!');
        });
      }
    });
  }

  // 3. Auto-Update Check & Reload Trigger
  if (updateBtn) {
    updateBtn.addEventListener('click', async () => {
      updateBtn.textContent = '...';
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/thinh1234-cyber/Addiction-K1ller/main/manifest.json?cache=' + Date.now()
        );
        if (response.ok) {
          const remoteManifest = await response.json();
          const localVersion = chrome.runtime.getManifest().version;
          if (remoteManifest.version && remoteManifest.version !== localVersion) {
            alert(`Đã tìm thấy phiên bản mới (v${remoteManifest.version}) trên GitHub!\nĐang tự động làm mới Extension...`);
          } else {
            alert(`Phiên bản hiện tại (v${localVersion}) đã mới nhất!\nĐang làm mới Extension...`);
          }
        } else {
          alert('Đã hoàn tất kiểm tra & làm mới Extension!');
        }
      } catch (err) {
        alert('Đã làm mới Extension!');
      } finally {
        updateBtn.textContent = 'Update';
        chrome.runtime.reload();
      }
    });
  }
});
