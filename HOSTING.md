# Hostingga joylash: qadamlar va tekshiruv ro'yxati

## 1. Joylash (Netlify, bepul, 2 daqiqa)
1. Kompyuterda yangi papka oching va ichiga shu papkadagi **uchta faylni** soling: `index.html`, `_headers`, `robots.txt`.
2. https://app.netlify.com/drop ga kiring va papkani sichqoncha bilan sahifaga tashlang.
3. Netlify manzil beradi (`nimadir.netlify.app`). HTTPS o'zi yoqiladi. O'z domeningiz bo'lsa: Site settings → Domain management.

Boshqa hostingda (GitHub Pages, Cloudflare Pages, oddiy hosting) ham xuddi shunday: `index.html` ni saytning ildiziga qo'ying. `_headers` faqat Netlify va Cloudflare Pages uchun, boshqasida shart emas.

## 2. Joylashgandan keyin ishlaydigan narsalar
- Hamma bo'limlar, 3 til, qorong'u/yorug' mavzu, qidiruv (Ctrl+K), galereya, yuklab olish va ulashish.
- **Ulashish havolasi o'z domeningizga olib boradi** (`https://sizning-sayt/#g-rasm`), claude.ai manziliga emas. Havola ochilganda o'sha rasm katta ochiladi.
- Sahifa tashqaridan faqat Google Fonts'ni yuklaydi (shrift). Boshqa hech qanday tashqi kutubxona yoki kuzatuvchi yo'q.

## 3. Joylashgandan keyin ishlamaydigan narsalar (sozlash kerak)
| Narsa | Holati | Nima kerak |
|---|---|---|
| Aloqa formasi | Hozir «server ulanmagan» deydi (yolg'on «yuborildi» demaydi) | Cloudflare Worker (`contact-form/SOZLASH.md`) va Worker manzilini `"endpoint"` ga yozish |
| Tashrif statistikasi va 👁 raqamlari | Yig'ilmaydi, raqamlar yashirin | Statistika serveri (`statistika/STATISTIKA-SOZLASH.md`) va manzilini `"statsEndpoint"` ga yozish |
| Admin panel | Hostingda ishlamaydi (u faqat claude.ai ichida ishlaydi) | Tarkibni o'zgartirish uchun menga yozing, men yangi `index.html` tayyorlab beraman |

`"endpoint"` va `"statsEndpoint"` ni qo'yish: `index.html` ni matn muharririda (Notepad++, VS Code) oching, `site-data` degan `<script>` ichida `"endpoint":""` va `"statsEndpoint":""` ni toping, qo'shtirnoq orasiga manzilni yozing. Fayl katta (rasmlar ichida), shuning uchun qidiruvdan (Ctrl+F) foydalaning. Serverdagi `ALLOWED_ORIGINS` ga saytingizning aniq manzilini yozishni unutmang.

## 3.1. Yangilash tartibi
Hostingdagi sayt oddiy fayl. Matn, rasm yoki loyiha o'zgarsa: menga ayting, men yangi `index.html` beraman va siz Netlify'ga qayta tashlaysiz. Yoki claude.ai dagi sahifada admin orqali o'zgartirib, menga «hostingga yangi fayl ber» deng.

## 4. Joylashdan oldin tarkibni o'zingiz tekshiring
Men bularni bilmayman, siz ko'rib chiqing:
- Kasbingiz: sayt «**Backend dasturchi**» deydi. To'g'rimi (Frontend emasmi)?
- Raqamlar: «5+ yillik tajriba», «100+ qilingan loyiha», «88 xursand mijoz», «10 mukofot». Hammasi haqiqatmi?
- Loyihalar: hozir 4 ta loyihada rasm yo'q (harf chiqib turadi). Hostingdan oldin admin → Ishlar bo'limida skrinshot yuklang.
- Aloqa: email, telefon, Telegram, Instagram to'g'rimi.
- Tug'ilgan kun: 18-mart (yosh va hisoblagich shundan hisoblanadi).

## 5. Joylashgandan keyin tekshiring (5 daqiqa)
1. Saytni telefonda ham, kompyuterda ham oching, hamma bo'limni aylanib chiqing.
2. Til va mavzu tugmalarini bosing.
3. Galereyada rasmni oching, «Yuklab olish» va «Ulashish» ni sinang.
4. Aloqa formasini yuboring (Worker ulangan bo'lsa, Telegram'ga xabar tushishi kerak).
5. https://pagespeed.web.dev da tezlikni, https://search.google.com/test/mobile-friendly da mobil mosligini tekshiring.

## 6. Qo'llab-quvvatlanadigan brauzerlar
Yangi Chrome, Edge, Safari 15.4+, Firefox 110+. Eskilarida sayt o'qiladi va ishlaydi, lekin ba'zi yumshoq effektlar (rang almashuvi, shisha xiralik) soddalashadi.

## 7. Qo'shimcha (ixtiyoriy)
- **Ijtimoiy tarmoqda ko'rinish (rasm):** hozir sarlavha va tavsif bor, rasm yo'q. Domen aniq bo'lgach `og:image` qo'shish mumkin.
- **Xavfsizlik sarlavhalari** `_headers` faylida. Qattiqroq himoya (CSP) uchun Worker manzillaringiz aniq bo'lgach qo'shamiz, ular bo'lmasa forma yoki statistika to'sib qo'yilishi mumkin.
- Auditoriya Yevropada bo'lsa, statistika yoqilganda saytda qisqa maxfiylik izohi qo'shish ma'qul.
