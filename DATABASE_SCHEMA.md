# 🗄️ Rent360 - Database Schema & Architecture

આ ડોક્યુમેન્ટમાં **Rent360 (Multi-tenant Rental OS)** નું સંપૂર્ણ ડેટાબેઝ માળખું (PostgreSQL) વ્યાખ્યાયિત કરેલ છે.

---

## 1. Stores (દુકાન માસ્ટર)
આ ટેબલ મલ્ટી-ટીનન્ટ આર્કિટેક્ચરનો પાયો છે. બાકીનો તમામ ડેટા આ `store_id` સાથે જોડાયેલો રહેશે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | દુકાનનું યુનિક આઈડી |
| `name` | String | દુકાનનું નામ (દા.ત. Virasat Fashion Studio) |
| `owner_name` | String | માલિકનું નામ |
| `mobile` | String | મુખ્ય સંપર્ક નંબર (બિલ પ્રિન્ટિંગ માટે) |
| `email` | String | ઇમેઇલ એડ્રેસ |
| `address` | Text | પૂરું સરનામું (બિલ પ્રિન્ટિંગ માટે) |
| `city` | String | શહેર |
| `state` | String | રાજ્ય |
| `pincode` | String | પીનકોડ |
| `gst_number` | String | GST નંબર (વૈકલ્પિક) |
| `logo_url` | String | દુકાનના લોગોની ઇમેજ લિંક |
| `upi_id` | String | બિલ પર QR કોડ બતાવવા માટે UPI ID |
| `subscription_status` | Enum | `ACTIVE`, `INACTIVE`, `TRIAL` |
| `created_at` | DateTime | રેકોર્ડ ક્યારે બન્યો |
| `updated_at` | DateTime | રેકોર્ડ છેલ્લે ક્યારે અપડેટ થયો |

---

## 2. Roles (સત્તા અને અધિકારો)
દરેક દુકાન પોતાના સ્ટાફ માટે કસ્ટમ રોલ્સ અને પરમિશન બનાવી શકે તે માટેનું ટેબલ.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK) | કઈ દુકાનનો રોલ છે |
| `name` | String | રોલનું નામ (દા.ત. Admin, Salesman, Masterji) |
| `permissions` | JSONB | અધિકારોનું લિસ્ટ (દા.ત. `["view_reports", "create_bill"]`) |
| `created_at` | DateTime | ક્યારે બન્યો |
| `updated_at` | DateTime | છેલ્લે ક્યારે અપડેટ થયો |

---

## 3. Users (સ્ટાફ અને માલિક)
સોફ્ટવેર વાપરનાર દરેક વ્યક્તિ (માલિક કે સ્ટાફ) નો ડેટા.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK) | કઈ દુકાનનો સ્ટાફ છે |
| `role_id` | UUID (FK) | સ્ટાફનો રોલ શું છે (Roles ટેબલ સાથે કનેક્ટેડ) |
| `name` | String | સ્ટાફનું નામ |
| `mobile` | String | લોગિન કરવા માટે મોબાઈલ નંબર |
| `password_hash` | String | પાસવર્ડ |
| `status` | Enum | નોકરી ચાલુ છે કે નહિ (`ACTIVE`, `INACTIVE`) |
| `created_at` | DateTime | એકાઉન્ટ ક્યારે બન્યું |

---

