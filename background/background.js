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
    let host = parsed.hostname.toLowerCase().trim().replace(/\.$/, '');

    if (['chrome:', 'chrome-extension:', 'edge:', 'about:', 'file:'].includes(parsed.protocol)) {
      return null;
    }

    // IP address detection (IPv4 / IPv6)
    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host) || host.startsWith('[')) {
      return host;
    }

    const parts = host.replace(/^www\./, '').split('.');
    if (parts.length <= 2) {
      return parts.join('.');
    }

    // Extended international multi-part TLDs list
    const multiPartTlds = [
      'co.uk', 'com.vn', 'edu.vn', 'gov.vn', 'net.vn', 'org.vn', 'co.jp', 'com.au', 'com.br', 'co.in',
      'co.kr', 'com.ng', 'co.nz', 'com.tw', 'com.sg', 'com.hk', 'org.uk', 'edu.au', 'gov.uk', 'ac.uk',
      'com.my', 'com.ph', 'com.tr', 'co.id', 'com.mx', 'co.th', 'com.sa', 'org.au', 'net.au'
    ];
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
  const currentHour = new Date().getHours();

  chrome.storage.local.get({ trackingData: {} }, (res) => {
    const trackingData = res.trackingData || {};
    if (!trackingData[todayKey]) {
      trackingData[todayKey] = {
        totalSeconds: 0,
        domains: {},
        hourly: new Array(24).fill(0)
      };
    }

    const dayData = trackingData[todayKey];
    if (!dayData.hourly) {
      dayData.hourly = new Array(24).fill(0);
    }

    dayData.totalSeconds = (dayData.totalSeconds || 0) + durationSec;
    dayData.domains[activeSession.domain] = (dayData.domains[activeSession.domain] || 0) + durationSec;
    dayData.hourly[currentHour] = (dayData.hourly[currentHour] || 0) + durationSec;

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

// Initialize active domain on service worker start / wake-up
async function initActiveDomain() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && tab.url) {
      switchActiveDomain(tab.url);
    }
  } catch (e) {}
}

// Initial Run on Service Worker Load
initActiveDomain();

// Listen to Tab Activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      switchActiveDomain(tab.url);
    }
  } catch (e) {}
});

// Listen to Tab URL & Status Changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab && tab.active && tab.url) {
    const newDomain = extractRootDomain(tab.url);
    if (newDomain && newDomain !== activeSession.domain) {
      switchActiveDomain(tab.url);
    }
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
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab && tab.url) {
        switchActiveDomain(tab.url);
      }
    } catch (e) {}
  }
});

// Flush data periodically & auto-recover active session domain if empty
setInterval(async () => {
  if (!activeSession.domain) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab && tab.url) {
        switchActiveDomain(tab.url);
      }
    } catch (e) {}
  }
  if (activeSession.domain) {
    flushActiveTime();
  }
}, 5000);
