# 🏗️ RentElite OS - System Architecture & Engineering Blueprint

> **હેતુ:** સોફ્ટવેર એન્જિનિયર્સ અને આર્કિટેક્ટ્સ માટે સિસ્ટમ ફ્લો, API એન્ડપોઇન્ટ્સ, WhatsApp ઓટોમેશન અને QR સ્કેનિંગ સિસ્ટમનું વિગતવાર માળખું.

---

## 1. હાઇ-લેવલ સિસ્ટમ આર્કિટેક્ચર (System Architecture)

```
[ ગ્રાહક / ઓનર / સ્ટાફ ]
         │
         ▼
[ Next.js 14 Web & PWA App (Tailwind + Shadcn) ]
         │ (HTTPS / REST / WebSocket)
         ▼
[ Node.js (NestJS / Express) API Gateway ]
   ├── Authentication & RBAC (Role-based access)
   ├── Calendar Booking Engine (Double Booking Guard)
   ├── Security Deposit Ledger
   ├── Tailor / Alteration Dispatcher
   └── Laundry Pipeline Manager
         │
 ┌───────┴───────┬───────────────┬────────────────┐
 ▼               ▼               ▼                ▼
[ PostgreSQL ]  [ Cloudinary ]  [ WhatsApp API ] [ QR Engine ]
(Data & Dates)  (Damage Photos) (Automated Bot)  (Barcode Tags)
```

---

## 2. કોર API એન્ડપોઇન્ટ્સ (Core API Routes)

### A. અવેલેબિલિટી & કેલેન્ડર એન્જિન (Availability API)
- `GET /api/v1/availability/check`
  - **Query Params:** `store_id`, `start_date`, `end_date`, `category_id`, `size`
  - **Logic:** આપેલ તારીખો વચ્ચે જે પ્રોડક્ટ વેરિઅન્ટ `BOOKED` કે `LAUNDRY` માં ના હોય તેવા તમામ વેરિઅન્ટ્સ ફિલ્ટર કરીને આપશે.

### B. બુકિંગ & POS API
- `POST /api/v1/bookings/create`
  - **Payload:** `customer_id`, `product_variant_ids[]`, `event_date`, `pickup_date`, `return_date`, `advance_amount`, `security_deposit_amount`
  - **Trigger:** WhatsApp Webhook ટ્રિગર થશે અને કસ્ટમરને તાત્કાલિક ડિજિટલ બિલ + શેરવાનીનો ફોટો મોકલાશે.

### C. દરજી / અલ્ટરેશન ટિકિટ API
- `POST /api/v1/alterations/create`
  - **Payload:** `booking_item_id`, `measurements: { chest, waist, length, sleeves }`, `deadline`
- `GET /api/v1/alterations/pending`
  - દરજીના ફોન કે ટેબલેટ માટે જે ડ્રેસ અલ્ટર કરવાના બાકી હોય તેનું લાઈવ લિસ્ટ.

### D. રિટર્ન & ડેમેજ API
- `POST /api/v1/returns/process`
  - **Payload:** `booking_id`, `has_damage`, `damage_penalty`, `damage_photos[]`, `all_accessories_returned`
  - **Logic:** સિક્યુરિટી ડિપોઝિટમાંથી ડેમેજ કાપીને ચોખ્ખી રકમ રીફંડ કરવાની એન્ટ્રી આપમેળે Cashbook માં પડી જશે.

---

## 3. WhatsApp Cloud API ઓટોમેશન ફ્લો (Exact Message Templates)

### 📲 ટેમ્પલેટ ૧: બુકિંગ કન્ફર્મેશન (Booking Confirmation)
```
નમસ્તે {{customer_name}} જી! 🙏
વિરાસત ફેશન સ્ટુડિયોમાંથી તમારી શેરવાનીનું બુકિંગ સફળતાપૂર્વક કન્ફર્મ થઈ ગયું છે.

📋 બુકિંગ નંબર: {{booking_no}}
👔 પ્રોડક્ટ: {{product_name}} (Size: {{size}})
📅 પ્રસંગ તારીખ: {{event_date}}
📦 પિકઅપ તારીખ: {{pickup_date}}
💰 કુલ ભાડું: ₹{{total_rent}} (એડવાન્સ: ₹{{advance_paid}})

તમારું ડિજિટલ બિલ જોવા નીચેની લિંક પર ક્લિક કરો:
{{invoice_pdf_link}}

કોઈપણ મદદ માટે અમારો સંપર્ક કરો: {{store_phone}}
```

