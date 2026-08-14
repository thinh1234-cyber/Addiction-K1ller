/* ==========================================================================
   KILL ADDICTION - Background Service Worker & Root Domain Time Tracking
   ========================================================================== */

let activeSession = {
  domain: null,
  startTime: null
};

// Extract clean Root Domain (e.g., m.facebook.com -> facebook.com, news.ycombinator.com -> ycombinator.com)
function extractRootDomain(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (['chrome:', 'chrome-extension:', 'edge:', 'about:', 'file:'].includes(parsed.protocol)) {
      return null;
    }

    const parts = host.replace(/^www\./, '').split('.');
    if (parts.length <= 2) {
      return parts.join('.');
    }

    // Handle multi-part TLDs (e.g. .co.uk, .com.vn, .edu.vn, .gov.vn, .net.vn, .org.vn, .co.jp)
    const multiPartTlds = ['co.uk', 'com.vn', 'edu.vn', 'gov.vn', 'net.vn', 'org.vn', 'co.jp', 'com.au', 'com.br', 'co.in'];
    const lastTwo = parts.slice(-2).join('.');

    if (multiPartTlds.includes(lastTwo) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }

    return parts.slice(-2).join('.');
  } catch (e) {
    return null;
  }
}

// Get today's date formatted as YYYY-MM-DD
function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Flush current active domain time to storage
async function flushActiveTime() {
  if (!activeSession.domain || !activeSession.startTime) return;

  const now = Date.now();
  const durationSec = Math.floor((now - activeSession.startTime) / 1000);
  activeSession.startTime = now; // reset anchor

  if (durationSec <= 0) return;

  const todayKey = getTodayKey();

  chrome.storage.local.get({ trackingData: {} }, (res) => {
    const trackingData = res.trackingData || {};
    if (!trackingData[todayKey]) {
      trackingData[todayKey] = {
        totalSeconds: 0,
        domains: {}
      };
    }

    const dayData = trackingData[todayKey];
    dayData.totalSeconds = (dayData.totalSeconds || 0) + durationSec;
    dayData.domains[activeSession.domain] = (dayData.domains[activeSession.domain] || 0) + durationSec;

    chrome.storage.local.set({ trackingData });
  });
}

// Switch active domain tracking target
async function switchActiveDomain(newUrl) {
  await flushActiveTime();

  const domain = extractRootDomain(newUrl);
  if (domain) {
    activeSession.domain = domain;
    activeSession.startTime = Date.now();
  } else {
    activeSession.domain = null;
    activeSession.startTime = null;
  }
}

// Check expired temporary unblocks every second
setInterval(() => {
  chrome.storage.local.get(['tempUnblocks'], (res) => {
    const tempUnblocks = res.tempUnblocks || {};
    const now = Date.now();

    Object.keys(tempUnblocks).forEach((platform) => {
      if (tempUnblocks[platform] && now >= tempUnblocks[platform].expireTime) {
        delete tempUnblocks[platform];
        chrome.storage.local.set({ [platform]: true, tempUnblocks }, () => {
          // Notify active tabs of that platform to re-enable blocking & reload
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((t) => {
              if (t.url && isPlatformUrl(t.url, platform)) {
                chrome.tabs.sendMessage(t.id, { action: 'TEMP_UNBLOCK_EXPIRED', platform }).catch(() => {});
              }
            });
          });
        });
      }
    });
  });
}, 1000);

function isPlatformUrl(url, platform) {
  if (!url) return false;
  const lUrl = url.toLowerCase();
  if (platform === 'facebook') return lUrl.includes('facebook.com');
  if (platform === 'youtube') return lUrl.includes('youtube.com');
  if (platform === 'tiktok') return lUrl.includes('tiktok.com');
  if (platform === 'instagram') return lUrl.includes('instagram.com');
  if (platform === 'threads') return lUrl.includes('threads');
  return false;
}

// Listen to Tab Activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      switchActiveDomain(tab.url);
    }
  } catch (e) {}
});

// Listen to Tab URL Changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    switchActiveDomain(changeInfo.url);
  }
});

// Listen to Window Focus
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await flushActiveTime();
    activeSession.domain = null;
    activeSession.startTime = null;
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId: windowId });
      if (tab && tab.url) {
        switchActiveDomain(tab.url);
      }
    } catch (e) {}
  }
});

// Listen to Idle State (e.g. user away for 60s)
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState !== 'active') {
    await flushActiveTime();
    activeSession.domain = null;
    activeSession.startTime = null;
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        switchActiveDomain(tab.url);
      }
    } catch (e) {}
  }
});

// Flush data periodically every 15 seconds
setInterval(() => {
  if (activeSession.domain) {
    flushActiveTime();
  }
}, 15000);
