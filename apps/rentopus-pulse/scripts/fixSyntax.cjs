const fs = require('fs');
let content = fs.readFileSync('src/components/DailyLogList.jsx', 'utf8');

// Remove literal backslashes before backticks and dollar signs
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/DailyLogList.jsx', content);
console.log('Fixed syntax error in DailyLogList.jsx');
