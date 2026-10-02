export const PROJECT_INFO = {
  name: "Rent360",
  tagline: "Roadmap to Completion & Daily Pulse",
  company: "InfoFriends Technology",
  ecosystem: "Info360 Suite",
  startDate: "2026-09-25",
  anchorStudio: "Virasat - The Fashion Studio, Gujarat (100% Lifetime Free)",
  subscriptionPricing: "₹9,999 / Year",
  techStack: {
    frontend: "React 18 + Vite + TypeScript + Tailwind CSS",
    backend: "Supabase (PostgreSQL)",
    database: "PostgreSQL with daterange exclusion constraints",
    architecture: "High-Speed Lightweight SPA + Real-Time Sync"
  }
};

export const TEAM_MEMBERS = [
  {
    id: "001",
    name: "Yash Babariya",
    role: "IT Full Stack Developer",
    badge: "Core Architecture & Retail UX",
    avatar: "YB",
    email: "yash.infofriyend@gmail.com",
    accessLevel: "Admin / Member",
    focus: "Full-stack frontend/backend, leveraging live experience managing sister's Western wear shop"
  },
  {
    id: "002",
    name: "Shridhar Savaliya",
    role: "Professional Accountant & IT Full Stack Developer",
    badge: "Finance & Core Engineering",
    avatar: "SS",
    email: "shridhar.infofriyend@gmail.com",
    accessLevel: "Admin / Member",
    focus: "Security deposit ledger, GST audit, double-entry accounting, backend logic"
  }
];

