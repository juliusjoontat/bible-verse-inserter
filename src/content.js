/**
 * Content Script - Handles pasting verses into text fields
 * Runs on every page to capture paste requests
 */

// Use browser API (works with polyfill on all browsers)
const browserAPI = globalThis.browser ?? globalThis.chrome;

/**
 * Listen for messages from popup
 */
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pasteVerse') {
    const success = pasteIntoActiveElement(request.text);
    sendResponse({ success: success });
  }
});

/**
 * Paste text into the currently active element
 */
function pasteIntoActiveElement(text) {
  const activeElement = document.activeElement;
  
  if (!activeElement) {
    console.log('[BibleExtension] No active element');
    return false;
  }
  
  // Handle text input and textarea elements
  if (activeElement.tagName === 'TEXTAREA' || 
      (activeElement.tagName === 'INPUT' && 
       (activeElement.type === 'text' || 
        activeElement.type === 'email' || 
        activeElement.type === 'search' ||
        activeElement.type === 'password'))) {
    
    try {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const currentValue = activeElement.value;
      
      // Insert text at cursor position
      const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
      activeElement.value = newValue;
      
      // Set cursor position after inserted text
      const newCursorPos = start + text.length;
      activeElement.setSelectionRange(newCursorPos, newCursorPos);
      
      // Trigger change events in case the website is listening
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      activeElement.dispatchEvent(new Event('change', { bubbles: true }));
      activeElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      console.log('[BibleExtension] Pasted successfully to ' + activeElement.tagName);
      return true;
    } catch (error) {
      console.error('[BibleExtension] Error pasting to input:', error);
      return false;
    }
  }
  
  // Handle contenteditable divs and other rich text editors
  if (activeElement.contentEditable === 'true') {
    try {
      const selection = window.getSelection();
      
      if (selection.rangeCount === 0) {
        console.log('[BibleExtension] No selection range');
        return false;
      }
      
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(text);
      
      // Remove the current selection
      range.deleteContents();
      
      // Insert the text
      range.insertNode(textNode);
      
      // Move cursor after inserted text
      range.setStartAfter(textNode);
      range.collapse(true);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger events
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      activeElement.dispatchEvent(new Event('change', { bubbles: true }));
      activeElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      console.log('[BibleExtension] Pasted successfully to contentEditable');
      return true;
    } catch (error) {
      console.error('[BibleExtension] Error pasting to contentEditable:', error);
      return false;
    }
  }
  
  // Try to find a text field and focus it
  const textInputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
  if (textInputs.length > 0) {
    console.log('[BibleExtension] Found text field, attempting paste');
    textInputs[0].focus();
    return pasteIntoActiveElement(text);
  }
  
  console.log('[BibleExtension] No suitable text field found');
  return false;
}

console.log('[BibleExtension] Content script loaded');
