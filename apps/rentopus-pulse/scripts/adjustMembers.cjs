const fs = require('fs');
let content = fs.readFileSync('src/data/roadmapData.js', 'utf8');

// The replacement added 'members: ["001", "002"]' to all 7 days.
// I will just use regex to replace specific occurrences to simulate absence.

let count = 0;
content = content.replace(/members: \["001", "002"\]/g, (match) => {
  count++;
  if (count === 2 || count === 3 || count === 4 || count === 6) {
    return 'members: ["001"]';
  }
  return match;
});

// Add a No Work Day (Day 8)
const noWorkDay = `  {
    dayNumber: 8,
    date: "03-10-2026",
    title: "System Maintenance & Holiday",
    titleGu: "સિસ્ટમ મેન્ટેનન્સ અને રજા",
    isNoWorkDay: true,
    noWorkReason: "Public Holiday / Office Closed. No code pushed today.",
    noWorkReasonGu: "જાહેર રજા / ઓફિસ બંધ. આજે કોઈ કામ થયું નથી.",
    members: [],
    tasksEn: [],
    tasksGu: [],
    deliverables: []
  }
];`;

content = content.replace(/\];$/, noWorkDay);

fs.writeFileSync('src/data/roadmapData.js', content);
console.log('Modified members arrays and added No Work day');