export const DAILY_HISTORY = [
  {
    date: "25-09-2026",
    dayNumber: 1,
    title: "The Spark & Virasat Studio Realization",
    titleGu: "વિચારનો ઉદ્ભવ અને વિરાસત સ્ટુડિયોનું એનાલિસિસ",
    members: ["001", "002"],
    tasksEn: [

      { member: "003", text: "Harsh Savaliya evaluated an existing rental software demo at Virasat - The Fashion Studio." },
      { member: "003", text: "Yash Babariya (IT Full Stack Dev + Retail Mgmt Experience) & Harsh analyzed competitor software 'Rentopus'." },
      { member: "001", text: "Identified critical industry flaws: market tools are slow, clunky, overpriced (₹16,000+), and lack boutique workflow logic." },
      { member: "001", text: "Strategic decision taken: Build a custom, ultra-fast ERP (Rent360) for Virasat Studio (100% Free), and roll out to all Gujarat studios for ₹9,999/yr." }
    
    ],
    tasksGu: [

      { member: "003", text: "હર્ષ સાવલિયાએ 'વિરાસત ધ ફેશન સ્ટુડિયો' ખાતે ચાલતા રેન્ટલ સોફ્ટવેર ડેમોનું ટેસ્ટિંગ કર્યું." },
      { member: "003", text: "યશભાઈ (IT ફૂલ સ્ટેક ડેવ. + રિટેલ મેનેજમેન્ટ અનુભવ) અને હર્ષભાઈએ કોમ્પિટિટર 'Rentopus' નું એનાલિસિસ કર્યું." },
      { member: "001", text: "ગંભીર ખામીઓ પકડી: માર્કેટના સોફ્ટવેર બહુ ધીમા, મોંઘા (₹16,000+) અને દુકાનની સાચી જરૂરિયાત વગરના બનેલા છે." },
      { member: "001", text: "મોટો નિર્ણય: વિરાસત સ્ટુડિયો માટે અતિ ઝડપી Rent360 બનાવવું (લાઈફટાઈમ ફ્રી), અને પછી ₹9,999/વર્ષમાં અન્ય સ્ટુડિયોઝને આપવું." }
    ],
    deliverables: ["Market Gap Identification", "₹9,999 SaaS Strategy", "Virasat Proving Ground Partnership"
    ]
  },
  {
    date: "26-09-2026",
    dayNumber: 2,
    title: "Competitor Reverse-Engineering (SiteSnapPro)",
    titleGu: "કોમ્પિટિટર રિવર્સ-એન્જિનિયરિંગ અને 54 સ્ક્રીન ઓડિટ",
    members: ["001"],
    tasksEn: [

      { member: "001", text: "Engineered automated Playwright crawler tool (SiteSnapPro) in Python." },
      { member: "001", text: "Audited all 54 routes/pages of competitor app (shop.whitecoretechnology.com)." },
      { member: "001", text: "Captured 54 full-page desktop screenshots (page_001.png to page_054.png)." },
      { member: "001", text: "Extracted structural JSON metadata (rentopus_admin_data.json) covering 52+ menus, forms, buttons, and billing flows." },
      { member: "001", text: "Pinpointed failure points: double-booking conflicts, lack of waterproof QR laundry tracking, and complicated refund flows." }
    
    ],
    tasksGu: [

      { member: "001", text: "પાયથોન અને પ્લેરાઈટ (Playwright) ની મદદથી 'SiteSnapPro' ઓટોમેશન ટૂલ બનાવ્યું." },
      { member: "001", text: "કોમ્પિટિટર સોફ્ટવેરના તમામ 54 રૂટ્સ અને સ્ક્રીન્સનું ડીપ ક્રોલિંગ કર્યું." },
      { member: "001", text: "તમામ 54 પેજીસના ફૂલ-પેજ સ્ક્રીનશોટ્સ (page_001 થી page_054) કેપ્ચર કર્યા." },
      { member: "001", text: "52+ ફંક્શનલ મેનૂ અને બટન્સનું JSON મેપિંગ કર્યું (rentopus_admin_data.json)." },
      { member: "001", text: "મુખ્ય સમસ્યાઓ શોધી: ડબલ બુકિંગ થવું, લોન્ડ્રીમાં વોટરપ્રૂફ QR નો અભાવ અને ડિપોઝિટ રિફંડની મુશ્કેલી." }
    ],
    deliverables: ["54 Route Screenshots", "rentopus_admin_data.json", "Competitor Bottleneck Matrix"
    ]
  },
  {
    date: "27-09-2026",
    dayNumber: 3,
    title: "Master Lifecycle & System Specifications",
    titleGu: "માસ્ટર આર્કિટેક્ચર અને 6-સ્ટેજ ગારમેન્ટ લાઈફસાઈકલ",
    members: ["001"],
    tasksEn: [

      { member: "001", text: "Formulated the 6-Stage Garment Rental Lifecycle (Enquiry > Booking > Alteration > Pickup > Inspection/Return > Laundry)." },
      { member: "001", text: "Authored comprehensive master specification document (README.md)." },
      { member: "001", text: "Drafted 11-week tactical development roadmap from development to showroom pilot." },
      { member: "001", text: "Specified automated WhatsApp cloud reminders for trial dates and return deadlines." }
    
    ],
    tasksGu: [

      { member: "001", text: "શેરવાની/ઇન્ડો-વેસ્ટર્ન માટે 6-સ્ટેજ ગારમેન્ટ લાઈફસાઈકલ મોડેલ તૈયાર કર્યું." },
      { member: "001", text: "વિગતવાર માસ્ટર સ્પેસિફિકેશન ડોક્યુમેન્ટ (README.md) તૈયાર કર્યું." },
      { member: "001", text: "11 અઠવાડિયાનો વિગતવાર ડેવલપમેન્ટ રોડમેપ લોક કર્યો." },
      { member: "001", text: "ટ્રાયલ અને રિટર્ન માટે ઓટોમેટેડ વોટ્સએપ ક્લાઉડ નોટિફિકેશન સિસ્ટમ પ્લાન કરી." }
    ],
    deliverables: ["README.md", "6-Stage Lifecycle Model", "11-Week Execution Timeline"
    ]
  },
  {
    date: "28-09-2026",
    dayNumber: 4,
    title: "Database Schema & Zero Double-Booking Math",
    titleGu: "ડેટાબેઝ સ્કીમા અને ઝીરો ડબલ-બુકિંગ મેથેમેટિક્સ",
    members: ["001"],
    tasksEn: [

      { member: "001", text: "Architected PostgreSQL enterprise schema with multi-tenant isolation." },
      { member: "001", text: "Engineered mathematical exclusion constraint (EXCLUDE USING gist) on garment dateranges to make double-booking impossible." },
      { member: "001", text: "Engineered Security Deposit & Damage Ledger schema for accurate ₹5,000 refund calculations." },
      { member: "001", text: "Designed Thermal 80mm dual-copy customer/store receipt layout with alteration checklist (DETAILED_MODULE_BREAKDOWN_AND_BILLING.md)." }
    
    ],
    tasksGu: [

      { member: "001", text: "પોસ્ટગ્રેસ (PostgreSQL) મલ્ટી-ટેનન્ટ એન્ટરપ્રાઇઝ ડેટાબેઝ સ્કીમા તૈયાર કર્યો." },
      { member: "001", text: "`daterange` એક્સક્લૂઝન કન્સ્ટ્રેઈન્ટથી ડેટાબેઝ લેવલે જ ડબલ બુકિંગ અટકાવવાનું ગણિત સેટ કર્યું." },
      { member: "001", text: "સિક્યોરિટી ડિપોઝિટ અને ડેમેજ ડિડક્શન લેજરનું પરફેક્ટ સ્કીમા ડિઝાઇન કર્યું." },
      { member: "001", text: "80mm થર્મલ ડ્યુઅલ-કોપી બિલ અને ટેલર અલ્ટરેશન સ્લિપનું મોડલ તૈયાર કર્યું." }
    ],
    deliverables: ["DATABASE_SCHEMA.md", "SYSTEM_ARCHITECTURE.md", "Thermal Bill Layout Specs"
    ]
  },
  {
    date: "29-09-2026",
    dayNumber: 5,
    title: "Minimalist Design Philosophy (The 92/8 Rule)",
    titleGu: "સોશિયલ મીડિયા મિનિમલિસ્ટ ડિઝાઇન (92/8 રૂલ)",
    members: ["001", "002"],
    tasksEn: [

      { member: "001", text: "Iterated brand palettes: Discarded eye-fatiguing loud gradients and neon fills." },
      { member: "001", text: "Established the 92/8 Rule: 92% Clean Monochrome (Pure Pitch Black #000000 / Pure White #FFFFFF) + 8% Surgical Clean Blue (#0B60B0)." },
      { member: "001", text: "Configured high-end typography hierarchy: Sora (Headings/Financials) + Plus Jakarta Sans (UI/Body) + Inter (Data)." },
      { member: "001", text: "Created pure SVG line icons (zero childish emojis) and tested 6px rounded vs 0px sharp button corners." },
      { member: "001", text: "Created interactive single-screen 100vh harness: theme_preview.html with live Light/Dark switch." }
    
    ],
    tasksGu: [

      { member: "001", text: "આંખો ખેંચાય તેવા ગ્રેડિયન્ટ્સ સંપૂર્ણપણે રદ કર્યા." },
      { member: "001", text: "92/8 નિયમ લાગુ કર્યો: 92% ક્લીન મોનોક્રોમ (Black/White) અને 8% સર્જિકલ સોલિડ બ્લૂ (#0B60B0)." },
      { member: "001", text: "`Sora` (હેડિંગ્સ), `Plus Jakarta Sans` (બોડી) અને `Inter` ફોન્ટ સ્કેલ નક્કી કરી." },
      { member: "001", text: "100% ક્લીન SVG વેક્ટર આઇકોન્સ અને બટન રેડિયસ (6px vs 0px) ની સરખામણી કરી." },
      { member: "001", text: "સંપૂર્ણ લાઈવ લાઈટ/ડાર્ક મોડ સાથે `theme_preview.html` પ્રિવ્યૂ પેજ બનાવ્યું." }
    ],
    deliverables: ["theme_preview.html", "preview_clean_blue.png", "Solid Blue 92/8 Tokens"
    ]
  },
  {
    date: "30-09-2026",
    dayNumber: 6,
    title: "Official Brand Assets & Logo Integration",
    titleGu: "ઓફિશિયલ બ્રાન્ડ એસેટ્સ અને Rent360 લોગો",
    members: ["001"],
    tasksEn: [

      { member: "001", text: "Crafted AI logo design brief & prompts document (LOGO_DESIGN_AI_BRIEF.txt)." },
      { member: "001", text: "Incorporated official Rent360 brand assets into repository (Rent360_Black.png, Rent360_White.png, icons)." },
      { member: "001", text: "Validated logo appearance across Pitch Black Dark Mode and Clean White Light Mode." },
      { member: "001", text: "Mapped brand presence under InfoFriends Technology ecosystem." }
    
    ],
    tasksGu: [

      { member: "001", text: "AI લોગો ડિઝાઇન માટેનો બ્રીફ અને પ્રોમ્પ્ટ્સ તૈયાર કર્યા (LOGO_DESIGN_AI_BRIEF.txt)." },
      { member: "001", text: "ઓફિશિયલ Rent360 લોગો ફાઈલો (Rent360_White.png, Rent360_Black.png) પ્રોજેક્ટમાં મૂકી." },
      { member: "001", text: "લાઈટ અને ડાર્ક મોડમાં લોગોની વિઝિબિલિટી કન્ફર્મ કરી." },
      { member: "001", text: "ઇન્ફોફ્રેન્ડ્સ ટેક્નોલોજી (InfoFriends Technology) અંતર્ગત બ્રાન્ડિંગ સેટ કર્યું." }
    ],
    deliverables: ["Rent360_Black.png", "Rent360_White.png", "App Favicons", "LOGO_DESIGN_AI_BRIEF.txt"
    ]
  },
  {
    date: "01-10-2026",
    dayNumber: 7,
    title: "Framework Decision & Roadmap Application Launch",
    titleGu: "ફ્રેમવર્ક લોકિંગ (React+Vite) અને રોડમેપ એપ્લિકેશન લૉન્ચ",
    members: ["001", "002"],
    tasksEn: [

      { member: "001", text: "Evaluated Next.js vs. React + Vite: Yash Babariya's real testing proved Next.js was bloated and sluggish on local reloads." },
      { member: "001", text: "Locked winning framework: React 18 + Vite + TypeScript (ultra-fast <50ms HMR, lightweight SPA for counter POS)." },
      { member: "002", text: "Documented exact team superpowers: Yash Babariya (IT Full Stack Dev + Retail Mgmt Experience), Shridhar (Accountant & Full Stack Dev), Harsh (Virasat Studio Partner)." },
      { member: "001", text: "Created PROJECT_JOURNAL_AND_ROADMAP.md for persistent historical logging." },
      { member: "001", text: "Engineered 'Rent360 Pulse' tracking application using the custom daily reporting format." }
    
    ],
    tasksGu: [

      { member: "001", text: "Next.js ના બદલે અતિ ઝડપી અને હળવું **React 18 + Vite + TypeScript** ફાઇનલ કર્યું." },
      { member: "002", text: "ટીમના રોલ્સ નોંધ્યા: યશભાઈ (IT ફૂલ સ્ટેક ડેવ. + રિટેલ અનુભવ), શ્રીધરભાઈ (એકાઉન્ટન્ટ + ફૂલ સ્ટેક), હર્ષભાઈ (વિરાસત સ્ટુડિયો પાર્ટનર)." },
      { member: "001", text: "પરમેનન્ટ હિસ્ટ્રી લોગ માટે `PROJECT_JOURNAL_AND_ROADMAP.md` બનાવ્યું." },
      { member: "001", text: "કસ્ટમ ડેઇલી રિપોર્ટિંગ ફોર્મેટનો ઉપયોગ કરીને 'Rent360 Pulse' ટ્રેકિંગ એપ ઊભી કરી." }
    ],
    deliverables: ["React + Vite Scaffolding", "PROJECT_JOURNAL_AND_ROADMAP.md", "Rent360 Pulse Tracker App"
    ]
  }
];

