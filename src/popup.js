/**
 * Bible Verse Inserter - Main Popup Script
 * Handles UI logic and API communication with Supabase
 */

// ========== DOM ELEMENTS ==========
const fetchBtn = document.getElementById('fetchBtn');
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
let lastFetchedKey = '';
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

// ========== FETCH VERSES FROM API ==========
async function fetchVerse(reference, version) {
  try {
    showStatus('Fetching verses...', 'loading');

    // Clear stale state so a failed fetch can't reuse the previous result
    currentVerseText = '';
    currentVerseRef = '';
    lastFetchedKey = '';

    // Parse the reference list (e.g. "Rom 1:18-23, 3:9, 3:19-20, 3:23")
    const refs = parseReferenceList(reference.trim());
    if (!refs) {
      showStatus('Invalid format. Try: John 3:16 or Rom 1:18-23, 3:9, 3:23', 'error');
      return;
    }

    // Resolve all book names first so bad input fails fast
    const lookups = [];
    for (const ref of refs) {
      const bookNum = getBookNumber(ref.book);
      if (!bookNum) {
        showStatus(`Book not found: "${ref.book}". Check spelling.`, 'error');
        return;
      }
      lookups.push({ ref, bookNum });
    }

    // Fetch all passages in parallel
    const segments = await Promise.all(lookups.map(async ({ ref, bookNum }) => {
      log(`Fetching ${version} - Book: ${bookNum}, Chapter: ${ref.chapter}, Verses: ${ref.startVerse || 'all'}`);
      const verses = await fetchSegment(bookNum, ref, version);
      return { ref, verses };
    }));

    const missing = segments.find(s => !s.verses || s.verses.length === 0);
    if (missing) {
      showStatus(`Verse not found: ${formatRef(missing.ref)}. Check your reference.`, 'error');
      return;
    }

    displaySegments(segments, version);
    lastFetchedKey = `${version}|${reference.trim()}`;
    showStatus('✓ Verses loaded!', 'success');

  } catch (error) {
    console.error('Error fetching verse:', error);
    showStatus(`Error: ${error.message}`, 'error');
    currentVerseText = '';
  }
}

// ========== FETCH A SINGLE PASSAGE ==========
// Uses Supabase when configured, otherwise falls back to the free
// public API (no key needed).
async function fetchSegment(bookNum, ref, version) {
  if (validateConfig().valid) {
    return fetchSegmentSupabase(bookNum, ref, version);
  }
  return fetchSegmentPublic(bookNum, ref, version);
}

async function fetchSegmentPublic(bookNum, ref, version) {
  const { chapter, startVerse, endVerse } = ref;
  const chapterVerses = await fetchChapterPublic(bookNum, chapter, version);

  if (!startVerse) return chapterVerses;
  const endV = endVerse || startVerse;
  return chapterVerses.filter(v => v.verse_number >= startVerse && v.verse_number <= endV);
}

// Downloads a whole chapter once; ranges are filtered client-side. The
// in-flight promise is cached so parallel segments of the same chapter
// (e.g. "Rom 3:9, 3:19-20, 3:23") share a single download.
function fetchChapterPublic(bookNum, chapter, version) {
  const cacheKey = `public-${version}-${bookNum}-${chapter}`;

  if (CONFIG.CACHE_ENABLED && verseCache.has(cacheKey)) {
    log('Using cached chapter for', cacheKey);
    return verseCache.get(cacheKey).promise;
  }

  const promise = (async () => {
    const url = `${CONFIG.PUBLIC_API_URL}/get-text/${version.toUpperCase()}/${bookNum}/${chapter}/`;
    log('Public API URL:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.map(v => ({
      verse_number: v.verse,
      // Strip Strong's concordance tags (<S>1063</S>) and any other markup
      text: v.text
        .replace(/<S>[^<]*<\/S>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }));
  })();

  if (CONFIG.CACHE_ENABLED) {
    verseCache.set(cacheKey, { promise, timestamp: Date.now() });
    // Don't cache failures
    promise.catch(() => verseCache.delete(cacheKey));
  }

  return promise;
}

async function fetchSegmentSupabase(bookNum, ref, version) {
  const { chapter, startVerse, endVerse } = ref;

  // Check cache first
  const cacheKey = `${version}-${bookNum}-${chapter}-${startVerse || 'all'}-${endVerse || ''}`;
  if (CONFIG.CACHE_ENABLED && verseCache.has(cacheKey)) {
    log('Using cached verses for', cacheKey);
    return verseCache.get(cacheKey).verses;
  }

  // Build API query
  let url = `${CONFIG.SUPABASE_URL}${CONFIG.API_ENDPOINT}?translation=eq.${version}&book_number=eq.${bookNum}&chapter=eq.${chapter}&order=verse_number.asc`;

  // Add verse range filter if specified
  if (startVerse) {
    const endV = endVerse || startVerse;
    url += `&verse_number=gte.${startVerse}&verse_number=lte.${endV}`;
  }

  log('API URL:', url);

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
  log(`Fetched ${verses.length} verses`);

  if (CONFIG.CACHE_ENABLED && verses.length > 0) {
    verseCache.set(cacheKey, {
      verses: verses,
      timestamp: Date.now()
    });
  }

  return verses;
}

