const fs = require('fs');

let content = fs.readFileSync('src/data/roadmapData.js', 'utf8');

// Function to convert task arrays of strings to arrays of objects
// Wait, doing this via regex might be tricky. Let's just evaluate it, modify it, and write it back.
// Since it's an ES module, I can't require it directly. I'll just write a smart regex or string replacement.

content = content.replace(/tasksEn:\s*\[([\s\S]*?)\],/g, (match, p1) => {
    // p1 is the list of strings
    const lines = p1.split('\n');
    const newLines = lines.map(line => {
        if (line.trim().startsWith('"') || line.trim().startsWith("'")) {
            // It's a task string. Add member 001 by default, unless it mentions Shridhar.
            let member = "001";
            if (line.includes("Shridhar") || line.includes("શ્રીધર")) {
                member = "002";
            } else if (line.includes("Harsh") || line.includes("હર્ષ")) {
                member = "003"; // Harsh was 003 originally
            }
            return line.replace(/^(\s*)(["'])(.*)(["'])(,?)$/, `$1{ member: "${member}", text: "$3" }$5`);
        }
        return line;
    });
    return `tasksEn: [\n${newLines.join('\n')}\n    ],`;
});

content = content.replace(/tasksGu:\s*\[([\s\S]*?)\]\n/g, (match, p1) => {
    const lines = p1.split('\n');
    const newLines = lines.map(line => {
        if (line.trim().startsWith('"') || line.trim().startsWith("'")) {
            let member = "001";
            if (line.includes("Shridhar") || line.includes("શ્રીધર")) {
                member = "002";
            } else if (line.includes("Harsh") || line.includes("હર્ષ")) {
                member = "003";
            }
            return line.replace(/^(\s*)(["'])(.*)(["'])(,?)$/, `$1{ member: "${member}", text: "$3" }$5`);
        }
        return line;
    });
    return `tasksGu: [\n${newLines.join('\n')}\n    ]\n`;
});

// Remove System Health and fake data from AnalyticsDashboard
let analyticsContent = fs.readFileSync('src/components/AnalyticsDashboard.jsx', 'utf8');

// We'll replace the entire file later via replace_file_content.

fs.writeFileSync('src/data/roadmapData.js', content);
console.log("Updated roadmapData.js to use task objects with members");
