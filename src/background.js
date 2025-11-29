/**
 * LinkedIn Unhecker - Background Script
 * Handles extension badge and cross-tab communication
 */

// Default filter settings
const defaultSettings = {
  enabled: true,
  hideByKeywords: [],
  hideByCompanies: [],
  hideByLocations: [],
  hidePromoted: false,
  hideEasyApply: false,
  hideAlreadyApplied: true,
  minimumSalary: 0,
  filterMode: 'hide'
};

/**
 * Initialize default settings if not set
 */
async function initializeSettings() {
  try {
    const result = await browser.storage.local.get('filterSettings');
    if (!result.filterSettings) {
      await browser.storage.local.set({ filterSettings: defaultSettings });
    }
  } catch (error) {
    console.error('LinkedIn Unhecker: Error initializing settings', error);
  }
}

/**
 * Update the extension badge
 */
function updateBadge(count, tabId) {
  const text = count > 0 ? count.toString() : '';
  const backgroundColor = count > 0 ? '#d32f2f' : '#0a66c2';
  
  if (tabId) {
    browser.browserAction.setBadgeText({ text, tabId });
    browser.browserAction.setBadgeBackgroundColor({ color: backgroundColor, tabId });
  } else {
    browser.browserAction.setBadgeText({ text });
    browser.browserAction.setBadgeBackgroundColor({ color: backgroundColor });
  }
}

/**
 * Handle messages from content script and popup
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateBadge') {
    const tabId = sender.tab ? sender.tab.id : null;
    updateBadge(message.count, tabId);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getSettings') {
    browser.storage.local.get('filterSettings').then(result => {
      sendResponse(result.filterSettings || defaultSettings);
    });
    return true;
  }
  
  if (message.action === 'saveSettings') {
    browser.storage.local.set({ filterSettings: message.settings }).then(() => {
      // Notify all LinkedIn tabs about the update
      browser.tabs.query({ url: '*://*.linkedin.com/*' }).then(tabs => {
        tabs.forEach(tab => {
          browser.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {
            // Tab might not have content script loaded
          });
        });
      });
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * Handle extension installation/update
 */
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    initializeSettings();
    // Open options page on first install
    browser.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    // Migrate settings if needed
    initializeSettings();
  }
});

// Initialize on startup
initializeSettings();