## 4. Categories (કેટેગરી)
દુકાનના કપડાંના અલગ અલગ પ્રકાર (જેમ કે શેરવાની, જોધપુરી) માટે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index) | કઈ દુકાનની કેટેગરી છે |
| `category_code` | String | દુકાનદારનો પોતાનો શોર્ટ કોડ (દા.ત. SHR) |
| `name` | String | કેટેગરીનું નામ (દા.ત. Sherwani) |
| `description` | Text | વધારાની માહિતી |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 5. Products (ડિઝાઇન અને કેટલોગ)
આ ટેબલ માસ્ટર ડિઝાઇન માટે છે. દુકાનદાર ગ્રાહકને આમાંથી ફોટા બતાવશે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index) | કઈ દુકાનની પ્રોડક્ટ છે |
| `category_id` | UUID (FK) | આ કઈ કેટેગરીમાં આવે છે |
| `product_code` | String | દુકાનદારનો પોતાનો શોર્ટ કોડ (દા.ત. SHR-ROYAL) |
| `name` | String | પ્રોડક્ટનું નામ (દા.ત. Royal Velvet Sherwani) |
| `base_rent_price` | Decimal | સામાન્ય ભાડું (દા.ત. 4500) |
| `base_security_deposit`| Decimal | સિક્યુરિટી ડિપોઝિટ (દા.ત. 5000) |
| `image_urls` | JSONB | ડ્રેસના ફોટાઓની લિંક |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 6. Product_Items (ફિઝિકલ પીસ / QR કોડ સ્ટોક)
એક જ પ્રોડક્ટના દુકાનમાં રહેલા અલગ-અલગ ફિઝિકલ પીસ (જે ભાડે જાય છે).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index) | કઈ દુકાન |
| `product_id` | UUID (FK) | આ કઈ ડિઝાઇનનો પીસ છે |
| `sku_code` | String | યુનિક QR/બારકોડ ID (દા.ત. SH-089-M) |
| `size` | String | આ પીસની સાઈઝ (દા.ત. 38, 40, Free Size) |
| `color` | String | કલર |
| `status` | Enum | અત્યારે ક્યાં છે? (`AVAILABLE`, `BOOKED`, `IN_WASHING`, `DAMAGED`) |
| `condition_notes`| Text | જો કોઈ ડાઘ કે નુકસાન હોય તો તેની નોંધ |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 7. Customers (ગ્રાહક માસ્ટર)
કોઈપણ ગ્રાહક પહેલીવાર દુકાને આવે ત્યારે તેની પ્રોફાઇલ અહીં બનશે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index) | કઈ દુકાનનો ગ્રાહક છે |
| `full_name` | String | ગ્રાહકનું આખું નામ |
| `mobile` | String | WhatsApp મેસેજ અને બિલ મોકલવા માટે |
| `alternate_mobile`| String | બીજો નંબર |
| `address` | Text | પૂરું સરનામું (સિક્યુરિટી અને વેરિફિકેશન માટે) |
| `city` | String | શહેર |
| `pincode` | String | પીનકોડ |
| `reference_by` | String | ગ્રાહક ક્યાંથી આવ્યો? (દા.ત. Instagram, જૂનો ગ્રાહક) |
| `created_at` | DateTime | રેકોર્ડ ક્યારે બન્યો |

---

## 8. Bookings (મુખ્ય બિલ / ભાડા કરાર)
આ ટેબલ ગ્રાહકના બિલિંગ (Header) માટે છે. (પ્રસંગની તારીખો અને કુલ રકમ).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index) | કઈ દુકાનનું બુકિંગ છે |
| `customer_id` | UUID (FK) | ગ્રાહક કોણ છે |
| `booking_no` | String | બિલ નંબર (દા.ત. RE-2026-001) |
| `event_type` | String | પ્રસંગ (દા.ત. Wedding, Reception) |
| `event_date` | Date | પ્રસંગની તારીખ |
| `time_slot_id` | UUID (FK) | પ્રસંગ કયા સ્લોટમાં છે (સવાર/સાંજ)? |
| `pickup_date` | DateTime | કપડાં લઈ જવાનો સમય |
| `return_date` | DateTime | કપડાં પાછા લાવવાનો સમય |
| `total_rent` | Decimal | કુલ ભાડું |
| `total_security` | Decimal | કુલ સિક્યુરિટી ડિપોઝિટ |
| `offer_id` | UUID (FK) | જો કોઈ ઓફર સિલેક્ટ કરી હોય (Offers ટેબલ સાથે કનેક્ટેડ) |
| `discount` | Decimal | આપેલું ડિસ્કાઉન્ટ |
| `tax_amount` | Decimal | GST કે અન્ય ટેક્સ (જો પાકું બિલ હોય તો) |
| `internal_notes` | Text | દુકાનના સ્ટાફ માટેની નોંધ (દા.ત. માલિકના સગા છે એટલે ડિસ્કાઉન્ટ આપ્યું છે) |
| `status` | Enum | સ્ટેટસ (`UPCOMING`, `PICKED_UP`, `RETURNED`, `CANCELLED`) |
| `salesman_id` | UUID (FK) | કયા સેલ્સમેને આ ડીલ ફાઇનલ કરી? (કમિશન ગણવા માટે) |
| `created_at` | DateTime | બિલ ક્યારે બન્યું |

