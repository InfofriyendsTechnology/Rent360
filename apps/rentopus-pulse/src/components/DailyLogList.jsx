import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X, Calendar, Search } from 'lucide-react';
import { DAILY_HISTORY } from '../data/roadmapData';

export default function DailyLogList({ lang }) {
  const [expandedDay, setExpandedDay] = useState(DAILY_HISTORY[DAILY_HISTORY.length - 1]?.date);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeDateFilter, setActiveDateFilter] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDay = (date) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  const handleFilter = (memberId, e) => {
    e.stopPropagation();
    setActiveFilter(activeFilter === memberId ? null : memberId);
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setActiveDateFilter(null);
      return;
    }
    const [year, month, day] = val.split('-');
    const formatted = `${day}-${month}-${year}`;
    setActiveDateFilter(formatted);
    setExpandedDay(formatted);
  };

  // Filter logic
  let filteredHistory = DAILY_HISTORY;
  if (activeFilter) {
    filteredHistory = filteredHistory.filter(day => day.members && day.members.includes(activeFilter));
  }
  if (activeDateFilter) {
    filteredHistory = filteredHistory.filter(day => day.date === activeDateFilter);
  }
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filteredHistory = filteredHistory.filter(day => {
      const matchTitle = (day.title || '').toLowerCase().includes(q);
      const matchTitleGu = (day.titleGu || '').toLowerCase().includes(q);
      const matchTasksEn = (day.tasksEn || []).some(t => (t.text || t).toLowerCase().includes(q));
      const matchTasksGu = (day.tasksGu || []).some(t => (t.text || t).toLowerCase().includes(q));
      return matchTitle || matchTitleGu || matchTasksEn || matchTasksGu;
    });
  }

  return (
    <div className="space-y-0">

      {/* Section Label */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-5">
        <h2 className="font-heading text-xl sm:text-3xl font-black uppercase tracking-tight text-main">
          {lang === 'gu' ? 'દિવસવાર ટ્રેકિંગ હિસ્ટ્રી' : 'DAY-BY-DAY TRACKING HISTORY'}
        </h2>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Calendar Picker Button */}
          <div className="relative">
            <button 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`flex items-center justify-center border-[3px] border-main p-2 sm:p-2.5 transition-colors shadow-sm-brutal ${
                activeDateFilter ? 'bg-[#0B60B0] text-white' : 'bg-card text-main hover:bg-[#0B60B0] hover:text-white'
              }`}
              title={lang === 'gu' ? 'તારીખ પસંદ કરો' : 'Jump to Date'}
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>
            {isCalendarOpen && (
              <BrutalistCalendar 
                activeDateFilter={activeDateFilter} 
                setActiveDateFilter={setActiveDateFilter}
                closeCalendar={() => setIsCalendarOpen(false)}
                lang={lang}
                DAILY_HISTORY={DAILY_HISTORY}
              />
            )}
          </div>

          <span className="text-[11px] sm:text-xs font-bold text-muted uppercase tracking-widest bg-card px-4 py-2 sm:py-3 border-[3px] border-main shadow-sm-brutal whitespace-nowrap hidden sm:inline-block">
            {filteredHistory.length} ENTRIES
          </span>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="mb-8 space-y-4">
        {/* Full-width Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted" strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder={lang === 'gu' ? 'ટાસ્ક કે ટાઇટલ સર્ચ કરો...' : 'Search tasks or titles...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card text-main text-sm sm:text-base font-bold pl-12 sm:pl-14 pr-4 py-3 sm:py-4 border-[3px] border-main shadow-sm-brutal focus:outline-none focus:border-[#0B60B0] focus:ring-0 transition-colors placeholder:text-muted/60"
          />
        </div>
        
        {/* Active Filters */}
        {(activeDateFilter || activeFilter) && (
          <div className="flex flex-wrap items-center gap-3">
            {activeDateFilter && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest">DATE:</span>
                <button 
                  onClick={() => setActiveDateFilter(null)}
                  className="flex items-center gap-1 bg-card text-main border-[3px] border-main px-3 py-1 text-[11px] sm:text-xs font-mono font-black shadow-sm-brutal hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                >
                  {activeDateFilter} <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3} />
                </button>
              </div>
            )}
            {activeFilter && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest">MEMBER:</span>
                <button 
                  onClick={() => setActiveFilter(null)}
                  className="flex items-center gap-1 bg-[#0B60B0] text-white border-[3px] border-[#0B60B0] px-3 py-1 text-[11px] sm:text-xs font-mono font-black shadow-sm-brutal hover:bg-red-500 hover:border-red-500 transition-colors"
                >
                  [{activeFilter}] <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="relative ml-2 sm:ml-4 border-l-[3px] border-transparent">
        {/* Main Vertical Line */}
        <div className="absolute -left-[3px] top-[24px] bottom-4 w-[3px] bg-main z-0" />
        
        {filteredHistory.map((day, idx) => {
          const isOpen = expandedDay === day.date;
          // When filtering, only show tasks belonging to this member, else show all
          const allTasks = lang === 'gu' ? day.tasksGu : day.tasksEn;
          const tasks = activeFilter && allTasks
            ? allTasks.filter(t => t.member === activeFilter)
            : allTasks;

          return (
            <div key={day.date} className="relative mb-5 sm:mb-6 z-10">

              {/* Connector dot */}
              <div className={`absolute -left-[9.5px] sm:-left-[10.5px] top-[14px] sm:top-[16px] w-4 h-4 border-2 ${
                isOpen ? 'bg-main border-[#0B60B0]' : 'bg-main border-main'
              }`} />

              {/* Day Button */}
              <button
                onClick={() => toggleDay(day.date)}
                className={`w-[calc(100%-1rem)] sm:w-[calc(100%-1.5rem)] text-left ml-4 sm:ml-6 px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 transition-all font-bold uppercase tracking-wide text-xs sm:text-sm ${
                  isOpen
                    ? 'bg-main text-main border-main shadow-accent-md'
                    : 'bg-card text-muted border-main hover:border-muted hover:text-main shadow-sm-brutal'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="font-mono text-[10px] sm:text-xs opacity-60 bg-main px-1.5 py-0.5 border border-main text-main">D{day.dayNumber}</span>
                  <span className="font-mono text-[10px] sm:text-xs opacity-60">{day.date}</span>
                  <span className="truncate w-full sm:w-auto mt-1 sm:mt-0">
                    {lang === 'gu' ? day.titleGu : day.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                  {!day.isNoWorkDay && tasks && (
                    <span className="text-[9px] sm:text-[10px] px-2 py-1 font-bold border-2 bg-card-alt text-muted border-main">
                      {tasks.length} TASKS
                    </span>
                  )}
                  {isOpen ? <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isOpen && (
                <div className="w-[calc(100%-1rem)] sm:w-[calc(100%-1.5rem)] ml-4 sm:ml-6 pl-3 sm:pl-5 border-l-[3px] border-main mt-5 mb-2 space-y-4 sm:space-y-5 transition-colors">

                  {/* Team Members Who Worked */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-widest">
                      {lang === 'gu' ? 'આજના મેમ્બર્સ કોડ:' : 'MEMBERS LOGGED:'}
                    </span>
                    {day.members && day.members.length > 0 ? (
                      day.members.map(m => (
                        <button 
                          key={m} 
                          onClick={(e) => handleFilter(m, e)}
                          className={`border-2 px-1.5 py-0.5 text-[9px] font-mono font-black shadow-sm-brutal transition-colors ${
                            activeFilter === m 
                              ? 'bg-[#0B60B0] text-white border-[#0B60B0]' 
                              : 'bg-main text-main border-main hover:border-[#0B60B0] hover:text-[#0B60B0]'
                          }`}
                        >
                          [{m}]
                        </button>
                      ))
                    ) : (
                      <span className="bg-red-500 text-white border-2 border-main px-1.5 py-0.5 text-[9px] font-mono font-black shadow-sm-brutal">
                        N/A
                      </span>
                    )}
                  </div>

                  {/* No Work Day Alert */}
                  {day.isNoWorkDay ? (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-500 shadow-sm-brutal">
                      <div className="text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        {lang === 'gu' ? 'આજે કોઈ કામ નથી થયું' : 'NO WORK LOGGED'}
                      </div>
                      <p className="text-sm font-medium text-main">
                        {lang === 'gu' ? day.noWorkReasonGu : day.noWorkReason}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Task List */}
                      {tasks && tasks.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {tasks.map((task, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-card-alt border-2 border-main hover:border-[#0B60B0] transition-colors group"
                            >
                              <Check className="w-4 h-4 text-[#0B60B0] flex-shrink-0 mt-0.5" strokeWidth={4} />
                              <div className="flex-1">
                                <span className="text-[11px] sm:text-[13px] text-main leading-relaxed font-medium">
                                  {task.text || task}
                                </span>
                                {task.member && (
                                  <button 
                                    onClick={(e) => handleFilter(task.member, e)}
                                    className={`ml-2 inline-block px-1.5 py-0.5 text-[8px] font-mono font-black tracking-widest shadow-sm-brutal transition-colors ${
                                      activeFilter === task.member
                                        ? 'bg-[#0B60B0] text-white border-2 border-[#0B60B0]'
                                        : 'bg-main text-main border-2 border-main group-hover:border-[#0B60B0]'
                                    }`}
                                  >
                                    [{task.member}]
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-xs font-bold text-muted border-2 border-dashed border-main text-center">
                          NO TASKS LOGGED FOR THIS FILTER
                        </div>
                      )}

                      {/* Deliverables */}
                      {day.deliverables && day.deliverables.length > 0 && !activeFilter && (
                        <div className="pt-2 sm:pt-3">
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted block mb-2 sm:mb-3">
                            DELIVERABLES
                          </span>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {day.deliverables.map((d, i) => (
                              <span key={i} className="px-2 py-1 sm:px-3 sm:py-1.5 bg-card border-2 border-main text-[9px] sm:text-[11px] font-mono text-muted font-bold">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

function BrutalistCalendar({ activeDateFilter, setActiveDateFilter, closeCalendar, lang, DAILY_HISTORY }) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (activeDateFilter) {
      const [d, m, y] = activeDateFilter.split('-');
      return new Date(y, m - 1, d);
    }
    return new Date(); // today
  });

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNamesEn = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monthNamesGu = ["જાન્યુ", "ફેબ્રુ", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઓગસ્ટ", "સપ્ટે", "ઓક્ટો", "નવે", "ડિસે"];
  const mNames = lang === 'gu' ? monthNamesGu : monthNamesEn;

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleSelect = (day) => {
    if (!day) return;
    const formattedDate = `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
    setActiveDateFilter(formattedDate);
    closeCalendar();
  };

  return (
    <div className="absolute top-[calc(100%+0.5rem)] right-0 p-4 bg-card border-2 border-main shadow-lg-brutal z-50 w-64 sm:w-72">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-1 border-2 border-main hover:bg-main hover:text-main bg-card transition-colors">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <span className="font-black text-main uppercase tracking-widest text-xs sm:text-sm">{mNames[month]} {year}</span>
        <button onClick={handleNextMonth} className="p-1 border-2 border-main hover:bg-main hover:text-main bg-card transition-colors">
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => (
          <span key={d} className="text-[9px] sm:text-[10px] font-bold text-muted">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const formatted = day ? `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}` : '';
          const isSelected = formatted === activeDateFilter;
          const hasLog = DAILY_HISTORY.some(h => h.date === formatted);

          return (
            <button
              key={idx}
              onClick={() => handleSelect(day)}
              disabled={!day || !hasLog}
              className={`h-7 sm:h-8 flex items-center justify-center border-2 text-[10px] sm:text-xs font-black transition-colors ${
                !day ? 'border-transparent cursor-default' :
                isSelected ? 'bg-[#0B60B0] text-white border-[#0B60B0] shadow-sm-brutal' :
                hasLog ? 'bg-card text-main border-main hover:bg-main hover:text-main shadow-sm-brutal cursor-pointer' :
                'bg-transparent text-muted border-transparent opacity-30 cursor-not-allowed'
              }`}
            >
              {day || ''}
            </button>
          )
        })}
      </div>
    </div>
  );
}
