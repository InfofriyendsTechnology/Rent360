import React, { useState } from 'react';
import { Globe, Sun, Moon, Menu, X } from 'lucide-react';

export default function Header({ lang, setLang, activeTab, setActiveTab, theme, toggleTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExtraOpen, setIsExtraOpen] = useState(false);

  const extraTabs = [
    { id: 'analytics',    label: 'ANALYTICS' },
    { id: 'achievements', label: 'ACHIEVEMENTS' },
    { id: 'ideas',        label: 'IDEAS & BACKLOG' },
    { id: 'origin',       label: 'THE ORIGIN' },
    { id: 'team',         label: 'TEAM' },
  ];

  const handleTabSelect = (id) => {
    setActiveTab(id);
    setIsMenuOpen(false);
    setIsExtraOpen(false);
  };

  return (
    <header className="border-b-2 border-main bg-main sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6 relative">

        {/* Top Row: Title + Controls */}
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-6">
          <div className="flex items-center justify-between xl:justify-start w-full xl:w-auto gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Logo Box */}
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 bg-white border-2 border-black flex items-center justify-center flex-shrink-0 shadow-accent-md sm:shadow-accent-lg cursor-pointer"
                onClick={() => handleTabSelect('daily')}
              >
                <img
                  src="/assets/logo/Rent360_icon_Black.png"
                  alt="Rent360 Icon"
                  className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = '/assets/logo/Rent360_Black.png'; 
                  }}
                />
              </div>
              
              {/* Title */}
              <div className="cursor-pointer" onClick={() => handleTabSelect('daily')}>
                <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl lg:text-[clamp(2.5rem,4vw,3.5rem)] font-black uppercase tracking-[-1px] md:tracking-[-2px] leading-none text-main">
                  RENT360 PULSE
                </h1>
                <div className="text-xs sm:text-sm font-bold text-muted uppercase tracking-[2px] sm:tracking-[3px] mt-1 sm:mt-2">
                  DAILY LOGS & PROGRESS
                </div>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="xl:hidden border-2 border-main p-2 shadow-sm-brutal bg-main text-main"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <div className="hidden xl:flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="bg-main text-main border-2 border-main px-3 py-1.5 sm:px-4 sm:py-2 font-bold text-[10px] sm:text-xs uppercase tracking-wide shadow-accent-md">
              STARTED: 25-09-2026
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 border-2 border-main bg-main text-main text-[10px] sm:text-xs font-bold uppercase tracking-wide hover:bg-card transition-colors shadow-md-brutal"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'gu' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 border-2 border-main bg-main text-main text-[10px] sm:text-xs font-bold uppercase tracking-wide hover:bg-card transition-colors shadow-md-brutal"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {lang === 'en' ? 'GUJARATI' : 'ENGLISH'}
            </button>
            
            {/* Desktop Settings/Extra Dropdown (Alternative to tabs) */}
            <div className="relative">
              <button 
                onClick={() => setIsExtraOpen(!isExtraOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 border-2 border-main text-xs font-bold uppercase tracking-wide hover:bg-card transition-colors shadow-md-brutal ${
                  isExtraOpen ? 'bg-card text-main' : 'bg-main text-main'
                }`}
              >
                <Menu className="w-4 h-4" />
                EXTRAS
              </button>
              
              {isExtraOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border-2 border-main shadow-lg-brutal flex flex-col z-50">
                  {extraTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabSelect(tab.id)}
                      className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wide hover:bg-[#0B60B0] hover:text-white transition-colors border-b-2 border-main last:border-b-0 ${
                        activeTab === tab.id ? 'bg-main text-[#0B60B0]' : 'text-main'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMenuOpen && (
          <div className="xl:hidden border-2 border-main bg-card shadow-lg-brutal mb-6 flex flex-col">
            <div className="p-4 border-b-2 border-main flex items-center justify-between bg-main">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">CONTROLS</span>
              <div className="flex gap-2">
                <button onClick={toggleTheme} className="p-2 border-2 border-main">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button onClick={() => setLang(lang === 'en' ? 'gu' : 'en')} className="p-2 border-2 border-main flex items-center gap-1 text-[10px] font-bold">
                  <Globe className="w-4 h-4" /> {lang === 'en' ? 'GUJ' : 'ENG'}
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <button
                onClick={() => handleTabSelect('daily')}
                className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 border-main ${
                  activeTab === 'daily' ? 'bg-[#0B60B0] text-white' : 'hover:bg-main'
                }`}
              >
                DAILY LOGS
              </button>
              {extraTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 border-main last:border-b-0 ${
                    activeTab === tab.id ? 'bg-[#0B60B0] text-white' : 'hover:bg-main'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
