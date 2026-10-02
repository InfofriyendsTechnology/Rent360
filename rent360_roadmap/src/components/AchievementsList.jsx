import React from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/roadmapData';

export default function AchievementsList({ lang }) {
  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-main pb-4">
        <div>
          <h2 className="font-heading text-xl sm:text-3xl font-black uppercase tracking-tight text-main mb-1 sm:mb-2">
            {lang === 'gu' ? 'મુખ્ય સિદ્ધિઓ' : 'MAJOR ACHIEVEMENTS'}
          </h2>
          <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-bold">
            {lang === 'gu'
              ? 'ભવિષ્યની કોઈ આગાહી નહીં, માત્ર નક્કર કામનું પરિણામ.'
              : 'NO PREDICTIONS. JUST PROVEN MILESTONES.'}
          </p>
        </div>
        <div className="bg-card px-4 py-2 border-2 border-main shadow-sm-brutal flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#0B60B0]" />
          <span className="font-black text-main">{ACHIEVEMENTS.length}</span>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {ACHIEVEMENTS.slice().reverse().map((a, idx) => (
          <div
            key={a.id}
            className="flex flex-col p-5 sm:p-6 bg-card border-2 border-main shadow-md-brutal transition-transform hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="bg-main text-main border-2 border-main px-2 py-1 text-[10px] font-bold uppercase tracking-widest font-mono">
                {a.date}
              </span>
              <CheckCircle2 className="w-5 h-5 text-[#0B60B0]" strokeWidth={3} />
            </div>
            
            <h3 className="font-heading text-lg sm:text-xl font-black text-main uppercase mb-2 leading-tight">
              {lang === 'gu' ? a.titleGu : a.title}
            </h3>
            
            <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed">
              {lang === 'gu' ? a.descriptionGu : a.descriptionEn}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