---

## 9. Offers & Discounts (ઓફર અને કૂપન)
માલિકે પહેલેથી બનાવેલા ડિસ્કાઉન્ટ કોડ્સ (જેમ કે દિવાળી ઓફર, સગા-સંબંધી ડિસ્કાઉન્ટ). આનાથી સેલ્સમેન પોતાની મરજીથી આડેધડ ડિસ્કાઉન્ટ નહિ આપી શકે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index) | કઈ દુકાનની ઓફર છે |
| `offer_code` | String | ઓફરનો કોડ (દા.ત. DIWALI20, RELATIVE50) |
| `offer_name` | String | ઓફરનું નામ (દા.ત. Festival Special) |
| `discount_type` | Enum | `% PERCENTAGE` અથવા `₹ FLAT_AMOUNT` |
| `discount_value` | Decimal | ડિસ્કાઉન્ટની વેલ્યૂ (દા.ત. 20% અથવા ₹500) |
| `valid_until` | Date | આ ઓફર કઈ તારીખ સુધી માન્ય છે? |
| `is_active` | Boolean | અત્યારે ઓફર ચાલુ છે કે બંધ? |

---

## 10. Booking_Items (બિલની અંદર રહેલા કપડાં)
એક બિલમાં બુક થયેલા અલગ-અલગ કપડાં, દરજીના માપ અને ફ્રી એક્સેસરીઝનું લિસ્ટ.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `booking_id` | UUID (FK) | કયા બિલમાં છે |
| `product_item_id` | UUID (FK) | કયો ફિઝિકલ પીસ (SKU / QR કોડ) |
| `rent_price` | Decimal | આ પીસનું ફાઈનલ ભાડું |
| `security_deposit`| Decimal | આ પીસની ડિપોઝિટ |
| `tailor_measurements`| JSONB | દરજી માટેના માપ (છાતી, કમર, લંબાઈ) |
| `tailor_status` | Enum | દરજીનું કામ (`PENDING`, `READY`) |
| `bundled_accessories`| JSONB | ફ્રી માં આપેલી વસ્તુઓ (સાફો, મોજડી વગેરે) |
| `item_status` | Enum | (`PICKED_UP`, `RETURNED`, `DAMAGED`) |

---

## 11. Payment_Modes (પેમેન્ટની રીત)
દુકાનદાર કઈ કઈ રીતે પૈસા સ્વીકારે છે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK) | કઈ દુકાન |
| `name` | String | પેમેન્ટ મોડ (દા.ત. Cash, PhonePe, Card) |
| `is_active` | Boolean | ચાલુ છે કે નહિ |

---

## 12. Store_Bank_Accounts (દુકાનના ખાતા)
દુકાનના ગલ્લા અને બેંક એકાઉન્ટનું લિસ્ટ.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK) | કઈ દુકાન |
| `account_name` | String | ખાતાનું નામ (દા.ત. Cash Drawer, HDFC Current) |
| `account_number` | String | એકાઉન્ટ નંબર |
| `ifsc_code` | String | બેંકનો કોડ |

---

## 13. Transaction_Categories (આવક/જાવકના પ્રકાર)
દુકાનનો રોજિંદો ખર્ચ અને આવક મેનેજ કરવા.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK) | કઈ દુકાન |
| `category_type`| Enum | `INCOME` (આવક) અથવા `EXPENSE` (જાવક) |
| `name` | String | નામ (દા.ત. ચા-પાણી, લાઈટ બિલ, ભાડું) |

---

