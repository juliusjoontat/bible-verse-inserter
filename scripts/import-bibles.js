const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const API_ENDPOINT = '/rest/v1/verses';

const BOOK_NAMES = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
  15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalm',
  20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
  24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
  28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
  33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
  38: 'Zechariah', 39: 'Malachi', 40: 'Matthew', 41: 'Mark', 42: 'Luke',
  43: 'John', 44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
  48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians',
  52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy',
  56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter',
  61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation'
};

const TRANSLATIONS = ['ESV', 'NIV', 'NASB', 'KJV'];

async function downloadBibleData(code) {
  console.log(`\n📥 Downloading ${code}...`);
  try {
    const res = await fetch(`https://bolls.life/static/translations/${code}.json`);
    const data = await res.json();
    console.log(`✓ Downloaded ${code} (${data.length} verses)`);
    return data;
  } catch (e) {
    console.error(`✗ Failed: ${e.message}`);
    return null;
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const BATCH_SIZE = 500;

async function importVerses(code, verses) {
  console.log(`📤 Importing ${code} (${verses.length} verses in batches of ${BATCH_SIZE})...`);
  let count = 0;
  let errors = 0;

  for (let i = 0; i < verses.length; i += BATCH_SIZE) {
    const batch = verses.slice(i, i + BATCH_SIZE).map(v => ({
      translation: code,
      book_number: v.book,
      book_name: BOOK_NAMES[v.book] || `Book ${v.book}`,
      chapter: v.chapter,
      verse_number: v.verse,
      text: v.text
    }));

    try {
      const res = await fetch(`${SUPABASE_URL}${API_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal,resolution=ignore-duplicates'
        },
        body: JSON.stringify(batch)
      });

      if (res.ok) {
        count += batch.length;
      } else {
        const err = await res.text();
        console.error(`  ✗ Batch ${i}-${i + batch.length} failed: ${err}`);
        errors += batch.length;
      }
    } catch (e) {
      console.error(`  ✗ Batch ${i} error: ${e.message}`);
      errors += batch.length;
    }

    console.log(`  ✓ ${Math.min(i + BATCH_SIZE, verses.length)}/${verses.length} verses...`);
    await sleep(200);
  }

  console.log(`✓ ${code}: ${count} inserted, ${errors} errors\n`);
  return count;
}

async function main() {
  console.log('\n🚀 Bible Import Starting (Bulk Mode)\n');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing env vars');
    process.exit(1);
  }
  
  let total = 0;
  
  for (const code of TRANSLATIONS) {
    const data = await downloadBibleData(code);
    if (data && data.length > 0) {
      const count = await importVerses(code, data);
      total += count;
      await sleep(2000);
    }
  }
  
  console.log(`✅ Complete! Imported ${total} verses\n`);
}

main().catch(console.error);
