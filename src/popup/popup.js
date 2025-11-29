/**
 * LinkedIn Unhecker - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const enableToggle = document.getElementById('enableToggle');
  const hidePromoted = document.getElementById('hidePromoted');
  const hideEasyApply = document.getElementById('hideEasyApply');
  const hideAlreadyApplied = document.getElementById('hideAlreadyApplied');
  const filterModeRadios = document.querySelectorAll('input[name="filterMode"]');
  const openOptionsBtn = document.getElementById('openOptions');
  const refreshFilterBtn = document.getElementById('refreshFilter');
  const totalJobsEl = document.getElementById('totalJobs');
  const filteredJobsEl = document.getElementById('filteredJobs');

  // Load current settings
  let settings = await browser.runtime.sendMessage({ action: 'getSettings' });
  
  // Update UI with current settings
  enableToggle.checked = settings.enabled;
  hidePromoted.checked = settings.hidePromoted;
  hideEasyApply.checked = settings.hideEasyApply;
  hideAlreadyApplied.checked = settings.hideAlreadyApplied;
  
  filterModeRadios.forEach(radio => {
    radio.checked = radio.value === settings.filterMode;
  });

  // Get stats from current tab
  async function updateStats() {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
        const stats = await browser.tabs.sendMessage(tabs[0].id, { action: 'getStats' });
        totalJobsEl.textContent = stats.total;
        filteredJobsEl.textContent = stats.filtered;
      } else {
        totalJobsEl.textContent = '-';
        filteredJobsEl.textContent = '-';
      }
    } catch (error) {
      totalJobsEl.textContent = '-';
      filteredJobsEl.textContent = '-';
    }
  }

  // Save settings and notify content script
  async function saveSettings() {
    settings.enabled = enableToggle.checked;
    settings.hidePromoted = hidePromoted.checked;
    settings.hideEasyApply = hideEasyApply.checked;
    settings.hideAlreadyApplied = hideAlreadyApplied.checked;
    
    filterModeRadios.forEach(radio => {
      if (radio.checked) {
        settings.filterMode = radio.value;
      }
    });

    await browser.runtime.sendMessage({ action: 'saveSettings', settings });
    updateStats();
  }

  // Event listeners
  enableToggle.addEventListener('change', saveSettings);
  hidePromoted.addEventListener('change', saveSettings);
  hideEasyApply.addEventListener('change', saveSettings);
  hideAlreadyApplied.addEventListener('change', saveSettings);
  filterModeRadios.forEach(radio => {
    radio.addEventListener('change', saveSettings);
  });

  openOptionsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });

  refreshFilterBtn.addEventListener('click', async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
        await browser.tabs.sendMessage(tabs[0].id, { action: 'settingsUpdated' });
        updateStats();
      }
    } catch (error) {
      console.error('Error refreshing filter:', error);
    }
  });

  // Initial stats update
  updateStats();
});
