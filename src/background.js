/**
 * Background Service Worker
 * Handles extension lifecycle and background tasks
 */

const browser = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Extension installed/updated
 */
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[BibleExtension] Extension installed');
    // Open welcome page
    browser.tabs.create({
      url: 'https://github.com/your-repo/bible-extension/README.md'
    });
  } else if (details.reason === 'update') {
    console.log('[BibleExtension] Extension updated to version', browser.runtime.getManifest().version);
  }
});

/**
 * Handle messages from content scripts or popup
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[BibleExtension] Message received:', request);
  
  if (request.action === 'getVersion') {
    const manifest = browser.runtime.getManifest();
    sendResponse({ version: manifest.version });
  }
  
  if (request.action === 'logDebug') {
    console.log('[BibleExtension Debug]', request.message);
    sendResponse({ status: 'logged' });
  }
});

/**
 * Handle extension icon click
 */
browser.action.onClicked.addListener((tab) => {
  console.log('[BibleExtension] Icon clicked on tab:', tab.url);
});

console.log('[BibleExtension] Background service worker ready');
