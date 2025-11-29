/**
 * LinkedIn Unhecker - Content Script
 * Filters LinkedIn job listings based on user-defined criteria
 */

(function() {
  'use strict';

  // Default filter settings
  let filterSettings = {
    enabled: true,
    hideByKeywords: [],
    hideByCompanies: [],
    hideByLocations: [],
    hidePromoted: false,
    hideEasyApply: false,
    hideAlreadyApplied: true,
    minimumSalary: 0,
    filterMode: 'hide' // 'hide' or 'highlight'
  };

  // CSS class for hidden/highlighted jobs
  const HIDDEN_CLASS = 'linkedin-unhecker-hidden';
  const HIGHLIGHT_CLASS = 'linkedin-unhecker-highlight';

  /**
   * Load filter settings from storage
   */
  async function loadSettings() {
    try {
      const result = await browser.storage.local.get('filterSettings');
      if (result.filterSettings) {
        filterSettings = { ...filterSettings, ...result.filterSettings };
      }
    } catch (error) {
      console.error('LinkedIn Unhecker: Error loading settings', error);
    }
  }

  /**
   * Check if a job listing matches any filter criteria
   * @param {Element} jobCard - The job card element
   * @returns {Object} - Match result with reason
   */
  function checkJobFilters(jobCard) {
    if (!filterSettings.enabled) {
      return { shouldFilter: false, reason: null };
    }

    // Get job details from the card
    const jobTitle = getJobTitle(jobCard);
    const companyName = getCompanyName(jobCard);
    const location = getJobLocation(jobCard);
    const isPromoted = checkIfPromoted(jobCard);
    const isEasyApply = checkIfEasyApply(jobCard);
    const hasApplied = checkIfAlreadyApplied(jobCard);

    // Check hide already applied
    if (filterSettings.hideAlreadyApplied && hasApplied) {
      return { shouldFilter: true, reason: 'Already applied' };
    }

    // Check promoted filter
    if (filterSettings.hidePromoted && isPromoted) {
      return { shouldFilter: true, reason: 'Promoted job' };
    }

    // Check Easy Apply filter
    if (filterSettings.hideEasyApply && isEasyApply) {
      return { shouldFilter: true, reason: 'Easy Apply job' };
    }

    // Check keyword filters (title)
    for (const keyword of filterSettings.hideByKeywords) {
      if (keyword && jobTitle.toLowerCase().includes(keyword.toLowerCase())) {
        return { shouldFilter: true, reason: `Keyword: ${keyword}` };
      }
    }

    // Check company filters
    for (const company of filterSettings.hideByCompanies) {
      if (company && companyName.toLowerCase().includes(company.toLowerCase())) {
        return { shouldFilter: true, reason: `Company: ${company}` };
      }
    }

    // Check location filters
    for (const loc of filterSettings.hideByLocations) {
      if (loc && location.toLowerCase().includes(loc.toLowerCase())) {
        return { shouldFilter: true, reason: `Location: ${loc}` };
      }
    }

    return { shouldFilter: false, reason: null };
  }

  /**
   * Get job title from card
   */
  function getJobTitle(jobCard) {
    const titleElement = jobCard.querySelector('.job-card-list__title, .jobs-unified-top-card__job-title, a.job-card-container__link, .job-card-list__title--link');
    return titleElement ? titleElement.textContent.trim() : '';
  }

  /**
   * Get company name from card
   */
  function getCompanyName(jobCard) {
    const companyElement = jobCard.querySelector('.job-card-container__primary-description, .job-card-container__company-name, .jobs-unified-top-card__company-name, .artdeco-entity-lockup__subtitle');
    return companyElement ? companyElement.textContent.trim() : '';
  }

  /**
   * Get job location from card
   */
  function getJobLocation(jobCard) {
    const locationElement = jobCard.querySelector('.job-card-container__metadata-item, .jobs-unified-top-card__bullet, .job-card-container__metadata-wrapper');
    return locationElement ? locationElement.textContent.trim() : '';
  }

  /**
   * Check if job is promoted
   */
  function checkIfPromoted(jobCard) {
    const promotedElement = jobCard.querySelector('.job-card-container__footer-job-state, .jobs-premium-applicant-insights');
    if (promotedElement && promotedElement.textContent.toLowerCase().includes('promoted')) {
      return true;
    }
    // Also check for promoted label
    const footerItems = jobCard.querySelectorAll('.job-card-container__footer-item');
    for (const item of footerItems) {
      if (item.textContent.toLowerCase().includes('promoted')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if job has Easy Apply
   */
  function checkIfEasyApply(jobCard) {
    const easyApplyElement = jobCard.querySelector('.job-card-container__apply-method, .jobs-apply-button--top-card');
    if (easyApplyElement && easyApplyElement.textContent.toLowerCase().includes('easy apply')) {
      return true;
    }
    // Check for Easy Apply icon/badge
    const easyApplyIcon = jobCard.querySelector('[data-job-search-easy-apply="true"], .jobs-apply-button');
    return !!easyApplyIcon;
  }

  /**
   * Check if user already applied
   */
  function checkIfAlreadyApplied(jobCard) {
    const appliedElement = jobCard.querySelector('.job-card-container__footer-job-state');
    if (appliedElement && appliedElement.textContent.toLowerCase().includes('applied')) {
      return true;
    }
    // Check for applied badge
    const appliedBadge = jobCard.querySelector('.job-card-list__footer-wrapper .artdeco-inline-feedback');
    if (appliedBadge && appliedBadge.textContent.toLowerCase().includes('applied')) {
      return true;
    }
    return false;
  }

  /**
   * Apply filter to a single job card
   */
  function applyFilterToJob(jobCard) {
    const { shouldFilter, reason } = checkJobFilters(jobCard);
    
    // Remove existing classes
    jobCard.classList.remove(HIDDEN_CLASS, HIGHLIGHT_CLASS);
    
    if (shouldFilter) {
      if (filterSettings.filterMode === 'hide') {
        jobCard.classList.add(HIDDEN_CLASS);
      } else {
        jobCard.classList.add(HIGHLIGHT_CLASS);
      }
      
      // Add data attribute with filter reason
      jobCard.dataset.filterReason = reason;
    } else {
      delete jobCard.dataset.filterReason;
    }
  }

  /**
   * Get all job cards on the page
   */
  function getJobCards() {
    return document.querySelectorAll('.job-card-container, .jobs-search-results__list-item, .scaffold-layout__list-item, [data-job-id]');
  }

  /**
   * Filter all jobs on the page
   */
  function filterAllJobs() {
    const jobCards = getJobCards();
    let filteredCount = 0;
    
    jobCards.forEach(jobCard => {
      applyFilterToJob(jobCard);
      if (jobCard.classList.contains(HIDDEN_CLASS) || jobCard.classList.contains(HIGHLIGHT_CLASS)) {
        filteredCount++;
      }
    });

    // Update badge count
    updateBadgeCount(filteredCount);
    
    console.log(`LinkedIn Unhecker: Filtered ${filteredCount} of ${jobCards.length} jobs`);
  }

  /**
   * Update extension badge with filtered count
   */
  function updateBadgeCount(count) {
    try {
      browser.runtime.sendMessage({
        action: 'updateBadge',
        count: count
      });
    } catch (error) {
      // Background script may not be available
    }
  }

  /**
   * Set up MutationObserver to handle dynamically loaded content
   */
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldFilter = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this is a job card or contains job cards
              if (node.matches && (node.matches('.job-card-container, .jobs-search-results__list-item, [data-job-id]') ||
                  node.querySelector('.job-card-container, .jobs-search-results__list-item, [data-job-id]'))) {
                shouldFilter = true;
                break;
              }
            }
          }
        }
        if (shouldFilter) break;
      }
      
      if (shouldFilter) {
        // Debounce filtering
        clearTimeout(window.linkedinUnheckerTimeout);
        window.linkedinUnheckerTimeout = setTimeout(filterAllJobs, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Listen for settings updates from popup/options
   */
  function setupMessageListener() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'settingsUpdated') {
        loadSettings().then(() => {
          filterAllJobs();
          sendResponse({ success: true });
        });
        return true;
      }
      
      if (message.action === 'getStats') {
        const jobCards = getJobCards();
        const hiddenCount = document.querySelectorAll('.' + HIDDEN_CLASS).length;
        const highlightedCount = document.querySelectorAll('.' + HIGHLIGHT_CLASS).length;
        
        sendResponse({
          total: jobCards.length,
          filtered: hiddenCount + highlightedCount,
          hidden: hiddenCount,
          highlighted: highlightedCount
        });
        return true;
      }

      if (message.action === 'toggleEnabled') {
        filterSettings.enabled = message.enabled;
        browser.storage.local.set({ filterSettings });
        filterAllJobs();
        sendResponse({ success: true });
        return true;
      }
    });
  }

  /**
   * Initialize the content script
   */
  async function init() {
    console.log('LinkedIn Unhecker: Initializing...');
    
    await loadSettings();
    setupMessageListener();
    
    // Initial filtering
    filterAllJobs();
    
    // Set up observer for dynamic content
    setupObserver();
    
    // Also filter on URL changes (LinkedIn uses client-side navigation)
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(filterAllJobs, 500);
      }
    }, 1000);
    
    console.log('LinkedIn Unhecker: Initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
