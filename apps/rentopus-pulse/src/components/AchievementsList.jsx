import React from 'react';
import { Zap, User, Link as LinkIcon } from 'lucide-react';
import { FEATURE_IDEAS } from '../data/roadmapData';

export default function AchievementsList({ lang }) {
  const achievements = FEATURE_IDEAS.filter(idea => idea.status === 'COMPLETED');

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-main pb-4">
        <div>
          <h2 className="font-heading text-xl sm:text-3xl font-black uppercase tracking-tight text-main mb-1 sm:mb-2">
            {lang === 'gu' ? 'સિદ્ધિઓ અને પૂરા થયેલા આઇડિયા' : 'ACHIEVEMENTS & COMPLETED IDEAS'}
          </h2>
          <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-bold">
            {lang === 'gu'
              ? 'જે ફીચર્સ સફળતાપૂર્વક લોન્ચ થઈ ગયા છે તેની યાદી'
              : 'FEATURES AND IDEAS SUCCESSFULLY IMPLEMENTED'}
          </p>
        </div>
        <div className="bg-card px-4 py-2 border-2 border-main shadow-sm-brutal flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500" />
          <span className="font-black text-main">{achievements.length} ACHIEVED</span>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {achievements.length > 0 ? (
          achievements.map((ach) => (
            <div key={ach.id} className="bg-emerald-50 dark:bg-emerald-950/10 border-2 border-emerald-500 p-5 sm:p-6 flex flex-col justify-between shadow-md-brutal">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500 px-2 py-0.5">
                    ACHIEVED
                  </span>
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-black text-main uppercase leading-tight mb-2">
                  {lang === 'gu' ? ach.titleGu : ach.title}
                </h3>
                <p className="text-sm text-muted font-medium leading-relaxed mb-4">
                  {lang === 'gu' ? ach.descriptionGu : ach.descriptionEn}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t-2 border-emerald-500/30">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-main border-2 border-main text-[9px] font-bold uppercase tracking-wider text-muted">
                  <User className="w-3 h-3 text-[#0B60B0]" />
                  IDEA BY: {ach.suggestedBy}
                </div>
                {ach.createdAt && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-main border-2 border-main text-[9px] font-bold uppercase tracking-wider text-muted">
                    LOGGED: {ach.createdAt}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 p-8 border-2 border-dashed border-main text-center text-muted font-bold uppercase tracking-widest">
            {lang === 'gu' ? 'હજુ કોઈ આઇડિયા પૂરો નથી થયો' : 'NO IDEAS COMPLETED YET'}
          </div>
        )}
      </div>

    </div>
  );
}
