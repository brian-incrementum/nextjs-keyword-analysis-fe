const fs = require('fs');
const path = require('path');

// Keyword templates for realistic data
const baseKeywords = [
  'running shoes', 'mens running shoes', 'womens running shoes', 'trail running shoes',
  'road running shoes', 'minimalist running shoes', 'cushioned running shoes',
  'stability running shoes', 'marathon shoes', 'sprint shoes', 'track shoes',
  'cross country shoes', 'waterproof running shoes', 'lightweight running shoes',
  'nike running shoes', 'adidas running shoes', 'asics running shoes',
  'new balance running shoes', 'brooks running shoes', 'hoka running shoes',
  'best running shoes', 'cheap running shoes', 'discount running shoes',
  'running shoes sale', 'running shoes clearance', 'running shoes deals',
  'running shoes for flat feet', 'running shoes for high arches',
  'running shoes for plantar fasciitis', 'running shoes for beginners',
  'running shoes for marathon', 'running shoes for treadmill',
  'black running shoes', 'white running shoes', 'blue running shoes',
  'red running shoes', 'green running shoes', 'pink running shoes'
];

const modifiers = [
  'best', 'top', 'premium', 'professional', 'budget', 'affordable',
  '2024', '2025', 'new', 'latest', 'popular', 'trending',
  'size 8', 'size 9', 'size 10', 'size 11', 'wide', 'narrow',
  'online', 'near me', 'store', 'shop', 'buy', 'purchase',
  'reviews', 'comparison', 'vs', 'guide', 'how to choose'
];

const locations = [
  'usa', 'uk', 'canada', 'australia', 'europe', 'asia',
  'new york', 'los angeles', 'chicago', 'houston', 'phoenix',
  'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose'
];

function generateKeyword() {
  const base = baseKeywords[Math.floor(Math.random() * baseKeywords.length)];
  const useModifier = Math.random() > 0.3;
  const useLocation = Math.random() > 0.7;
  
  let keyword = base;
  
  if (useModifier) {
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    keyword = Math.random() > 0.5 ? `${modifier} ${keyword}` : `${keyword} ${modifier}`;
  }
  
  if (useLocation) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    keyword = `${keyword} ${location}`;
  }
  
  // Add some variations
  if (Math.random() > 0.8) {
    keyword = keyword.replace('shoes', 'shoe');
  }
  if (Math.random() > 0.9) {
    keyword = keyword.replace('mens', "men's");
  }
  if (Math.random() > 0.9) {
    keyword = keyword.replace('womens', "women's");
  }
  
  return keyword;
}

function generateSearchVolume() {
  // Generate realistic search volume distribution
  const rand = Math.random();
  if (rand < 0.1) {
    // 10% high volume
    return Math.floor(Math.random() * 90000) + 10000;
  } else if (rand < 0.3) {
    // 20% medium-high volume
    return Math.floor(Math.random() * 9000) + 1000;
  } else if (rand < 0.6) {
    // 30% medium volume
    return Math.floor(Math.random() * 900) + 100;
  } else {
    // 40% low volume
    return Math.floor(Math.random() * 99) + 1;
  }
}

function generateTestCSV(numKeywords, filename) {
  const keywords = new Set();
  
  // Generate unique keywords
  while (keywords.size < numKeywords) {
    keywords.add(generateKeyword());
  }
  
  // Create CSV content
  let csvContent = 'Keyword,Search Volume,Competition,CPC\n';
  
  for (const keyword of keywords) {
    const searchVolume = generateSearchVolume();
    const competition = ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)];
    const cpc = (Math.random() * 4.5 + 0.5).toFixed(2);
    
    csvContent += `"${keyword}",${searchVolume},${competition},$${cpc}\n`;
  }
  
  // Write to file
  const filePath = path.join(__dirname, '..', 'public', 'test-data', filename);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, csvContent);
  console.log(`✅ Generated ${filename} with ${numKeywords} keywords`);
  console.log(`   File location: ${filePath}`);
}

// Generate test files of various sizes
console.log('🚀 Generating test CSV files...\n');

generateTestCSV(100, 'test-keywords-100.csv');
generateTestCSV(1000, 'test-keywords-1000.csv');
generateTestCSV(5000, 'test-keywords-5000.csv');
generateTestCSV(10000, 'test-keywords-10000.csv');
generateTestCSV(20000, 'test-keywords-20000.csv');

console.log('\n✨ All test files generated successfully!');
console.log('📁 Files are located in: public/test-data/');
console.log('\n💡 Usage: Upload these files in the keyword analysis tool to test performance with different dataset sizes.');