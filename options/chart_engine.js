/* ==========================================================================
   KILL ADDICTION - Interactive Canvas Chart Engine (Weekly Trend & Donut Slice Interaction)
   ========================================================================== */

const ChartEngine = {
  donutSliceRegistry: [],

  // Format minutes into XXhXXm or XXm
  formatMinutesShort(mins) {
    if (!mins || mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`;
    return `${m}m`;
  },

  // Render Bar Chart for Top Domains (Supports per-domain custom color array)
  renderBarChart(canvasId, labels, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 550);
    const height = (canvas.height = 240);

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Chưa có dữ liệu theo dõi thời gian', width / 2, height / 2);
      return;
    }

    const maxVal = Math.max(...data, 60);
    const paddingLeft = 60;
    const paddingBottom = 40;
    const chartW = width - paddingLeft - 20;
    const chartH = height - paddingBottom - 20;
    const barWidth = Math.min(36, (chartW / data.length) * 0.5);
    const stepX = chartW / data.length;

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 20 + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();

      const valLabel = Math.round((maxVal - (maxVal / 4) * i) / 60) + ' phút';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(valLabel, paddingLeft - 8, y + 4);
    }

    // Draw Bars
    data.forEach((val, i) => {
      const barH = (val / maxVal) * chartH;
      const x = paddingLeft + i * stepX + (stepX - barWidth) / 2;
      const y = height - paddingBottom - barH;

      const barColor = Array.isArray(colors) ? colors[i] || '#38bdf8' : colors || '#38bdf8';

      const grad = ctx.createLinearGradient(0, y, 0, height - paddingBottom);
      grad.addColorStop(0, barColor);
      grad.addColorStop(1, barColor + '33');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Label below bar
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      const shortLabel = labels[i].length > 10 ? labels[i].substring(0, 8) + '..' : labels[i];
      ctx.fillText(shortLabel, x + barWidth / 2, height - paddingBottom + 18);
    });
  },

  // Render Weekly Total Usage Bar/Trend Chart with XXhXXm labels, current-day line cutoff & day selection interactivity
  renderWeeklyTrendChart(canvasId, dayLabels, totalMinutesData, accentColor, maxDayIndex = 6, selectedDayIndex = null, onDayClickCallback = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 900);
    const height = (canvas.height = 240);

    ctx.clearRect(0, 0, width, height);

    if (!totalMinutesData || totalMinutesData.length === 0) return;

    const maxVal = Math.max(...totalMinutesData, 30);
    const paddingLeft = 50;
    const paddingTop = 32;
    const paddingBottom = 40;
    const chartW = width - paddingLeft - 20;
    const chartH = height - paddingBottom - paddingTop;
    const stepX = chartW / 6; // 7 days (T2 - CN)

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = paddingTop + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();

      const valLabel = Math.round(maxVal - (maxVal / 3) * i) + 'm';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(valLabel, paddingLeft - 8, y + 4);
    }

    const activeMaxIdx = Math.min(maxDayIndex, totalMinutesData.length - 1);

    // Draw Smooth Trend Line ONLY up to activeMaxIdx
    ctx.beginPath();
    for (let i = 0; i <= activeMaxIdx; i++) {
      const val = totalMinutesData[i];
      const x = paddingLeft + i * stepX;
      const y = height - paddingBottom - (val / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = accentColor || '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Area Fill below Line up to activeMaxIdx
    ctx.lineTo(paddingLeft + activeMaxIdx * stepX, height - paddingBottom);
    ctx.lineTo(paddingLeft, height - paddingBottom);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
    areaGrad.addColorStop(0, accentColor ? accentColor + '40' : 'rgba(56, 189, 248, 0.25)');
    areaGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Draw Data Points, Time Text (XXhXXm) above point, & Day Labels below
    dayLabels.forEach((label, i) => {
      const x = paddingLeft + i * stepX;

      // Draw vertical guide line if selected
      if (i === selectedDayIndex) {
        ctx.beginPath();
        ctx.moveTo(x, paddingTop - 10);
        ctx.lineTo(x, height - paddingBottom);
        ctx.strokeStyle = accentColor || '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Render Day Label at bottom for all 7 days
      ctx.fillStyle = i === selectedDayIndex ? '#ffffff' : '#cbd5e1';
      ctx.font = i === selectedDayIndex ? 'bold 12px system-ui' : '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, height - paddingBottom + 18);

      // Render Point & Top Time Text ONLY for days up to activeMaxIdx
      if (i <= activeMaxIdx) {
        const val = totalMinutesData[i];
        const y = height - paddingBottom - (val / maxVal) * chartH;

        if (i === selectedDayIndex) {
          // Selected Highlight Ring
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = accentColor || '#38bdf8';
          ctx.fill();
        } else {
          // Normal Point circle
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = accentColor || '#38bdf8';
          ctx.fill();
        }

        // Time Text above point (e.g. 1h25m or 45m)
        const timeText = this.formatMinutesShort(val);
        ctx.fillStyle = i === selectedDayIndex ? (accentColor || '#38bdf8') : '#f8fafc';
        ctx.font = i === selectedDayIndex ? 'bold 12px system-ui' : 'bold 11px system-ui';
        ctx.fillText(timeText, x, y - 10);
      }
    });

    // Attach Click Handler for Day Selection
    canvas.onclick = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const x = evt.clientX - rect.left;

      const stepX = chartW / 6;
      let closestIdx = -1;
      let minDiff = Infinity;

      for (let i = 0; i <= activeMaxIdx; i++) {
        const ptX = paddingLeft + i * stepX;
        const diff = Math.abs(x - ptX);
        if (diff < stepX / 2 && diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }

      if (closestIdx !== -1 && onDayClickCallback) {
        onDayClickCallback(closestIdx);
      }
    };
  },

  // Render Interactive Donut Chart for Usage Distribution
  renderDonutChart(canvasId, labels, data, colors, onSliceClickCallback) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 300);
    const height = (canvas.height = 240);

    ctx.clearRect(0, 0, width, height);

    this.donutSliceRegistry = [];
    const total = data.reduce((a, b) => a + b, 0);

    if (total <= 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Chưa có dữ liệu', width / 2, height / 2);
      return;
    }

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 25;
    const innerRadius = radius * 0.65;

    let startAngle = -Math.PI / 2;

    data.forEach((val, i) => {
      const sliceAngle = (val / total) * (2 * Math.PI);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      const sliceColor = Array.isArray(colors) ? colors[i % colors.length] : '#38bdf8';
      ctx.fillStyle = sliceColor;
      ctx.fill();

      this.donutSliceRegistry.push({
        label: labels[i],
        val: val,
        percent: Math.round((val / total) * 100),
        startAngle,
        endAngle,
        color: sliceColor
      });

      startAngle = endAngle;
    });

    // Center Total Text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(total / 60) + ' phút', cx, cy + 5);

    // Attach Click Handler for Slice Interactivity
    canvas.onclick = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= innerRadius && dist <= radius) {
        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) angle += 2 * Math.PI;

        const hit = this.donutSliceRegistry.find(
          (slice) => angle >= slice.startAngle && angle <= slice.endAngle
        );

        if (hit && onSliceClickCallback) {
          onSliceClickCallback(hit);
        }
      }
    };
  }
};
