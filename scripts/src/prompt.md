Ornek topluluk iceriklerini hazirlayip veritabanina ekledim. Su an canli seedlenen 3 ders var:

Kafede Siparis Verme
Havaalani Check-in
Uzaktan Toplanti Dili
Hepsi DuoTR Topluluk yazariyla yayinda ve her birinde 4 kelime bankasi + 5 egzersiz var. Egzersiz tipleri karisik: coktan secmeli, eslestirme, bosluk doldurma, sesten yaziya, yazili ceviri.

Bunun icin tekrar calistirilabilir bir seed script de ekledim:

seed-community-lessons.ts
scripts/package.json
package.json
Tekrar seedlemek istersen:

npx pnpm run seed:community
Dogruladim:

GET /api/community-lessons seeded dersleri donuyor
GET /api/community-lessons/community-seed-cafe-ordering detay ve 5 egzersizle geliyor
Uygulamada gormek icin dev server’i ac: npx pnpm run dev, sonra /community sayfasina git. Istersen bir sonraki adimda ben buna B1 is gorusmesi, otel check-in, doktor randevusu gibi 5-10 yeni paket daha ekleyeyim.