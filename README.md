# LinkedIn Unhecker

A Firefox addon that allows you to filter LinkedIn job offers based on various criteria.

## Features

- **Filter by Keywords**: Hide jobs containing specific keywords in the title
- **Filter by Companies**: Block job listings from specific companies
- **Filter by Locations**: Hide jobs from certain locations
- **Quick Filters**:
  - Hide promoted/sponsored jobs
  - Hide Easy Apply jobs
  - Hide jobs you've already applied to
- **Filter Modes**:
  - **Hide**: Completely remove filtered jobs from view
  - **Highlight**: Dim filtered jobs and show the filter reason
- **Auto-save**: Settings are automatically saved and synced

## Installation

### From Firefox Add-ons (Recommended)
*(Coming soon)*

### Manual Installation (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/dkbu/linkedin-unhecker.git
   cd linkedin-unhecker
   ```

2. Open Firefox and navigate to `about:debugging`

3. Click "This Firefox" in the left sidebar

4. Click "Load Temporary Add-on..."

5. Navigate to the `src` folder and select the `manifest.json` file

The extension will be loaded and active until you restart Firefox.

## Usage

1. Navigate to LinkedIn Jobs: [linkedin.com/jobs](https://www.linkedin.com/jobs/)

2. Click the LinkedIn Unhecker icon in your browser toolbar to:
   - Toggle filtering on/off
   - Enable/disable quick filters
   - Switch between hide and highlight modes
   - View filtering statistics

3. Click "Advanced Filters" to:
   - Add keywords to filter by job title
   - Add company names to block
   - Add locations to filter

## Screenshots

*(Coming soon)*

## Development

### Project Structure

```
src/
├── manifest.json       # Extension manifest
├── background.js       # Background script for badge and messaging
├── content.js          # Content script for filtering jobs
├── content.css         # Styles for filtered jobs
├── icons/              # Extension icons
├── popup/              # Popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── options/            # Options page
    ├── options.html
    ├── options.css
    └── options.js
```

### Testing

1. Load the extension as described in the installation section
2. Navigate to LinkedIn Jobs
3. Open the browser console to see filtering logs
4. Use the popup and options page to configure filters

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under CC0 1.0 Universal - see the [LICENSE](LICENSE) file for details.