## 14. Transactions (રોજમેળ / Cashbook)
દુકાનની તમામ આવક અને જાવકની ડાયરી (ભાડું, ડિપોઝિટ અને અન્ય ખર્ચા).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનનો વ્યવહાર છે |
| `booking_id` | UUID (FK) | (જો ભાડાના બુકિંગ નું પેમેન્ટ હોય તો) |
| `retail_sale_id`| UUID (FK) | (જો કાયમી વેચાણનું પેમેન્ટ હોય તો) |
| `purchase_id` | UUID (FK) | (જો હોલસેલર/વેન્ડરને પેમેન્ટ આપ્યું હોય તો) |
| `category_id` | UUID (FK) | કઈ કેટેગરીમાં પૈસા આવ્યા/ગયા? |
| `bank_account_id`| UUID (FK) | કયા બેંક ખાતામાં/ગલ્લામાં અસર થઈ? |
| `payment_mode_id`| UUID (FK) | કઈ રીતે પૈસા આવ્યા? |
| `transaction_type`| Enum | `CREDIT` (જમા) અથવા `DEBIT` (ઉધાર) |
| `amount` | Decimal | રકમ |
| `reference_no` | String | UPI રેફરન્સ નંબર અથવા બિલ નંબર |
| `remarks` | Text | નોંધ |
| `performed_by` | UUID (FK) | કયા સ્ટાફે એન્ટ્રી કરી |
| `created_at` | DateTime | સમય |

---

## 15. Vendor_Types (વેન્ડરના પ્રકાર)
દુકાનદાર પોતાની મરજી મુજબ અલગ-અલગ વેન્ડર કેટેગરી બનાવી શકે (દા.ત. ધોબી, દરજી, ભરતકામ વાળા, કાપડના સપ્લાયર).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK) | કઈ દુકાનના પ્રકાર છે |
| `name` | String | પ્રકારનું નામ (દા.ત. Laundry, Tailor, Dyer) |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 16. Vendors (વેન્ડર / સપ્લાયર માસ્ટર)
દુકાન સાથે જોડાયેલા ધોબી, દરજી કે અન્ય વેપારીઓનું લિસ્ટ.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK) | કઈ દુકાનનો વેન્ડર છે |
| `vendor_type_id` | UUID (FK) | વેન્ડરનો પ્રકાર (Vendor_Types ટેબલ સાથે કનેક્ટેડ) |
| `name` | String | વેન્ડરનું નામ (દા.ત. શિવમ ડ્રાયક્લીનર્સ) |
| `mobile` | String | મોબાઈલ નંબર |
| `address` | Text | સરનામું |
| `created_at` | DateTime | ક્યારે નોંધાયા |

---

## 17. Service_Types (સર્વિસના પ્રકાર)
દુકાનદાર પોતે નક્કી કરી શકે કે કપડાં કયા કામ માટે બહાર જાય છે (દા.ત. Dry Cleaning, Steam Ironing, Rafu/Repair, Fitting).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનની સર્વિસ છે |
| `name` | String | સર્વિસનું નામ (દા.ત. Dry Cleaning) |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 18. Item_Service_Logs (વેન્ડર સર્વિસ રજિસ્ટર)
કયો ડ્રેસ ક્યારે ધોવા, ફિટિંગ કે રિપેરિંગ માટે ગયો અને ક્યારે પાછો આવ્યો તેનું ટ્રેકિંગ.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાન |
| `vendor_id` | UUID (FK) | કયા વેન્ડર (ધોબી/દરજી) ને આપ્યો છે |
| `product_item_id`| UUID (FK) | કયો ફિઝિકલ પીસ (QR કોડ) બહાર ગયો છે |
| `service_type_id`| UUID (FK) | શેના માટે ગયો? (Service_Types ટેબલ સાથે કનેક્ટેડ) |
| `sent_date` | DateTime | ક્યારે મોકલ્યો |
| `expected_return`| DateTime | ક્યારે પાછો આવવાની શક્યતા છે |
| `actual_return` | DateTime | ખરેખર ક્યારે પાછો આવ્યો |
| `service_cost` | Decimal | કામનો ખર્ચ (જો વેન્ડરનું બિલ ટ્રેક કરવું હોય તો) |
| `status` | Enum | અત્યારે સ્ટેટસ શું છે? (`IN_SERVICE`, `RETURNED`, `LOST_BY_VENDOR`, `DAMAGED_BY_VENDOR`) |
| `created_at` | DateTime | એન્ટ્રી ક્યારે થઈ |

