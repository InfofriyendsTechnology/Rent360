import React, { useState } from 'react';
import { Lightbulb, User, Link as LinkIcon, MessageSquare, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { FEATURE_IDEAS } from '../data/roadmapData';

export default function IdeaBacklog({ lang, setActiveTab }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const parseMentions = (text) => {
    if (!text) return text;
    // Split by @000, @001, etc.
    const parts = text.split(/(@\d{3})/g);
    return parts.map((part, i) => {
      if (part.match(/^@\d{3}$/)) {
        return (
          <button
            key={i}
            onClick={() => setActiveTab('team')}
            className="inline-flex items-center mx-1 px-1.5 py-0.5 bg-[#0B60B0] text-white border-2 border-[#0B60B0] text-[10px] font-mono font-black shadow-sm-brutal hover:bg-main hover:text-[#0B60B0] transition-colors"
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  let filteredIdeas = FEATURE_IDEAS.filter(idea => idea.status !== 'COMPLETED');
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filteredIdeas = filteredIdeas.filter(idea => {
      const matchTitle = (idea.title || '').toLowerCase().includes(q);
      const matchTitleGu = (idea.titleGu || '').toLowerCase().includes(q);
      const matchDesc = (idea.descriptionEn || '').toLowerCase().includes(q);
      const matchDescGu = (idea.descriptionGu || '').toLowerCase().includes(q);
      return matchTitle || matchTitleGu || matchDesc || matchDescGu;
    });
  }

  const toggleIdea = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-main pb-4 mb-4">
        <div>
          <h2 className="font-heading text-xl sm:text-3xl font-black uppercase tracking-tight text-main mb-1 sm:mb-2">
            {lang === 'gu' ? 'આઇડિયા બેકલોગ' : 'FEATURE IDEAS BACKLOG'}
          </h2>
          <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-bold">
            {lang === 'gu'
              ? 'ભવિષ્યના ફીચર્સ, સોશિયલ મીડિયા રેફરન્સ અને નવા આઇડિયાઝ.'
              : 'FUTURE PLANS, SOCIAL MEDIA REFERENCES & PENDING CONCEPTS.'}
          </p>
        </div>
        <div className="bg-card px-4 py-2 sm:py-3 border-[3px] border-main shadow-sm-brutal flex items-center gap-2 shrink-0 self-start">
          <Lightbulb className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
          <span className="font-black text-main text-[11px] sm:text-xs tracking-widest">{filteredIdeas.length} PENDING</span>
        </div>
      </div>

      {/* Search Row */}
      <div className="pb-6 w-full">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted" strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder={lang === 'gu' ? 'આઇડિયા સર્ચ કરો...' : 'Search ideas...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card text-main text-sm sm:text-base font-bold pl-12 sm:pl-14 pr-4 py-3 sm:py-4 border-[3px] border-main shadow-sm-brutal focus:outline-none focus:border-[#0B60B0] focus:ring-0 transition-colors placeholder:text-muted/60"
          />
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        {filteredIdeas.map((idea) => (
          <div
            key={idea.id}
            className={`bg-card border-2 border-main transition-all ${
              expandedId === idea.id ? 'shadow-accent-lg border-[#0B60B0]' : 'shadow-md-brutal hover:shadow-lg-brutal'
            }`}
          >
            {/* Header / Meta */}
            <div className="flex items-center justify-between border-b-2 border-main p-3 sm:p-4 bg-card-alt cursor-pointer" onClick={() => toggleIdea(idea.id)}>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-muted uppercase tracking-widest">
                  <User className="w-3.5 h-3.5" />
                  <span>{idea.suggestedBy}</span>
                </div>
                {idea.createdAt && (
                  <div className="bg-main text-main border-2 border-main px-1.5 py-0.5 text-[8px] sm:text-[9px] font-mono font-black shadow-sm-brutal">
                    {idea.createdAt}
                  </div>
                )}
              </div>
              <span className="bg-main text-main border-2 border-main px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                {idea.status}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5">
              <h3 className="font-heading text-lg sm:text-xl font-black text-main uppercase mb-2 leading-tight">
                {lang === 'gu' ? idea.titleGu : idea.title}
              </h3>
              
              <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed mb-4">
                {parseMentions(lang === 'gu' ? idea.descriptionGu : idea.descriptionEn)}
              </p>

              {/* Footer / Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-main border-2 border-main text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted">
                  <LinkIcon className="w-3 h-3 text-[#0B60B0]" />
                  SOURCE: {idea.source}
                </div>

                {idea.history && idea.history.length > 0 && (
                  <button 
                    onClick={() => toggleIdea(idea.id)}
                    className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border-2 px-3 py-1.5 transition-colors ${
                      expandedId === idea.id 
                        ? 'bg-[#0B60B0] border-[#0B60B0] text-white' 
                        : 'bg-main border-main text-main hover:bg-[#0B60B0] hover:text-white hover:border-[#0B60B0]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {idea.history.length} {lang === 'gu' ? 'ચર્ચા' : 'UPDATES'}
                    {expandedId === idea.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Expanded History Thread */}
              {expandedId === idea.id && idea.history && (
                <div className="mt-6 pt-5 border-t-2 border-main space-y-4">
                  <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    {lang === 'gu' ? 'ચર્ચા અને ઇવોલ્યુશન' : 'DISCUSSION & EVOLUTION THREAD'}
                  </div>
                  
                  {idea.history.map((h, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 sm:p-4 border-2 ${
                        h.type === 'reply' 
                          ? 'border-[#0B60B0] bg-[#0B60B0] bg-opacity-5 ml-4 sm:ml-8 relative' 
                          : h.type === 'doubt'
                            ? 'border-amber-500 bg-amber-500 bg-opacity-5'
                            : 'border-main bg-main'
                      }`}
                    >
                      {/* Connection Line for Replies */}
                      {h.type === 'reply' && (
                        <div className="absolute -left-[18px] sm:-left-[34px] top-4 w-[16px] sm:w-[32px] h-[2px] bg-[#0B60B0]"></div>
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase ${h.type === 'reply' ? 'text-[#0B60B0]' : 'text-main'}`}>
                            {h.author}
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 bg-card-alt border border-main text-muted">
                            {h.type}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-muted">{h.date}</span>
                      </div>
                      <p className={`text-[11px] sm:text-xs font-medium leading-relaxed ${h.type === 'reply' ? 'text-main' : 'text-muted'}`}>
                        {parseMentions(lang === 'gu' ? h.contentGu : h.contentEn)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
