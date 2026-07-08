/**
 * Background Service Worker
 * Handles extension lifecycle and background tasks
 */

const browserAPI = globalThis.browser ?? globalThis.chrome;

/**
 * Extension installed/updated
 */
browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[BibleExtension] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[BibleExtension] Extension updated to version', browserAPI.runtime.getManifest().version);
  }
});

/**
 * Handle messages from content scripts or popup
 */
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[BibleExtension] Message received:', request);

  if (request.action === 'getVersion') {
    const manifest = browserAPI.runtime.getManifest();
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
browserAPI.action.onClicked.addListener((tab) => {
  console.log('[BibleExtension] Icon clicked on tab:', tab.url);
});

console.log('[BibleExtension] Background service worker ready');
