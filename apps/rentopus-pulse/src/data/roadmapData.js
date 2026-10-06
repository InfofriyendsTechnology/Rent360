import projectInfoRaw from './projectInfo.json';
import teamMembersRaw from './teamMembers.json';

// Use Vite's glob import to automatically pull all JSON files in the folders
// eager: true means they are imported directly in the bundle, not lazy loaded.
const historyModules = import.meta.glob('./history/*.json', { eager: true });
const ideaModules = import.meta.glob('./ideas/*.json', { eager: true });

// Convert the objects returned by Vite into arrays
export const PROJECT_INFO = projectInfoRaw;
export const TEAM_MEMBERS = teamMembersRaw;

const rawHistory = Object.values(historyModules)
  .map(mod => mod.default || mod)
  .sort((a, b) => a.dayNumber - b.dayNumber);

// Helper to parse DD-MM-YYYY to Date
const parseDate = (dateStr) => {
  const [d, m, y] = dateStr.split('-');
  return new Date(y, m - 1, d);
};

// Helper to format Date to DD-MM-YYYY
const formatDate = (date) => {
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

// Auto-fill missing days up to today
const filledHistory = [];
if (rawHistory.length > 0) {
  const firstDate = parseDate(rawHistory[0].date);
  
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // We want to fill up to today, or the last logged date, whichever is later
  const lastLoggedDate = parseDate(rawHistory[rawHistory.length - 1].date);
  const endDate = today > lastLoggedDate ? today : lastLoggedDate;

  let currentDate = new Date(firstDate);
  const historyMap = new Map(rawHistory.map(h => [h.date, h]));
  let currentDayNum = 1;

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    
    if (historyMap.has(dateStr)) {
      const actualLog = historyMap.get(dateStr);
      actualLog.dayNumber = currentDayNum; // Ensure sequential numbering
      filledHistory.push(actualLog);
    } else {
      filledHistory.push({
        date: dateStr,
        dayNumber: currentDayNum,
        title: "No Updates Logged",
        titleGu: "કોઈ કામ નોંધાયેલ નથી",
        isNoWorkDay: true,
        noWorkReason: "No tasks or updates were recorded in the system for this day.",
        noWorkReasonGu: "આજના દિવસ માટે સિસ્ટમમાં કોઈ અપડેટ નોંધાયેલ નથી.",
        members: [],
        tasksEn: [],
        tasksGu: [],
        deliverables: []
      });
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDayNum++;
  }
}

export const DAILY_HISTORY = filledHistory;

// Map modules and sort ideas by createdAt (if necessary)
export const FEATURE_IDEAS = Object.values(ideaModules)
  .map(mod => mod.default || mod);
