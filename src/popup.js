/**
 * Bible Verse Inserter - Main Popup Script
 * Handles UI logic and API communication with Supabase
 */

// ========== DOM ELEMENTS ==========
const copyBtn = document.getElementById('copyBtn');
const pasteBtn = document.getElementById('pasteBtn');
const verseRefInput = document.getElementById('verseReference');
const versionSelect = document.getElementById('bibleVersion');
const statusDiv = document.getElementById('status');
const verseOutput = document.getElementById('verseOutput');
const verseRefSpan = document.getElementById('verseRef');
const verseTextDiv = document.getElementById('verseText');

// ========== STATE ==========
let currentVerseText = '';
let currentVerseRef = '';
let verseCache = new Map();

// ========== STATUS DISPLAY ==========
function showStatus(message, type = 'loading') {
  statusDiv.textContent = message;
  statusDiv.className = `show ${type}`;
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  }
}

// ========== FETCH VERSE FROM API ==========
async function fetchVerse(reference, version) {
  try {
    showStatus('Fetching verse...', 'loading');
    
    // Validate config
    const validation = validateConfig();
    if (!validation.valid) {
      showStatus('⚠️ Extension not configured. See README.', 'error');
      log('Config errors:', validation.errors);
      return;
    }
    
    // Parse the reference
    const parseResult = parseVerseReference(reference.trim());
    if (!parseResult) {
      showStatus('Invalid format. Try: John 3:16 or Genesis 1:1-5', 'error');
      return;
    }
    
    const { book, chapter, startVerse, endVerse } = parseResult;
    const bookNum = getBookNumber(book);
    
    if (!bookNum) {
      showStatus('Book not found. Check spelling.', 'error');
      return;
    }
    
    log(`Fetching ${version} - Book: ${bookNum}, Chapter: ${chapter}, Verses: ${startVerse || 'all'}`);
    
    // Check cache first
    const cacheKey = `${version}-${bookNum}-${chapter}-${startVerse || 'all'}-${endVerse || ''}`;
    if (CONFIG.CACHE_ENABLED && verseCache.has(cacheKey)) {
      log('Using cached verse');
      const cachedVerse = verseCache.get(cacheKey);
      displayVerses(cachedVerse.verses, reference, version);
      showStatus('✓ Verse loaded (from cache)!', 'success');
      return;
    }
    
    // Build API query
    let url = `${CONFIG.SUPABASE_URL}${CONFIG.API_ENDPOINT}?translation=eq.${version}&book_number=eq.${bookNum}&chapter=eq.${chapter}&order=verse_number.asc`;
    
    // Add verse range filter if specified
    if (startVerse) {
      const endV = endVerse || startVerse;
      url += `&verse_number=gte.${startVerse}&verse_number=lte.${endV}`;
    }
    
    log('API URL:', url);
    
    // Fetch from Supabase
    const response = await fetch(url, {
      headers: {
        'apikey': CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const verses = await response.json();
    
    if (!verses || verses.length === 0) {
      showStatus('Verse not found. Check your reference.', 'error');
      return;
    }
    
    log(`Fetched ${verses.length} verses`);
    
    // Cache the result
    if (CONFIG.CACHE_ENABLED) {
      verseCache.set(cacheKey, {
        verses: verses,
        timestamp: Date.now()
      });
    }
    
    // Display verses
    displayVerses(verses, reference, version);
    showStatus('✓ Verse loaded!', 'success');
    
  } catch (error) {
    console.error('Error fetching verse:', error);
    showStatus(`Error: ${error.message}`, 'error');
    currentVerseText = '';
  }
}

// ========== DISPLAY VERSES ==========
function displayVerses(verses, originalRef, version) {
  // Build formatted verse text
  const verseText = verses
    .map(v => `<sup>${v.verse_number}</sup> ${v.text}`)
    .join(' ');
  
  const referenceStr = `${originalRef.trim()} (${getVersionName(version)})`;
  
  // Build plain text for copying
  currentVerseText = `${referenceStr}\n\n${verses
    .map(v => `${v.verse_number}. ${v.text}`)
    .join('\n')}`;
  
  currentVerseRef = referenceStr;
  
  // Display in popup
  verseRefSpan.textContent = referenceStr;
  verseTextDiv.innerHTML = verseText;
  verseOutput.classList.add('show');
}

// ========== COPY TO CLIPBOARD ==========
function copyToClipboard() {
  if (!currentVerseText) {
    showStatus('No verse to copy. Fetch a verse first.', 'error');
    return;
  }
  
  navigator.clipboard.writeText(currentVerseText).then(() => {
    showStatus('✓ Copied to clipboard!', 'success');
  }).catch((err) => {
    console.error('Copy failed:', err);
    showStatus('Failed to copy to clipboard.', 'error');
  });
}

// ========== AUTO-PASTE VERSE ==========
async function pasteVerse() {
  if (!currentVerseText) {
    showStatus('No verse to paste. Fetch a verse first.', 'error');
    return;
  }
  
  try {
    showStatus('Pasting...', 'loading');
    
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    
    browser.tabs.sendMessage(tab.id, {
      action: 'pasteVerse',
      text: currentVerseText
    }).then((response) => {
      if (response && response.success) {
        showStatus('✓ Pasted successfully!', 'success');
      } else {
        showStatus('Could not find a text field to paste into.', 'error');
      }
    }).catch((error) => {
      showStatus('Cannot paste on this page.', 'error');
      log('Paste error:', error);
    });
    
  } catch (error) {
    console.error('Error:', error);
    showStatus('Error: ' + error.message, 'error');
  }
}

// ========== PARSE VERSE REFERENCE ==========
function parseVerseReference(ref) {
  // Matches: "John 3:16", "John 3:16-18", "John 3", "1 John 3:16"
  const pattern = /^([0-9]*\s*[a-zA-Z\s]+?)\s+(\d+)(?::(\d+))?(?:-(\d+))?$/;
  const match = ref.match(pattern);
  
  if (!match) return null;
  
  const [, bookName, chapterStr, startVerseStr, endVerseStr] = match;
  
  return {
    book: bookName.trim(),
    chapter: parseInt(chapterStr),
    startVerse: startVerseStr ? parseInt(startVerseStr) : null,
    endVerse: endVerseStr ? parseInt(endVerseStr) : null
  };
}

// ========== BOOK NAME TO NUMBER ==========
function getBookNumber(name) {
  const normalizedName = name.toLowerCase().trim();
  
  // Handle numbered books (1 John, 2 Peter, etc.)
  const numberedMatch = normalizedName.match(/^(\d+)\s+(.+)$/);
  let searchName = numberedMatch ? numberedMatch[2] : normalizedName;
  
  const books = {
    // Old Testament
    'genesis': 1, 'gen': 1,
    'exodus': 2, 'exo': 2,
    'leviticus': 3, 'lev': 3,
    'numbers': 4, 'num': 4,
    'deuteronomy': 5, 'deu': 5,
    'joshua': 6, 'jos': 6,
    'judges': 7, 'jud': 7,
    'ruth': 8, 'rut': 8,
    'samuel': 9, 'sam': 9,
    'kings': 11, 'kin': 11,
    'chronicles': 13, 'chr': 13,
    'ezra': 15, 'ezr': 15,
    'nehemiah': 16, 'neh': 16,
    'esther': 17, 'est': 17,
    'job': 18,
    'psalm': 19, 'psalms': 19, 'psa': 19,
    'proverbs': 20, 'pro': 20,
    'ecclesiastes': 21, 'ecc': 21,
    'song': 22, 'sng': 22,
    'isaiah': 23, 'isa': 23,
    'jeremiah': 24, 'jer': 24,
    'lamentations': 25, 'lam': 25,
    'ezekiel': 26, 'eze': 26,
    'daniel': 27, 'dan': 27,
    'hosea': 28, 'hos': 28,
    'joel': 29, 'joe': 29,
    'amos': 30, 'amo': 30,
    'obadiah': 31, 'oba': 31,
    'jonah': 32, 'jon': 32,
    'micah': 33, 'mic': 33,
    'nahum': 34, 'nah': 34,
    'habakkuk': 35, 'hab': 35,
    'zephaniah': 36, 'zep': 36,
    'haggai': 37, 'hag': 37,
    'zechariah': 38, 'zec': 38,
    'malachi': 39, 'mal': 39,
    // New Testament
    'matthew': 40, 'mat': 40,
    'mark': 41, 'mar': 41,
    'luke': 42, 'luk': 42,
    'john': 43, 'joh': 43,
    'acts': 44, 'act': 44,
    'romans': 45, 'rom': 45,
    'corinthians': 46, 'cor': 46,
    'galatians': 48, 'gal': 48,
    'ephesians': 49, 'eph': 49,
    'philippians': 50, 'phi': 50,
    'colossians': 51, 'col': 51,
    'thessalonians': 52, 'the': 52,
    'timothy': 54, 'tim': 54,
    'titus': 56, 'tit': 56,
    'philemon': 57, 'phl': 57,
    'hebrews': 58, 'heb': 58,
    'james': 59, 'jam': 59,
    'peter': 60, 'pet': 60,
    'jude': 65,
    'revelation': 66, 'rev': 66
  };

  let bookNum = books[searchName];

  // Handle numbered books
  if (bookNum && numberedMatch) {
    const prefix = parseInt(numberedMatch[1]);
    // "1/2/3 John" are the epistles (62-64), not the Gospel of John (43)
    if (bookNum === 43) bookNum = 62;
    if (prefix === 2) bookNum++;
    else if (prefix === 3) bookNum += 2;
  }
  
  return bookNum || null;
}

// ========== VERSION NAME LOOKUP ==========
function getVersionName(code) {
  const names = {
    'esv': 'English Standard Version',
    'niv': 'New International Version',
    'nasb': 'New American Standard Bible',
    'kjv': 'King James Version',
    'nkjv': 'New King James Version',
    'asv': 'American Standard Version',
    'web': 'World English Bible',
    'ylt': "Young's Literal Translation"
  };
  return names[code.toLowerCase()] || code.toUpperCase();
}

// ========== EVENT LISTENERS ==========
copyBtn.addEventListener('click', copyToClipboard);
pasteBtn.addEventListener('click', pasteVerse);

verseRefInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const reference = verseRefInput.value;
    const version = versionSelect.value;
    
    if (!reference.trim()) {
      showStatus('Please enter a verse reference.', 'error');
      return;
    }
    
    fetchVerse(reference, version);
  }
});

// Focus on input when popup opens
document.addEventListener('DOMContentLoaded', () => {
  verseRefInput.focus();
  log('Extension loaded');
  
  // Check if configured
  const validation = validateConfig();
  if (!validation.valid) {
    showStatus('⚠️ Configure Supabase API in config.js', 'error');
  }
});