// ========== FORMAT A PARSED REFERENCE ==========
function formatRef(ref) {
  let str = `${ref.book} ${ref.chapter}`;
  if (ref.startVerse) {
    str += `:${ref.startVerse}`;
    if (ref.endVerse) str += `-${ref.endVerse}`;
  }
  return str;
}

// ========== DISPLAY VERSES ==========
function displaySegments(segments, version) {
  const multiple = segments.length > 1;

  // Build formatted HTML, one block per passage
  const verseHtml = segments
    .map(({ ref, verses }) => {
      const header = multiple ? `<div class="verse-reference">${formatRef(ref)}</div>` : '';
      const body = verses
        .map(v => `<sup>${v.verse_number}</sup> ${v.text}`)
        .join(' ');
      return `${header}<div>${body}</div>`;
    })
    .join('<div class="verse-divider"></div>');

  const referenceStr = `${segments.map(s => formatRef(s.ref)).join('; ')} (${getVersionName(version)})`;

  // Build plain text for copying
  currentVerseText = `${referenceStr}\n\n` + segments
    .map(({ ref, verses }) => {
      const header = multiple ? `${formatRef(ref)}\n` : '';
      return header + verses.map(v => `${v.verse_number}. ${v.text}`).join('\n');
    })
    .join('\n\n');

  currentVerseRef = referenceStr;

  // Display in popup
  verseRefSpan.textContent = referenceStr;
  verseTextDiv.innerHTML = verseHtml;
  verseOutput.classList.add('show');
}

// ========== ENSURE VERSES ARE FETCHED ==========
// Fetches automatically when the reference or version changed since the
// last fetch, so Copy/Paste work without pressing Enter first.
async function ensureFetched() {
  const reference = verseRefInput.value.trim();
  if (!reference) {
    showStatus('Please enter a verse reference.', 'error');
    return false;
  }

  const key = `${versionSelect.value}|${reference}`;
  if (currentVerseText && key === lastFetchedKey) {
    return true;
  }

  await fetchVerse(reference, versionSelect.value);
  return !!currentVerseText;
}

// ========== COPY TO CLIPBOARD ==========
async function copyToClipboard() {
  if (!(await ensureFetched())) return;

  navigator.clipboard.writeText(currentVerseText).then(() => {
    showStatus('✓ Copied to clipboard!', 'success');
  }).catch((err) => {
    console.error('Copy failed:', err);
    showStatus('Failed to copy to clipboard.', 'error');
  });
}

// ========== AUTO-PASTE VERSE ==========
async function pasteVerse() {
  if (!(await ensureFetched())) return;

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

// ========== PARSE VERSE REFERENCES ==========
// Parses a comma-separated list of references. Later segments inherit the
// book (and chapter, for bare verse numbers) from the previous segment:
//   "Rom 1:18-23, 3:9, 3:19-20, 3:23" -> Rom 1:18-23; Rom 3:9; Rom 3:19-20; Rom 3:23
//   "John 3:16, 18, 4:1-3"            -> John 3:16; John 3:18; John 4:1-3
function parseReferenceList(input) {
  const segments = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
  if (segments.length === 0) return null;

  const refs = [];
  let currentBook = null;
  let currentChapter = null;

  for (const seg of segments) {
    // Full reference: "John 3:16", "John 3:16-18", "John 3", "1 John 3:16"
    const full = seg.match(/^([0-9]*\s*[a-zA-Z\s]+?)\s+(\d+)(?::(\d+))?(?:-(\d+))?$/);
    // Chapter and verse, book inherited: "3:9", "3:19-20"
    const chapVerse = seg.match(/^(\d+):(\d+)(?:-(\d+))?$/);
    // Verse only, book and chapter inherited: "23", "23-25"
    const verseOnly = seg.match(/^(\d+)(?:-(\d+))?$/);

    if (full) {
      currentBook = full[1].trim();
      currentChapter = parseInt(full[2]);
      refs.push({
        book: currentBook,
        chapter: currentChapter,
        startVerse: full[3] ? parseInt(full[3]) : null,
        endVerse: full[4] ? parseInt(full[4]) : null
      });
    } else if (chapVerse && currentBook) {
      currentChapter = parseInt(chapVerse[1]);
      refs.push({
        book: currentBook,
        chapter: currentChapter,
        startVerse: parseInt(chapVerse[2]),
        endVerse: chapVerse[3] ? parseInt(chapVerse[3]) : null
      });
    } else if (verseOnly && currentBook && currentChapter) {
      refs.push({
        book: currentBook,
        chapter: currentChapter,
        startVerse: parseInt(verseOnly[1]),
        endVerse: verseOnly[2] ? parseInt(verseOnly[2]) : null
      });
    } else {
      return null;
    }
  }

  return refs;
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
fetchBtn.addEventListener('click', ensureFetched);
copyBtn.addEventListener('click', copyToClipboard);
pasteBtn.addEventListener('click', pasteVerse);

verseRefInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    ensureFetched();
  }
});

// Focus on input when popup opens
document.addEventListener('DOMContentLoaded', () => {
  verseRefInput.focus();
  log('Extension loaded');

  // Without Supabase credentials the free public API is used instead
  if (!validateConfig().valid) {
    log('Supabase not configured; using public Bible API');
  }
});
