const fetch = require('node-fetch');

async function checkDataStructure() {
  console.log('📥 Downloading ESV sample...');
  const res = await fetch('https://bolls.life/static/translations/ESV.json');
  const data = await res.json();
  
  console.log('\n📊 First verse structure:');
  console.log(JSON.stringify(data[0], null, 2));
  
  console.log('\n📊 All field names in first verse:');
  console.log(Object.keys(data[0]));
}

checkDataStructure().catch(console.error);
