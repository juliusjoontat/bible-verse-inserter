# Complete Setup Guide - Bible Verse Inserter Extension

This guide will walk you through setting up the Bible Extension project from scratch.

**Total Time:** ~2 hours (mostly waiting for imports)
**Difficulty:** Beginner-friendly

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Import Bible Data](#import-bible-data)
5. [Build & Test](#build--test)
6. [Loading in Browsers](#loading-in-browsers)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 16.0.0 or higher
  - Download: https://nodejs.org/
  - Verify: `node --version` (should be v16+)
  
- **npm** 7.0.0 or higher
  - Usually comes with Node.js
  - Verify: `npm --version`

- **Git** (optional, but recommended)
  - Download: https://git-scm.com/

- **A Modern Web Browser**
  - Chrome 90+, Firefox 109+, Edge 90+, Opera 76+, or Brave 1.0+

### Required Accounts

- **Supabase Account** (Free)
  - Sign up at: https://supabase.com
  - Takes ~2 minutes

---

## Project Setup

### Step 1: Download/Clone the Project

**Option A: Clone with Git**
```bash
git clone https://github.com/your-repo/bible-extension-project.git
cd bible-extension-project
```

**Option B: Download as ZIP**
1. Download the project ZIP file
2. Extract to a folder
3. Open terminal in that folder

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- `webextension-polyfill` - For Firefox compatibility
- `@supabase/supabase-js` - Supabase client (optional)
- Build and development tools

**Expected output:**
```
added 150+ packages in 45s
```

### Step 3: Verify Installation

```bash
npm --version
node --version
```

Should show versions 7+

---

## Supabase Configuration

### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or Google
4. Verify your email
5. Create an organization (or use default)

### Step 2: Create a New Project

1. Click "New Project"
2. Project name: `bible-extension` (or your choice)
3. Set a strong password (you'll need this!)
4. Choose region: Pick one close to you
5. Click "Create new project"

**Wait 2-3 minutes for deployment** ⏳

### Step 3: Set Up Database Schema

1. Once project is created, go to "SQL Editor"
2. Click "New query"
3. Copy the entire contents from `docs/supabase-schema.sql`
4. Paste into the SQL editor
5. Click "Run"

**Expected result:**
```
Query successful!
Created table "verses"
Created indexes
```

### Step 4: Get Your API Credentials

1. Go to **Settings** → **API**
2. Look for these values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **Project API Keys** section
   - Copy the **"anon public"** key

**Keep these credentials safe!** You'll use them next.

---

## Import Bible Data

### Step 1: Set Environment Variables

**On macOS/Linux:**
```bash
export SUPABASE_URL=https://xxxxx.supabase.co
export SUPABASE_KEY=your-anon-key-here
```

**On Windows (Command Prompt):**
```cmd
set SUPABASE_URL=https://xxxxx.supabase.co
set SUPABASE_KEY=your-anon-key-here
```

**On Windows (PowerShell):**
```powershell
$env:SUPABASE_URL="https://xxxxx.supabase.co"
$env:SUPABASE_KEY="your-anon-key-here"
```

### Step 2: Import Bible Translations

```bash
npm run import:bibles
```

**This will:**
1. Download ESV, NIV, NASB, KJV from bolls.life
2. Import all verses into your Supabase database
3. Create necessary indexes

**Expected progress:**
```
📥 Downloading ESV...
✓ Downloaded ESV

📤 Importing ESV to Supabase...
  📊 Progress: 1000 verses imported...
  📊 Progress: 2000 verses imported...
  [continues until done]

✓ Import complete for ESV
  Total verses: 31102
  Total chapters: 1189
  Errors: 0
```

**This takes 30-60 minutes.** ☕ Good time for a coffee break!

### Step 3: Verify Import

In Supabase Dashboard:
1. Go to **Table Editor**
2. Click on **verses** table
3. Should see thousands of rows

---

## Build & Test

### Step 1: Update Configuration

Edit `src/config.js` and add your Supabase credentials:

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',  // ← Your URL
  SUPABASE_KEY: 'your-anon-key-here',         // ← Your key
  // ... rest stays the same
};
```

### Step 2: Build for Your Browser

**For Chrome:**
```bash
npm run build:chrome
```

**For Firefox:**
```bash
npm run build:firefox
```

**For Edge:**
```bash
npm run build:edge
```

**For Opera:**
```bash
npm run build:opera
```

**Or build all at once:**
```bash
npm run build
```

**Expected output:**
```
🔨 Building for chrome...
📋 Copying files...
⬇️  Downloading WebExtension polyfill...
✓ Polyfill copied from node_modules
🔧 Updating manifest for chrome...
✓ Manifest updated
✓ Validating build...
✓ All required files present

✅ Build complete for chrome!
📁 Output: /dist/chrome
```

---

## Loading in Browsers

### Chrome

1. Type `chrome://extensions` in address bar
2. Enable **"Developer mode"** (top-right toggle)
3. Click **"Load unpacked"** button
4. Navigate to `dist/chrome` folder
5. Click "Open" or "Select Folder"

**Result:** Extension should appear in your extensions list!

### Firefox

1. Type `about:debugging` in address bar
2. Click **"This Firefox"** (left sidebar)
3. Click **"Load Temporary Add-on"** button
4. Navigate to `dist/firefox` folder
5. Select any file (e.g., `manifest.json`)
6. Click "Open"

**Result:** Extension appears in Firefox toolbar!

### Edge

1. Type `edge://extensions` in address bar
2. Enable **"Developer mode"** (bottom-left toggle)
3. Click **"Load unpacked"** button
4. Navigate to `dist/edge` folder
5. Click "Open" or "Select Folder"

### Opera

1. Type `opera://extensions` in address bar
2. Enable **"Developer mode"** (bottom-left toggle)
3. Click **"Load unpacked extension"** button
4. Navigate to `dist/opera` folder
5. Click "Open" or "Select Folder"

---

## Testing the Extension

### Basic Test

1. Click the extension icon in your browser
2. In the popup, you should see:
   - Bible version dropdown
   - Verse reference input field
   - Copy and Paste buttons

### Test Lookup

1. In the verse reference field, type: `John 3:16`
2. Make sure "ESV" is selected in dropdown
3. Press **Enter** key
4. Should display the verse!

### Expected Result

```
John 3:16 (English Standard Version)

16 For God so loved the world, that he gave his only Son, 
that whoever believes in him should not perish but have 
eternal life.
```

### Test Copy

1. After fetching a verse
2. Click the **📋 Copy** button
3. Click in this text box: `[Click here]`
4. Press Ctrl+V (or Cmd+V on Mac)
5. The verse should paste!

### Test Paste

1. After fetching a verse
2. Go to any website with a text input (e.g., Gmail, Twitter)
3. Click in the text field
4. Go back to extension popup
5. Click the **✏️ Paste** button
6. The verse should appear in the text field!

---

## Troubleshooting

### "Extension not loading"

**Solution 1:** Make sure you've run the build:
```bash
npm run build:chrome  # (or your browser)
```

**Solution 2:** Check for errors in browser console:
- Chrome: Right-click extension → Inspect popup
- Firefox: about:debugging → Your extension → Inspect

**Solution 3:** Verify all files are present:
- manifest.json
- popup.html
- popup.js
- content.js
- background.js
- config.js
- browser-polyfill.js

### "SUPABASE_URL not configured"

**Solution:**
1. Open `src/config.js`
2. Verify `SUPABASE_URL` is set correctly
3. Verify `SUPABASE_KEY` is set correctly
4. Rebuild: `npm run build`
5. Reload extension in browser

### "Verse not found"

**Possible causes:**
1. Bible data hasn't been imported yet
   - Solution: Run `npm run import:bibles`
   
2. Book name spelling is wrong
   - Example: "Jonah" not "Jonas"
   - Try: "John 3:16"
   
3. Verse range is invalid
   - Try: "John 3:16" instead of "John 3:16-25"
   
4. Translation not imported
   - Check Supabase table for data

### "Cannot paste on this page"

**Possible causes:**
1. Text field not focused
   - Solution: Click in a text field first
   
2. Rich text editor (not plain input)
   - Some editors may not be supported
   - Try a plain text field
   
3. Page security restrictions
   - Some secure pages don't allow extensions
   - Try a different website

### "Paste not working in Firefox"

**Solution:**
1. Check that `browser-polyfill.js` exists in `dist/firefox`
2. Verify permissions in manifest.json include "activeTab" and "scripting"
3. Clear Firefox cache: about:debugging → Refresh

### Import taking too long

**This is normal!** 
- ESV alone has 31,102 verses
- Each needs to be uploaded
- 4 translations = ~115,000 verses
- Expected time: 30-60 minutes

**You can:**
- Let it run in the background
- Monitor progress in console
- Don't close the terminal

### API calls are slow

**Possible causes:**
1. First time loading Supabase (might be cold)
   - Solution: Give it 30 seconds to warm up
   
2. Network latency
   - Solution: Try a verse you've fetched before (uses cache)
   
3. Supabase free tier limits
   - Solution: Upgrade to Pro tier ($25/month)

---

## Next Steps

🎉 **Congratulations!** Your extension is now working!

### Now You Can:

1. **Test thoroughly** - Try all Bible versions and verses
2. **Submit to App Stores** - See docs/PUBLISHING.md
3. **Customize UI** - Edit src/popup.html and css
4. **Add features** - See docs/DEVELOPMENT.md
5. **Share with others** - Publish to Chrome Web Store, etc.

### Recommended Next Reading

- `docs/API.md` - API reference
- `docs/DEVELOPMENT.md` - Development guide
- `docs/CONTRIBUTING.md` - Contributing guidelines
- `docs/PUBLISHING.md` - How to publish to app stores

---

## Support

- ❓ Questions? Check the main README.md
- 🐛 Found a bug? Open an issue on GitHub
- 💡 Have ideas? Start a discussion
- 📧 Need help? Email your-email@example.com

---

## Checklist - You're Done When:

- [ ] Node.js and npm installed
- [ ] Project cloned/downloaded
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase account created
- [ ] Database schema imported
- [ ] API credentials in `src/config.js`
- [ ] Bible data imported (`npm run import:bibles`)
- [ ] Project built for your browser
- [ ] Extension loaded in browser
- [ ] Can fetch "John 3:16" successfully
- [ ] Can copy verse to clipboard
- [ ] Can paste verse into a text field

**All done?** 🚀 You're ready to use and customize your Bible extension!

---

Good luck! Happy building! 📖✨
