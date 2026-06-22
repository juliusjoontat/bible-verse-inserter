# Bible Verse Inserter - Multi-Browser Extension

A powerful, privacy-focused browser extension that lets you quickly insert Bible verses into any text field on the web.

**Supported Browsers:**
- ✅ Chrome / Chromium
- ✅ Firefox
- ✅ Microsoft Edge
- ✅ Opera
- ✅ Brave

**Supported Bible Versions:**
- ESV (English Standard Version)
- NIV (New International Version)
- NASB (New American Standard Bible)
- KJV (King James Version)
- NKJV (New King James Version)
- ASV (American Standard Version)
- WEB (World English Bible)
- YLT (Young's Literal Translation)

## Features

🔍 **Quick Lookup** - Search Bible verses by reference (e.g., "John 3:16")
📋 **Copy to Clipboard** - Copy verses with one click
✏️ **Auto-Paste** - Automatically paste verses into text fields
🌐 **Multi-Browser** - Works on Chrome, Firefox, Edge, Opera, and Brave
⚡ **Fast & Lightweight** - Cloud-based backend means no heavy local data
🔒 **Privacy-Focused** - Data stored securely on your own Supabase instance
💰 **Free to Launch** - $0 startup cost with generous free tier

## Quick Start

### 1. Prerequisites

- Node.js 16+ and npm 7+
- A Supabase account (free at supabase.com)
- A modern web browser

### 2. Clone & Setup Project

```bash
# Clone the project
git clone https://github.com/your-repo/bible-extension-project.git
cd bible-extension-project

# Install dependencies
npm install
```

### 3. Configure Supabase

**Step 1: Create Supabase Account**
1. Go to https://supabase.com
2. Sign up with GitHub/Google
3. Create a new project
4. Wait for deployment (2-3 minutes)

**Step 2: Create Database Schema**
1. Go to SQL Editor in your Supabase project
2. Run the SQL schema (see `docs/supabase-schema.sql`)
3. Verify tables are created

**Step 3: Get API Credentials**
1. Settings → API
2. Copy "Project URL" (e.g., https://xxxxx.supabase.co)
3. Copy "anon public" API key

**Step 4: Update Configuration**
Edit `src/config.js`:
```javascript
const CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_KEY: 'your-anon-key-here',
  // ... rest of config
};
```

### 4. Import Bible Data

```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_KEY=your-anon-key-here

# Import all Bible translations
npm run import:bibles

# This will:
# 1. Download ESV, NIV, NASB, KJV from bolls.life
# 2. Insert all verses into your Supabase database
# 3. Create necessary indexes
# Total time: 30-60 minutes
```

### 5. Build for Your Browser

```bash
# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox

# Build for Edge
npm run build:edge

# Build for Opera
npm run build:opera

# Build all browsers
npm run build
```

### 6. Load in Your Browser

**Chrome:**
1. Go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `dist/chrome` folder

**Firefox:**
1. Go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file from `dist/firefox` folder

**Edge:**
1. Go to `edge://extensions`
2. Enable "Developer mode" (bottom left)
3. Click "Load unpacked"
4. Select `dist/edge` folder

**Opera:**
1. Go to `opera://extensions`
2. Enable "Developer mode" (bottom left)
3. Click "Load unpacked extension"
4. Select `dist/opera` folder

### 7. Test

1. Click the extension icon
2. Select "John 3:16"
3. Select "ESV" version
4. Press Enter
5. Should display the verse!

## Project Structure

```
bible-extension-project/
├── src/
│   ├── manifest.json          # Extension configuration
│   ├── popup.html             # Popup UI
│   ├── popup.js               # Main popup logic
│   ├── content.js             # Content script for pasting
│   ├── background.js          # Background service worker
│   ├── config.js              # Configuration (API credentials)
│   └── icons/                 # Extension icons
├── scripts/
│   ├── build.js               # Build script for each browser
│   ├── import-bibles.js       # Import Bible data to Supabase
│   └── package.js             # Package for distribution
├── docs/
│   ├── SETUP.md               # Detailed setup guide
│   ├── API.md                 # API documentation
│   ├── CONTRIBUTING.md        # Contribution guidelines
│   └── supabase-schema.sql    # Database schema
├── dist/                      # Built extensions (generated)
│   ├── chrome/
│   ├── firefox/
│   ├── edge/
│   └── opera/
├── package.json               # Project dependencies
└── README.md                  # This file
```

## Development

### Available Commands

```bash
# Build for development (with debug mode)
npm run dev

# Build all browsers for production
npm run build

# Import Bible data
npm run import:bibles

# Run tests
npm run test

# Lint code
npm run lint

# Package all browsers for distribution
npm run package
```

### Debug Mode

Edit `src/config.js` and set `DEBUG: true` to enable console logging.

### Hot Reload

For Chrome development:
1. Load unpacked extension from `dist/chrome`
2. After making changes, run `npm run build:chrome`
3. Click the refresh icon on the extension card in `chrome://extensions`

## API Reference

### Configuration (src/config.js)

```javascript
CONFIG = {
  SUPABASE_URL: string,        // Your Supabase URL
  SUPABASE_KEY: string,        // Your Supabase API key
  CACHE_ENABLED: boolean,      // Enable verse caching
  CACHE_DURATION_MS: number,   // Cache duration in milliseconds
  DEBUG: boolean               // Enable debug logging
}
```

### Popup API

**Functions:**
- `fetchVerse(reference, version)` - Fetch verse from Supabase
- `displayVerses(verses, reference, version)` - Display verses in popup
- `copyToClipboard()` - Copy verse to clipboard
- `pasteVerse()` - Paste verse into active field

**Events:**
- Enter key in verse input = fetch verse
- Copy button click = copy to clipboard
- Paste button click = paste to text field

## Deployment

### Publishing to Chrome Web Store

1. Create Chrome developer account
2. Package extension: `npm run package`
3. Upload `dist/chrome.zip` to Chrome Web Store
4. Wait for review (~1 hour)

### Publishing to Firefox Add-ons

1. Create Mozilla developer account
2. Package extension: `npm run package`
3. Upload `dist/firefox.zip` to Firefox Add-ons
4. Wait for review (~24 hours)

### Publishing to Edge Store

1. Create Microsoft developer account
2. Package extension: `npm run package`
3. Upload `dist/edge.zip` to Edge Add-ons
4. Wait for review (~24 hours)

## Troubleshooting

### "SUPABASE_URL not configured"
- Make sure you've updated `src/config.js` with your Supabase credentials
- Restart the build process

### "Verse not found"
- Check spelling of book name (e.g., "John" not "Jonah")
- Make sure Bible data has been imported: `npm run import:bibles`
- Try a different verse

### Extension not loading in Firefox
- Make sure `browser-polyfill.js` is present in `dist/firefox`
- Clear Firefox cache: `about:debugging` → This Firefox → Inspect

### Paste not working
- Click in a text field first to focus it
- Make sure it's a regular text input or textarea
- Some rich text editors may not be supported

## Contributing

Contributions are welcome! Please see `docs/CONTRIBUTING.md` for guidelines.

## Performance

- **Verse lookup:** ~100-500ms depending on network
- **Paste operation:** ~10-50ms
- **Memory usage:** ~5-10MB
- **Cache hit:** ~10ms

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Supported |
| Firefox | 109+    | ✅ Supported |
| Edge    | 90+     | ✅ Supported |
| Opera   | 76+     | ✅ Supported |
| Brave   | 1.0+    | ✅ Supported |

## License

MIT License - See LICENSE file

## Support

- 📖 Documentation: See `docs/` folder
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Email: your-email@example.com

## Roadmap

- [ ] Add verse commentary
- [ ] Favorite verses feature
- [ ] Reading plans
- [ ] Greek/Hebrew word studies
- [ ] Mobile app companion
- [ ] Dark mode UI
- [ ] Custom verse themes

## Credits

- Bible data: [bolls.life](https://bolls.life)
- Backend: [Supabase](https://supabase.com)
- WebExtension API: [Mozilla](https://developer.mozilla.org)
- Polyfill: [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)

---

**Made with ❤️ for Bible readers and researchers**

Start building now! 🚀
