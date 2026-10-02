const fs = require('fs');
let content = fs.readFileSync('src/data/roadmapData.js', 'utf8');

// Replace dates from YYYY-MM-DD to DD-MM-YYYY
content = content.replace(/date:\s*"(\d{4})-(\d{2})-(\d{2})"/g, 'date: "$3-$2-$1"');

// Replace STARTED date in Header.jsx just in case (Wait, I'll do that via replace_file_content if needed)

fs.writeFileSync('src/data/roadmapData.js', content);
console.log('Dates formatted to DD-MM-YYYY');