export const ACHIEVEMENTS = [
  {
    id: "ACH-001",
    title: "Virasat Studio Production Go-Live",
    titleGu: "વિરાસત સ્ટુડિયોમાં લાઈવ પ્રોડક્શન શરૂ",
    date: "TBD",
    descriptionEn: "Successfully deployed the Rent360 ERP at Virasat Studio and processed the first real-world customer rental booking.",
    descriptionGu: "વિરાસત સ્ટુડિયોના કાઉન્ટર પર સોફ્ટવેર લાઈવ કર્યું અને રિયલ કસ્ટમરનું પહેલું રેન્ટલ બુકિંગ સફળતાપૂર્વક પ્રોસેસ કર્યું."
  },
  {
    id: "ACH-002",
    title: "Zero Double-Booking Validation",
    titleGu: "ઝીરો ડબલ-બુકિંગનું પ્રમાણીકરણ",
    date: "TBD",
    descriptionEn: "Processed 100+ concurrent bookings without a single date clash or inventory overlap, proving the core architecture.",
    descriptionGu: "એકસાથે 100 થી વધુ બુકિંગ્સ ડબલ-બુકિંગ કે એરર વગર પ્રોસેસ કર્યા અને સિસ્ટમની એક્યુરસી સાબિત કરી."
  },
  {
    id: "ACH-003",
    title: "First 10 Commercial SaaS Clients",
    titleGu: "પ્રથમ 10 કોમર્શિયલ SaaS ક્લાયન્ટ્સ",
    date: "TBD",
    descriptionEn: "Successfully onboarded 10 external rental boutiques in Gujarat at the ₹9,999/year commercial plan.",
    descriptionGu: "ગુજરાતના અન્ય 10 રેન્ટલ બુટિક્સને ₹9,999/વર્ષ ના પ્લાન સાથે સફળતાપૂર્વક સિસ્ટમમાં જોડ્યા."
  }
];

