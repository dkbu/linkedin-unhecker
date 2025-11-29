/**
 * LinkedIn Unhecker - Options Page Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  const keywordsInput = document.getElementById('keywordsInput');
  const keywordsTags = document.getElementById('keywordsTags');
  const companiesInput = document.getElementById('companiesInput');
  const companiesTags = document.getElementById('companiesTags');
  const locationsInput = document.getElementById('locationsInput');
  const locationsTags = document.getElementById('locationsTags');
  const hidePromoted = document.getElementById('hidePromoted');
  const hideEasyApply = document.getElementById('hideEasyApply');
  const hideAlreadyApplied = document.getElementById('hideAlreadyApplied');
  const filterModeRadios = document.querySelectorAll('input[name="filterMode"]');
  const saveStatus = document.getElementById('saveStatus');

  // Load settings
  let settings = await browser.runtime.sendMessage({ action: 'getSettings' });

  /**
   * Create a tag element
   */
  function createTag(text, onRemove) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = text;
    
    const removeBtn = document.createElement('span');
    removeBtn.className = 'tag-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      onRemove(text);
      tag.remove();
    });
    
    tag.appendChild(removeBtn);
    return tag;
  }

  /**
   * Render tags for a filter list
   */
  function renderTags(container, items, onRemove) {
    container.innerHTML = '';
    items.forEach(item => {
      container.appendChild(createTag(item, onRemove));
    });
  }

  /**
   * Setup tag input
   */
  function setupTagInput(input, container, items, settingsKey) {
    // Render existing tags
    renderTags(container, items, (text) => {
      const index = settings[settingsKey].indexOf(text);
      if (index > -1) {
        settings[settingsKey].splice(index, 1);
        saveSettings();
      }
    });

    // Handle new tag input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const value = input.value.trim();
        if (value && !settings[settingsKey].includes(value)) {
          settings[settingsKey].push(value);
          saveSettings();
          renderTags(container, settings[settingsKey], (text) => {
            const index = settings[settingsKey].indexOf(text);
            if (index > -1) {
              settings[settingsKey].splice(index, 1);
              saveSettings();
            }
          });
          input.value = '';
        }
      }
    });

    // Handle paste
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const values = pastedText.split(/[,\n]/).map(v => v.trim()).filter(v => v);
      
      values.forEach(value => {
        if (value && !settings[settingsKey].includes(value)) {
          settings[settingsKey].push(value);
        }
      });
      
      saveSettings();
      renderTags(container, settings[settingsKey], (text) => {
        const index = settings[settingsKey].indexOf(text);
        if (index > -1) {
          settings[settingsKey].splice(index, 1);
          saveSettings();
        }
      });
    });
  }

  /**
   * Save settings
   */
  async function saveSettings() {
    await browser.runtime.sendMessage({ action: 'saveSettings', settings });
    showSaveStatus();
  }

  /**
   * Show save status message
   */
  function showSaveStatus() {
    saveStatus.textContent = 'Settings saved!';
    saveStatus.style.color = '#28a745';
    
    setTimeout(() => {
      saveStatus.textContent = 'Settings auto-saved';
      saveStatus.style.color = '#28a745';
    }, 2000);
  }

  /**
   * Update settings from UI
   */
  function updateSettingsFromUI() {
    settings.hidePromoted = hidePromoted.checked;
    settings.hideEasyApply = hideEasyApply.checked;
    settings.hideAlreadyApplied = hideAlreadyApplied.checked;
    
    filterModeRadios.forEach(radio => {
      if (radio.checked) {
        settings.filterMode = radio.value;
      }
    });
    
    saveSettings();
  }

  // Initialize UI with settings
  hidePromoted.checked = settings.hidePromoted;
  hideEasyApply.checked = settings.hideEasyApply;
  hideAlreadyApplied.checked = settings.hideAlreadyApplied;
  
  filterModeRadios.forEach(radio => {
    radio.checked = radio.value === settings.filterMode;
  });

  // Setup tag inputs
  setupTagInput(keywordsInput, keywordsTags, settings.hideByKeywords, 'hideByKeywords');
  setupTagInput(companiesInput, companiesTags, settings.hideByCompanies, 'hideByCompanies');
  setupTagInput(locationsInput, locationsTags, settings.hideByLocations, 'hideByLocations');

  // Event listeners for checkboxes and radios
  hidePromoted.addEventListener('change', updateSettingsFromUI);
  hideEasyApply.addEventListener('change', updateSettingsFromUI);
  hideAlreadyApplied.addEventListener('change', updateSettingsFromUI);
  filterModeRadios.forEach(radio => {
    radio.addEventListener('change', updateSettingsFromUI);
  });
});
