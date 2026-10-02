import React from 'react';
import { Users } from 'lucide-react';
import { TEAM_MEMBERS } from '../data/roadmapData';

export default function TeamList({ lang }) {
  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-main pb-4">
        <div>
          <h2 className="font-heading text-xl sm:text-3xl font-black uppercase tracking-tight text-main mb-1 sm:mb-2">
            {lang === 'gu' ? 'ટીમ મેમ્બર્સ' : 'TEAM MEMBERS'}
          </h2>
          <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-bold">
            {lang === 'gu'
              ? 'ફાઉન્ડિંગ ડેવલપર્સ અને તેમની ભૂમિકા'
              : 'FOUNDING DEVELOPERS & THEIR ROLES'}
          </p>
        </div>
        <div className="bg-card px-4 py-2 border-2 border-main shadow-sm-brutal flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0B60B0]" />
          <span className="font-black text-main">{TEAM_MEMBERS.length} MEMBERS</span>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {TEAM_MEMBERS.map(m => (
          <div
            key={m.id}
            className="bg-card border-2 border-main p-5 sm:p-6 flex flex-col justify-between shadow-md-brutal transition-transform hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-main bg-main flex items-center justify-center font-heading font-black text-[#0B60B0] text-sm sm:text-base shadow-sm-brutal">
                  {m.avatar}
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 bg-main border-2 border-main text-muted shadow-sm-brutal">
                  {m.badge}
                </span>
              </div>

              <h3 className="font-heading text-lg sm:text-xl font-black uppercase text-main">
                <span className="bg-main text-main border-2 border-main px-1.5 py-0.5 text-xs mr-2 shadow-sm-brutal">
                  {m.id}
                </span>
                {m.name}
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-[10px] sm:text-[11px] text-[#0B60B0] font-bold uppercase tracking-wider">{m.role}</p>
                {m.email && <p className="text-[9px] font-mono text-muted lowercase tracking-wide">{m.email}</p>}
                {m.accessLevel && <p className="text-[9px] font-bold bg-card-alt border border-main px-1.5 py-0.5 inline-block uppercase text-main">{m.accessLevel}</p>}
              </div>
              
              <div className="mt-4 pt-4 border-t-2 border-main">
                <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1.5">
                  {lang === 'gu' ? 'મુખ્ય ફોકસ' : 'CORE FOCUS'}
                </div>
                <p className="text-[11px] sm:text-sm text-main leading-relaxed font-medium">
                  {m.focus}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