---

## 19. Time_Slots (સમયના મુહૂર્ત / સ્લોટ માસ્ટર)
એક જ તારીખે ડબલ બુકિંગ લઈ શકાય તે માટે દુકાનદાર સમયના સ્લોટ બનાવી શકે છે (દા.ત. Morning, Evening, Full Day).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનના સ્લોટ છે |
| `name` | String | સ્લોટનું નામ (દા.ત. સવારનું મુહૂર્ત, સાંજ) |
| `start_time` | Time | સ્લોટ શરુ થવાનો સમય (દા.ત. 08:00 AM) |
| `end_time` | Time | સ્લોટ પૂરો થવાનો સમય (દા.ત. 02:00 PM) |
| `created_at` | DateTime | ક્યારે બન્યો |

---

## 20. Accessories & Supplies (છૂટક વસ્તુઓ અને એક્સેસરીઝ)
દુકાનમાં વપરાતી નાની-નાની વસ્તુઓ (કવર, હેંગર, સેફ્ટી પીન, ફ્રી આપવાના બ્રોચ/માળા) નો સ્ટોક ટ્રેક કરવા માટે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનની વસ્તુ છે |
| `item_name` | String | વસ્તુનું નામ (દા.ત. Suit Cover, Hangers, Safety Pins) |
| `item_type` | Enum | `FREE_ACCESSORY`, `PACKAGING`, `SHOP_SUPPLY` |
| `total_stock` | Integer | અત્યારે દુકાનમાં કેટલો સ્ટોક (પીસ) પડ્યો છે |
| `alert_limit` | Integer | સ્ટોક આનાથી ઓછો થાય એટલે સિસ્ટમ એલર્ટ આપે |
| `created_at` | DateTime | ક્યારે નોંધાયું |

---

## 21. Attendance (સ્ટાફની હાજરી)
દુકાનના સ્ટાફ (સેલ્સમેન, મેનેજર) ની રોજની હાજરી, આવવા-જવાનો સમય અને રજાઓનો હિસાબ રાખવા.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનની એન્ટ્રી છે |
| `user_id` | UUID (FK) | કયા સ્ટાફની હાજરી છે (Users ટેબલ સાથે) |
| `date` | Date | કઈ તારીખની હાજરી |
| `status` | Enum | `PRESENT`, `ABSENT`, `HALF_DAY`, `ON_LEAVE` |
| `clock_in` | Time | કેટલા વાગ્યે દુકાને આવ્યો |
| `clock_out` | Time | કેટલા વાગ્યે ઘરે ગયો |
| `remarks` | Text | કોઈ નોંધ (દા.ત. મોડા આવ્યા હતા) |
| `created_at` | DateTime | એન્ટ્રી ક્યારે થઈ |

---

## 22. Holidays (રજાઓનું લિસ્ટ)
દુકાનમાં કયા તહેવાર પર રજા રહેશે તેનું સેટિંગ. (આનાથી ફાયદો એ થશે કે સિસ્ટમ એ તારીખે ગ્રાહકને ડિલિવરી કે રિટર્નની તારીખ નહિ આપવા દે).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનની રજાઓ છે |
| `date` | Date | રજાની તારીખ |
| `name` | String | તહેવારનું નામ (દા.ત. દિવાળી, ધુળેટી) |
| `holiday_type` | Enum | `FULL_DAY`, `HALF_DAY_MORNING`, `HALF_DAY_EVENING` |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 23. Staff_Leaves (સ્ટાફની રજાઓ / એપ્લિકેશન)
કોઈ સ્ટાફ મેમ્બર એડવાન્સમાં રજા માંગે, કે માંદગીની રજા લે, તો એની મંજૂરી અને હિસાબ માટે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાન |
| `user_id` | UUID (FK) | કયા સ્ટાફની રજા છે |
| `start_date` | Date | રજા ક્યારથી શરુ થાય છે |
| `end_date` | Date | ક્યાં સુધી રજા છે |
| `leave_type` | Enum | `SICK` (માંદગી), `CASUAL` (અંગત કામ), `PAID`, `UNPAID` |
| `reason` | Text | રજા લેવાનું કારણ |
| `status` | Enum | `PENDING`, `APPROVED`, `REJECTED` |
| `created_at` | DateTime | ક્યારે એપ્લાય કર્યું |

