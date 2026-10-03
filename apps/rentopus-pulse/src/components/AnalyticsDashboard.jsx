import React from 'react';
import { DAILY_HISTORY, TEAM_MEMBERS, FEATURE_IDEAS } from '../data/roadmapData';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsDashboard({ lang }) {
  const totalDays = DAILY_HISTORY.length;
  const totalTasks = DAILY_HISTORY.reduce((acc, curr) => acc + (curr.tasksEn ? curr.tasksEn.length : 0), 0);
  
  const maxTasks = Math.max(...DAILY_HISTORY.map(d => d.tasksEn ? d.tasksEn.length : 0), 1);
  
  // Advanced Dynamic Team Contribution
  const memberAnalytics = TEAM_MEMBERS.map(member => {
    let workedDays = 0;
    let noWorkDays = 0;
    let tasksCompleted = 0;

    DAILY_HISTORY.forEach(day => {
      if (day.isNoWorkDay) {
        noWorkDays++;
      } else {
        const didWorkToday = day.members && day.members.includes(member.id);
        if (didWorkToday) workedDays++;
        else noWorkDays++;
        
        // Count specific tasks
        if (day.tasksEn) {
          tasksCompleted += day.tasksEn.filter(t => t.member === member.id).length;
        }
      }
    });

    const taskPercentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    return {
      ...member,
      workedDays,
      noWorkDays,
      tasksCompleted,
      taskPercentage
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-main pb-4">
        <div>
          <h2 className="font-heading text-xl sm:text-3xl font-black uppercase tracking-tight text-main mb-1 sm:mb-2">
            {lang === 'gu' ? 'પ્રોજેક્ટ એનાલિટિક્સ (રિયલ ડેટા)' : 'REAL PROJECT ANALYTICS'}
          </h2>
          <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-bold">
            {lang === 'gu'
              ? 'રોડમેપ લોગ્સમાંથી 100% રિયલ ડેટા'
              : '100% REAL DATA FROM ROADMAP LOGS'}
          </p>
        </div>
        <div className="bg-card px-4 py-2 border-2 border-main shadow-sm-brutal flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#0B60B0]" />
          <span className="font-black text-main">LIVE DATA</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatBlock label={lang === 'gu' ? 'કુલ દિવસો' : 'TOTAL DAYS'} value={totalDays} />
        <StatBlock label={lang === 'gu' ? 'કુલ ટાસ્ક' : 'TOTAL TASKS'} value={totalTasks} />
        <StatBlock label={lang === 'gu' ? 'સિદ્ધિઓ' : 'ACHIEVEMENTS'} value={FEATURE_IDEAS.filter(i => i.status === 'COMPLETED').length} />
        <StatBlock label={lang === 'gu' ? 'ટીમ મેમ્બર્સ' : 'TEAM MEMBERS'} value={TEAM_MEMBERS.length} />
      </div>

      <div className="bg-card border-2 border-main shadow-md-brutal p-5 sm:p-6 mt-8">
        <h3 className="font-heading text-lg sm:text-xl font-black uppercase text-main mb-6">
          {lang === 'gu' ? 'દૈનિક કામનો ગ્રાફ (Velocity)' : 'DAILY WORK VELOCITY'}
        </h3>
        <div className="flex items-end gap-2 sm:gap-4 h-48 sm:h-64 mt-4 overflow-x-auto pb-2 border-b-2 border-main">
          {DAILY_HISTORY.map((day, idx) => {
            const taskCount = day.tasksEn ? day.tasksEn.length : 0;
            const heightPercentage = day.isNoWorkDay ? 0 : (taskCount / maxTasks) * 100;
            return (
              <div key={idx} className="h-full flex flex-col justify-end items-center flex-1 min-w-[40px] group">
                <span className="text-[10px] font-bold text-main mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.isNoWorkDay ? '0' : taskCount}
                </span>
                <div className="flex-1 w-full flex flex-col justify-end">
                  <div 
                    className={`w-full border-2 border-main transition-all ${day.isNoWorkDay ? 'bg-red-500' : 'bg-[#0B60B0] hover:bg-main'}`}
                    style={{ height: `${Math.max(day.isNoWorkDay ? 5 : 5, heightPercentage)}%` }}
                  ></div>
                </div>
                <span className="text-[8px] sm:text-[9px] font-mono font-bold text-muted mt-2 rotate-45 sm:rotate-0 origin-left">
                  D{day.dayNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
        
        {/* Real Detailed Team Contribution */}
        <div className="bg-card border-2 border-main shadow-sm-brutal p-5">
          <h3 className="font-heading text-base font-black uppercase text-main mb-4">
             {lang === 'gu' ? 'મેમ્બર-વાઈઝ એનાલિટિક્સ' : 'MEMBER-WISE ANALYTICS'}
          </h3>
          <div className="space-y-6">
            {memberAnalytics.map((m, i) => (
              <div key={m.id} className={`${i !== memberAnalytics.length - 1 ? 'border-b-2 border-main pb-4' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col relative group cursor-help">
                    <div className="flex items-center gap-2">
                      <span className="bg-main text-main border-2 border-main px-1.5 py-0.5 text-[10px] font-mono font-black shadow-sm-brutal">
                        {m.id}
                      </span>
                      <span className="text-sm font-black uppercase">{m.name.split(' ')[0]}</span>
                    </div>
                    {/* Hover Tooltip */}
                    <div className="absolute left-0 top-full mt-1 w-max max-w-[200px] bg-main text-main border-2 border-main p-2 shadow-md-brutal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      <p className="text-[10px] font-black uppercase">{m.name}</p>
                      {m.email && <p className="text-[8px] font-mono opacity-80 lowercase">{m.email}</p>}
                      {m.accessLevel && <p className="text-[8px] font-bold text-[#0B60B0] uppercase mt-1">{m.accessLevel}</p>}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-muted">{m.taskPercentage}%</span>
                </div>
                
                <div className="h-2 w-full bg-card-alt border border-main mb-3">
                  <div className="h-full bg-[#0B60B0]" style={{ width: `${m.taskPercentage}%` }}></div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-card-alt border-2 border-main p-1.5">
                    <span className="block text-[10px] font-bold text-muted uppercase">TASKS</span>
                    <span className="block font-black text-main">{m.tasksCompleted}</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 p-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="block text-[10px] font-bold uppercase">WORK DAYS</span>
                    <span className="block font-black">{m.workedDays}</span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500 p-1.5 text-red-700 dark:text-red-400">
                    <span className="block text-[10px] font-bold uppercase">NO WORK</span>
                    <span className="block font-black">{m.noWorkDays}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


          <div className="bg-card border-2 border-main shadow-sm-brutal p-5">
            <h3 className="font-heading text-base font-black uppercase text-main mb-4">
               {lang === 'gu' ? 'આઇડિયા પાઇપલાઇન' : 'IDEA PIPELINE'}
            </h3>
            <div className="flex items-center justify-between border-b-2 border-main pb-2 mb-2">
              <span className="text-xs font-bold text-muted uppercase">TOTAL IDEAS LOGGED</span>
              <span className="font-black text-main">{FEATURE_IDEAS.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase">DISCUSSIONS / COMMENTS</span>
              <span className="font-black text-main">
                {FEATURE_IDEAS.reduce((acc, idea) => acc + (idea.history ? idea.history.length : 0), 0)}
              </span>
            </div>
          </div>

      </div>

    </div>
  );
}


function StatBlock({ label, value }) {
  return (
    <div className="bg-card border-2 border-main p-4 sm:p-5 flex flex-col justify-between shadow-sm-brutal">
      <span className="block font-heading text-2xl sm:text-4xl font-black text-main">
        {value}
      </span>
      <span className="block text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
}
