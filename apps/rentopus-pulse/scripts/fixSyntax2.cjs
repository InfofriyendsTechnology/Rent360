const fs = require('fs');
let content = fs.readFileSync('src/components/AnalyticsDashboard.jsx', 'utf8');

// Remove literal backslashes before backticks and dollar signs
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/AnalyticsDashboard.jsx', content);
console.log('Fixed syntax error in AnalyticsDashboard.jsx');
