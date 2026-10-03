import projectInfoRaw from './projectInfo.json';
import teamMembersRaw from './teamMembers.json';
import achievementsRaw from './achievements.json';

// Use Vite's glob import to automatically pull all JSON files in the folders
// eager: true means they are imported directly in the bundle, not lazy loaded.
const historyModules = import.meta.glob('./history/*.json', { eager: true });
const ideaModules = import.meta.glob('./ideas/*.json', { eager: true });

// Convert the objects returned by Vite into arrays
export const PROJECT_INFO = projectInfoRaw;
export const TEAM_MEMBERS = teamMembersRaw;
export const ACHIEVEMENTS = achievementsRaw;

// Map modules and sort by dayNumber (or date)
export const DAILY_HISTORY = Object.values(historyModules)
  .map(mod => mod.default || mod)
  .sort((a, b) => a.dayNumber - b.dayNumber);

// Map modules and sort ideas by createdAt (if necessary)
export const FEATURE_IDEAS = Object.values(ideaModules)
  .map(mod => mod.default || mod);
