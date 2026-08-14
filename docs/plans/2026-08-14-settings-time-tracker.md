# Implementation Plan: Settings Page & Time Tracker Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a comprehensive Settings & Analytics Dashboard to the Kill Addiction Chrome Extension featuring full platform configuration, DOM Zapper management, and real-time Chrome active usage & web tab domain time tracking charts.

**Architecture:** 
- A background service worker (`background/background.js`) tracks active tab domains and focus time using `chrome.tabs` and `chrome.idle` APIs, saving daily metrics in `chrome.storage.local`.
- A dedicated Settings Modal/Tab (`options/settings.html`, `options/settings.js`, `options/settings.css`) accessible via a ⚙️ Settings button in the Popup header (`popup/popup.html`).
- Embedded lightweight, high-performance canvas chart system for time analytics (Chrome screen time breakdown & per-domain breakdown).

**Tech Stack:** HTML5, CSS Variables (VS Code Pastel Theme System), Vanilla JavaScript (ES6+), Chrome Extension APIs (Manifest V3 Service Worker, `chrome.tabs`, `chrome.idle`, `chrome.storage.local`), Canvas 2D API for charts.

---

## File Structure & Responsibilities

- **`manifest.json`**: Add `background` service worker script and `idle` / `tabs` permissions.
- **`background/background.js`**: Background service worker to track active tab URL/domain, active state, idle status, and update daily domain usage time in `chrome.storage.local`.
- **`popup/popup.html`**: Add ⚙️ Setting icon button in the header bar.
- **`popup/popup.css`**: Style the setting button matching the VS Code Pastel theme.
- **`popup/popup.js`**: Open the Settings page when the ⚙️ Setting button is clicked.
- **`options/settings.html`**: The full Settings & Time Analytics UI layout (Config panel + Time Tracker Charts).
- **`options/settings.css`**: Styling for the Settings page, responsive tabs, grid cards, and chart containers using VS Code Pastel design system.
- **`options/settings.js`**: Controller script to handle tab navigation, config updates, Zapped list management, data fetching from storage, and rendering interactive time tracking charts.
- **`options/chart_engine.js`**: Custom lightweight canvas chart module for rendering daily domain breakdown bar & donut charts without external NPM dependencies.

---

### Task 1: Background Service Worker & Time Tracking Engine

**Files:**
- Create: `background/background.js`
- Modify: `manifest.json:6-18`

- [ ] **Step 1: Add Manifest permissions and background service worker registration**
  Update `manifest.json` to include `"background": { "service_worker": "background/background.js" }`, and add `"idle"` to `permissions`.

- [ ] **Step 2: Implement domain extractor and time recorder in `background/background.js`**
  Write background logic to listen to `chrome.tabs.onActivated`, `chrome.tabs.onUpdated`, `chrome.windows.onFocusChanged`, and `chrome.idle.onStateChanged`.

- [ ] **Step 3: Test background active domain duration calculation**
  Verify that switching tabs updates `domainTimeData` for the current date (`YYYY-MM-DD`) in `chrome.storage.local`.

---

### Task 2: Popup Header ⚙️ Settings Button Integration

**Files:**
- Modify: `popup/popup.html:15-28`
- Modify: `popup/popup.css:125-145`
- Modify: `popup/popup.js:75-90`

- [ ] **Step 1: Add ⚙️ Setting button to `popup/popup.html`**
  Insert `<button id="settings-btn" class="icon-btn" title="Cài đặt & Thống kê thời gian">⚙️</button>` inside `.header-right`.

- [ ] **Step 2: Add CSS styles for `.icon-btn` in `popup/popup.css`**
  Style the setting button with hover effects adhering to active VS Code Pastel themes.

- [ ] **Step 3: Connect button event in `popup/popup.js`**
  Use `chrome.runtime.openOptionsPage()` or `chrome.tabs.create({ url: 'options/settings.html' })` to open the Settings page.

---

### Task 3: Options Settings UI & Configuration Panel

**Files:**
- Create: `options/settings.html`
- Create: `options/settings.css`
- Create: `options/settings.js`

- [ ] **Step 1: Build HTML structure in `options/settings.html`**
  Create navigation tabs (⚙️ Cấu hình tổng quan, 📊 Thống kê thời gian, 🎯 Quản lý Zapped Elements).

- [ ] **Step 2: Implement VS Code Pastel Design Tokens in `options/settings.css`**
  Apply CSS variable themes (`dark`, `cappuccino`, `pink`, `light-white`, `gray`) to the Settings dashboard.

- [ ] **Step 3: Implement Configuration & Zapped list manager in `options/settings.js`**
  Enable toggling platform feeds, clearing specific zapped selectors, and customizing focus banner text.

---

### Task 4: Interactive Chrome & Web Tab Time Tracking Analytics Dashboard

**Files:**
- Create: `options/chart_engine.js`
- Modify: `options/settings.html:45-80`
- Modify: `options/settings.js:90-160`

- [ ] **Step 1: Create Lightweight Canvas Chart Engine in `options/chart_engine.js`**
  Implement bar chart and donut chart rendering functions for daily total usage and top web domain breakdowns.

- [ ] **Step 2: Render Chrome active usage metrics and per-tab domain list in `options/settings.js`**
  Fetch time tracking data from `chrome.storage.local`, calculate total active Chrome screen time today vs this week, and render domain ranking list with percentage bars.

- [ ] **Step 3: Verify chart responsiveness and theme synchronization**
  Ensure charts re-render dynamically when switching themes or date filters (Hôm nay / 7 ngày qua).