export const FEATURE_IDEAS = [
  {
    id: "IDEA-001",
    createdAt: "01-10-2026",
    title: "Modular & Customizable Feature Toggles",
    titleGu: "કસ્ટમ મોડ્યુલર ફીચર સિસ્ટમ",
    suggestedBy: "Yash Babariya",
    source: "Own Idea / Architecture Vision",
    descriptionEn: "Software shouldn't be bloated with permanent features that a client doesn't use. We will build a modular architecture where features can be toggled on/off based on the client's plan. If a client doesn't need a specific feature, they won't even see it, keeping their dashboard clean, comfortable, and highly customized to their exact needs.",
    descriptionGu: "સોફ્ટવેરમાં બિનજરૂરી ફીચર્સ કાયમી ન હોવા જોઈએ. આપણે એવી મોડ્યુલર સિસ્ટમ બનાવીશું જેમાં ક્લાયન્ટના પ્લાન પ્રમાણે ફીચર્સ ચાલુ/બંધ કરી શકાય. જો ક્લાયન્ટને કોઈ ફીચર નથી જોઈતું, તો તે એમના ડેશબોર્ડમાં દેખાશે જ નહીં. આનાથી સોફ્ટવેર એકદમ ક્લીન, કમ્ફર્ટેબલ અને કસ્ટમાઇઝેબલ રહેશે.",
    history: [
      {
        date: "01-10-2026",
        author: "Example Context",
        type: "note",
        contentEn: "For example, if staff salary management is hardcoded in the software but the client uses a different tool for it, the uncustomizable salary feature becomes useless bloat.",
        contentGu: "ઉદાહરણ તરીકે: જો સ્ટાફ સેલરીનું ફીચર કાયમી હોય પણ ક્લાયન્ટ તેનો ઉપયોગ ન કરતો હોય, તો તે નકામું બની જાય છે. તેથી તેને કસ્ટમાઇઝેબલ રાખવું જરૂરી છે."
      },
      {
        date: "02-10-2026",
        author: "Shridhar Savaliya",
        type: "doubt",
        contentEn: "Doubt: If clients don't see a feature by default, how will they know about its advantages or even know that it exists?",
        contentGu: "પ્રશ્ન (Shridhar): જો ક્લાયન્ટને કોઈ ફીચર દેખાશે જ નહીં, તો તેમને એ ફીચરના ફાયદા કેવી રીતે ખબર પડશે? તેમને કેવી રીતે ખ્યાલ આવશે કે આવું કોઈ ફીચર છે?"
      },
      {
        date: "02-10-2026",
        author: "Yash Babariya",
        type: "reply",
        contentEn: "Reply: We will explain all available features to our clients very carefully during onboarding. If they explicitly don't want a feature after knowing about it, there is no reason to force it onto their dashboard.",
        contentGu: "જવાબ (Yash Babariya): આપણે ક્લાયન્ટને ઓનબોર્ડિંગ વખતે સોફ્ટવેરના બધા જ ફીચર્સ વિગતવાર સમજાવીશું. જો બધું જાણ્યા પછી પણ તેમને કોઈ ફીચર નથી જોઈતું, તો પછી આપણે શા માટે તે ફીચર પરાણે ઉમેરવું જોઈએ?"
      }
    ]
  }
];