### 📲 ટેમ્પલેટ ૨: ફાઇનલ ટ્રાયલ રિમાઇન્ડર (Final Trial Alert - પ્રસંગના 3 દિવસ પહેલા)
```
નમસ્તે {{customer_name}} જી! 🎉
તમારા શુભ પ્રસંગ માટેનો ડ્રેસ ({{product_name}}) દરજી દ્વારા માપ પ્રમાણે એકદમ તૈયાર કરી દેવાયો છે.

કૃપા કરીને આજે સાંજે {{trial_time}} વાગ્યા સુધીમાં ફાઇનલ ટ્રાયલ માટે પધારવા વિનંતી છે.
📍 સરનામું: {{store_address}}
```

### 📲 ટેમ્પલેટ ૩: રિટર્ન & સિક્યુરિટી ડિપોઝિટ રિમાઇન્ડર (Return Alert - પ્રસંગ પછીના દિવસે)
```
નમસ્તે {{customer_name}} જી! 💐
આશા છે કે આપનો પ્રસંગ અત્યંત આનંદદાયક રહ્યો હશે!

કૃપા કરીને આજે સાંજે ૭:૦૦ વાગ્યા સુધીમાં ડ્રેસ અને એક્સેસરીઝ જમા કરાવીને આપની સિક્યુરિટી ડિપોઝિટ (₹{{security_deposit}}) પરત મેળવી લેવા વિનંતી છે.
```

---

## 4. વોટરપ્રૂફ QR ટેગિંગ આર્કિટેક્ચર (QR Code Engine)

1. **ટેગ જનરેશન:**
   - દરેક શેરવાની / કુર્તા માટે એક યુનિક સ્ટ્રક્ચર્ડ QR કોડ બનશે:  
     `RE-STORE_ID-SKU-SIZE-SERIAL` (દા.ત. `RE-VFS-SH01-38-001`).
2. **સ્કેનિંગ ફંક્શનાલિટી:**
   - સેલ્સમેન પોતાના મોબાઈલ કેમેરાથી ટેગ સ્કેન કરે એટલે:
     - આ શેરવાનીનું નામ, સાઈઝ અને ફેબ્રિક
     - છેલ્લે કયા ગ્રાહક પાસે ગઈ હતી
     - આગામી કઈ તારીખે બુકિંગ છે
     - કુલ કેટલી વાર ભાડે ગઈ અને કેટલી કમાણી કરી
     બધું જ ૧ સેકન્ડમાં સ્ક્રીન પર ખુલી જશે!

---

## 5. સિક્યુરિટી ડિપોઝિટ અલ્ગોરિધમ (Security Ledger Formula)

```
ચોખ્ખી રિફંડ રકમ = મૂળ સિક્યુરિટી ડિપોઝિટ 
                 - ડેમેજ / ડાઘ પેનલ્ટી 
                 - ગુમ થયેલી એક્સેસરીઝની કિંમત 
                 - (લેટ દિવસો × પ્રતિ દિવસ લેટ ફી)
```
- જો ગ્રાહક પાસેથી હજુ ભાડાની બાકી રકમ (Balance Rent Due) લેવાની હોય, તો તે પણ સીધી ડિપોઝિટમાંથી કાપી શકાય છે.

---

## 6. મલ્ટી-ટેનન્સી સુરક્ષા (Store Data Isolation)

દરેક SQL ક્વેરીમાં Row-Level Security (RLS) અથવા Middleware દ્વારા `store_id` ફરજિયાત ચેક થશે:
```sql
SELECT * FROM bookings WHERE store_id = :current_store_id;
```
આનાથી વિરાસત ફેશન સ્ટુડિયો, સુરતની દુકાન કે રાજકોટની દુકાનનો ડેટા ક્યારેય એકબીજા સાથે ભળી નહીં શકે!
