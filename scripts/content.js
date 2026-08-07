/* ==========================================================================
   KILL ADDICTION - Dynamic Content Script & Multi-Platform Feed Eradicator
   ========================================================================== */

(function () {
  'use strict';

  const hostname = window.location.hostname;

  let settings = {
    facebook: true,
    youtube: true,
    tiktok: true,
    instagram: true,
    threads: true,
    zappedSelectors: []
  };

  // Helper: Is element inside a Messenger or Chat container?
  function isInsideChat(el) {
    if (!el) return false;
    return !!(
      el.closest('[data-pagelet="ChatTab"]') ||
      el.closest('[role="dialog"]') ||
      el.closest('[aria-label="Messenger"]') ||
      el.closest('[aria-label="Đoạn chat"]') ||
      el.closest('[aria-label="Messaging"]') ||
      el.closest('[role="complementary"]')
    );
  }

  // --------------------------------------------------------------------------
  // 1. Settings & Platform State Manager
  // --------------------------------------------------------------------------
  function applySettings() {
    chrome.storage.local.get(['facebook', 'youtube', 'tiktok', 'instagram', 'threads', 'zappedSelectors'], (res) => {
      settings.facebook = res.facebook !== false;
      settings.youtube = res.youtube !== false;
      settings.tiktok = res.tiktok !== false;
      settings.instagram = res.instagram !== false;
      settings.threads = res.threads !== false;
      settings.zappedSelectors = res.zappedSelectors || [];

      const html = document.documentElement;

      // Facebook
      if (hostname.includes('facebook.com')) {
        if (window.location.pathname.startsWith('/messages')) {
          html.removeAttribute('data-kill-facebook');
          restoreFacebookFeed();
          return;
        }

        if (settings.facebook) {
          html.setAttribute('data-kill-facebook', 'true');
          cleanFacebookFeed();
        } else {
          html.removeAttribute('data-kill-facebook');
          restoreFacebookFeed();
        }
      }

      // YouTube
      if (hostname.includes('youtube.com')) {
        if (settings.youtube) {
          html.setAttribute('data-kill-youtube', 'true');
          cleanYouTubeFeed();
        } else {
          html.removeAttribute('data-kill-youtube');
        }
      }

      // TikTok
      if (hostname.includes('tiktok.com')) {
        if (settings.tiktok) {
          html.setAttribute('data-kill-tiktok', 'true');
          cleanTikTokFeed();
        } else {
          html.removeAttribute('data-kill-tiktok');
          restoreTikTokFeed();
        }
      }

      // Instagram
      if (hostname.includes('instagram.com')) {
        const isDirect = window.location.pathname.startsWith('/direct/');
        if (isDirect) {
          html.setAttribute('data-is-ig-direct', 'true');
        } else {
          html.removeAttribute('data-is-ig-direct');
        }

        if (settings.instagram && !isDirect) {
          html.setAttribute('data-kill-instagram', 'true');
          cleanInstagramFeed();
        } else {
          html.removeAttribute('data-kill-instagram');
          restoreInstagramFeed();
        }
      }

      // Threads (Support threads.net and threads.com)
      if (hostname.includes('threads')) {
        if (settings.threads) {
          html.setAttribute('data-kill-threads', 'true');
          cleanThreadsFeed();
        } else {
          html.removeAttribute('data-kill-threads');
          restoreThreadsFeed();
        }
      }

      // Apply user zapped selectors
      if (Array.isArray(settings.zappedSelectors)) {
        settings.zappedSelectors.forEach((sel) => {
          try {
            document.querySelectorAll(sel).forEach((el) => {
              if (!isInsideChat(el)) {
                el.classList.add('kill-addiction-zapped');
              }
            });
          } catch (e) {}
        });
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. Facebook Cleaner
  // --------------------------------------------------------------------------
  function cleanFacebookFeed() {
    const bannerId = 'kill-addiction-facebook-banner';

    document
      .querySelectorAll(
        '[role="feed"], [data-pagelet="Feed"], [data-pagelet="GroupFeed"], [data-pagelet="Stories"], [aria-label="Tin"], [aria-label="Reels"], [data-pagelet^="FeedUnit"]'
      )
      .forEach((el) => {
        if (el.id !== bannerId && !isInsideChat(el)) {
          el.style.setProperty('display', 'none', 'important');
        }
      });

    const main = document.querySelector('[role="main"]');
    if (main) {
      let centerCol = Array.from(main.querySelectorAll('div')).find((div) => {
        const isLeft = div.closest('[data-pagelet="LeftRail"]') || div.closest('[role="navigation"]');
        const isRight = div.closest('[role="complementary"]') || div.closest('[data-pagelet="ChatTab"]');
        const hasFeedContent =
          div.querySelector('[role="feed"]') ||
          div.querySelector('[data-pagelet="Stories"]') ||
          div.querySelector('div[role="article"]') ||
          div.querySelector('[aria-label="Tin"]');

        return !isLeft && !isRight && hasFeedContent;
      });

      if (!centerCol) {
        const feed = document.querySelector('[role="feed"], [data-pagelet="Feed"]');
        if (feed) centerCol = feed.parentNode;
      }

      if (centerCol) {
        Array.from(centerCol.children).forEach((child) => {
          if (child.id !== bannerId && !isInsideChat(child)) {
            child.style.setProperty('display', 'none', 'important');
          }
        });

        if (!document.getElementById(bannerId)) {
          const banner = createBannerHTML(
            'facebook',
            'News Feed Cleared!',
            'Focus on messaging & work. Messenger chat and conversations are 100% active.'
          );
          centerCol.prepend(banner);
        }
      }
    }
  }

  function restoreFacebookFeed() {
    const banner = document.getElementById('kill-addiction-facebook-banner');
    if (banner) banner.remove();
    const feed = document.querySelector('[role="feed"], [data-pagelet="Feed"], [data-pagelet="GroupFeed"]');
    if (feed) feed.style.removeProperty('display');
  }

  // --------------------------------------------------------------------------
  // 3. Threads Cleaner
  // --------------------------------------------------------------------------
  function cleanThreadsFeed() {
    const bannerId = 'kill-addiction-threads-banner';

    document.querySelectorAll('[data-pressable-container="true"]').forEach((el) => {
      if (el.id !== bannerId) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    const pressable = document.querySelector('[data-pressable-container="true"]');
    let centerCol = null;

    if (pressable) {
      centerCol = pressable.parentElement;
      while (centerCol && centerCol.children.length < 3 && centerCol.tagName !== 'MAIN') {
        centerCol = centerCol.parentElement;
      }
    }

    if (!centerCol) {
      centerCol = document.querySelector('main') || document.querySelector('[role="main"]');
    }

    if (centerCol) {
      Array.from(centerCol.children).forEach((child) => {
        if (child.id !== bannerId) {
          child.style.setProperty('display', 'none', 'important');
        }
      });

      if (!document.getElementById(bannerId)) {
        const banner = createBannerHTML(
          'threads',
          'Threads Timeline Cleared!',
          'Timeline feed and posts have been eradicated. Focus on work & learning.'
        );
        centerCol.prepend(banner);
      }
    }
  }

  function restoreThreadsFeed() {
    const banner = document.getElementById('kill-addiction-threads-banner');
    if (banner) banner.remove();
    document.querySelectorAll('[data-pressable-container="true"]').forEach((el) => {
      el.style.removeProperty('display');
    });
  }

  // --------------------------------------------------------------------------
  // 4. YouTube Cleaner
  // --------------------------------------------------------------------------
  function cleanYouTubeFeed() {
    const grid = document.querySelector('ytd-rich-grid-renderer');
    if (grid && !document.getElementById('kill-addiction-youtube-banner')) {
      grid.style.setProperty('display', 'none', 'important');
      const banner = createBannerHTML('youtube', 'YouTube Feed Eradicated!', 'Use the top search bar directly to find videos. Home recommendations are hidden.');
      grid.parentNode.insertBefore(banner, grid);
    }
  }

  // --------------------------------------------------------------------------
  // 5. TikTok Cleaner
  // --------------------------------------------------------------------------
  function cleanTikTokFeed() {
    const bannerId = 'kill-addiction-tiktok-banner';
    const feed =
      document.querySelector('[data-e2e="recommend-feed-container"]') ||
      document.querySelector('[data-e2e="feed-video"]') ||
      document.querySelector('div[class*="DivFeedContainer"]') ||
      document.querySelector('div[class*="DivItemContainer"]') ||
      document.querySelector('main div[class*="DivBodyContainer"] > div[class*="DivContentContainer"]');

    if (feed) {
      feed.style.setProperty('display', 'none', 'important');
      if (!document.getElementById(bannerId)) {
        const banner = createBannerHTML('tiktok', 'TikTok Stream Cleared!', 'Short videos feed blocked. Focus on your priorities.');
        feed.parentNode.insertBefore(banner, feed);
      }
    }
  }

  function restoreTikTokFeed() {
    const banner = document.getElementById('kill-addiction-tiktok-banner');
    if (banner) banner.remove();
    const feed =
      document.querySelector('[data-e2e="recommend-feed-container"]') ||
      document.querySelector('div[class*="DivFeedContainer"]');
    if (feed) feed.style.removeProperty('display');
  }

  // --------------------------------------------------------------------------
  // 6. Instagram Cleaner
  // --------------------------------------------------------------------------
  function cleanInstagramFeed() {
    const bannerId = 'kill-addiction-instagram-banner';
    const mainSection = document.querySelector('main[role="main"] section') || document.querySelector('main[role="main"]');

    if (mainSection) {
      mainSection.querySelectorAll('article, [aria-label="Stories"], [aria-label="Tin"]').forEach((el) => {
        if (el.id !== bannerId) {
          el.style.setProperty('display', 'none', 'important');
        }
      });

      let timeline = mainSection.querySelector('div > div') || mainSection;
      if (timeline && timeline.children) {
        Array.from(timeline.children).forEach((child) => {
          if (child.id !== bannerId) {
            child.style.setProperty('display', 'none', 'important');
          }
        });
      }

      if (!document.getElementById(bannerId)) {
        const banner = createBannerHTML('instagram', 'Instagram Feed Cleared!', 'Timeline feed and stories hidden. Direct Messages remain active.');
        if (timeline && timeline.prepend) {
          timeline.prepend(banner);
        } else if (mainSection.parentNode) {
          mainSection.parentNode.insertBefore(banner, mainSection);
        }
      }
    }
  }

  function restoreInstagramFeed() {
    const banner = document.getElementById('kill-addiction-instagram-banner');
    if (banner) banner.remove();
    document.querySelectorAll('main[role="main"] article').forEach((el) => {
      el.style.removeProperty('display');
    });
  }

  // Helper to build Focus Banner HTML
  function createBannerHTML(platform, title, subtitle) {
    const banner = document.createElement('div');
    banner.id = `kill-addiction-${platform}-banner`;
    banner.style.cssText = `
      padding: 40px 24px;
      margin: 30px auto;
      width: 100%;
      max-width: 520px;
      background: #0f172a;
      color: #38bdf8;
      border-radius: 16px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45);
      border: 1px solid rgba(56,189,248,0.3);
      box-sizing: border-box;
      display: block !important;
    `;
    banner.innerHTML = `
      <div style="font-size: 40px; margin-bottom: 12px;">🛡️</div>
      <h3 style="margin: 0 0 10px 0; color: #f43f5e; font-size: 22px; font-weight: 700;">${title}</h3>
      <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">${subtitle}</p>
    `;
    return banner;
  }

  // Initial Run
  applySettings();

  // Storage Listener
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      applySettings();
    }
  });

  // Dynamic MutationObserver to continuously check feed status
  const observer = new MutationObserver(() => {
    applySettings();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // --------------------------------------------------------------------------
  // 7. DOM Inspector Zapper Mode
  // --------------------------------------------------------------------------
  let isInspectMode = false;
  let hoveredElement = null;

  function handleMouseOver(e) {
    if (!isInspectMode) return;
    e.stopPropagation();

    if (e.target.tagName === 'INPUT' && (e.target.type === 'password' || e.target.type === 'email')) return;

    if (hoveredElement) {
      hoveredElement.classList.remove('kill-addiction-highlight');
    }
    hoveredElement = e.target;
    hoveredElement.classList.add('kill-addiction-highlight');
  }

  function handleMouseOut(e) {
    if (!isInspectMode) return;
    if (hoveredElement) {
      hoveredElement.classList.remove('kill-addiction-highlight');
      hoveredElement = null;
    }
  }

  function handleClick(e) {
    if (!isInspectMode) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (hoveredElement) {
      hoveredElement.classList.remove('kill-addiction-highlight');

      const selector = generateSelector(hoveredElement);
      hoveredElement.classList.add('kill-addiction-zapped');

      chrome.storage.local.get({ zappedSelectors: [] }, (res) => {
        const list = res.zappedSelectors;
        if (!list.includes(selector)) {
          list.push(selector);
          chrome.storage.local.set({ zappedSelectors: list });
        }
      });

      disableInspectMode();
      alert(`Element Zapped Permanently!\nSelector: ${selector}`);
    }
  }

  function generateSelector(el) {
    if (el.id && !/\d{5,}/.test(el.id)) return `#${el.id}`;
    if (el.getAttribute('data-pressable-container')) return '[data-pressable-container="true"]';
    if (el.getAttribute('aria-label')) return `${el.tagName.toLowerCase()}[aria-label="${el.getAttribute('aria-label')}"]`;
    if (el.getAttribute('data-pagelet')) return `[data-pagelet="${el.getAttribute('data-pagelet')}"]`;
    if (el.getAttribute('data-e2e')) return `[data-e2e="${el.getAttribute('data-e2e')}"]`;
    if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
    if (el.getAttribute('role')) return `${el.tagName.toLowerCase()}[role="${el.getAttribute('role')}"]`;

    if (el.className && typeof el.className === 'string') {
      const validClasses = el.className
        .split(' ')
        .filter((c) => c && !c.startsWith('css-') && !c.startsWith('r-') && !c.startsWith('kill-'));
      if (validClasses.length > 0) {
        return `${el.tagName.toLowerCase()}.${validClasses[0]}`;
      }
    }

    const parent = el.parentElement;
    if (parent) {
      const index = Array.from(parent.children).indexOf(el) + 1;
      return `${parent.tagName.toLowerCase()} > ${el.tagName.toLowerCase()}:nth-child(${index})`;
    }

    return el.tagName.toLowerCase();
  }

  function enableInspectMode() {
    isInspectMode = true;
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    document.body.style.cursor = 'crosshair';
  }

  function disableInspectMode() {
    isInspectMode = false;
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    document.body.style.cursor = '';
    if (hoveredElement) {
      hoveredElement.classList.remove('kill-addiction-highlight');
      hoveredElement = null;
    }
  }

  // Runtime Messages Listener
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'TOGGLE_INSPECT') {
      if (isInspectMode) {
        disableInspectMode();
        sendResponse({ status: 'INSPECT_DISABLED' });
      } else {
        enableInspectMode();
        sendResponse({ status: 'INSPECT_ENABLED' });
      }
    } else if (req.action === 'RESET_ZAPPED') {
      document.querySelectorAll('.kill-addiction-zapped').forEach((el) => {
        el.classList.remove('kill-addiction-zapped');
      });
      applySettings();
    }
  });
})();
