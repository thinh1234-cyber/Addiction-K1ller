/* ==========================================================================
   KILL ADDICTION - Popup Interface Controller (Synced Controls & Live Countdown)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('theme-select');
  const inspectBtn = document.getElementById('inspect-btn');
  const resetZappedBtn = document.getElementById('reset-zapped-btn');
  const settingsBtn = document.getElementById('settings-btn');

  const platforms = ['facebook', 'youtube', 'tiktok', 'instagram', 'threads'];

  const PLATFORM_NAMES = {
    facebook: 'Facebook',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    threads: 'Threads'
  };

  // 1. Theme Selector
  chrome.storage.local.get(['theme'], (res) => {
    const currentTheme = res.theme || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    if (themeSelect) themeSelect.value = currentTheme;
  });

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      document.body.setAttribute('data-theme', selectedTheme);
      chrome.storage.local.set({ theme: selectedTheme });
    });
  }

  // 2. Load Platform Switch States & Live Countdown Labels
  function updateSwitchesAndLabels() {
    chrome.storage.local.get([...platforms, 'tempUnblocks'], (res) => {
      const tempUnblocks = res.tempUnblocks || {};
      const now = Date.now();

      platforms.forEach((p) => {
        const checkbox = document.getElementById(p);
        const labelElem = document.getElementById(`label-${p}`);
        const isChecked = res[p] !== false;

        if (checkbox) {
          checkbox.checked = isChecked;
        }

        const item = tempUnblocks[p];
        if (!isChecked && item && item.expireTime) {
          const remainingSec = Math.max(0, Math.ceil((item.expireTime - now) / 1000));
          if (remainingSec > 0) {
            if (labelElem) labelElem.textContent = `${PLATFORM_NAMES[p]} (${remainingSec}s left)`;
          } else {
            if (labelElem) labelElem.textContent = PLATFORM_NAMES[p];
          }
        } else {
          if (labelElem) labelElem.textContent = PLATFORM_NAMES[p];
        }
      });
    });
  }

  // Initial Run & 1-Second Countdown Ticker
  updateSwitchesAndLabels();
  const ticker = setInterval(updateSwitchesAndLabels, 1000);

  // Sync state changes in real time
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      updateSwitchesAndLabels();
    }
  });

  // Attach Switch OnChange Handlers with Strict Focus Lock Enforcement
  platforms.forEach((p) => {
    const checkbox = document.getElementById(p);
    if (checkbox) {
      checkbox.onchange = (e) => {
        const isChecked = e.target.checked;

        chrome.storage.local.get(['tempUnblocks', 'strictFocusUntil'], (res) => {
          const now = Date.now();
          if (res.strictFocusUntil && now < res.strictFocusUntil) {
            const leftMins = Math.ceil((res.strictFocusUntil - now) / 60000);
            alert(`🔒 Chế Độ Tập Trung Cao Độ đang kích hoạt (còn ${leftMins} phút)!\n\nKhông thể tắt chặn nền tảng trong thời gian này.`);
            checkbox.checked = true; // revert state
            updateSwitchesAndLabels();
            return;
          }

          const tempUnblocks = res.tempUnblocks || {};

          if (!isChecked) {
            // Random duration 20s to 300s
            const durationSec = Math.floor(Math.random() * (300 - 20 + 1)) + 20;
            const expireTime = Date.now() + durationSec * 1000;

            tempUnblocks[p] = { expireTime, duration: durationSec };

            chrome.storage.local.set({ [p]: false, tempUnblocks }, () => {
              updateSwitchesAndLabels();
            });
          } else {
            delete tempUnblocks[p];
            chrome.storage.local.set({ [p]: true, tempUnblocks }, () => {
              updateSwitchesAndLabels();
            });
          }
        });
      };
    }
  });

  // 3. Inspect Mode Button Handler
  if (inspectBtn) {
    inspectBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_INSPECT' }, (res) => {
          if (res && res.status === 'INSPECT_ENABLED') {
            inspectBtn.textContent = '❌ Tắt Zapper Mode';
            inspectBtn.style.background = '#f43f5e';
          } else {
            inspectBtn.textContent = '🎯 Chọn vùng cần block (Zapper)';
            inspectBtn.style.background = '';
          }
        });
      }
    });
  }

  // Reset Zapped Elements
  if (resetZappedBtn) {
    resetZappedBtn.addEventListener('click', async () => {
      if (confirm('Bạn có muốn khôi phục lại tất cả phần tử đã ẩn thủ công không?')) {
        chrome.storage.local.set({ zappedSelectors: [] }, async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            chrome.tabs.sendMessage(tab.id, { action: 'RESET_ZAPPED' });
          }
          alert('Đã khôi phục các phần tử đã ẩn!');
        });
      }
    });
  }

  // Open Settings Dashboard Button
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options/settings.html'));
      }
    });
  }
});
