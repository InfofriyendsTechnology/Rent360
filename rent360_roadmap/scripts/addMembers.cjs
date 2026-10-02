const fs = require('fs');
let content = fs.readFileSync('src/data/roadmapData.js', 'utf8');

content = content.replace(/tasksEn: \[/g, 'members: ["001", "002"],\n    tasksEn: [');

fs.writeFileSync('src/data/roadmapData.js', content);
console.log('Added members array to daily history');
