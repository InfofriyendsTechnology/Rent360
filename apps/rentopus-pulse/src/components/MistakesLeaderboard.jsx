import React, { useState } from 'react';
import { TEAM_MEMBERS, DAILY_HISTORY } from '../data/roadmapData';
import mistakesRaw from '../data/mistakesData.json';
import { 
  ChevronDown, ChevronRight, FileSpreadsheet, 
  AlertTriangle, CheckCircle2, ShieldAlert, Award,
  Check, ShieldCheck
} from 'lucide-react';

export default function MistakesLeaderboard({ lang }) {
  const [expandedMember, setExpandedMember] = useState(null);
  const mistakes = mistakesRaw || [];

  // Calculate scores for each member:
  // Rule: +1 Mark per task, -3 Marks per mistake
  const memberScores = TEAM_MEMBERS.map(member => {
    let tasksCompleted = 0;
    DAILY_HISTORY.forEach(day => {
      if (day.tasksEn && Array.isArray(day.tasksEn)) {
        tasksCompleted += day.tasksEn.filter(t => t.member === member.id).length;
      }
    });

    const memberMistakes = mistakes.filter(m => m.member === member.id);
    const mistakesCount = memberMistakes.length;
    const penaltyPoints = memberMistakes.reduce((acc, curr) => acc + (curr.penaltyMarks || 3), 0);
    const taskPoints = tasksCompleted * 1;
    const netScore = taskPoints - penaltyPoints;

    return {
      ...member,
      tasksCompleted,
      taskPoints,
      mistakesCount,
      penaltyPoints,
      netScore,
      mistakesList: memberMistakes
    };
  }).sort((a, b) => b.netScore - a.netScore);

  // Overall Team Summary KPIs
  const totalTasks = memberScores.reduce((acc, curr) => acc + curr.tasksCompleted, 0);
  const totalMistakes = mistakes.length;
  const totalPenalty = memberScores.reduce((acc, curr) => acc + curr.penaltyPoints, 0);
  const totalNetScore = totalTasks - totalPenalty;
  const overallAccuracy = totalTasks > 0 ? (((totalTasks - totalMistakes) / totalTasks) * 100).toFixed(1) : 100;

  const toggleExpand = (id) => {
    setExpandedMember(expandedMember === id ? null : id);
  };

  return (
    <div className="space-y-6 text-main animate-fade-in font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-3">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-black uppercase text-main flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0B60B0] dark:text-[#3B82F6]" />
            {lang === 'gu' ? 'મેમ્બર સ્કોરકાર્ડ' : 'MEMBER SCORECARD'}
          </h2>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Tasks (Plus Points) */}
        <div className="bg-card border border-black/10 dark:border-white/10 p-3.5 rounded-sm">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider mb-1">
            <span>{lang === 'gu' ? 'કુલ પ્લસ પોઈન્ટ્સ' : 'TOTAL PLUS PTS'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="font-heading font-black text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">
            +{totalTasks} <span className="text-[11px] font-mono font-normal text-muted">PTS</span>
          </div>
          <span className="text-[10px] text-muted block mt-0.5 font-mono">
            {totalTasks} {lang === 'gu' ? 'ટાસ્ક પૂરા થયા' : 'Tasks Completed'}
          </span>
        </div>

        {/* Total Mistakes */}
        <div className="bg-card border border-black/10 dark:border-white/10 p-3.5 rounded-sm">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider mb-1">
            <span>{lang === 'gu' ? 'કુલ ભૂલો' : 'TOTAL MISTAKES'}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="font-heading font-black text-xl sm:text-2xl text-rose-600 dark:text-rose-400">
            {totalMistakes} <span className="text-[11px] font-mono font-normal text-muted">FAULTS</span>
          </div>
          <span className="text-[10px] text-muted block mt-0.5 font-mono">
            {totalMistakes} {lang === 'gu' ? 'નોંધાયેલી ભૂલો' : 'Logged Incidents'}
          </span>
        </div>

        {/* Total Penalty Deducted */}
        <div className="bg-card border border-black/10 dark:border-white/10 p-3.5 rounded-sm">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider mb-1">
            <span>{lang === 'gu' ? 'પેનલ્ટી કપાત' : 'PENALTY CUT (-3x)'}</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="font-heading font-black text-xl sm:text-2xl text-amber-600 dark:text-amber-400">
            -{totalPenalty} <span className="text-[11px] font-mono font-normal text-muted">PTS</span>
          </div>
          <span className="text-[10px] text-muted block mt-0.5 font-mono">
            3x {lang === 'gu' ? 'માર્ક્સ કટ પ્રતિ ભૂલ' : 'Marks Cut Per Bug'}
          </span>
        </div>

        {/* Total Net Score & Quality */}
        <div className="bg-card border border-black/10 dark:border-white/10 p-3.5 rounded-sm">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider mb-1">
            <span>{lang === 'gu' ? 'નેટ ટીમ સ્કોર' : 'NET TEAM SCORE'}</span>
            <Award className="w-3.5 h-3.5 text-[#0B60B0]" />
          </div>
          <div className="font-heading font-black text-xl sm:text-2xl text-main">
            {totalNetScore} <span className="text-[11px] font-mono font-normal text-muted">PTS</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-0.5">
            {overallAccuracy}% {lang === 'gu' ? 'ક્વોલિટી એક્યુરસી' : 'Quality Accuracy'}
          </span>
        </div>

      </div>

      {/* Gradebook Style Score Table with Clean Hairline Borders */}
      <div className="bg-card border border-black/10 dark:border-white/10 rounded-sm overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-card-alt border-b border-black/10 dark:border-white/10 text-[10px] font-mono uppercase tracking-wider text-muted">
                <th className="py-2.5 px-4 w-16 text-center">RANK</th>
                <th className="py-2.5 px-4">MEMBER</th>
                <th className="py-2.5 px-4 text-center">TASKS (+1)</th>
                <th className="py-2.5 px-4 text-center">MISTAKES (-3)</th>
                <th className="py-2.5 px-4 text-center">NET SCORE</th>
                <th className="py-2.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {memberScores.map((m, idx) => {
                const isExpanded = expandedMember === m.id;
                const isLeader = idx === 0;

                return (
                  <React.Fragment key={m.id}>
                    <tr 
                      onClick={() => toggleExpand(m.id)}
                      className={`hover:bg-card-alt/60 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-card-alt/80' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {isLeader ? (
                          <span className="inline-block bg-[#FACC15] text-black px-2 py-0.5 text-[10px] font-black font-mono rounded-sm">
                            #1 LEADER
                          </span>
                        ) : (
                          <span className="text-muted">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-sm bg-card-alt border border-black/5 dark:border-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-muted">
                            {m.avatar || m.id}
                          </span>
                          <div>
                            <span className="font-bold text-main block">{m.name}</span>
                            <span className="text-[10px] text-muted font-mono">[{m.id}] {m.role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tasks Points */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{m.taskPoints}
                        </span>
                        <span className="text-[10px] text-muted block">({m.tasksCompleted})</span>
                      </td>

                      {/* Mistakes Count */}
                      <td className="py-3 px-4 text-center font-mono">
                        {m.mistakesCount > 0 ? (
                          <>
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              -{m.penaltyPoints}
                            </span>
                            <span className="text-[10px] text-rose-500 block">({m.mistakesCount})</span>
                          </>
                        ) : (
                          <span className="text-muted font-bold">0</span>
                        )}
                      </td>

                      {/* Net Score */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-heading font-black text-sm sm:text-base text-main">
                          {m.netScore} <span className="text-[10px] font-bold text-muted">PTS</span>
                        </span>
                      </td>

                      {/* Action Toggle */}
                      <td className="py-3 px-4 text-right">
                        <button 
                          type="button"
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-muted hover:text-main"
                        >
                          {m.mistakesCount > 0 ? (
                            <span className="text-rose-500 font-bold">
                              {m.mistakesCount} {lang === 'gu' ? 'ભૂલો' : 'Mistakes'}
                            </span>
                          ) : (
                            <span className="text-muted">
                              {lang === 'gu' ? 'ક્લીન' : 'Clean'}
                            </span>
                          )}
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Member Details Row */}
                    {isExpanded && (
                      <tr className="bg-card-alt/30">
                        <td colSpan={6} className="p-4 border-t border-b border-black/5 dark:border-white/5">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                                {m.name} {lang === 'gu' ? 'ના વિગતવાર રેકોર્ડ્સ:' : 'DETAILED MISTAKE AUDIT:'}
                              </span>
                              <span className="text-[10px] font-mono text-muted">
                                Total Penalty: -{m.penaltyPoints} Marks
                              </span>
                            </div>

                            {m.mistakesList.length > 0 ? (
                              <div className="space-y-2">
                                {m.mistakesList.map((err) => (
                                  <div 
                                    key={err.id}
                                    className="p-3 bg-card border border-rose-500/30 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-rose-500 text-white font-mono text-[9px] px-1 py-0.5 rounded-sm font-bold">
                                          {err.id}
                                        </span>
                                        <span className="font-mono text-[10px] font-bold text-muted">
                                          {err.date}
                                        </span>
                                        <span className="font-bold text-main">
                                          {lang === 'gu' ? err.titleGu : err.title}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted">
                                        {lang === 'gu' ? err.descriptionGu : err.description}
                                      </p>
                                      {err.auditedByName && (
                                        <span className="text-[10px] text-muted/70 block mt-1 font-mono">
                                          {lang === 'gu' ? 'ઑડિટ અને રિપોર્ટ:' : 'Audited & Identified by:'} [{err.auditedBy}] {err.auditedByName}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                                      <span className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">
                                        -{err.penaltyMarks || 3} PTS
                                      </span>
                                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-mono font-bold rounded-sm flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        {lang === 'gu' ? err.statusGu || 'સોલ્વ થયેલ' : err.status || 'FIXED'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3 bg-card border border-black/5 dark:border-white/5 text-center text-xs text-muted font-mono rounded-sm flex items-center justify-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                {lang === 'gu' ? 'આ મેમ્બર દ્વારા કોઈ ભૂલ નોંધાયેલી નથી. ઉત્કૃષ્ટ કામગીરી!' : 'No mistakes recorded for this member. Clean record!'}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Date vs Mistakes Master Ledger Table */}
      <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-black uppercase text-main flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            {lang === 'gu' ? 'તારીખ મુજબ ભૂલોનું માસ્ટર રજિસ્ટર (Date vs Mistakes)' : 'MASTER MISTAKES REGISTER (DATE VS FAULT)'}
          </h3>
          <span className="text-[10px] font-mono text-muted font-medium">
            {mistakes.length} {lang === 'gu' ? 'નોંધાયેલી ભૂલો' : 'ENTRIES LOGGED'}
          </span>
        </div>

        <div className="bg-card border border-black/10 dark:border-white/10 rounded-sm overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-card-alt border-b border-black/10 dark:border-white/10 text-[10px] font-mono uppercase tracking-wider text-muted">
                <th className="py-2.5 px-4 w-28">DATE</th>
                <th className="py-2.5 px-4 w-36">MEMBER</th>
                <th className="py-2.5 px-4">MISTAKE DESCRIPTION</th>
                <th className="py-2.5 px-4 w-24 text-center">PENALTY</th>
                <th className="py-2.5 px-4 w-28 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {mistakes.map((err) => (
                <tr key={err.id} className="hover:bg-card-alt/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-muted text-[11px]">
                    {err.date}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span className="font-bold text-main block">[{err.member}]</span>
                    <span className="text-[10px] text-muted">{err.memberName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-main block text-xs">
                      {lang === 'gu' ? err.titleGu : err.title}
                    </span>
                    <span className="text-[11px] text-muted block mt-0.5 leading-snug">
                      {lang === 'gu' ? err.descriptionGu : err.description}
                    </span>
                    {err.auditedByName && (
                      <span className="text-[10px] text-muted/70 block mt-1 font-mono">
                        {lang === 'gu' ? 'ઑડિટર:' : 'Audited by:'} [{err.auditedBy}] {err.auditedByName}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                    -{err.penaltyMarks || 3}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-mono font-bold rounded-sm inline-flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {lang === 'gu' ? err.statusGu || 'સોલ્વ' : err.status || 'FIXED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
