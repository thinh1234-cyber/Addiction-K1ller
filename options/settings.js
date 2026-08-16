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
      } else if (btn.dataset.tab === 'config') {
        loadConfigStates();
        loadCustomBlockedDomains();
      } else if (btn.dataset.tab === 'zapper') {
        loadZappedSelectors();
      }
    });
  });

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
    if (!seconds || seconds <= 0) return '0 giây';
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
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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
          currentWeekLabel.textContent = `Tuần này (${startDateStr} - ${endDateStr})`;
        } else if (weekOffset === -1) {
          currentWeekLabel.textContent = `Tuần trước (${startDateStr} - ${endDateStr})`;
        } else {
          currentWeekLabel.textContent = `${Math.abs(weekOffset)} tuần trước (${startDateStr} - ${endDateStr})`;
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
        titleLabel = `Tổng thời gian Chrome (${selectedDay.label})`;
      } else if (currentRange === 'today' && weekOffset === 0) {
        // "Hôm nay" filter in current week
        const todayKey = getTodayKey();
        const todayData = trackingData[todayKey] || { totalSeconds: 0, domains: {} };
        aggregatedDomains = todayData.domains || {};
        totalTimeSec = todayData.totalSeconds || 0;
        titleLabel = `Tổng thời gian Chrome (Hôm nay)`;
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
          titleLabel = `Tổng thời gian Chrome (Tuần này)`;
        } else if (weekOffset === -1) {
          titleLabel = `Tổng thời gian Chrome (Tuần trước)`;
        } else {
          titleLabel = `Tổng thời gian Chrome (${Math.abs(weekOffset)} tuần trước)`;
        }
      }

      // Sort domains by usage time descending
      const sortedDomains = Object.entries(aggregatedDomains).sort((a, b) => b[1] - a[1]);

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
            donutDetailTime.textContent = `Thời gian dùng: ${formatTime(clickedSlice.val)}`;
            donutDetailPercent.textContent = `Chiếm ${clickedSlice.percent}% tổng thời gian web`;
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

    function updateConfigUI() {
      chrome.storage.local.get([...platforms, 'tempUnblocks'], (res) => {
        const tempUnblocks = res.tempUnblocks || {};
        const now = Date.now();

        platforms.forEach((p) => {
          const checkbox = document.getElementById(`cfg-${p}`);
          const labelElem = document.getElementById(`cfg-label-${p}`);
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

    updateConfigUI();
    setInterval(updateConfigUI, 1000);

    platforms.forEach((p) => {
      const checkbox = document.getElementById(`cfg-${p}`);
      if (checkbox) {
        checkbox.onchange = (e) => {
          const isChecked = e.target.checked;

          chrome.storage.local.get(['tempUnblocks'], (res) => {
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
    chrome.storage.local.get({ customBlockedDomains: [] }, (res) => {
      const list = res.customBlockedDomains || [];
      customDomainListContainer.innerHTML = '';

      if (list.length === 0) {
        customDomainListContainer.innerHTML = '<p style="color:#94a3b8; font-size:12px;">Chưa có trang web tùy chỉnh nào bị chặn.</p>';
        return;
      }

      list.forEach((domain, idx) => {
        const tag = document.createElement('div');
        tag.className = 'domain-tag';
        tag.innerHTML = `
          <span>🌐 ${domain}</span>
          <span class="domain-tag-remove" title="Bỏ chặn">✕</span>
        `;
        tag.querySelector('.domain-tag-remove').onclick = () => {
          list.splice(idx, 1);
          chrome.storage.local.set({ customBlockedDomains: list }, () => {
            loadCustomBlockedDomains();
          });
        };
        customDomainListContainer.appendChild(tag);
      });
    });
  }

  if (addCustomDomainBtn) {
    addCustomDomainBtn.onclick = () => {
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

  // Initial Runs
  renderAnalytics();
  loadConfigStates();
  loadCustomBlockedDomains();
});
