import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DailyLogList from './components/DailyLogList';
import AchievementsList from './components/AchievementsList';
import IdeaBacklog from './components/IdeaBacklog';
import TeamSection from './components/TeamSection';
import TeamList from './components/TeamList';

export default function App() {
  const [lang, setLang] = useState('gu');
  const [activeTab, setActiveTab] = useState('daily');
  const [theme, setTheme] = useState('dark');

  // Handle HTML dark class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen flex flex-col bg-main text-main transition-colors duration-300">
      <Header 
        lang={lang} setLang={setLang} 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        theme={theme} toggleTheme={toggleTheme} 
      />
      <main className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 flex-1">
        {activeTab === 'daily' && <DailyLogList lang={lang} />}
        {activeTab === 'analytics' && <AnalyticsDashboard lang={lang} />}
        {activeTab === 'achievements' && <AchievementsList lang={lang} />}
        {activeTab === 'ideas' && <IdeaBacklog lang={lang} />}
        {activeTab === 'origin' && <TeamSection lang={lang} />}
        {activeTab === 'team' && <TeamList lang={lang} />}
      </main>
      <footer className="border-t-2 border-main py-6 mt-12 bg-card w-full mt-auto">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted font-bold uppercase tracking-widest text-center md:text-left">
          <span>RENT360 PULSE — INFOFRIYEND TECHNOLOGY</span>
          <span>REACT + VITE + TAILWIND</span>
        </div>
      </footer>
    </div>
  );
}
