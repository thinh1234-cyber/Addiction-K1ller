/* ==========================================================================
   KILL ADDICTION - Settings Dashboard Controller & Advanced Analytics
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('theme-select');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const prevWeekBtn = document.getElementById('prev-week-btn');
  const nextWeekBtn = document.getElementById('next-week-btn');
  const currentWeekLabel = document.getElementById('current-week-label');

  const customDomainInput = document.getElementById('custom-domain-input');
  const addCustomDomainBtn = document.getElementById('add-custom-domain-btn');
  const customDomainListContainer = document.getElementById('custom-domain-list');

  const donutDetailCard = document.getElementById('donut-detail-card');
  const donutDetailTitle = document.getElementById('donut-detail-title');
  const donutDetailTime = document.getElementById('donut-detail-time');
  const donutDetailPercent = document.getElementById('donut-detail-percent');
  const donutDetailClose = document.getElementById('donut-detail-close');

  let currentRange = 'today'; // 'today' or 'week'
  let weekOffset = 0; // 0 = current week, -1 = last week, etc.
  let selectedDayIndex = null; // null (whole week/range) or 0..6 (specific day T2..CN)

  const PLATFORM_NAMES = {
    facebook: 'Facebook',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    threads: 'Threads'
  };

  // Palette of high-contrast pastel & editor colors for synchronized domain colors
  const DOMAIN_COLOR_PALETTE = [
    '#38bdf8', '#ff79c6', '#a6e22e', '#f92672', '#bd93f9',
    '#fbbf24', '#34d399', '#f472b6', '#61afef', '#88c0d0',
    '#fb7185', '#c084fc', '#818cf8', '#00f6ff', '#2aa198'
  ];

  function getDomainColor(domain) {
    if (!domain) return '#38bdf8';
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % DOMAIN_COLOR_PALETTE.length;
    return DOMAIN_COLOR_PALETTE[index];
  }

  // --------------------------------------------------------------------------
  // 1. Theme Manager
  // --------------------------------------------------------------------------
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
      renderAnalytics();
      renderPerformanceTab();
    });
  }

  // Close Donut Detail Card
  if (donutDetailClose) {
    donutDetailClose.onclick = () => {
      if (donutDetailCard) donutDetailCard.style.display = 'none';
    };
  }

  // --------------------------------------------------------------------------
  // 2. Tab Navigation Manager
  // --------------------------------------------------------------------------
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = `tab-${btn.dataset.tab}`;
      const targetTab = document.getElementById(tabId);
      if (targetTab) targetTab.classList.add('active');

      if (btn.dataset.tab === 'analytics') {
        renderAnalytics();
      } else if (btn.dataset.tab === 'performance') {
        renderPerformanceTab();
      } else if (btn.dataset.tab === 'config') {
        loadConfigStates();
        loadCustomBlockedDomains();
        loadZappedSelectors();
      }
    });
  });

  // Language Selector Handler & i18n Dictionary
  const langSelect = document.getElementById('lang-select');
  const i18n = {
    vi: {
      title: 'Addiction K1ller',
      subtitle: 'Cài đặt & Biểu đồ thống kê thời gian Chrome',
      tabAnalytics: '📊 Thống Kê Thời Gian',
      tabPerformance: '⚡ Hiệu Suất',
      tabConfig: '⚙️ Cấu Hình',
      weeklyTitle: '📅 Tổng Thời Gian Sử Dụng Web Cả Tuần',
      top5Title: '📈 Top 5 Webs Truy Cập Nhiều Nhất',
      donutTitle: '🍩 Tỷ Lệ Sử Dụng Tất Cả Webs',
      domainCountLabel: 'Số trang Web đã duyệt',
      topDomainLabel: 'Trang dùng nhiều nhất',
      tableTitle: '📋 Danh Sách Chi Tiết Thời Gian Theo Root Domain',
      thDomain: 'Tên Trang Web (Root Domain)',
      thTime: 'Thời Gian Sử Dụng',
      thPercent: 'Tỷ Lệ Percent',
      perfTitle: '📊 Chỉ Số Phân Tích Hiệu Suất Tập Trung',
      focusScoreLabel: 'Điểm Tập Trung',
      distractionIndexLabel: 'Tỷ Lệ Xao Nhãng',
      heatmapTitle: '🔥 Biểu Đồ Nhiệt Mật Độ Sử Dụng Web 24 Giờ Trong Ngày',
      heatmapDesc: 'Rê chuột vào các cột giờ (0h đến 23h) để kiểm tra thời điểm bạn hoạt động nhiều nhất.',
      contribTitle: '📅 Biểu Đồ Nhiệt Xao Nhãng Theo Ngày',
      contribDesc: 'Màu sắc pastel đồng bộ theo giao diện, biểu thị cấp độ giải trí từ dịu mát đến ấm đậm.',
      cfgPlatformsTitle: '⚙️ Tùy Chỉnh Bật/Tắt Bảng Tin Nền Tảng Mặc Định',
      cfgPlatformsDesc: 'Chỉ ẩn Newsfeed & bài viết gây xao nhãng. Giữ 100% tính năng Chat/Messenger & Tìm kiếm',
      customBlockTitle: '🚫 Chặn Trang Web & Subdomain Tùy Chỉnh',
      customBlockDesc: 'Nhập tên miền trang web muốn Chặn Hẳn Hoàn Toàn (vd: reddit.com). Tất cả Subdomain của trang cũng sẽ bị dừng truy cập!',
      quotaTitle: '⏱️ Giới Hạn Thời Gian Sử Dụng Trong Ngày',
      quotaDesc: 'Đặt ngân sách thời gian tối đa lướt từng domain mỗi ngày. Khi hết giờ tự động Chặn Hẳn 100%!',
      strictTitle: '🔒 Chế Độ Tập Trung Cao Độ',
      strictDesc: 'Khóa 100% các nút Bật/Tắt Tạm Thời & Danh sách Chặn Tùy Chỉnh trong thời gian thiết lập chống tự phá rào.',
      scheduleTitle: '📅 Khung Giờ Làm Việc Tự Động',
      scheduleDesc: 'Tự động kích hoạt tính năng chặn feed trong giờ hành chính.',
      zappedTitle: '🎯 Bộ Chọn CSS Đã Ẩn Thủ Công',
      zappedDesc: 'Các phần tử trang web bạn đã click ẩn trực tiếp bằng công cụ Zapper',
      btnToday: 'Hôm nay',
      btnWeek: 'Cả tuần',
      perfToday: 'Hôm nay',
      perfWeek: 'Tuần này',
      perfMonth: 'Tháng này',
      legendLow: 'Ít giải trí',
      legendHigh: 'Nhiều',
      opt25: '25 Phút (Kỹ thuật Pomodoro)',
      opt45: '45 Phút (Phiên Deep Work)',
      opt60: '60 Phút (Hardcore Focus)',
      startStrictBtn: '🚀 Kích Hoạt Strict Focus',
      addCustomDomainBtn: 'Thêm Domain Chặn Hẳn',
      customDomainPlaceholder: 'Ví dụ: reddit.com, twitter.com...',
      clockSub: 'Ngân sách hôm nay',
      quotaDomainPlaceholder: 'Domain (vd: reddit.com)',
      quotaMinsPlaceholder: 'Phút',
      addQuotaBtn: '🔒 Lưu & Khóa 3 Ngày',
      timeFrom: 'Từ:',
      timeTo: 'Đến:',
      clearZappedBtn: 'Xóa Tất Cả Zapped',
      fbDesc: 'Ẩn Newsfeed & Stories trang chủ, giữ Messenger chat',
      ytDesc: 'Ẩn video đề xuất trang chủ & Shorts, giữ Tìm kiếm',
      ttDesc: 'Ẩn luồng video tự động cuộn (FYP)',
      igDesc: 'Ẩn Timeline trang chủ, giữ Direct Messages (/direct/)',
      thDesc: 'Ẩn toàn bộ bài viết Timeline trang chủ',
      prevWeek: '◄ Tuần trước',
      nextWeek: 'Tuần sau ►',
      monthBtn: 'Tháng',
      weekBtn: 'Tuần',
      totalChromeTitle: 'Tổng thời gian Chrome',
      donutDetailTitle: 'Chi Tiết Domain'
    },
    en: {
      title: 'Addiction K1ller',
      subtitle: 'Chrome Settings & Web Usage Time Analytics',
      tabAnalytics: '📊 Time Analytics',
      tabPerformance: '⚡ Performance',
      tabConfig: '⚙️ Configuration',
      weeklyTitle: '📅 Weekly Total Usage Time',
      top5Title: '📈 Top 5 Most Visited Websites',
      donutTitle: '🍩 Total Usage Ratio Across Websites',
      domainCountLabel: 'Browsed Websites',
      topDomainLabel: 'Most Used Website',
      tableTitle: '📋 Detailed Root Domain Usage List',
      thDomain: 'Website Name (Root Domain)',
      thTime: 'Usage Duration',
      thPercent: 'Percentage Ratio',
      perfTitle: '📊 Focus Performance Analytics',
      focusScoreLabel: 'Productivity Focus Score',
      distractionIndexLabel: 'Distraction Index',
      heatmapTitle: '🔥 24-Hour Hourly Usage Density Heatmap',
      heatmapDesc: 'Hover over hour columns (00h to 23h) to inspect peak browsing hours.',
      contribTitle: '📅 Daily Distraction Activity Heatmap',
      contribDesc: 'Pastel colors synchronized with UI theme, representing distraction intensity levels.',
      cfgPlatformsTitle: '⚙️ Platform Default Feed Switches',
      cfgPlatformsDesc: 'Hide newsfeeds & distracting posts only. 100% Chat & Search retained.',
      customBlockTitle: '🚫 Custom Domain & Subdomain Hard Blocker',
      customBlockDesc: 'Enter domain to block completely (e.g. reddit.com). All subdomains will be blocked as well!',
      quotaTitle: '⏱️ Daily Time Quota',
      quotaDesc: 'Set maximum daily time budget per domain. Automatically 100% blocked after limit!',
      strictTitle: '🔒 Strict Focus Mode',
      strictDesc: 'Lock 100% of temporary toggle switches and custom list for set duration to prevent self-sabotage.',
      scheduleTitle: '📅 Work Hours Automatic Schedule',
      scheduleDesc: 'Automatically enable feed blocking during office working hours.',
      zappedTitle: '🎯 Manually Hidden CSS Selectors',
      zappedDesc: 'Elements manually hidden using the DOM Zapper inspector tool',
      btnToday: 'Today',
      btnWeek: 'This Week',
      perfToday: 'Today',
      perfWeek: 'This Week',
      perfMonth: 'This Month',
      legendLow: 'Low Distraction',
      legendHigh: 'High',
      opt25: '25 Minutes (Pomodoro Technique)',
      opt45: '45 Minutes (Deep Work Session)',
      opt60: '60 Minutes (Hardcore Focus)',
      startStrictBtn: '🚀 Activate Strict Focus',
      addCustomDomainBtn: 'Add Block Domain',
      customDomainPlaceholder: 'Example: reddit.com, twitter.com...',
      clockSub: "Today's Budget",
      quotaDomainPlaceholder: 'Domain (e.g. reddit.com)',
      quotaMinsPlaceholder: 'Mins',
      addQuotaBtn: '🔒 Save & Lock 3 Days',
      timeFrom: 'From:',
      timeTo: 'To:',
      clearZappedBtn: 'Clear All Zapped',
      fbDesc: 'Hide Feed & Stories, keep Messenger chat',
      ytDesc: 'Hide Home recommendations & Shorts, keep Search',
      ttDesc: 'Hide auto-scrolling For You Page videos',
      igDesc: 'Hide Feed Timeline, keep Direct Messages',
      thDesc: 'Hide Home Timeline posts',
      prevWeek: '◄ Prev Week',
      nextWeek: 'Next Week ►',
      monthBtn: 'Month',
      weekBtn: 'Week',
      totalChromeTitle: 'Total Chrome Usage Time',
      donutDetailTitle: 'Domain Details'
    }
  };

  function applyLanguage(lang) {
    window.currentLang = lang;
    const dict = i18n[lang] || i18n.vi;

    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    const setAttr = (id, attr, val) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, val);
    };

    setTxt('i18n-title', dict.title);
    setTxt('i18n-subtitle', dict.subtitle);
    setTxt('tab-label-analytics', dict.tabAnalytics);
    setTxt('tab-label-performance', dict.tabPerformance);
    setTxt('tab-label-config', dict.tabConfig);
    setTxt('i18n-weekly-title', dict.weeklyTitle);
    setTxt('i18n-top5-title', dict.top5Title);
    setTxt('i18n-donut-title', dict.donutTitle);
    setTxt('i18n-domain-count-label', dict.domainCountLabel);
    setTxt('i18n-top-domain-label', dict.topDomainLabel);
    setTxt('i18n-table-title', dict.tableTitle);
    setTxt('i18n-th-domain', dict.thDomain);
    setTxt('i18n-th-time', dict.thTime);
    setTxt('i18n-th-percent', dict.thPercent);
    setTxt('i18n-perf-title', dict.perfTitle);
    setTxt('i18n-focus-score-label', dict.focusScoreLabel);
    setTxt('i18n-distraction-index-label', dict.distractionIndexLabel);
    setTxt('i18n-heatmap-title', dict.heatmapTitle);
    setTxt('i18n-heatmap-desc', dict.heatmapDesc);
    setTxt('i18n-contrib-title', dict.contribTitle);
    setTxt('i18n-contrib-desc', dict.contribDesc);
    setTxt('i18n-cfg-platforms-title', dict.cfgPlatformsTitle);
    setTxt('i18n-cfg-platforms-desc', dict.cfgPlatformsDesc);
    setTxt('i18n-custom-block-title', dict.customBlockTitle);
    setTxt('i18n-custom-block-desc', dict.customBlockDesc);
    setTxt('i18n-quota-title', dict.quotaTitle);
    setTxt('i18n-quota-desc', dict.quotaDesc);
    setTxt('i18n-strict-title', dict.strictTitle);
    setTxt('i18n-strict-desc', dict.strictDesc);
    setTxt('i18n-schedule-title', dict.scheduleTitle);
    setTxt('i18n-schedule-desc', dict.scheduleDesc);
    setTxt('i18n-zapped-title', dict.zappedTitle);
    setTxt('i18n-zapped-desc', dict.zappedDesc);

    // Nav Controls & Headings
    setTxt('prev-week-btn', dict.prevWeek);
    setTxt('next-week-btn', dict.nextWeek);
    setTxt('contrib-mode-month', dict.monthBtn);
    setTxt('contrib-mode-week', dict.weekBtn);
    setTxt('metric-today-title', dict.totalChromeTitle);
    setTxt('donut-detail-title', dict.donutDetailTitle);

    // Weekday Header
    const weekdayContainer = document.getElementById('calendar-weekday-header');
    if (weekdayContainer) {
      const days = lang === 'en' 
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      weekdayContainer.innerHTML = days.map(d => `<div>${d}</div>`).join('');
    }

    // Filter Buttons
    setTxt('i18n-btn-today', dict.btnToday);
    setTxt('i18n-btn-week', dict.btnWeek);
    setTxt('i18n-perf-today', dict.perfToday);
    setTxt('i18n-perf-week', dict.perfWeek);
    setTxt('i18n-perf-month', dict.perfMonth);

    // Heatmap Legend Labels
    setTxt('i18n-legend-low', dict.legendLow);
    setTxt('i18n-legend-high', dict.legendHigh);

    // Strict Focus Options & Button
    setTxt('i18n-opt-25', dict.opt25);
    setTxt('i18n-opt-45', dict.opt45);
    setTxt('i18n-opt-60', dict.opt60);
    setTxt('start-strict-focus-btn', dict.startStrictBtn);

    // Custom Block Form
    setTxt('add-custom-domain-btn', dict.addCustomDomainBtn);
    setAttr('custom-domain-input', 'placeholder', dict.customDomainPlaceholder);

    // Quota Clock Widget
    setTxt('i18n-clock-sub', dict.clockSub);
    setAttr('quota-domain-input', 'placeholder', dict.quotaDomainPlaceholder);
    setAttr('quota-mins-input', 'placeholder', dict.quotaMinsPlaceholder);

    chrome.storage.local.get(['quotaLockUntil'], (qRes) => {
      if (!qRes.quotaLockUntil || Date.now() >= qRes.quotaLockUntil) {
        setTxt('add-quota-btn', dict.addQuotaBtn);
      }
    });

    // Work Schedule Labels
    setTxt('i18n-time-from', dict.timeFrom);
    setTxt('i18n-time-to', dict.timeTo);

    // Zapped Button
    setTxt('clear-all-zapped', dict.clearZappedBtn);

    // Platform Switch Descriptions
    setTxt('i18n-fb-desc', dict.fbDesc);
    setTxt('i18n-yt-desc', dict.ytDesc);
    setTxt('i18n-tt-desc', dict.ttDesc);
    setTxt('i18n-ig-desc', dict.igDesc);
    setTxt('i18n-th-desc', dict.thDesc);

    // Re-render active views to refresh text
    renderAnalytics();
    renderPerformanceTab();
    renderGitHubContribGrid();
  }

  if (langSelect) {
    chrome.storage.local.get({ lang: 'vi' }, (res) => {
      langSelect.value = res.lang || 'vi';
      applyLanguage(langSelect.value);
    });

    langSelect.onchange = (e) => {
      const selectedLang = e.target.value;
      chrome.storage.local.set({ lang: selectedLang }, () => {
        applyLanguage(selectedLang);
      });
    };
  }

  // --------------------------------------------------------------------------
  // Calendar Heatmap Engine (Month/Week Modes with Custom Outlines & Dynamic Data)
  // --------------------------------------------------------------------------
  let contribViewMode = 'month'; // 'month' or 'week'
  let contribOffset = 0;

  const contribModeMonthBtn = document.getElementById('contrib-mode-month');
  const contribModeWeekBtn = document.getElementById('contrib-mode-week');
  const contribPrevBtn = document.getElementById('contrib-prev-btn');
  const contribNextBtn = document.getElementById('contrib-next-btn');
  const contribDateLabel = document.getElementById('contrib-date-label');

  if (contribModeMonthBtn && contribModeWeekBtn) {
    contribModeMonthBtn.onclick = () => {
      contribModeMonthBtn.classList.add('active');
      contribModeWeekBtn.classList.remove('active');
      contribViewMode = 'month';
      contribOffset = 0;
      renderGitHubContribGrid();
    };

    contribModeWeekBtn.onclick = () => {
      contribModeWeekBtn.classList.add('active');
      contribModeMonthBtn.classList.remove('active');
      contribViewMode = 'week';
      contribOffset = 0;
      renderGitHubContribGrid();
    };
  }

  if (contribPrevBtn) {
    contribPrevBtn.onclick = () => {
      contribOffset--;
      renderGitHubContribGrid();
    };
  }

  if (contribNextBtn) {
    contribNextBtn.onclick = () => {
      contribOffset++;
      renderGitHubContribGrid();
    };
  }

  // Theme-Synced Pastel 9-Level Heatmap Color Generator
  const PASTEL_PALETTES = {
    dark: ['#0f2942', '#0e3a5a', '#104e7a', '#0284c7', '#38bdf8', '#7dd3fc', '#fcd34d', '#fb923c', '#f43f5e'],
    cappuccino: ['#2d241e', '#453227', '#694732', '#8c5e3c', '#d97706', '#f59e0b', '#fbbf24', '#f97316', '#ef4444'],
    pink: ['#3b1c2b', '#5c2243', '#83285c', '#b83280', '#ec4899', '#f472b6', '#fbcfe8', '#f87171', '#e11d48'],
    'light-white': ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#f59e0b', '#f97316', '#dc2626'],
    gray: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#facc15', '#fb923c', '#ef4444'],
    dracula: ['#282a36', '#44475a', '#6272a4', '#8be9fd', '#ff79c6', '#bd93f9', '#ffb86c', '#ff8b6c', '#ff5555'],
    'one-dark-pro': ['#21252b', '#2c313a', '#3e4451', '#545862', '#61afef', '#98c379', '#e5c07b', '#d19a66', '#e06c75'],
    monokai: ['#272822', '#3e3d32', '#75715e', '#66d9ef', '#a6e22e', '#fd971f', '#f92672', '#ff4655', '#e6005c'],
    cyberpunk: ['#1a0033', '#330066', '#6600cc', '#00f0ff', '#ff007f', '#ffe600', '#ff6600', '#ff0055', '#ff0033'],
    'solarized-dark': ['#073642', '#095264', '#0d738c', '#2aa198', '#859900', '#b58900', '#cb4b16', '#dc322f', '#d33682']
  };

  function getPastelStyleForLevel(mins) {
    if (mins <= 0) {
      return { background: 'rgba(15, 23, 42, 0.3)', color: '#64748b', border: '1px solid rgba(255, 255, 255, 0.05)' };
    }

    const activeTheme = document.body.getAttribute('data-theme') || 'dark';
    const palette = PASTEL_PALETTES[activeTheme] || PASTEL_PALETTES.dark;

    let idx = 0;
    if (mins <= 10) idx = 0;
    else if (mins <= 20) idx = 1;
    else if (mins <= 30) idx = 2;
    else if (mins <= 45) idx = 3;
    else if (mins <= 60) idx = 4;
    else if (mins <= 90) idx = 5;
    else if (mins <= 120) idx = 6;
    else if (mins <= 180) idx = 7;
    else idx = 8;

    const bg = palette[idx];
    const textColor = idx >= 4 ? (activeTheme === 'light-white' ? '#ffffff' : '#0f172a') : '#ffffff';

    return {
      background: bg,
      color: textColor,
      border: `1px solid ${bg}`
    };
  }

  function renderPastelLegend() {
    const legendContainer = document.getElementById('pastel-legend-steps');
    if (!legendContainer) return;
    legendContainer.innerHTML = '';

    const activeTheme = document.body.getAttribute('data-theme') || 'dark';
    const palette = PASTEL_PALETTES[activeTheme] || PASTEL_PALETTES.dark;

    palette.forEach((color, idx) => {
      const step = document.createElement('div');
      step.className = 'step';
      step.style.backgroundColor = color;
      step.title = `Cấp ${idx + 1}`;
      legendContainer.appendChild(step);
    });
  }

  function getDatesForRange(range) {
    const dates = [];
    const today = new Date();

    if (range === 'today') {
      dates.push(getTodayKey());
    } else if (range === 'week') {
      const day = today.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMon);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${dt}`);
      }
    } else if (range === 'month') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = today.getDate(); // Up to today

      for (let d = 1; d <= daysInMonth; d++) {
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        dates.push(`${year}-${mStr}-${dStr}`);
      }
    }
    return dates;
  }

  function renderGitHubContribGrid() {
    const container = document.getElementById('github-contrib-grid');
    if (!container) return;
    container.innerHTML = '';
    renderPastelLegend();

    const isEn = window.currentLang === 'en';
    const dayNames = isEn 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    chrome.storage.local.get(['trackingData'], (res) => {
      const trackingData = res.trackingData || {};

      if (contribViewMode === 'month') {
        const targetDate = new Date();
        targetDate.setDate(1);
        targetDate.setMonth(targetDate.getMonth() + contribOffset);

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth(); // 0-11

        if (contribDateLabel) {
          contribDateLabel.textContent = isEn 
            ? `${monthNamesEn[month]} ${year}` 
            : `Tháng ${month + 1}/${year}`;
        }

        const firstDay = new Date(year, month, 1);
        let startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0: Mon, ..., 6: Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        // 1. Previous Month Filler Days
        for (let i = startWeekday - 1; i >= 0; i--) {
          const dayNum = prevMonthDays - i;
          const tile = document.createElement('div');
          tile.className = 'contrib-tile out-month empty-day';
          tile.innerHTML = `<span style="font-size:10px;">${dayNum}</span>`;
          container.appendChild(tile);
        }

        // 2. Current Month Days (Pastel Theme-Synced)
        for (let day = 1; day <= daysInMonth; day++) {
          const dayStr = String(day).padStart(2, '0');
          const monthStr = String(month + 1).padStart(2, '0');
          const dateKey = `${year}-${monthStr}-${dayStr}`;

          const dayData = trackingData[dateKey];
          const hasData = dayData && dayData.totalSeconds > 0;
          const mins = hasData ? Math.round(dayData.totalSeconds / 60) : 0;

          const tile = document.createElement('div');
          tile.className = 'contrib-tile in-month';

          if (hasData) {
            const pStyle = getPastelStyleForLevel(mins);
            tile.style.backgroundColor = pStyle.background;
            tile.style.color = pStyle.color;
            tile.style.border = pStyle.border;
            tile.title = isEn ? `${dateKey}: ${mins} mins distraction` : `${dateKey}: ${mins} phút giải trí`;
            tile.innerHTML = `<span>${day}</span><span style="font-size:9px; opacity:0.9;">${mins}m</span>`;
          } else {
            tile.classList.add('empty-day');
            tile.title = isEn ? `${dateKey}: No data` : `${dateKey}: Chưa có dữ liệu`;
            tile.innerHTML = `<span>${day}</span>`;
          }

          container.appendChild(tile);
        }

        // 3. Next Month Filler Days (to complete grid row)
        const totalTiles = startWeekday + daysInMonth;
        const remainder = totalTiles % 7;
        if (remainder !== 0) {
          const nextDaysNeeded = 7 - remainder;
          for (let day = 1; day <= nextDaysNeeded; day++) {
            const tile = document.createElement('div');
            tile.className = 'contrib-tile out-month empty-day';
            tile.innerHTML = `<span style="font-size:10px;">${day}</span>`;
            container.appendChild(tile);
          }
        }
      } else {
        // Week View Mode (Pastel Theme-Synced)
        const weekDays = getMondayToSundayDates(contribOffset);
        if (contribDateLabel) {
          contribDateLabel.textContent = `${weekDays[0].rawDate} - ${weekDays[6].rawDate}`;
        }

        weekDays.forEach((d, idx) => {
          const dayData = trackingData[d.key];
          const hasData = dayData && dayData.totalSeconds > 0;
          const mins = hasData ? Math.round(dayData.totalSeconds / 60) : 0;

          const tile = document.createElement('div');
          tile.className = 'contrib-tile in-month';

          if (hasData) {
            const pStyle = getPastelStyleForLevel(mins);
            tile.style.backgroundColor = pStyle.background;
            tile.style.color = pStyle.color;
            tile.style.border = pStyle.border;
            tile.title = isEn ? `${d.label}: ${mins} mins distraction` : `${d.label}: ${mins} phút giải trí`;
            tile.innerHTML = `<span>${dayNames[idx]}</span><span style="font-size:9px; opacity:0.9;">${mins}m</span>`;
          } else {
            tile.classList.add('empty-day');
            tile.title = isEn ? `${d.label}: No data` : `${d.label}: Chưa có dữ liệu`;
            tile.innerHTML = `<span>${dayNames[idx]}</span><span style="font-size:9px; opacity:0.6;">--</span>`;
          }

          container.appendChild(tile);
        });
      }
    });
  }

  function renderPerformanceTab() {
    const activeRangeBtn = document.querySelector('[data-perf-range].active');
    const range = activeRangeBtn ? activeRangeBtn.dataset.perfRange : 'today';

    const focusScoreElem = document.getElementById('focus-score-value');
    const focusAdviceElem = document.getElementById('focus-score-advice');
    const distractionIndexElem = document.getElementById('distraction-index-value');
    const distractionAdviceElem = document.getElementById('distraction-index-advice');

    const defaultDistractingDomains = [
      'facebook.com', 'youtube.com', 'tiktok.com', 'instagram.com', 'threads.net',
      'reddit.com', 'twitter.com', 'x.com', 'bilibili.com', 'netflix.com'
    ];

    const isEn = window.currentLang === 'en';

    chrome.storage.local.get(['trackingData', 'customBlockedDomains'], (res) => {
      const trackingData = res.trackingData || {};
      const customBlocked = res.customBlockedDomains || [];
      const allDistractionDomains = new Set([...defaultDistractingDomains, ...customBlocked]);

      let totalSec = 0;
      let distractionSec = 0;
      const hourlySec = new Array(24).fill(0);

      const targetDates = getDatesForRange(range);

      targetDates.forEach((dateKey) => {
        const dayData = trackingData[dateKey];
        if (dayData) {
          totalSec += dayData.totalSeconds || 0;
          if (dayData.domains) {
            Object.keys(dayData.domains).forEach((dom) => {
              const domSec = dayData.domains[dom] || 0;
              if (allDistractionDomains.has(dom)) {
                distractionSec += domSec;
              }
            });
          }
          if (dayData.hourly && Array.isArray(dayData.hourly)) {
            dayData.hourly.forEach((hSec, hIdx) => {
              hourlySec[hIdx] += hSec || 0;
            });
          }
        }
      });

      // Distraction Index (%)
      const distractionRatio = totalSec > 0 ? Math.min(100, Math.round((distractionSec / totalSec) * 100)) : 0;
      if (distractionIndexElem) distractionIndexElem.textContent = `${distractionRatio}%`;
      if (distractionAdviceElem) {
        distractionAdviceElem.textContent = distractionRatio < 15 
          ? (isEn ? 'Safe: Very low distraction level' : 'An toàn: Mức xao nhãng rất thấp')
          : distractionRatio < 35 
            ? (isEn ? 'Warning: Moderate browsing distraction' : 'Cảnh báo: Lướt web giải trí trung bình')
            : (isEn ? 'Danger: High distraction level' : 'Nguy hiểm: Mức độ xao nhãng cao');
      }

      // Productivity Focus Score (0-100)
      const distractionHours = distractionSec / 3600;
      let focusScore = 100;
      if (totalSec > 0) {
        focusScore = Math.max(0, Math.min(100, Math.round(100 - (distractionRatio * 0.7) - (distractionHours * 4))));
      }

      if (focusScoreElem) focusScoreElem.textContent = `${focusScore} / 100`;

      let rankLabel = isEn ? '🔥 Rank: Master Focus' : '🔥 Hạng: Master Focus';
      if (focusScore < 50) rankLabel = isEn ? '🚨 Rank: High Distraction Warning' : '🚨 Hạng: High Distraction Warning';
      else if (focusScore < 75) rankLabel = isEn ? '⚠️ Rank: Average Browsing' : '⚠️ Hạng: Average Browsing';
      else if (focusScore < 90) rankLabel = isEn ? '⚡ Rank: Deep Worker' : '⚡ Rank: Deep Worker';

      const timeSuffix = range === 'today' 
        ? (isEn ? 'Today' : 'Hôm nay') 
        : range === 'week' 
          ? (isEn ? 'This Week' : 'Tuần này') 
          : (isEn ? 'This Month' : 'Tháng này');
      if (focusAdviceElem) focusAdviceElem.textContent = `${rankLabel} (${timeSuffix})`;

      // Render 24-Hour Usage Heatmap Chart with Real Hourly Data
      const themeColors = {
        dark: '#38bdf8',
        cappuccino: '#f59e0b',
        pink: '#ec4899',
        'light-white': '#4f46e5',
        gray: '#88c0d0',
        dracula: '#ff79c6',
        'one-dark-pro': '#61afef',
        monokai: '#f92672',
        cyberpunk: '#ff007f',
        'solarized-dark': '#2aa198'
      };
      const activeTheme = document.body.getAttribute('data-theme') || 'dark';
      const accent = themeColors[activeTheme] || '#38bdf8';

      const hourlyMinsArray = hourlySec.map(sec => Math.round(sec / 60));

      if (typeof ChartEngine !== 'undefined' && ChartEngine.renderHourlyHeatmapChart) {
        ChartEngine.renderHourlyHeatmapChart('heatmap-chart', hourlyMinsArray, accent);
      }
    });

    renderGitHubContribGrid();
  }

  // --------------------------------------------------------------------------
  // 3. Analytics & Time Tracking Engine
  // --------------------------------------------------------------------------
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      selectedDayIndex = null;
      renderAnalytics();
    });
  });

  // Week Controls Handlers
  if (prevWeekBtn) {
    prevWeekBtn.onclick = () => {
      weekOffset--;
      selectedDayIndex = null;
      renderAnalytics();
    };
  }

  if (nextWeekBtn) {
    nextWeekBtn.onclick = () => {
      if (weekOffset < 0) {
        weekOffset++;
        selectedDayIndex = null;
        renderAnalytics();
      }
    };
  }

  function getTodayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatTime(seconds) {
    const isEn = window.currentLang === 'en';
    if (!seconds || seconds <= 0) return isEn ? '0s' : '0 giây';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  // Calculate Monday to Sunday dates for weekOffset cleanly
  function getMondayToSundayDates(offset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon, ...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + offset * 7);

    const dates = [];
    const isEn = window.currentLang === 'en';
    const dayNames = isEn 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      const rawDate = `${day}/${month}`;

      dates.push({
        key,
        label: `${dayNames[i]} (${rawDate})`,
        rawDate,
        dateObj: d
      });
    }
    return dates;
  }

  function renderAnalytics() {
    chrome.storage.local.get(['trackingData'], (res) => {
      const trackingData = res.trackingData || {};
      const isEn = window.currentLang === 'en';

      // 1. Get 7 days for active weekOffset
      const weekDays = getMondayToSundayDates(weekOffset);
      const weeklyLabels = weekDays.map((d) => d.label);
      const weeklyMinutes = weekDays.map((d) => {
        const daySec = trackingData[d.key] ? trackingData[d.key].totalSeconds || 0 : 0;
        return Math.round(daySec / 60);
      });

      // Calculate max available day index for line chart cutoff
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentDayIdxInWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const maxDayIndex = weekOffset === 0 ? currentDayIdxInWeek : 6;

      // Update Week Label
      if (currentWeekLabel) {
        const startDateStr = weekDays[0].rawDate;
        const endDateStr = weekDays[6].rawDate;

        if (weekOffset === 0) {
          currentWeekLabel.textContent = isEn 
            ? `This Week (${startDateStr} - ${endDateStr})` 
            : `Tuần này (${startDateStr} - ${endDateStr})`;
        } else if (weekOffset === -1) {
          currentWeekLabel.textContent = isEn 
            ? `Last Week (${startDateStr} - ${endDateStr})` 
            : `Tuần trước (${startDateStr} - ${endDateStr})`;
        } else {
          currentWeekLabel.textContent = isEn 
            ? `${Math.abs(weekOffset)} weeks ago (${startDateStr} - ${endDateStr})` 
            : `${Math.abs(weekOffset)} tuần trước (${startDateStr} - ${endDateStr})`;
        }
      }

      if (nextWeekBtn) {
        nextWeekBtn.disabled = weekOffset >= 0;
      }

      // 2. Aggregate Domains Data depending on active filters
      let aggregatedDomains = {};
      let totalTimeSec = 0;
      let titleLabel = '';

      if (selectedDayIndex !== null) {
        // Specific day selected from weekly trend chart
        const selectedDay = weekDays[selectedDayIndex];
        const dayData = trackingData[selectedDay.key] || { totalSeconds: 0, domains: {} };
        aggregatedDomains = dayData.domains || {};
        totalTimeSec = dayData.totalSeconds || 0;
        titleLabel = isEn 
          ? `Total Chrome Usage Time (${selectedDay.label})` 
          : `Tổng thời gian Chrome (${selectedDay.label})`;
      } else if (currentRange === 'today' && weekOffset === 0) {
        // "Hôm nay" filter in current week
        const todayKey = getTodayKey();
        const todayData = trackingData[todayKey] || { totalSeconds: 0, domains: {} };
        aggregatedDomains = todayData.domains || {};
        totalTimeSec = todayData.totalSeconds || 0;
        titleLabel = isEn 
          ? `Total Chrome Usage Time (Today)` 
          : `Tổng thời gian Chrome (Hôm nay)`;
      } else {
        // Full Week Aggregation for weekDays
        weekDays.forEach((d) => {
          const dayData = trackingData[d.key];
          if (dayData && dayData.domains) {
            totalTimeSec += dayData.totalSeconds || 0;
            Object.entries(dayData.domains).forEach(([dom, sec]) => {
              aggregatedDomains[dom] = (aggregatedDomains[dom] || 0) + sec;
            });
          }
        });

        if (weekOffset === 0) {
          titleLabel = isEn ? `Total Chrome Usage Time (This Week)` : `Tổng thời gian Chrome (Tuần này)`;
        } else if (weekOffset === -1) {
          titleLabel = isEn ? `Total Chrome Usage Time (Last Week)` : `Tổng thời gian Chrome (Tuần trước)`;
        } else {
          titleLabel = isEn 
            ? `Total Chrome Usage Time (${Math.abs(weekOffset)} weeks ago)` 
            : `Tổng thời gian Chrome (${Math.abs(weekOffset)} tuần trước)`;
        }
      }

      // Sort domains by usage time descending (filtering out null / invalid domains)
      const sortedDomains = Object.entries(aggregatedDomains)
        .filter(([dom]) => dom && dom !== 'null' && dom !== 'undefined' && dom.trim() !== '')
        .sort((a, b) => b[1] - a[1]);

      // Metrics Cards
      const metricTitleElem = document.getElementById('metric-today-title');
      if (metricTitleElem) metricTitleElem.textContent = titleLabel;

      document.getElementById('metric-today-time').textContent = formatTime(totalTimeSec);
      document.getElementById('metric-domain-count').textContent = `${sortedDomains.length} domains`;
      document.getElementById('metric-top-domain').textContent = sortedDomains.length > 0 ? sortedDomains[0][0] : '--';

      // 3. BAR CHART: TOP 5 WEBS TRUY CẬP NHIỀU NHẤT
      const top5Domains = sortedDomains.slice(0, 5);
      const barLabels = top5Domains.map((d) => d[0]);
      const barData = top5Domains.map((d) => d[1]);
      const barColors = top5Domains.map((d) => getDomainColor(d[0]));

      // 4. DONUT CHART: TỔNG HỢP HẾT NGUỒN DOMAIN
      const donutLabels = sortedDomains.map((d) => d[0]);
      const donutData = sortedDomains.map((d) => d[1]);
      const donutColors = sortedDomains.map((d) => getDomainColor(d[0]));

      // Theme Colors Mapping
      const themeColors = {
        dark: '#38bdf8',
        cappuccino: '#f59e0b',
        pink: '#ec4899',
        'light-white': '#4f46e5',
        gray: '#88c0d0',
        dracula: '#ff79c6',
        'one-dark-pro': '#61afef',
        monokai: '#f92672',
        cyberpunk: '#ff007f',
        'solarized-dark': '#2aa198'
      };
      const activeTheme = document.body.getAttribute('data-theme') || 'dark';
      const accent = themeColors[activeTheme] || '#38bdf8';

      if (typeof ChartEngine !== 'undefined') {
        // Render Weekly Trend Line Chart with Day Click Callback
        ChartEngine.renderWeeklyTrendChart(
          'weekly-chart',
          weeklyLabels,
          weeklyMinutes,
          accent,
          maxDayIndex,
          selectedDayIndex,
          (clickedDayIdx) => {
            if (selectedDayIndex === clickedDayIdx) {
              selectedDayIndex = null;
            } else {
              selectedDayIndex = clickedDayIdx;
            }
            renderAnalytics();
          }
        );

        // Render Bar Chart (Top 5 Domains)
        ChartEngine.renderBarChart('bar-chart', barLabels, barData, barColors);

        // Render Interactive Donut Chart (ALL Domains)
        ChartEngine.renderDonutChart('donut-chart', donutLabels, donutData, donutColors, (clickedSlice) => {
          if (donutDetailCard) {
            donutDetailCard.style.display = 'block';
            donutDetailTitle.textContent = `🌐 ${clickedSlice.label}`;
            donutDetailTime.textContent = isEn ? `Usage time: ${formatTime(clickedSlice.valSec || clickedSlice.val)}` : `Thời gian dùng: ${formatTime(clickedSlice.valSec || clickedSlice.val)}`;
            donutDetailPercent.textContent = isEn ? `${clickedSlice.percent}% of total web usage time` : `Chiếm ${clickedSlice.percent}% tổng thời gian web`;
          }
        });
      }

      // Render Full Ranking Table
      const tableBody = document.getElementById('domain-list-body');
      tableBody.innerHTML = '';

      if (sortedDomains.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:20px;">Chưa có dữ liệu theo dõi thời gian cho khoảng thời gian đã chọn!</td></tr>';
        return;
      }

      sortedDomains.forEach(([dom, sec]) => {
        const percent = totalTimeSec > 0 ? Math.round((sec / totalTimeSec) * 100) : 0;
        const domColor = getDomainColor(dom);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${dom}</strong></td>
          <td>${formatTime(sec)}</td>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="progress-bar-bg" style="flex:1;">
                <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${domColor};"></div>
              </div>
              <span style="font-size:11px; font-weight:700; min-width:30px;">${percent}%</span>
            </div>
          </td>
        `;
        tableBody.appendChild(row);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. Config Manager & Custom Domain Blocker (Synced Controls & Live Countdown)
  // --------------------------------------------------------------------------
  function loadConfigStates() {
    const platforms = ['facebook', 'youtube', 'tiktok', 'instagram', 'threads'];
    const strictLockBadge = document.getElementById('strict-lock-badge');

    function updateConfigUI() {
      chrome.storage.local.get([...platforms, 'tempUnblocks', 'strictFocusUntil'], (res) => {
        const tempUnblocks = res.tempUnblocks || {};
        const now = Date.now();
        const isStrictLocked = res.strictFocusUntil && now < res.strictFocusUntil;

        if (strictLockBadge) {
          if (isStrictLocked) {
            const leftMins = Math.ceil((res.strictFocusUntil - now) / 60000);
            strictLockBadge.style.display = 'flex';
            strictLockBadge.textContent = `🔒 STRICT FOCUS LOCK (${leftMins}m left)`;
          } else {
            strictLockBadge.style.display = 'none';
          }
        }

        platforms.forEach((p) => {
          const checkbox = document.getElementById(`cfg-${p}`);
          const labelElem = document.getElementById(`cfg-label-${p}`);
          const itemMeta = checkbox ? checkbox.closest('.config-item') : null;
          const isChecked = res[p] !== false;

          if (checkbox) {
            checkbox.checked = isChecked;
            if (isStrictLocked) {
              checkbox.disabled = true;
              if (itemMeta) itemMeta.classList.add('locked-item');
            } else {
              checkbox.disabled = false;
              if (itemMeta) itemMeta.classList.remove('locked-item');
            }
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

    updateConfigUI();
    setInterval(updateConfigUI, 1000);

    platforms.forEach((p) => {
      const checkbox = document.getElementById(`cfg-${p}`);
      if (checkbox) {
        checkbox.onchange = (e) => {
          const isChecked = e.target.checked;

          chrome.storage.local.get(['tempUnblocks', 'strictFocusUntil'], (res) => {
            const now = Date.now();
            if (res.strictFocusUntil && now < res.strictFocusUntil) {
              const leftMins = Math.ceil((res.strictFocusUntil - now) / 60000);
              alert(`🔒 Chế Độ Tập Trung Cao Độ đang kích hoạt (còn ${leftMins} phút)!\n\nKhông thể tắt chặn nền tảng trong thời gian này.`);
              checkbox.checked = true;
              updateConfigUI();
              return;
            }

            const tempUnblocks = res.tempUnblocks || {};

            if (!isChecked) {
              const durationSec = Math.floor(Math.random() * (300 - 20 + 1)) + 20;
              const expireTime = Date.now() + durationSec * 1000;
              tempUnblocks[p] = { expireTime, duration: durationSec };

              chrome.storage.local.set({ [p]: false, tempUnblocks }, () => {
                updateConfigUI();
              });
            } else {
              delete tempUnblocks[p];
              chrome.storage.local.set({ [p]: true, tempUnblocks }, () => {
                updateConfigUI();
              });
            }
          });
        };
      }
    });
  }

  // Real-time Storage Change Listener
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      loadConfigStates();
    }
  });

  function loadCustomBlockedDomains() {
    chrome.storage.local.get(['customBlockedDomains', 'strictFocusUntil'], (res) => {
      const list = res.customBlockedDomains || [];
      const now = Date.now();
      const isStrictLocked = res.strictFocusUntil && now < res.strictFocusUntil;

      customDomainListContainer.innerHTML = '';

      if (list.length === 0) {
        customDomainListContainer.innerHTML = '<p style="color:#94a3b8; font-size:12px;">Chưa có trang web tùy chỉnh nào bị chặn.</p>';
        return;
      }

      list.forEach((domain, idx) => {
        const tag = document.createElement('div');
        tag.className = 'domain-tag';
        tag.innerHTML = `
          <span>🌐 <strong>${domain}</strong></span>
          ${isStrictLocked ? '<span style="font-size:10px; opacity:0.6;">🔒</span>' : '<span class="domain-tag-remove" title="Bỏ chặn">✕</span>'}
        `;

        const removeBtn = tag.querySelector('.domain-tag-remove');
        if (removeBtn) {
          removeBtn.onclick = () => {
            if (isStrictLocked) {
              const leftMins = Math.ceil((res.strictFocusUntil - now) / 60000);
              alert(`🔒 Chế Độ Tập Trung Cao Độ đang bật (còn ${leftMins}m)!\n\nKhông thể bỏ chặn domain trong thời gian này.`);
              return;
            }
            list.splice(idx, 1);
            chrome.storage.local.set({ customBlockedDomains: list }, () => {
              loadCustomBlockedDomains();
            });
          };
        }
        customDomainListContainer.appendChild(tag);
      });
    });
  }

  if (addCustomDomainBtn) {
    addCustomDomainBtn.onclick = () => {
      chrome.storage.local.get(['strictFocusUntil'], (sRes) => {
        const now = Date.now();
        if (sRes.strictFocusUntil && now < sRes.strictFocusUntil) {
          const leftMins = Math.ceil((sRes.strictFocusUntil - now) / 60000);
          alert(`🔒 Chế Độ Tập Trung Cao Độ đang bật (còn ${leftMins}m)!\n\nKhông thể thêm domain mới.`);
          return;
        }

        const val = customDomainInput.value.trim().toLowerCase();
        if (!val) return;

        const cleanDomain = val.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        if (!cleanDomain) return;

        chrome.storage.local.get({ customBlockedDomains: [] }, (res) => {
          const list = res.customBlockedDomains || [];
          if (!list.includes(cleanDomain)) {
            list.push(cleanDomain);
            chrome.storage.local.set({ customBlockedDomains: list }, () => {
              customDomainInput.value = '';
              loadCustomBlockedDomains();
              alert(`Đã thêm ${cleanDomain} (và tất cả subdomain) vào danh sách chặn hẳn!`);
            });
          }
        });
      });
    };
  }

  // --------------------------------------------------------------------------
  // 5. Zapper Selector Manager
  // --------------------------------------------------------------------------
  function loadZappedSelectors() {
    const container = document.getElementById('zapped-list-container');
    const clearBtn = document.getElementById('clear-all-zapped');

    chrome.storage.local.get({ zappedSelectors: [] }, (res) => {
      const list = res.zappedSelectors || [];
      container.innerHTML = '';

      if (list.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; grid-column: 1/-1;">Chưa có phần tử nào bị ẩn thủ công bằng Zapper.</p>';
        return;
      }

      list.forEach((sel, index) => {
        const tag = document.createElement('div');
        tag.className = 'zapped-tag';
        tag.innerHTML = `
          <span>${sel}</span>
          <button class="btn-delete-tag" title="Xóa phần tử này">✕</button>
        `;

        tag.querySelector('.btn-delete-tag').addEventListener('click', () => {
          list.splice(index, 1);
          chrome.storage.local.set({ zappedSelectors: list }, () => {
            loadZappedSelectors();
          });
        });

        container.appendChild(tag);
      });
    });

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ bộ chọn zapped?')) {
          chrome.storage.local.set({ zappedSelectors: [] }, () => {
            loadZappedSelectors();
          });
        }
      };
    }
  }

  // --------------------------------------------------------------------------
  // 6. Daily Time Quota (Clock Widget + 3-Day Lock), Strict Focus & Work Schedule Handlers
  // --------------------------------------------------------------------------
  const quotaDomainInput = document.getElementById('quota-domain-input');
  const quotaMinsInput = document.getElementById('quota-mins-input');
  const addQuotaBtn = document.getElementById('add-quota-btn');
  const quotaListContainer = document.getElementById('quota-list-container');
  const quotaLockBadge = document.getElementById('quota-lock-badge');
  const quotaClockTimer = document.getElementById('quota-clock-timer');

  function updateQuotaClockTicker() {
    chrome.storage.local.get(['dailyQuotas', 'quotaLockUntil', 'trackingData'], (res) => {
      const quotas = res.dailyQuotas || {};
      const quotaLockUntil = res.quotaLockUntil || 0;
      const now = Date.now();
      const isQuotaLocked = now < quotaLockUntil;

      if (quotaLockBadge) {
        if (isQuotaLocked) {
          const remainingHours = Math.ceil((quotaLockUntil - now) / (1000 * 3600));
          quotaLockBadge.style.display = 'inline-block';
          quotaLockBadge.textContent = `🔒 Khóa 3 ngày (còn ${remainingHours}h)`;
        } else {
          quotaLockBadge.style.display = 'none';
        }
      }

      if (addQuotaBtn) {
        addQuotaBtn.disabled = isQuotaLocked;
        if (isQuotaLocked) {
          addQuotaBtn.style.opacity = '0.6';
          addQuotaBtn.textContent = '🔒 Đã Khóa 3 Ngày';
        } else {
          addQuotaBtn.style.opacity = '1';
          addQuotaBtn.textContent = '🔒 Lưu & Khóa 3 Ngày';
        }
      }

      // Calculate today's total budget and remaining quota time
      const todayKey = getTodayKey();
      const trackingData = res.trackingData || {};
      const todayData = trackingData[todayKey] || {};
      const todaySec = todayData.totalSeconds || 0;

      const quotaKeys = Object.keys(quotas);
      if (quotaKeys.length > 0) {
        let totalQuotaSec = 0;
        quotaKeys.forEach(k => {
          totalQuotaSec += (quotas[k] || 0) * 60;
        });

        const remainingSec = Math.max(0, totalQuotaSec - todaySec);
        const hrs = Math.floor(remainingSec / 3600);
        const mins = Math.floor((remainingSec % 3600) / 60);
        const secs = remainingSec % 60;

        if (quotaClockTimer) {
          quotaClockTimer.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
      } else {
        if (quotaClockTimer) quotaClockTimer.textContent = '--:--:--';
      }
    });
  }

  setInterval(updateQuotaClockTicker, 1000);
  updateQuotaClockTicker();

  function loadDailyQuotas() {
    if (!quotaListContainer) return;
    chrome.storage.local.get(['dailyQuotas', 'quotaLockUntil'], (res) => {
      const quotas = res.dailyQuotas || {};
      const quotaLockUntil = res.quotaLockUntil || 0;
      const now = Date.now();
      const isQuotaLocked = now < quotaLockUntil;

      quotaListContainer.innerHTML = '';
      const keys = Object.keys(quotas);

      if (keys.length === 0) {
        quotaListContainer.innerHTML = '<p style="color:#94a3b8; font-size:12px;">Chưa có quy tắc giới hạn thời gian nào được thiết lập.</p>';
        return;
      }

      keys.forEach((dom) => {
        const mins = quotas[dom];
        const tag = document.createElement('div');
        tag.className = 'domain-tag';
        tag.innerHTML = `
          <span>⏱️ <strong>${dom}</strong>: ${mins}m/ngày</span>
          ${isQuotaLocked ? '<span style="font-size:10px; opacity:0.6;">🔒</span>' : '<span class="domain-tag-remove" title="Xóa quota">✕</span>'}
        `;
        const removeBtn = tag.querySelector('.domain-tag-remove');
        if (removeBtn) {
          removeBtn.onclick = () => {
            if (isQuotaLocked) {
              const remainingHours = Math.ceil((quotaLockUntil - now) / (1000 * 3600));
              alert(`🔒 Giới hạn Quotas đang bị khóa 3 ngày (còn ${remainingHours}h)!\n\nKhông thể xóa quota.`);
              return;
            }
            delete quotas[dom];
            chrome.storage.local.set({ dailyQuotas: quotas }, () => {
              loadDailyQuotas();
              updateQuotaClockTicker();
            });
          };
        }
        quotaListContainer.appendChild(tag);
      });
    });
  }

  if (addQuotaBtn) {
    addQuotaBtn.onclick = () => {
      chrome.storage.local.get(['quotaLockUntil', 'dailyQuotas'], (res) => {
        const now = Date.now();
        if (res.quotaLockUntil && now < res.quotaLockUntil) {
          const remainingHours = Math.ceil((res.quotaLockUntil - now) / (1000 * 3600));
          alert(`🔒 Giới hạn Quota đã bị khóa trong 3 ngày (còn ${remainingHours} giờ)!\n\nKhông thể thay đổi cấu hình trong thời gian này.`);
          return;
        }

        const dom = quotaDomainInput ? quotaDomainInput.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : '';
        const mins = quotaMinsInput ? parseInt(quotaMinsInput.value.trim(), 10) : 0;
        if (!dom || isNaN(mins) || mins <= 0) {
          alert('Vui lòng nhập tên domain và số phút hợp lệ!');
          return;
        }

        const quotas = res.dailyQuotas || {};
        quotas[dom] = mins;
        // Lock editing for 3 Days (72 Hours)
        const lockUntil = now + 3 * 24 * 60 * 60 * 1000;

        chrome.storage.local.set({ dailyQuotas: quotas, quotaLockUntil: lockUntil }, () => {
          if (quotaDomainInput) quotaDomainInput.value = '';
          if (quotaMinsInput) quotaMinsInput.value = '';
          loadDailyQuotas();
          updateQuotaClockTicker();
          alert(`Đã thiết lập giới hạn ${mins} phút/ngày cho ${dom} và khóa cấu hình trong 3 ngày!`);
        });
      });
    };
  }

  // Strict Focus Mode Handler
  const startStrictFocusBtn = document.getElementById('start-strict-focus-btn');
  const focusDurationSelect = document.getElementById('focus-duration-select');

  if (startStrictFocusBtn && focusDurationSelect) {
    startStrictFocusBtn.onclick = () => {
      const mins = parseInt(focusDurationSelect.value, 10);
      const expireTime = Date.now() + mins * 60 * 1000;
      chrome.storage.local.set({ strictFocusUntil: expireTime }, () => {
        loadConfigStates();
        loadCustomBlockedDomains();
        alert(`🔒 Đã kích hoạt Chế Độ Tập Trung Cao Độ trong ${mins} phút!\n\nTất cả nút bật/tắt tạm thời & danh sách chặn tùy chỉnh sẽ bị khóa triệt để.`);
      });
    };
  }

  // Custom Dark Time Selectors Initialization & Work Schedule Handler
  const schedStartH = document.getElementById('sched-start-h');
  const schedStartM = document.getElementById('sched-start-m');
  const schedEndH = document.getElementById('sched-end-h');
  const schedEndM = document.getElementById('sched-end-m');
  const scheduleEnableSwitch = document.getElementById('schedule-enable-switch');

  function populateTimeOptions(selectElem, max, step = 1) {
    if (!selectElem) return;
    selectElem.innerHTML = '';
    for (let i = 0; i < max; i += step) {
      const valStr = String(i).padStart(2, '0');
      const opt = document.createElement('option');
      opt.value = valStr;
      opt.textContent = valStr;
      selectElem.appendChild(opt);
    }
  }

  if (schedStartH && schedStartM && schedEndH && schedEndM) {
    populateTimeOptions(schedStartH, 24, 1);
    populateTimeOptions(schedStartM, 60, 5);
    populateTimeOptions(schedEndH, 24, 1);
    populateTimeOptions(schedEndM, 60, 5);

    chrome.storage.local.get(['workSchedule'], (res) => {
      const sched = res.workSchedule || { enabled: false, start: '08:00', end: '17:00' };
      if (scheduleEnableSwitch) scheduleEnableSwitch.checked = !!sched.enabled;

      const [sH, sM] = (sched.start || '08:00').split(':');
      const [eH, eM] = (sched.end || '17:00').split(':');

      if (schedStartH) schedStartH.value = sH || '08';
      if (schedStartM) schedStartM.value = sM || '00';
      if (schedEndH) schedEndH.value = eH || '17';
      if (schedEndM) schedEndM.value = eM || '00';
    });

    const saveWorkSchedule = () => {
      const startStr = `${schedStartH.value}:${schedStartM.value}`;
      const endStr = `${schedEndH.value}:${schedEndM.value}`;
      const isEnabled = scheduleEnableSwitch ? scheduleEnableSwitch.checked : false;

      const sched = { enabled: isEnabled, start: startStr, end: endStr };
      chrome.storage.local.set({ workSchedule: sched }, () => {
        if (isEnabled) {
          console.log(`📅 Work Schedule saved: ${startStr} - ${endStr}`);
        }
      });
    };

    schedStartH.onchange = saveWorkSchedule;
    schedStartM.onchange = saveWorkSchedule;
    schedEndH.onchange = saveWorkSchedule;
    schedEndM.onchange = saveWorkSchedule;

    // Attach Work Schedule Preset Pills
    document.querySelectorAll('.preset-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const start = pill.dataset.start.split(':');
        const end = pill.dataset.end.split(':');

        if (schedStartH) schedStartH.value = start[0];
        if (schedStartM) schedStartM.value = start[1];
        if (schedEndH) schedEndH.value = end[0];
        if (schedEndM) schedEndM.value = end[1];

        saveWorkSchedule();
      });
    });

    if (scheduleEnableSwitch) {
      scheduleEnableSwitch.onchange = () => {
        saveWorkSchedule();
        if (scheduleEnableSwitch.checked) {
          const startStr = `${schedStartH.value}:${schedStartM.value}`;
          const endStr = `${schedEndH.value}:${schedEndM.value}`;
          alert(`📅 Đã bật khung giờ tự động từ ${startStr} đến ${endStr}!`);
        }
      };
    }
  }

  // Performance Time Range Buttons
  const perfRangeBtns = document.querySelectorAll('[data-perf-range]');
  perfRangeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      perfRangeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderPerformanceTab();
    });
  });

  // --------------------------------------------------------------------------
  // 7. Update Button Handler (Auto Check Remote Manifest & Extension Reload)
  // --------------------------------------------------------------------------
  const updateBtn = document.getElementById('update-btn');

  function isNewerVersion(remote, current) {
    const rParts = remote.split('.').map(Number);
    const cParts = current.split('.').map(Number);
    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
      const r = rParts[i] || 0;
      const c = cParts[i] || 0;
      if (r > c) return true;
      if (r < c) return false;
    }
    return false;
  }

  if (updateBtn) {
    updateBtn.addEventListener('click', async () => {
      const currentVersion = chrome.runtime.getManifest().version;
      updateBtn.disabled = true;
      updateBtn.textContent = '⏳ Check...';

      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/thinh1234-cyber/Addiction-K1ller/main/manifest.json?t=' + Date.now()
        );
        if (!response.ok) throw new Error('Network error');

        const remoteManifest = await response.json();
        const remoteVersion = remoteManifest.version;

        if (isNewerVersion(remoteVersion, currentVersion)) {
          updateBtn.textContent = '🔄 Updating...';
          alert(`🎉 Đã tìm thấy bản mới V${remoteVersion}! Đang tự động cập nhật và reload extension...`);
          setTimeout(() => {
            chrome.runtime.reload();
          }, 400);
        } else {
          updateBtn.textContent = '✓ Latest';
          alert(`✅ Tiện ích đang ở phiên bản mới nhất (V${currentVersion})!\n\nTự động làm mới bộ nhớ extension...`);
          setTimeout(() => {
            chrome.runtime.reload();
          }, 600);
        }
      } catch (err) {
        updateBtn.textContent = '🔄 Reloading';
        setTimeout(() => {
          chrome.runtime.reload();
        }, 400);
      }
    });
  }

  // Initial Runs
  renderAnalytics();
  loadConfigStates();
  loadCustomBlockedDomains();
  loadDailyQuotas();
  loadZappedSelectors();
});
