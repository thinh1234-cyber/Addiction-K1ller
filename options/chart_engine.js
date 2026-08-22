/* ==========================================================================
   ADDICTION K1LLER - Interactive Canvas Chart Engine (Sleek Per-Element Hover & Accurate Time Formatting)
   ========================================================================== */

const ChartEngine = {
  donutSliceRegistry: [],

  getLang() {
    return window.currentLang || 'vi';
  },

  // Format minutes into XXhXXm or XXm
  formatMinutesShort(mins) {
    if (!mins || mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`;
    return `${m}m`;
  },

  // --------------------------------------------------------------------------
  // 1. Bar Chart with Sleek Hover Glow & Accurate Time Tooltip
  // --------------------------------------------------------------------------
  renderBarChart(canvasId, labels, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 550);
    const height = (canvas.height = 240);

    let hoverIdx = -1;
    const lang = this.getLang();
    const minUnit = lang === 'en' ? ' mins' : ' phút';

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (!data || data.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(lang === 'en' ? 'No tracking data recorded' : 'Chưa có dữ liệu theo dõi thời gian', width / 2, height / 2);
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

        const valLabel = Math.round((maxVal - (maxVal / 4) * i) / 60) + minUnit;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(valLabel, paddingLeft - 8, y + 4);
      }

      // Draw Bars
      data.forEach((valSec, i) => {
        const barH = (valSec / maxVal) * chartH;
        const x = paddingLeft + i * stepX + (stepX - barWidth) / 2;
        const y = height - paddingBottom - barH;
        const isHovered = i === hoverIdx;

        const barColor = Array.isArray(colors) ? colors[i] || '#38bdf8' : colors || '#38bdf8';

        ctx.save();
        if (isHovered) {
          ctx.shadowColor = barColor;
          ctx.shadowBlur = 8;
        }

        const grad = ctx.createLinearGradient(0, y, 0, height - paddingBottom);
        grad.addColorStop(0, barColor);
        grad.addColorStop(1, barColor + '44');

        ctx.fillStyle = grad;
        ctx.beginPath();
        const currentBarW = isHovered ? barWidth + 2 : barWidth;
        const currentX = isHovered ? x - 1 : x;
        const currentY = isHovered ? y - 2 : y;
        const currentBarH = isHovered ? barH + 2 : barH;

        ctx.roundRect(currentX, currentY, currentBarW, currentBarH, [6, 6, 0, 0]);
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.restore();

        // Label below bar
        ctx.fillStyle = isHovered ? '#ffffff' : '#cbd5e1';
        ctx.font = isHovered ? 'bold 11px system-ui' : '11px system-ui';
        ctx.textAlign = 'center';
        const shortLabel = labels[i].length > 10 ? labels[i].substring(0, 8) + '..' : labels[i];
        ctx.fillText(shortLabel, x + barWidth / 2, height - paddingBottom + 18);

        // Hover Floating Tooltip
        if (isHovered) {
          const formattedMins = ChartEngine.formatMinutesShort(Math.round(valSec / 60));
          const tooltipText = `${labels[i]}: ${formattedMins}`;
          ctx.font = 'bold 12px system-ui';
          const textWidth = ctx.measureText(tooltipText).width;
          const ttW = textWidth + 16;
          const ttH = 26;
          const ttX = Math.max(10, Math.min(width - ttW - 10, currentX + currentBarW / 2 - ttW / 2));
          const ttY = Math.max(10, currentY - ttH - 8);

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = barColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(ttX, ttY, ttW, ttH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(tooltipText, ttX + ttW / 2, ttY + 17);
        }
      });
    };

    draw();

    const paddingLeft = 60;
    const paddingBottom = 40;
    const chartW = width - paddingLeft - 20;
    const stepX = chartW / data.length;
    const barWidth = Math.min(36, (chartW / data.length) * 0.5);

    canvas.onmousemove = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = evt.clientX - rect.left;
      const mouseY = evt.clientY - rect.top;

      let foundIdx = -1;
      const chartH = height - paddingBottom - 20;
      const maxVal = Math.max(...data, 60);

      data.forEach((val, i) => {
        const barH = (val / maxVal) * chartH;
        const x = paddingLeft + i * stepX + (stepX - barWidth) / 2;
        const y = height - paddingBottom - barH;

        if (mouseX >= x - 4 && mouseX <= x + barWidth + 4 && mouseY >= y - 6 && mouseY <= height - paddingBottom) {
          foundIdx = i;
        }
      });

      if (foundIdx !== hoverIdx) {
        hoverIdx = foundIdx;
        canvas.style.cursor = hoverIdx !== -1 ? 'pointer' : 'default';
        draw();
      }
    };

    canvas.onmouseleave = () => {
      if (hoverIdx !== -1) {
        hoverIdx = -1;
        canvas.style.cursor = 'default';
        draw();
      }
    };
  },

  // --------------------------------------------------------------------------
  // 2. Weekly Trend Chart
  // --------------------------------------------------------------------------
  renderWeeklyTrendChart(canvasId, dayLabels, totalMinutesData, accentColor, maxDayIndex = 6, selectedDayIndex = null, onDayClickCallback = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 900);
    const height = (canvas.height = 240);

    let hoverIdx = -1;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (!totalMinutesData || totalMinutesData.length === 0) return;

      const maxVal = Math.max(...totalMinutesData, 30);
      const paddingLeft = 50;
      const paddingTop = 32;
      const paddingBottom = 40;
      const chartW = width - paddingLeft - 20;
      const chartH = height - paddingBottom - paddingTop;
      const stepX = chartW / 6;

      // Grid Lines
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

      // Trend Line
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

      // Area Fill
      ctx.lineTo(paddingLeft + activeMaxIdx * stepX, height - paddingBottom);
      ctx.lineTo(paddingLeft, height - paddingBottom);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
      areaGrad.addColorStop(0, accentColor ? accentColor + '30' : 'rgba(56, 189, 248, 0.2)');
      areaGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Points & Dashed Guide Line
      dayLabels.forEach((label, i) => {
        const x = paddingLeft + i * stepX;
        const val = i <= activeMaxIdx ? totalMinutesData[i] : 0;
        const y = height - paddingBottom - (val / maxVal) * chartH;
        const isSelected = i === selectedDayIndex;
        const isHovered = i === hoverIdx;

        // Dashed Guide Line matched to exact Point Height (y)
        if ((isSelected || isHovered) && i <= activeMaxIdx) {
          ctx.beginPath();
          ctx.moveTo(x, height - paddingBottom);
          ctx.lineTo(x, y);
          ctx.strokeStyle = isHovered ? '#ffffff' : (accentColor || '#38bdf8');
          ctx.lineWidth = isHovered ? 2 : 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Day Label
        ctx.fillStyle = (isSelected || isHovered) ? '#ffffff' : '#cbd5e1';
        ctx.font = (isSelected || isHovered) ? 'bold 12px system-ui' : '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, height - paddingBottom + 18);

        // Point rendering
        if (i <= activeMaxIdx) {
          ctx.save();
          if (isHovered || isSelected) {
            ctx.shadowColor = accentColor || '#38bdf8';
            ctx.shadowBlur = 8;
          }

          if (isHovered) {
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = accentColor || '#38bdf8';
            ctx.fill();
          } else if (isSelected) {
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = accentColor || '#38bdf8';
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = accentColor || '#38bdf8';
            ctx.fill();
          }
          ctx.restore();

          // Time text above point
          const timeText = ChartEngine.formatMinutesShort(val);
          ctx.fillStyle = (isSelected || isHovered) ? (accentColor || '#38bdf8') : '#f8fafc';
          ctx.font = (isSelected || isHovered) ? 'bold 12px system-ui' : 'bold 11px system-ui';
          ctx.fillText(timeText, x, y - 10);
        }
      });
    };

    draw();

    const paddingLeft = 50;
    const paddingTop = 32;
    const paddingBottom = 40;
    const chartW = width - paddingLeft - 20;
    const stepX = chartW / 6;
    const activeMaxIdx = Math.min(maxDayIndex, totalMinutesData.length - 1);

    canvas.onmousemove = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = evt.clientX - rect.left;

      let foundIdx = -1;
      for (let i = 0; i <= activeMaxIdx; i++) {
        const ptX = paddingLeft + i * stepX;
        if (Math.abs(mouseX - ptX) < stepX / 2) {
          foundIdx = i;
          break;
        }
      }

      if (foundIdx !== hoverIdx) {
        hoverIdx = foundIdx;
        canvas.style.cursor = hoverIdx !== -1 ? 'pointer' : 'default';
        draw();
      }
    };

    canvas.onmouseleave = () => {
      if (hoverIdx !== -1) {
        hoverIdx = -1;
        canvas.style.cursor = 'default';
        draw();
      }
    };

    canvas.onclick = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = evt.clientX - rect.left;

      let closestIdx = -1;
      let minDiff = Infinity;

      for (let i = 0; i <= activeMaxIdx; i++) {
        const ptX = paddingLeft + i * stepX;
        const diff = Math.abs(mouseX - ptX);
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

  // --------------------------------------------------------------------------
  // 3. Donut Chart with Accurate Time Formatting
  // --------------------------------------------------------------------------
  renderDonutChart(canvasId, labels, data, colors, onSliceClickCallback) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 300);
    const height = (canvas.height = 240);

    let hoverIdx = -1;
    const lang = this.getLang();
    const minUnit = lang === 'en' ? ' mins' : ' phút';

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      this.donutSliceRegistry = [];
      const totalSec = data.reduce((a, b) => a + b, 0);

      if (totalSec <= 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(lang === 'en' ? 'No Data' : 'Chưa có dữ liệu', width / 2, height / 2);
        return;
      }

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) / 2 - 25;
      const innerRadius = baseRadius * 0.65;

      let startAngle = -Math.PI / 2;

      data.forEach((valSec, i) => {
        const sliceAngle = (valSec / totalSec) * (2 * Math.PI);
        const endAngle = startAngle + sliceAngle;
        const isHovered = i === hoverIdx;
        const currentRadius = isHovered ? baseRadius + 4 : baseRadius;

        const sliceColor = Array.isArray(colors) ? colors[i % colors.length] : '#38bdf8';

        ctx.save();
        if (isHovered) {
          ctx.shadowColor = sliceColor;
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, currentRadius, startAngle, endAngle);
        ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = sliceColor;
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.restore();

        this.donutSliceRegistry.push({
          label: labels[i],
          valSec: valSec,
          formattedTime: ChartEngine.formatMinutesShort(Math.round(valSec / 60)),
          percent: Math.round((valSec / totalSec) * 100),
          startAngle,
          endAngle,
          color: sliceColor
        });

        startAngle = endAngle;
      });

      // Center Total Text in Formatted Time (e.g. 91 mins / 91 phút)
      const totalMins = Math.round(totalSec / 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(totalMins + minUnit, cx, cy + 5);

      // Tooltip for hovered slice
      if (hoverIdx !== -1 && this.donutSliceRegistry[hoverIdx]) {
        const hit = this.donutSliceRegistry[hoverIdx];
        const ttText = `${hit.label}: ${hit.formattedTime} (${hit.percent}%)`;
        ctx.font = 'bold 11px system-ui';
        const tw = ctx.measureText(ttText).width + 16;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = hit.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - tw / 2, cy - 28, tw, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(ttText, cx, cy - 13);
      }
    };

    draw();

    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) / 2 - 25;
    const innerRadius = baseRadius * 0.65;

    canvas.onmousemove = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = evt.clientX - rect.left;
      const mouseY = evt.clientY - rect.top;

      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let foundIdx = -1;
      if (dist >= innerRadius && dist <= baseRadius + 6) {
        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) angle += 2 * Math.PI;

        foundIdx = this.donutSliceRegistry.findIndex(
          (slice) => angle >= slice.startAngle && angle <= slice.endAngle
        );
      }

      if (foundIdx !== hoverIdx) {
        hoverIdx = foundIdx;
        canvas.style.cursor = hoverIdx !== -1 ? 'pointer' : 'default';
        draw();
      }
    };

    canvas.onmouseleave = () => {
      if (hoverIdx !== -1) {
        hoverIdx = -1;
        canvas.style.cursor = 'default';
        draw();
      }
    };

    canvas.onclick = (evt) => {
      if (hoverIdx !== -1 && this.donutSliceRegistry[hoverIdx] && onSliceClickCallback) {
        onSliceClickCallback(this.donutSliceRegistry[hoverIdx]);
      }
    };
  },

  // --------------------------------------------------------------------------
  // 4. 24-Hour Usage Heatmap Chart (Subtle Theme Accent Hover)
  // --------------------------------------------------------------------------
  renderHourlyHeatmapChart(canvasId, hourlyMinutesData, accentColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 900);
    const height = (canvas.height = 180);

    let hoverIdx = -1;
    const lang = this.getLang();
    const slotWord = lang === 'en' ? 'Slot' : 'Khung';

    const data = hourlyMinutesData || [0,0,0,0,0,0, 5,12,25,30,15,40, 20,35,45,28,10,18, 42,50,38,20,10,2];
    const maxMins = Math.max(...data, 15);
    const paddingLeft = 40;
    const paddingTop = 20;
    const paddingBottom = 35;
    const chartW = width - paddingLeft - 20;
    const chartH = height - paddingTop - paddingBottom;
    const colWidth = chartW / 24;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      data.forEach((mins, h) => {
        const x = paddingLeft + h * colWidth + 2;
        const barW = colWidth - 4;
        const intensity = mins / maxMins;
        const isHovered = h === hoverIdx;

        const barH = Math.max(4, intensity * chartH);
        const y = height - paddingBottom - barH;

        ctx.save();
        if (isHovered) {
          ctx.shadowColor = accentColor || '#38bdf8';
          ctx.shadowBlur = 8;
        }

        ctx.fillStyle = mins > 0 ? (accentColor || '#38bdf8') : 'rgba(148, 163, 184, 0.15)';
        ctx.globalAlpha = isHovered ? 1.0 : (mins > 0 ? 0.3 + intensity * 0.7 : 0.3);
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();

        // Hour label
        if (h % 3 === 0) {
          ctx.fillStyle = isHovered ? '#ffffff' : '#94a3b8';
          ctx.font = isHovered ? 'bold 10px system-ui' : '10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(`${h}h`, x + barW / 2, height - paddingBottom + 16);
        }

        // Hover Tooltip
        if (isHovered) {
          const ttText = `${slotWord} ${h}:00 - ${mins}m`;
          ctx.font = 'bold 11px system-ui';
          const tw = ctx.measureText(ttText).width + 16;
          const ttX = Math.max(10, Math.min(width - tw - 10, x + barW / 2 - tw / 2));
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = accentColor || '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(ttX, Math.max(4, y - 28), tw, 22, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(ttText, ttX + tw / 2, Math.max(4, y - 28) + 15);
        }
      });
    };

    draw();

    canvas.onmousemove = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = evt.clientX - rect.left;
      let foundIdx = -1;

      for (let h = 0; h < 24; h++) {
        const x = paddingLeft + h * colWidth;
        if (mouseX >= x && mouseX <= x + colWidth) {
          foundIdx = h;
          break;
        }
      }

      if (foundIdx !== hoverIdx) {
        hoverIdx = foundIdx;
        canvas.style.cursor = hoverIdx !== -1 ? 'pointer' : 'default';
        draw();
      }
    };

    canvas.onmouseleave = () => {
      if (hoverIdx !== -1) {
        hoverIdx = -1;
        canvas.style.cursor = 'default';
        draw();
      }
    };
  }
};
