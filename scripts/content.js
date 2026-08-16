/* ==========================================================================
   KILL ADDICTION - Dynamic Content Script & Multi-Platform Eradicator
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
    customBlockedDomains: [],
    zappedSelectors: []
  };

  // 30 Gen Z Sarcastic / Motivational Quotes for Custom Blocked Sites
  const GENZ_SARCASTIC_QUOTES = [
    // 1 - 10
    "Bớt lướt web vô bổ lại đi bạn ơi. Tương lai sáng lạn không nằm ở cái sự lười biếng này đâu!",
    "Ủa rồi định lướt tới mấy giờ? KPI chưa xong mà tâm trí cứ đòi sang chảnh giải trí 'xíu' à?",
    "Vào đây làm gì nữa? Tính trốn việc à? Thôi quay lại làm việc đi cho đời bớt nợ!",
    "Tầm này người ta đang cày tiền cày tri thức, còn bạn thì đang cố vào cái trang này. Thấy sai sai chưa?",
    "Nghèo thì phải bôn ba, lười biếng thì chỉ có ăn cám thôi! Đóng tab ngay còn kịp!",
    "Ủa alo? Não bảo làm việc mà tay lại linh tinh gì đấy? Tỉnh táo lại giùm cái!",
    "Định vô đây kiếm tý dopamine bẩn đúng không? Mơ đi, mở công việc lên mà cày!",
    "Sống có trách nhiệm với bản thân chút đi bạn ơi. Trang này đâu có trả lương cho bạn đâu?",
    "Chán bạn thật sự luôn á! Mới tập trung được 5 phút đã mò vào đây rồi. Yếu đuối vậy?",
    "Muốn giàu sang thành công hay muốn thất nghiệp ăn bám? Chọn đi rồi tắt tab này ngay!",
    // 11 - 20
    "Mở tab này lên tính giải trí hay tính giải tán luôn sự nghiệp?",
    "Nhìn lại cái To-Do List đi bạn ơi, nó đang khóc thét kìa chứ ngồi đó mà lướt!",
    "Tuổi trẻ này ngắn lắm, đừng lãng phí nó vào mấy cái click chuột vô nghĩa này nữa!",
    "Ủa rồi ai làm công việc giùm bạn? Cả thế giới đang tiến lên mà bạn lại đứng đây lướt web?",
    "Nuôi hoài hoài chưa thấy lớn, mới gặp tý áp lực đã mò vào trang web này tìm cảm giác an toàn à?",
    "Trang này không giúp bạn trả tiền nhà, tiền điện hay tiền cà phê đâu. Tắt đi cày tiếp!",
    "Đừng biến sự lười biếng thành thói quen. Đóng tab lại và làm điều có ích hơn đi!",
    "Muốn có kết quả hơn người thì phải chịu được cảm giác làm việc khi người khác đang chơi!",
    "Thôi đừng tự lừa dối bản thân nữa. Bạn thừa biết vào đây chỉ tốn thời gian thôi mà?",
    "Bật chế độ nghiêm túc lên đi! Trẻ không bôn ba, già hối hận không kịp đâu!",
    // 21 - 30
    "Ủa tưởng hôm nay quyết tâm cày code/học tập dữ lắm mà? Sao lại xuất hiện ở đây?",
    "Mặt hồ gợn sóng vì gió, còn sự nghiệp bạn gợn sóng vì mấy cái tab vô bổ này đó!",
    "Tắt tab này ngay trước khi sự lười biếng nuốt chửng nấc thang sự nghiệp của bạn!",
    "Bạn có 24h mỗi ngày giống như mọi tỷ phú. Khác biệt là họ không lướt trang web này!",
    "Hành động nhỏ tạo nên số phận lớn. Việc đóng tab này chính là bước đầu tiên đó!",
    "Đừng để sự nuông chiều bản thân hôm nay trở thành nước mắt của ngày mai!",
    "Tính lướt 'nốt 5 phút' nữa đúng không? 5 phút của bạn kéo dài từ sáng tới chiều rồi đó!",
    "Thời gian là tài sản duy nhất mất đi không lấy lại được. Đừng ném nó qua cửa sổ!",
    "Vắng bạn trang này vẫn hoạt động bình thường, nhưng thiếu sự tập trung thì tương lai bạn bị ảnh hưởng đó!",
    "Đủ rồi đấy! Quay lại làm việc ngay và luôn, chiến binh không được gục ngã trước cám dỗ!"
  ];

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

  // Helper: Extract clean Root Domain (e.g., m.facebook.com -> facebook.com)
  function extractRootDomain(host) {
    if (!host) return '';
    let cleanHost = host.toLowerCase().trim().replace(/^www\./, '').replace(/\.$/, '').split(':')[0];
    const parts = cleanHost.split('.');
    if (parts.length <= 2) return cleanHost;

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
  }

  // Helper: Is current domain or subdomain in custom blocked list?
  function checkCustomDomainBlock(host, blockedList) {
    if (!Array.isArray(blockedList) || !host) return null;
    const cleanHost = host.toLowerCase().trim().replace(/^www\./, '').replace(/\.$/, '').split(':')[0];
    const rootDom = extractRootDomain(host);

    for (const domain of blockedList) {
      if (!domain) continue;
      let cleanDomain = domain.toLowerCase().trim()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\.$/, '')
        .split('/')[0]
        .split(':')[0];

      if (!cleanDomain) continue;

      if (cleanDomain.startsWith('*.')) {
        cleanDomain = cleanDomain.substring(2);
      }

      if (
        cleanHost === cleanDomain ||
        cleanHost.endsWith('.' + cleanDomain) ||
        rootDom === cleanDomain ||
        (rootDom && rootDom === extractRootDomain(cleanDomain))
      ) {
        return cleanDomain;
      }
    }
    return null;
  }

  // Render Full Site Blocker Overlay with Random Gen Z Sarcastic Quote
  function renderFullSiteBlockerOverlay(matchedDomain) {
    const overlayId = 'kill-addiction-full-site-blocker-overlay';
    if (!document.getElementById(overlayId)) {
      const randomQuote = GENZ_SARCASTIC_QUOTES[Math.floor(Math.random() * GENZ_SARCASTIC_QUOTES.length)];

      const overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.className = 'kill-addiction-full-site-blocker';
      overlay.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 20px;">🛑</div>
        <h1 style="margin: 0 0 14px 0; color: #f43f5e; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">TRANG WEB ĐÃ BỊ CHẶN HOÀN TOÀN</h1>
        
        <div style="max-width: 600px; background: rgba(244, 63, 94, 0.12); border: 2px dashed #f43f5e; padding: 20px 24px; border-radius: 14px; margin: 16px auto 24px auto;">
          <p style="margin: 0; color: #f8fafc; font-size: 18px; font-weight: 700; line-height: 1.5;">"${randomQuote}"</p>
        </div>

        <p style="margin: 0; color: #94a3b8; font-size: 14px;">
          <strong>${matchedDomain}</strong> đã bị khóa. Hãy đóng tab và quay lại làm việc!
        </p>
      `;
      (document.body || document.documentElement).appendChild(overlay);
    }
  }

  // --------------------------------------------------------------------------
  // FLOATING COUNTDOWN CIRCLE CLOCK (15s FINAL TIMER)
  // --------------------------------------------------------------------------
  function getCurrentPlatform() {
    if (hostname.includes('facebook.com')) return 'facebook';
    if (hostname.includes('youtube.com')) return 'youtube';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('threads')) return 'threads';
    return null;
  }

  function updateCountdownWidget(remainingSec) {
    const widgetId = 'kill-addiction-countdown-widget';
    let widget = document.getElementById(widgetId);

    if (remainingSec <= 0) {
      if (widget) widget.remove();
      window.location.reload();
      return;
    }

    if (!widget) {
      widget = document.createElement('div');
      widget.id = widgetId;
      widget.className = 'kill-addiction-countdown-container';
      widget.innerHTML = `
        <svg class="countdown-svg" width="56" height="56" viewBox="0 0 56 56">
          <circle class="countdown-bg-circle" cx="28" cy="28" r="22" />
          <circle id="kill-addiction-countdown-progress" class="countdown-progress-circle" cx="28" cy="28" r="22" />
        </svg>
        <div id="kill-addiction-countdown-text" class="countdown-text">15s</div>
      `;
      (document.body || document.documentElement).appendChild(widget);
    }

    const progressElem = document.getElementById('kill-addiction-countdown-progress');
    const textElem = document.getElementById('kill-addiction-countdown-text');

    if (progressElem && textElem) {
      const circumference = 138.23; // 2 * Math.PI * 22
      const ratio = Math.max(0, Math.min(1, remainingSec / 15));
      const strokeDashoffset = circumference * (1 - ratio);

      progressElem.style.strokeDashoffset = strokeDashoffset;

      // Color transition: Green (>10s) -> Yellow (6s-10s) -> Red (1s-5s)
      let strokeColor = '#22c55e';
      if (remainingSec <= 10 && remainingSec > 5) {
        strokeColor = '#eab308';
      } else if (remainingSec <= 5) {
        strokeColor = '#ef4444';
      }

      progressElem.style.stroke = strokeColor;
      textElem.textContent = `${remainingSec}s`;
    }
  }

  // Monitor Temporary Unblock Expiry Timer
  setInterval(() => {
    const platform = getCurrentPlatform();
    if (!platform) return;

    chrome.storage.local.get(['tempUnblocks'], (res) => {
      const tempUnblocks = res.tempUnblocks || {};
      const item = tempUnblocks[platform];

      if (item && item.expireTime) {
        const remainingSec = Math.ceil((item.expireTime - Date.now()) / 1000);
        if (remainingSec <= 15) {
          updateCountdownWidget(remainingSec);
        }
      } else {
        const widget = document.getElementById('kill-addiction-countdown-widget');
        if (widget) widget.remove();
      }
    });
  }, 1000);

  // --------------------------------------------------------------------------
  // 1. Settings & Platform State Manager
  // --------------------------------------------------------------------------
  function applySettings() {
    chrome.storage.local.get(
      ['facebook', 'youtube', 'tiktok', 'instagram', 'threads', 'customBlockedDomains', 'zappedSelectors'],
      (res) => {
        settings.facebook = res.facebook !== false;
        settings.youtube = res.youtube !== false;
        settings.tiktok = res.tiktok !== false;
        settings.instagram = res.instagram !== false;
        settings.threads = res.threads !== false;
        settings.customBlockedDomains = res.customBlockedDomains || [];
        settings.zappedSelectors = res.zappedSelectors || [];

        const html = document.documentElement;

        // Custom Domain FULL SITE BLOCKING Check (Chặn HẲN hoàn toàn)
        const matchedCustomDomain = checkCustomDomainBlock(hostname, settings.customBlockedDomains);
        if (matchedCustomDomain) {
          html.setAttribute('data-kill-custom-blocked', 'true');
          renderFullSiteBlockerOverlay(matchedCustomDomain);
          return;
        }

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

        // Threads
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
      }
    );
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
  // 7. DOM Inspector Zapper Mode with Real-time Tooltip & ESC Key Cancel
  // --------------------------------------------------------------------------
  let isInspectMode = false;
  let hoveredElement = null;
  let zapperToolbar = null;
  let selectorTooltip = null;

  function createZapperUI() {
    if (!zapperToolbar) {
      zapperToolbar = document.createElement('div');
      zapperToolbar.className = 'kill-addiction-zapper-toolbar';
      zapperToolbar.innerHTML = `
        <span>🎯 CHẾ ĐỘ CHỌN THÀNH PHẦN (ZAPPER MODE)</span>
        <span style="font-size:11px; opacity:0.8; font-weight:normal;">[Di chuột & click để xóa vĩnh viễn | Ấn ESC để hủy]</span>
        <button id="kill-addiction-cancel-zapper">Thoát [ESC]</button>
      `;
      (document.body || document.documentElement).appendChild(zapperToolbar);

      const cancelBtn = zapperToolbar.querySelector('#kill-addiction-cancel-zapper');
      if (cancelBtn) {
        cancelBtn.onclick = (e) => {
          e.stopPropagation();
          disableInspectMode();
        };
      }
    }

    if (!selectorTooltip) {
      selectorTooltip = document.createElement('div');
      selectorTooltip.className = 'kill-addiction-selector-tooltip';
      selectorTooltip.style.display = 'none';
      (document.body || document.documentElement).appendChild(selectorTooltip);
    }
  }

  function removeZapperUI() {
    if (zapperToolbar) {
      zapperToolbar.remove();
      zapperToolbar = null;
    }
    if (selectorTooltip) {
      selectorTooltip.remove();
      selectorTooltip = null;
    }
  }

  function handleMouseMove(e) {
    if (!isInspectMode || !selectorTooltip) return;
    selectorTooltip.style.left = `${e.clientX + 14}px`;
    selectorTooltip.style.top = `${e.clientY + 14}px`;
  }

  function handleMouseOver(e) {
    if (!isInspectMode) return;
    e.stopPropagation();

    if (e.target.closest('.kill-addiction-zapper-toolbar')) return;
    if (e.target.tagName === 'INPUT' && (e.target.type === 'password' || e.target.type === 'email')) return;

    if (hoveredElement) {
      hoveredElement.classList.remove('kill-addiction-highlight');
    }
    hoveredElement = e.target;
    hoveredElement.classList.add('kill-addiction-highlight');

    if (selectorTooltip) {
      const sel = generateSelector(hoveredElement);
      selectorTooltip.textContent = sel ? `Target: ${sel}` : 'Element';
      selectorTooltip.style.display = 'block';
    }
  }

  function handleMouseOut(e) {
    if (!isInspectMode) return;
    if (hoveredElement) {
      hoveredElement.classList.remove('kill-addiction-highlight');
      hoveredElement = null;
    }
    if (selectorTooltip) {
      selectorTooltip.style.display = 'none';
    }
  }

  function handleKeyDown(e) {
    if (isInspectMode && e.key === 'Escape') {
      e.preventDefault();
      disableInspectMode();
    }
  }

  function handleClick(e) {
    if (!isInspectMode) return;
    if (e.target.closest('.kill-addiction-zapper-toolbar')) return;

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
      alert(`🎉 Đã Ẩn Vĩnh Viễn Thành Phần Web!\n\nCSS Selector: ${selector}`);
    }
  }

  function generateSelector(el) {
    if (!el || el.nodeType !== 1) return '';

    // 1. Clean ID Check (Ignoring dynamic numeric/hash IDs)
    if (el.id && !/\d{4,}/.test(el.id) && !/^[a-z0-9]{10,}$/i.test(el.id)) {
      return `#${el.id}`;
    }

    // 2. Data Attributes Priority (React, Vue, Angular, Next.js)
    const priorityAttrs = [
      'data-pressable-container',
      'data-pagelet',
      'data-e2e',
      'data-testid',
      'data-test-id',
      'data-component',
      'data-qa',
      'data-id',
      'aria-label',
      'role',
      'name',
      'placeholder'
    ];

    for (const attr of priorityAttrs) {
      const val = el.getAttribute(attr);
      if (val) {
        if (attr === 'data-pressable-container') return '[data-pressable-container="true"]';
        return `${el.tagName.toLowerCase()}[${attr}="${val}"]`;
      }
    }

    // 3. Link Href Targeting (Shorts, Reels, Explore, Watch)
    if (el.tagName === 'A' && el.getAttribute('href')) {
      const href = el.getAttribute('href');
      if (href.includes('/shorts/') || href.includes('/reels/') || href.includes('/watch') || href.includes('/explore/')) {
        const cleanHref = href.split('?')[0];
        return `a[href*="${cleanHref}"]`;
      }
    }

    // 4. Stable Class Names (filtering out dynamic hashed classes)
    if (el.className && typeof el.className === 'string') {
      const validClasses = el.className
        .split(/\s+/)
        .filter((c) => {
          if (!c) return false;
          if (c.startsWith('css-') || c.startsWith('r-') || c.startsWith('kill-') || c.startsWith('sc-')) return false;
          if (/^[a-zA-Z0-9]{10,}$/.test(c)) return false;
          if (/^x[0-9a-zA-Z]{5,}/.test(c)) return false;
          if (/_[a-zA-Z0-9]{5,}$/.test(c)) return false;
          return true;
        });

      if (validClasses.length > 0) {
        return `${el.tagName.toLowerCase()}.${validClasses[0]}`;
      }
    }

    // 5. Parent Combinator Fallback
    const parent = el.parentElement;
    if (parent) {
      const index = Array.from(parent.children).indexOf(el) + 1;
      return `${parent.tagName.toLowerCase()} > ${el.tagName.toLowerCase()}:nth-child(${index})`;
    }

    return el.tagName.toLowerCase();
  }

  function enableInspectMode() {
    isInspectMode = true;
    createZapperUI();
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.body.style.cursor = 'crosshair';
  }

  function disableInspectMode() {
    isInspectMode = false;
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    document.body.style.cursor = '';

    if (hoveredElement) {
      hoveredElement.classList.remove('kill-addiction-highlight');
      hoveredElement = null;
    }
    removeZapperUI();
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
    } else if (req.action === 'TEMP_UNBLOCK_EXPIRED') {
      window.location.reload();
    }
  });
})();
