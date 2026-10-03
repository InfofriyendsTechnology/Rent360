import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export default function PromptGuide({ lang }) {
  const [copied, setCopied] = useState(false);

  const promptText = "Log today's work for 001:\n1. Created the auth system\n2. Designed the login page\n3. Fixed CORS error";

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 p-4 sm:p-5 mb-8 shadow-sm-brutal">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-heading text-lg font-black uppercase text-emerald-700 dark:text-emerald-400">
          {lang === 'gu' ? 'નવો રિપોર્ટ કેવી રીતે એડ કરવો?' : 'HOW TO ADD A NEW DAILY LOG?'}
        </h3>
      </div>
      <p className="text-sm font-medium text-main mb-4 leading-relaxed">
        {lang === 'gu'
          ? 'આ સિસ્ટમમાં કોઈ ડેટાબેઝ નથી. નવો રિપોર્ટ નાખવા માટે નીચે આપેલો પ્રોમ્પ્ટ કોપી કરો, તેમાં તમારું આજનું કામ લખો અને ડેવલપર AI (મને) સેન્ડ કરો. હું જાતે જ બધું ફોર્મેટ કરીને સિસ્ટમમાં એડ કરી દઈશ.'
          : 'There is no database. To log your work, copy the prompt below, type your daily tasks, and send it to the AI. The AI will format and save it securely.'}
      </p>
      
      <div className="relative bg-card border-2 border-main p-3 sm:p-4">
        <button 
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 bg-main text-main border-2 border-main hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors shadow-sm-brutal"
          title="Copy Prompt"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <pre className="text-[10px] sm:text-xs font-mono font-bold text-muted whitespace-pre-wrap pr-10">
          {promptText}
        </pre>
      </div>
    </div>
  );
}