---

## 24. Staff_Salaries (સ્ટાફનો પગાર / Payroll)
દર મહિને સ્ટાફનો ફિક્સ પગાર, બિલિંગ પર કમિશન અને રજાઓના કાપ્યા પછીનો ફાઇનલ હિસાબ.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાન |
| `user_id` | UUID (FK) | કયા સ્ટાફનો પગાર |
| `month_year` | String | કયા મહિનાનો પગાર છે (દા.ત. OCT-2026) |
| `base_salary` | Decimal | મૂળ પગાર (દા.ત. 15000) |
| `commission` | Decimal | બુકિંગ પર કમાયેલું કમિશન |
| `bonus_amount` | Decimal | બોનસ કે ઇનામ |
| `leave_deductions`| Decimal | રજાઓના કપાત થયેલા પૈસા |
| `advance_deduction`| Decimal | ઉપાડ (Advance) લીધો હોય તો એ કપાત |
| `net_payable` | Decimal | હાથમાં આપવાની ફાઇનલ રકમ |
| `status` | Enum | `PENDING`, `PAID` |
| `paid_on` | DateTime | કઈ તારીખે પગાર ચૂકવ્યો |
| `payment_mode_id`| UUID (FK) | કેવી રીતે ચૂકવ્યો (રોકડા/બેંક ટ્રાન્સફર) |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 25. Staff_Advances (સ્ટાફ ઉપાડ રજિસ્ટર)
સ્ટાફ મહિનાની વચ્ચે ગમે ત્યારે ઉપાડ (Advance) લે, તો એની તારીખ અને કારણ સાથે નોંધ રાખવા માટે. મહિનાના અંતે આ બધો ઉપાડ ભેગો થઈને પગારમાંથી માઇનસ થશે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાન |
| `user_id` | UUID (FK) | કયા સ્ટાફે ઉપાડ લીધો |
| `amount` | Decimal | કેટલો ઉપાડ લીધો (દા.ત. 500, 2000) |
| `date_taken` | Date | કઈ તારીખે લીધો |
| `reason` | Text | શેના માટે લીધો? (દા.ત. છોકરાની ફી ભરવા) |
| `is_settled` | Boolean | શું આ ઉપાડ પગારમાંથી કપાઈ ગયો છે? (`TRUE` / `FALSE`) |
| `salary_id` | UUID (FK) | કયા મહિનાના પગારમાં આ કપાત થઈ? (જો સેટલ થઈ ગયું હોય તો) |
| `created_at` | DateTime | એન્ટ્રી ક્યારે થઈ |

---

## 26. Reminders (ડેઇલી ફોન-કૉલ અને ટ્રેકિંગ)
ગ્રાહકને ક્યારે ટ્રાયલ/ફિટિંગ માટે બોલાવવાનો છે, અથવા કોના પૈસા બાકી છે એનું ટ્રેકિંગ. રોજ સવારે ડેશબોર્ડ પર આજના રિમાઇન્ડરનું લિસ્ટ દેખાશે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનના રિમાઇન્ડર છે |
| `customer_id` | UUID (FK) | કયા ગ્રાહકને ફોન કરવાનો છે |
| `booking_id` | UUID (FK) | (વૈકલ્પિક) કયા બિલ માટે ફોન કરવાનો છે |
| `reminder_date` | Date | કઈ તારીખે આ રિમાઇન્ડર ડેશબોર્ડ પર દેખાવું જોઈએ? |
| `title` | String | શોર્ટ ટાઇટલ (દા.ત. "ટ્રાયલ માટે કૉલ કરો", "બાકી પેમેન્ટ લેવાનું છે") |
| `description` | Text | વધારાની નોંધ |
| `assigned_to` | UUID (FK) | કયા સ્ટાફે (સેલ્સમેને) ફોન કરવાનો છે? |
| `status` | Enum | `PENDING` (બાકી છે), `COMPLETED` (વાત થઈ ગઈ), `SNOOZED` (કાલે ફોન કરશું) |
| `created_at` | DateTime | ક્યારે નોંધાયું |

