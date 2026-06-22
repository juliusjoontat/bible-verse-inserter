/**
 * Import Bible Translations Script
 * Imports Bible verses from bolls.life into your Supabase database
 * 
 * Usage: node scripts/import-bibles.js
 * 
 * Make sure to set SUPABASE_URL and SUPABASE_KEY in config.js first!
 */

const fetch = require('node-fetch');
const fs = require('fs');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-anon-key-here';
const API_ENDPOINT = '/rest/v1/verses';

// Translations to import
const TRANSLATIONS = [
  { code: 'ESV', name: 'English Standard Version' },
  { code: 'NIV', name: 'New International Version' },
  { code: 'NASB', name: 'New American Standard Bible' },
  { code: 'KJV', name: 'King James Version' },
];

// Book name mapping
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
  43: 'John', 44: 'Acts', 45: 'Romans', 46: '1 Corinthians',
  47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians', 50: 'Philippians',
  51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians',
  54: '1 Timothy', 55: '2 Timothy', 56: 'Titus', 57: 'Philemon',
  58: 'Hebrews', 59: 'James', 60: '1 Peter', 61: '2 Peter', 62: '1 John',
  63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation'
};

/**
 * Download Bible data from bolls.life
 */
async function downloadBibleData(translationCode) {
  console.log(`\n📥 Downloading ${translationCode}...`);
  
  const url = `https://bolls.life/static/translations/${translationCode}.json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    console.log(`✓ Downloaded ${translationCode}`);
    return data;
  } catch (error) {
    console.error(`✗ Failed to download ${translationCode}:`, error.message);
    return null;
  }
}

/**
 * Import verses to Supabase
 */
async function importVersesToSupabase(translationCode, bibleData) {
  console.log(`\n📤 Importing ${translationCode} to Supabase...`);
  
  let verseCount = 0;
  let errorCount = 0;
  let chapterCount = 0;
  
  for (const book of bibleData) {
    const bookNum = book.book_id;
    const bookName = BOOK_NAMES[bookNum] || `Book ${bookNum}`;
    
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        try {
          // Prepare verse data
          const verseData = {
            translation: translationCode,
            book_number: bookNum,
            book_name: bookName,
            chapter: chapter.chapter,
            verse_number: verse.verse,
            text: verse.text
          };
          
          // Insert to Supabase
          const response = await fetch(
            `${SUPABASE_URL}${API_ENDPOINT}`,
            {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(verseData)
            }
          );
          
          if (!response.ok) {
            const error = await response.text();
            console.error(`✗ Error inserting verse: ${error}`);
            errorCount++;
          }
          
          verseCount++;
          
          // Progress update every 1000 verses
          if (verseCount % 1000 === 0) {
            console.log(`  📊 Progress: ${verseCount} verses imported...`);
          }
          
        } catch (error) {
          console.error(`✗ Error processing verse:`, error.message);
          errorCount++;
        }
      }
      chapterCount++;
    }
  }
  
  console.log(`\n✓ Import complete for ${translationCode}`);
  console.log(`  Total verses: ${verseCount}`);
  console.log(`  Total chapters: ${chapterCount}`);
  console.log(`  Errors: ${errorCount}`);
  
  return { verseCount, chapterCount, errorCount };
}

/**
 * Validate configuration
 */
function validateConfig() {
  if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
    console.error('❌ SUPABASE_URL not configured');
    console.log('   Set: export SUPABASE_URL=https://your-project.supabase.co');
    return false;
  }
  
  if (!SUPABASE_KEY || SUPABASE_KEY === 'your-anon-key-here') {
    console.error('❌ SUPABASE_KEY not configured');
    console.log('   Set: export SUPABASE_KEY=your-anon-key-here');
    return false;
  }
  
  return true;
}

/**
 * Main import process
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Bible Verses Importer               ║');
  console.log('║   Importing to Supabase               ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Validate configuration
  if (!validateConfig()) {
    process.exit(1);
  }
  
  console.log(`\n🎯 Target: ${SUPABASE_URL}`);
  console.log(`📚 Translations: ${TRANSLATIONS.map(t => t.code).join(', ')}`);
  
  const results = {};
  
  // Import each translation
  for (const translation of TRANSLATIONS) {
    const bibleData = await downloadBibleData(translation.code);
    
    if (bibleData) {
      const result = await importVersesToSupabase(translation.code, bibleData);
      results[translation.code] = result;
      
      // Rate limiting - wait 2 seconds between translations
      if (translation !== TRANSLATIONS[TRANSLATIONS.length - 1]) {
        console.log('\n⏳ Waiting before next translation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║           IMPORT COMPLETE              ║');
  console.log('╚════════════════════════════════════════╝');
  
  console.log('\n📊 Summary:');
  for (const [translation, data] of Object.entries(results)) {
    console.log(`  ${translation}: ${data.verseCount} verses, ${data.errorCount} errors`);
  }
  
  const totalVerses = Object.values(results).reduce((sum, r) => sum + r.verseCount, 0);
  console.log(`\n✅ Total verses imported: ${totalVerses}`);
  console.log('\n💡 Your extension is ready to use!\n');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
