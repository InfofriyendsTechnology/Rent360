import React from 'react';

export default function TeamSection({ lang }) {
  return (
    <div className="space-y-6 sm:space-y-10">

      {/* Section Header */}
      <div>
        <h2 className="font-heading text-xl sm:text-3xl font-black uppercase tracking-tight text-main mb-1 sm:mb-2">
          {lang === 'gu' ? 'ધ ઓરિજિન સ્ટોરી' : 'THE GENESIS'}
        </h2>
        <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-bold">
          {lang === 'gu'
            ? 'કેવી રીતે શરૂ થયો Rent360 પ્રોજેક્ટ'
            : 'HOW RENT360 WAS BORN'}
        </p>
      </div>

      {/* Narrative Box */}
      <div className="bg-card border-2 border-main p-6 sm:p-10 shadow-lg-brutal transition-colors">
        
        <div className="flex items-center gap-3 mb-8 border-b-2 border-main pb-6">
          <div className="w-12 h-12 bg-[#0B60B0] border-2 border-main shadow-sm-brutal flex items-center justify-center text-white font-heading font-black text-xl">
            25
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">SEPTEMBER 2026</div>
            <div className="font-heading text-lg sm:text-xl font-black text-main uppercase">The Spark</div>
          </div>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed sm:leading-loose font-medium text-main">
          {lang === 'gu' ? (
            <>
              <p>
                આ શરૂઆત 25 સપ્ટેમ્બર 2026 ના રોજ થઈ હતી. અમારા મિત્ર હર્ષ, જેઓ 'વિરાસત ધ ફેશન સ્ટુડિયો' ના પાર્ટનર છે, તેઓ Rentopus નામના એક રેન્ટલ સોફ્ટવેરનો ડેમો ટેસ્ટ કરી રહ્યા હતા. 
              </p>
              <p>
                અમે માત્ર IT સોફ્ટવેર ડેવલપર્સ નથી. અમે ગ્રાઉન્ડ લેવલના બિઝનેસને સમજીએ છીએ—યશ પાસે પોતાની બહેનના વેસ્ટર્ન વેર બુટિકનું મેનેજમેન્ટ કરવાનો લાઈવ અનુભવ છે, અને શ્રીધર એક પ્રોફેશનલ એકાઉન્ટન્ટ છે. જ્યારે અમે એ સોફ્ટવેર જોયું, ત્યારે અમને માત્ર ખરાબ કોડ નહીં, પણ ખરાબ <span className="bg-[#0B60B0] text-white px-2 py-0.5 font-bold mx-1">બિઝનેસ લોજિક</span> દેખાયું. જે લોકોએ ક્યારેય ગ્રાહકો સાથે સીધી ડીલ નથી કરી, તેઓ રિટેલર્સ માટે ટૂલ્સ બનાવી રહ્યા હતા.
              </p>
              <p className="pl-4 sm:pl-6 border-l-[4px] border-[#0B60B0] font-heading font-bold text-lg sm:text-xl py-2 my-8 text-main">
                અમારી પાસે એક મોટી તાકાત છે: અમે ફૂલ-સ્ટેક એન્જિનિયર્સ હોવાની સાથે-સાથે કાઉન્ટર પર થતી ભીડ, શોર્ટેજ, ડબલ-બુકિંગ અને ફાઇનાન્સિયલ એકાઉન્ટિંગને પ્રેક્ટિકલ રીતે સમજીએ છીએ.
              </p>
              <p>
                તે જ દિવસે અમે એક નિર્ણય લીધો. અમે શરૂઆતથી જ એક શક્તિશાળી, ઝીરો-ડિફેક્ટ Enterprise SaaS ERP બનાવીશું. અમે તેને <strong>વિરાસત સ્ટુડિયોમાં 100% લાઈફટાઈમ ફ્રી</strong> આપીશું, જેથી તે રિયલ વેડિંગ સીઝન ટ્રાફિક વચ્ચે ટેસ્ટ થઈ શકે.
              </p>
            </>
          ) : (
            <>
              <p>
                It all started on September 25, 2026. Harsh, a close friend and partner at Virasat The Fashion Studio, was testing a demo of a legacy rental software called Rentopus.
              </p>
              <p>
                As IT professionals who also happen to have deep roots in real-world commerce—Yash having live experience managing his sister's Western wear boutique, and Shridhar practicing as a professional accountant—we immediately saw the structural flaws. We didn't just see bad code; we saw bad <span className="bg-[#0B60B0] text-white px-2 py-0.5 font-bold mx-1">business logic</span>. Software developers without on-the-ground retail experience were building tools they never had to use.
              </p>
              <p className="pl-4 sm:pl-6 border-l-[4px] border-[#0B60B0] font-heading font-bold text-lg sm:text-xl py-2 my-8 text-main">
                We realized we possessed a rare unfair advantage: we are full-stack engineers who actually understand garment lifecycles, store shortages, double-booking nightmares, and double-entry accounting.
              </p>
              <p>
                That day, we made a decision. We would architect an enterprise-grade, zero-defect SaaS ERP from scratch. We would deploy it at <strong>Virasat Studio as a 100% lifetime free gift</strong> to pressure-test it in a live, high-volume environment. 
              </p>
            </>
          )}
        </div>

      </div>

      {/* Anchor Studio / The Goal */}
      <div className="bg-main border-2 border-main p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md-brutal mt-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 border-2 border-emerald-600 dark:border-emerald-400">
            {lang === 'gu' ? 'અંતિમ લક્ષ્ય' : 'THE ULTIMATE GOAL'}
          </span>
          <h4 className="font-heading text-lg sm:text-xl font-black uppercase text-main mt-4">
            {lang === 'gu' ? 'ગુજરાત માર્કેટ ડિસરપ્શન' : 'GUJARAT MARKET DISRUPTION'}
          </h4>
          <p className="text-xs sm:text-sm text-muted mt-2 font-medium max-w-2xl">
            {lang === 'gu'
              ? 'એકવાર વિરાસતમાં આ સોફ્ટવેર પરફેક્ટ સાબિત થઈ જાય, પછી અમે આખા ગુજરાતના રેન્ટલ માર્કેટમાં આ પ્રીમિયમ સિસ્ટમ માત્ર ₹10,000 માં આપીને માર્કેટ લીડર બનીશું.'
              : 'Once perfected at Virasat, we will disrupt the entire Gujarat rental market by offering this superior enterprise system for just ₹10,000—delivering unprecedented value.'}
          </p>
        </div>
        <div className="bg-card text-main px-8 py-6 text-center flex-shrink-0 border-2 border-main shadow-accent-lg">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">COMMERCIAL LAUNCH</div>
          <div className="font-heading text-2xl sm:text-4xl font-black text-[#0B60B0]">₹9,999/YR</div>
        </div>
      </div>

    </div>
  );
}