---

## 27. Credit_Vouchers (જમા ચિઠ્ઠી / ક્રેડિટ વોલેટ)
જ્યારે ગ્રાહક બુકિંગ કેન્સલ કરાવે, ત્યારે રોકડા પાછા આપવાને બદલે તેને આ વાઉચર આપી શકાય, જે તે ભવિષ્યમાં વાપરી શકે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાન |
| `customer_id` | UUID (FK) | કયા ગ્રાહકનું વાઉચર છે |
| `original_booking_id`| UUID (FK)| કયું બુકિંગ કેન્સલ થવાથી આ વાઉચર બન્યું? |
| `voucher_code` | String | યુનિક કોડ (દા.ત. CR-9021) |
| `total_amount` | Decimal | વાઉચરની કુલ રકમ (દા.ત. ₹5000) |
| `balance_amount` | Decimal | વાપર્યા પછી વધેલી રકમ |
| `expiry_date` | Date | આ વાઉચર કઈ તારીખ સુધી માન્ય રહેશે |
| `is_active` | Boolean | ચાલુ છે કે નહિ |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 28. Audit_Logs (સિક્યુરિટી અને એક્ટિવિટી ટ્રેકિંગ)
કયા સ્ટાફે સિસ્ટમમાં ક્યારે શું ફેરફાર કર્યો એનો સેકન્ડ-બાય-સેકન્ડ રેકોર્ડ (કોઈ છેતરપિંડી ન કરી શકે એના માટે).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાન |
| `user_id` | UUID (FK) | કયા સ્ટાફે ચેન્જીસ કર્યા? |
| `action_type` | String | શું કર્યું? (દા.ત. `DELETE_BOOKING`, `EDIT_DISCOUNT`, `LOGIN`) |
| `table_name` | String | કયા ટેબલમાં ફેરફાર કર્યો? (દા.ત. Bookings) |
| `record_id` | UUID | કયા રેકોર્ડમાં? |
| `old_data` | JSONB | જૂનો ડેટા શું હતો (ચેન્જ કરતા પહેલા) |
| `new_data` | JSONB | નવો ડેટા શું નાખ્યો |
| `ip_address` | String | કયા ઇન્ટરનેટ/WiFi પરથી કર્યું |
| `device_info` | String | કયા મોબાઈલ/કોમ્પ્યુટર પરથી કર્યું (દા.ત. iPhone 15) |
| `created_at` | DateTime | ક્યારે કર્યું |

---

## 29. Purchase_Invoices (માલની ખરીદીના બિલો)
જ્યારે દુકાનદાર હોલસેલર/મેન્યુફેક્ચરર પાસેથી નવો માલ લાવે, અને તેનું પેમેન્ટ ૧-૨ મહિના પછી કરવાનું હોય (ઉધાર માલ) ત્યારે તેનું ટ્રેકિંગ કરવા માટે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનની ખરીદી છે |
| `vendor_id` | UUID (FK) | કયા હોલસેલર/વેપારી પાસેથી લીધો |
| `invoice_no` | String | બિલ નંબર |
| `invoice_date` | Date | ખરીદીની તારીખ |
| `total_amount` | Decimal | બિલની કુલ રકમ |
| `paid_amount` | Decimal | અત્યાર સુધી કેટલા ચૂકવ્યા |
| `due_date` | Date | બાકી પેમેન્ટ ક્યારે કરવાનું છે? (દા.ત. ૨ મહિના પછીની તારીખ) |
| `status` | Enum | `UNPAID`, `PARTIAL`, `PAID` |
| `created_at` | DateTime | એન્ટ્રી ક્યારે થઈ |

---

## 30. Purchase_Items (ખરીદીના બિલની અંદરની વસ્તુઓ)

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `purchase_id` | UUID (FK) | કયા બિલમાં |
| `product_id` | UUID (FK) | (વૈકલ્પિક) કયા પ્રકારનો માલ ખરીદ્યો |
| `item_name` | String | વસ્તુનું નામ (જો નવી હોય તો) |
| `quantity` | Integer | કેટલી સંખ્યામાં પીસ લીધા |
| `unit_price` | Decimal | એક પીસનો ભાવ |
| `total_price` | Decimal | કુલ ભાવ |

---

## 31. Retail_Sales (કાયમી વેચાણ / ડાયરેક્ટ સેલિંગ)
જ્યારે ગ્રાહક કપડાં કે એક્સેસરીઝ ભાડે લેવાના બદલે કાયમ માટે વેચાતા (ખરીદી) લે છે. (આમાં ડિપોઝિટ કે રિટર્ન તારીખ નહિ હોય).

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાન |
| `customer_id` | UUID (FK) | કોણે ખરીદ્યું |
| `bill_no` | String | વેચાણનું બિલ નંબર (દા.ત. SA-001) |
| `sale_date` | Date | વેચાણની તારીખ |
| `total_amount` | Decimal | કુલ રકમ |
| `discount` | Decimal | ડિસ્કાઉન્ટ |
| `tax_amount` | Decimal | GST કે અન્ય ટેક્સ |
| `final_amount` | Decimal | ફાઇનલ લેવાના પૈસા |
| `salesman_id` | UUID (FK) | કયા સેલ્સમેને વેચ્યું (કમિશન માટે) |
| `created_at` | DateTime | ક્યારે બન્યું |

---

## 32. Retail_Sale_Items (વેચાણ બિલની અંદરની વસ્તુઓ)

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `retail_sale_id`| UUID (FK) | કયા બિલમાં |
| `product_item_id`| UUID (FK) | (જો કોઈ સ્પેસિફિક QR કોડ વાળો પીસ વેચ્યો હોય) |
| `accessory_id` | UUID (FK) | (જો સાફો કે મોજડી જેવી એક્સેસરી વેચી હોય) |
| `quantity` | Integer | કેટલા પીસ વેચ્યા |
| `price` | Decimal | વેચાણ કિંમત |

---

## 33. Subscription_Plans (SaaS ના પ્લાન માસ્ટર)
આપણા સોફ્ટવેર (Rent360) ને વાપરવા માટે દુકાનદારોએ કયું પેકેજ લીધું છે (જેમ કે Basic, Premium). સુપર-એડમિન આ પ્લાન બનાવશે.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `name` | String | પ્લાનનું નામ (દા.ત. Free, Basic, Pro) |
| `price_per_month`| Decimal | મહિનાનો ચાર્જ |
| `price_per_year` | Decimal | વર્ષનો ચાર્જ |
| `max_bookings` | Integer | મહિનામાં વધુમાં વધુ કેટલા બિલ બનાવી શકશે |
| `max_staff` | Integer | કેટલા સ્ટાફના લોગિન બનાવી શકશે |
| `features` | JSONB | પ્લાનમાં કયા-કયા ફીચર્સ મળશે એનું લિસ્ટ |
| `is_active` | Boolean | આ પ્લાન અત્યારે વેચાણ માટે ચાલુ છે? |

---

## 34. Store_Subscriptions (દુકાનનું સબ્સ્ક્રિપ્શન)
કઈ દુકાન કયો પ્લાન વાપરે છે અને એનું રિન્યુઅલ ક્યારે આવવાનું છે એનું ટ્રેકિંગ.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | યુનિક આઈડી |
| `store_id` | UUID (FK, Index)| કઈ દુકાનનું સબ્સ્ક્રિપ્શન છે |
| `plan_id` | UUID (FK) | કયો પ્લાન ચાલુ છે |
| `start_date` | Date | પ્લાન ક્યારથી શરુ થયો |
| `end_date` | Date | પ્લાન ક્યારે પૂરો થશે (Expiry Date) |
| `status` | Enum | `ACTIVE`, `TRIAL`, `EXPIRED`, `CANCELLED` |
| `last_paid_amount`| Decimal | છેલ્લે કેટલા રૂપિયા સુપર-એડમિનને આપ્યા હતા |
| `created_at` | DateTime | ક્યારે નોંધાયું |

---
