import { Router, type IRouter } from "express";

const router: IRouter = Router();

const lessonsData = [
  {
    id: 1,
    title: "Selamlaşmalar",
    description: "Temel İngilizce selamlaşma ifadelerini öğren",
    category: "Temel",
    difficulty: "beginner" as const,
    xpReward: 10,
    wordCount: 6,
    completed: false,
    locked: false,
    icon: "👋",
  },
  {
    id: 2,
    title: "Renkler",
    description: "İngilizce renkleri öğren",
    category: "Temel",
    difficulty: "beginner" as const,
    xpReward: 10,
    wordCount: 8,
    completed: false,
    locked: false,
    icon: "🎨",
  },
  {
    id: 3,
    title: "Sayılar",
    description: "1'den 20'ye kadar İngilizce sayıları öğren",
    category: "Temel",
    difficulty: "beginner" as const,
    xpReward: 10,
    wordCount: 10,
    completed: false,
    locked: false,
    icon: "🔢",
  },
  {
    id: 4,
    title: "Hayvanlar",
    description: "Yaygın hayvanların İngilizce adlarını öğren",
    category: "Doğa",
    difficulty: "beginner" as const,
    xpReward: 15,
    wordCount: 8,
    completed: false,
    locked: true,
    icon: "🦁",
  },
  {
    id: 5,
    title: "Yiyecekler",
    description: "Yaygın yiyeceklerin İngilizce adlarını öğren",
    category: "Günlük Hayat",
    difficulty: "beginner" as const,
    xpReward: 15,
    wordCount: 8,
    completed: false,
    locked: true,
    icon: "🍎",
  },
  {
    id: 6,
    title: "Aile",
    description: "Aile üyelerinin İngilizce adlarını öğren",
    category: "Günlük Hayat",
    difficulty: "beginner" as const,
    xpReward: 15,
    wordCount: 8,
    completed: false,
    locked: true,
    icon: "👨‍👩‍👧‍👦",
  },
  {
    id: 7,
    title: "Günler ve Aylar",
    description: "Günler ve ayların İngilizce adlarını öğren",
    category: "Zaman",
    difficulty: "intermediate" as const,
    xpReward: 20,
    wordCount: 10,
    completed: false,
    locked: true,
    icon: "📅",
  },
  {
    id: 8,
    title: "Meslekler",
    description: "Mesleklerin İngilizce adlarını öğren",
    category: "Günlük Hayat",
    difficulty: "intermediate" as const,
    xpReward: 20,
    wordCount: 8,
    completed: false,
    locked: true,
    icon: "👩‍💼",
  },
];

const lessonDetailsData: Record<number, { words: object[]; questions: object[] }> = {
  1: {
    words: [
      { id: 1, english: "Hello", turkish: "Merhaba", pronunciation: "he-LOH", example: "Hello, how are you?", exampleTurkish: "Merhaba, nasılsın?" },
      { id: 2, english: "Good morning", turkish: "Günaydın", pronunciation: "gud MOR-ning", example: "Good morning, everyone!", exampleTurkish: "Günaydın, herkes!" },
      { id: 3, english: "Good night", turkish: "İyi geceler", pronunciation: "gud NAYT", example: "Good night, sleep well.", exampleTurkish: "İyi geceler, iyi uyu." },
      { id: 4, english: "Thank you", turkish: "Teşekkür ederim", pronunciation: "THANGK yoo", example: "Thank you very much!", exampleTurkish: "Çok teşekkür ederim!" },
      { id: 5, english: "Please", turkish: "Lütfen", pronunciation: "PLEEZ", example: "Can you help me, please?", exampleTurkish: "Bana yardım eder misin, lütfen?" },
      { id: 6, english: "Sorry", turkish: "Özür dilerim", pronunciation: "SOR-ee", example: "Sorry, I am late.", exampleTurkish: "Özür dilerim, geç kaldım." },
    ],
    questions: [
      { id: 1, type: "translate-to-english", question: "\"Merhaba\" kelimesinin İngilizcesi nedir?", options: ["Hello", "Goodbye", "Thank you", "Please"], correctAnswer: "Hello", hint: "Günün her saatinde kullanılabilir" },
      { id: 2, type: "translate-to-turkish", question: "\"Good morning\" ne anlama gelir?", options: ["İyi geceler", "İyi akşamlar", "Günaydın", "Hoşça kal"], correctAnswer: "Günaydın", hint: "Sabahları kullanılır" },
      { id: 3, type: "multiple-choice", question: "\"Teşekkür ederim\" hangi İngilizce ifadeye karşılık gelir?", options: ["Sorry", "Please", "Thank you", "Hello"], correctAnswer: "Thank you", hint: "Minnetliliği ifade eden sözcük" },
      { id: 4, type: "translate-to-english", question: "\"Lütfen\" kelimesinin İngilizcesi nedir?", options: ["Sorry", "Please", "Thank you", "Goodbye"], correctAnswer: "Please", hint: "Kibarca istekte bulunmak için kullanılır" },
      { id: 5, type: "fill-blank", question: "\"___, I am late.\" (Özür dilerim, geç kaldım.)", options: ["Hello", "Please", "Sorry", "Thank you"], correctAnswer: "Sorry", hint: "Özür belirten kelime" },
      { id: 6, type: "translate-to-turkish", question: "\"Good night\" ne anlama gelir?", options: ["Günaydın", "İyi günler", "İyi geceler", "Hoşça kal"], correctAnswer: "İyi geceler", hint: "Geceleri kullanılır" },
    ],
  },
  2: {
    words: [
      { id: 1, english: "Red", turkish: "Kırmızı", pronunciation: "RED", example: "The apple is red.", exampleTurkish: "Elma kırmızıdır." },
      { id: 2, english: "Blue", turkish: "Mavi", pronunciation: "BLOO", example: "The sky is blue.", exampleTurkish: "Gökyüzü mavidir." },
      { id: 3, english: "Green", turkish: "Yeşil", pronunciation: "GREEN", example: "The grass is green.", exampleTurkish: "Çimen yeşildir." },
      { id: 4, english: "Yellow", turkish: "Sarı", pronunciation: "YEL-oh", example: "The sun is yellow.", exampleTurkish: "Güneş sarıdır." },
      { id: 5, english: "White", turkish: "Beyaz", pronunciation: "WAYT", example: "The snow is white.", exampleTurkish: "Kar beyazdır." },
      { id: 6, english: "Black", turkish: "Siyah", pronunciation: "BLAK", example: "The night is black.", exampleTurkish: "Gece siyahtır." },
      { id: 7, english: "Orange", turkish: "Turuncu", pronunciation: "OR-enj", example: "The orange is orange.", exampleTurkish: "Portakal turuncudur." },
      { id: 8, english: "Purple", turkish: "Mor", pronunciation: "PUR-pul", example: "The grapes are purple.", exampleTurkish: "Üzümler mordur." },
    ],
    questions: [
      { id: 1, type: "translate-to-english", question: "\"Kırmızı\" kelimesinin İngilizcesi nedir?", options: ["Blue", "Red", "Green", "Yellow"], correctAnswer: "Red", hint: "Elmanın rengi" },
      { id: 2, type: "translate-to-turkish", question: "\"Blue\" ne anlama gelir?", options: ["Kırmızı", "Sarı", "Yeşil", "Mavi"], correctAnswer: "Mavi", hint: "Gökyüzünün rengi" },
      { id: 3, type: "multiple-choice", question: "Çimenin rengi İngilizce nasıl söylenir?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Green", hint: "Doğanın ana rengi" },
      { id: 4, type: "translate-to-english", question: "\"Sarı\" kelimesinin İngilizcesi nedir?", options: ["White", "Black", "Yellow", "Orange"], correctAnswer: "Yellow", hint: "Güneşin rengi" },
      { id: 5, type: "fill-blank", question: "\"The snow is ___.\" (Kar beyazdır.)", options: ["Black", "White", "Red", "Blue"], correctAnswer: "White", hint: "Karın rengi" },
      { id: 6, type: "translate-to-turkish", question: "\"Purple\" ne anlama gelir?", options: ["Turuncu", "Pembe", "Mor", "Gri"], correctAnswer: "Mor", hint: "Üzümün rengi" },
    ],
  },
  3: {
    words: [
      { id: 1, english: "One", turkish: "Bir", pronunciation: "WUN", example: "I have one cat.", exampleTurkish: "Bir kedim var." },
      { id: 2, english: "Two", turkish: "İki", pronunciation: "TOO", example: "I have two dogs.", exampleTurkish: "İki köpeğim var." },
      { id: 3, english: "Three", turkish: "Üç", pronunciation: "THREE", example: "There are three birds.", exampleTurkish: "Üç kuş var." },
      { id: 4, english: "Four", turkish: "Dört", pronunciation: "FOR", example: "A cat has four legs.", exampleTurkish: "Bir kedinin dört ayağı var." },
      { id: 5, english: "Five", turkish: "Beş", pronunciation: "FAYV", example: "I have five fingers.", exampleTurkish: "Beş parmağım var." },
      { id: 6, english: "Ten", turkish: "On", pronunciation: "TEN", example: "There are ten students.", exampleTurkish: "On öğrenci var." },
      { id: 7, english: "Twenty", turkish: "Yirmi", pronunciation: "TWEN-tee", example: "She is twenty years old.", exampleTurkish: "O yirmi yaşında." },
      { id: 8, english: "Hundred", turkish: "Yüz", pronunciation: "HUN-dred", example: "There are a hundred pages.", exampleTurkish: "Yüz sayfa var." },
      { id: 9, english: "Zero", turkish: "Sıfır", pronunciation: "ZEE-roh", example: "Zero is nothing.", exampleTurkish: "Sıfır hiçtir." },
      { id: 10, english: "Thousand", turkish: "Bin", pronunciation: "THOW-zend", example: "A thousand stars shine.", exampleTurkish: "Bin yıldız parlıyor." },
    ],
    questions: [
      { id: 1, type: "translate-to-english", question: "\"Bir\" kelimesinin İngilizcesi nedir?", options: ["Two", "One", "Three", "Zero"], correctAnswer: "One", hint: "En küçük pozitif tam sayı" },
      { id: 2, type: "translate-to-turkish", question: "\"Five\" ne anlama gelir?", options: ["Dört", "Altı", "Beş", "Üç"], correctAnswer: "Beş", hint: "Bir elin parmak sayısı" },
      { id: 3, type: "multiple-choice", question: "İngilizce'de \"Yirmi\" nasıl söylenir?", options: ["Twelve", "Twenty", "Thirty", "Ten"], correctAnswer: "Twenty", hint: "2 x 10" },
      { id: 4, type: "fill-blank", question: "\"A cat has ___ legs.\" (Bir kedinin dört ayağı var.)", options: ["Two", "Three", "Four", "Five"], correctAnswer: "Four", hint: "Çoğu hayvanın bacak sayısı" },
      { id: 5, type: "translate-to-english", question: "\"Yüz\" kelimesinin İngilizcesi nedir?", options: ["Ten", "Thousand", "Hundred", "Zero"], correctAnswer: "Hundred", hint: "100" },
    ],
  },
  4: {
    words: [
      { id: 1, english: "Cat", turkish: "Kedi", pronunciation: "KAT", example: "The cat is sleeping.", exampleTurkish: "Kedi uyuyor." },
      { id: 2, english: "Dog", turkish: "Köpek", pronunciation: "DOG", example: "The dog is barking.", exampleTurkish: "Köpek havlıyor." },
      { id: 3, english: "Bird", turkish: "Kuş", pronunciation: "BURD", example: "The bird is flying.", exampleTurkish: "Kuş uçuyor." },
      { id: 4, english: "Fish", turkish: "Balık", pronunciation: "FISH", example: "The fish is swimming.", exampleTurkish: "Balık yüzüyor." },
      { id: 5, english: "Lion", turkish: "Aslan", pronunciation: "LY-en", example: "The lion is the king.", exampleTurkish: "Aslan kraldır." },
      { id: 6, english: "Elephant", turkish: "Fil", pronunciation: "EL-eh-fent", example: "The elephant is big.", exampleTurkish: "Fil büyüktür." },
      { id: 7, english: "Rabbit", turkish: "Tavşan", pronunciation: "RAB-it", example: "The rabbit is fast.", exampleTurkish: "Tavşan hızlıdır." },
      { id: 8, english: "Horse", turkish: "At", pronunciation: "HORS", example: "The horse is running.", exampleTurkish: "At koşuyor." },
    ],
    questions: [
      { id: 1, type: "translate-to-english", question: "\"Kedi\" kelimesinin İngilizcesi nedir?", options: ["Dog", "Cat", "Bird", "Fish"], correctAnswer: "Cat", hint: "Miyavlayan hayvan" },
      { id: 2, type: "translate-to-turkish", question: "\"Elephant\" ne anlama gelir?", options: ["Aslan", "Zürafa", "Fil", "At"], correctAnswer: "Fil", hint: "En büyük kara hayvanı" },
      { id: 3, type: "multiple-choice", question: "\"Kuş\" İngilizce nasıl söylenir?", options: ["Fish", "Bird", "Cat", "Dog"], correctAnswer: "Bird", hint: "Uçan hayvan" },
    ],
  },
  5: {
    words: [
      { id: 1, english: "Apple", turkish: "Elma", pronunciation: "AP-ul", example: "I eat an apple.", exampleTurkish: "Ben bir elma yerim." },
      { id: 2, english: "Bread", turkish: "Ekmek", pronunciation: "BRED", example: "I eat bread every day.", exampleTurkish: "Her gün ekmek yerim." },
      { id: 3, english: "Milk", turkish: "Süt", pronunciation: "MILK", example: "I drink milk in the morning.", exampleTurkish: "Sabahları süt içerim." },
      { id: 4, english: "Water", turkish: "Su", pronunciation: "WAW-ter", example: "I drink water every day.", exampleTurkish: "Her gün su içerim." },
      { id: 5, english: "Egg", turkish: "Yumurta", pronunciation: "EG", example: "I eat eggs for breakfast.", exampleTurkish: "Kahvaltıda yumurta yerim." },
      { id: 6, english: "Rice", turkish: "Pirinç", pronunciation: "RYCE", example: "I like rice.", exampleTurkish: "Pirinç severim." },
      { id: 7, english: "Cheese", turkish: "Peynir", pronunciation: "CHEEZ", example: "I like cheese.", exampleTurkish: "Peynir severim." },
      { id: 8, english: "Sugar", turkish: "Şeker", pronunciation: "SHUG-er", example: "This is too much sugar.", exampleTurkish: "Bu çok fazla şeker." },
    ],
    questions: [
      { id: 1, type: "translate-to-english", question: "\"Elma\" kelimesinin İngilizcesi nedir?", options: ["Orange", "Apple", "Banana", "Grape"], correctAnswer: "Apple", hint: "Kırmızı veya yeşil meyve" },
      { id: 2, type: "translate-to-turkish", question: "\"Water\" ne anlama gelir?", options: ["Süt", "Çay", "Su", "Meyve suyu"], correctAnswer: "Su", hint: "Hayat kaynağı" },
    ],
  },
  6: {
    words: [
      { id: 1, english: "Mother", turkish: "Anne", pronunciation: "MUH-ther", example: "My mother is kind.", exampleTurkish: "Annem naziktir." },
      { id: 2, english: "Father", turkish: "Baba", pronunciation: "FAH-ther", example: "My father is strong.", exampleTurkish: "Babam güçlüdür." },
      { id: 3, english: "Sister", turkish: "Kız kardeş", pronunciation: "SIS-ter", example: "My sister is young.", exampleTurkish: "Kız kardeşim gençtir." },
      { id: 4, english: "Brother", turkish: "Erkek kardeş", pronunciation: "BRUH-ther", example: "My brother is tall.", exampleTurkish: "Erkek kardeşim uzundur." },
      { id: 5, english: "Grandmother", turkish: "Büyükanne", pronunciation: "GRAND-muh-ther", example: "My grandmother cooks well.", exampleTurkish: "Büyükannem iyi pişirir." },
      { id: 6, english: "Grandfather", turkish: "Büyükbaba", pronunciation: "GRAND-fah-ther", example: "My grandfather is old.", exampleTurkish: "Büyükbabam yaşlıdır." },
      { id: 7, english: "Son", turkish: "Oğul", pronunciation: "SUN", example: "My son is five years old.", exampleTurkish: "Oğlum beş yaşında." },
      { id: 8, english: "Daughter", turkish: "Kız", pronunciation: "DAW-ter", example: "My daughter is smart.", exampleTurkish: "Kızım akıllıdır." },
    ],
    questions: [
      { id: 1, type: "translate-to-english", question: "\"Anne\" kelimesinin İngilizcesi nedir?", options: ["Father", "Sister", "Mother", "Brother"], correctAnswer: "Mother", hint: "Sizi dünyaya getiren kişi" },
      { id: 2, type: "translate-to-turkish", question: "\"Brother\" ne anlama gelir?", options: ["Kız kardeş", "Erkek kardeş", "Baba", "Oğul"], correctAnswer: "Erkek kardeş", hint: "Erkek kardeş" },
    ],
  },
  7: {
    words: [
      { id: 1, english: "Monday", turkish: "Pazartesi", pronunciation: "MUN-day", example: "Monday is the first day.", exampleTurkish: "Pazartesi ilk gündür." },
      { id: 2, english: "Tuesday", turkish: "Salı", pronunciation: "TOOZ-day", example: "Tuesday comes after Monday.", exampleTurkish: "Salı, Pazartesi'den sonra gelir." },
      { id: 3, english: "Wednesday", turkish: "Çarşamba", pronunciation: "WENZ-day", example: "Wednesday is in the middle.", exampleTurkish: "Çarşamba ortadadır." },
      { id: 4, english: "Thursday", turkish: "Perşembe", pronunciation: "THURZ-day", example: "Thursday is my favorite day.", exampleTurkish: "Perşembe benim favori günüm." },
      { id: 5, english: "Friday", turkish: "Cuma", pronunciation: "FRY-day", example: "Friday is the last work day.", exampleTurkish: "Cuma son iş günüdür." },
      { id: 6, english: "Saturday", turkish: "Cumartesi", pronunciation: "SAT-er-day", example: "Saturday is a holiday.", exampleTurkish: "Cumartesi tatil günüdür." },
      { id: 7, english: "Sunday", turkish: "Pazar", pronunciation: "SUN-day", example: "Sunday is a day of rest.", exampleTurkish: "Pazar dinlenme günüdür." },
      { id: 8, english: "January", turkish: "Ocak", pronunciation: "JAN-yoo-air-ee", example: "January is the first month.", exampleTurkish: "Ocak ilk aydır." },
      { id: 9, english: "February", turkish: "Şubat", pronunciation: "FEB-roo-air-ee", example: "February is a short month.", exampleTurkish: "Şubat kısa bir aydır." },
      { id: 10, english: "December", turkish: "Aralık", pronunciation: "deh-SEM-ber", example: "December is the last month.", exampleTurkish: "Aralık son aydır." },
    ],
    questions: [
      { id: 1, type: "translate-to-english", question: "\"Pazartesi\" kelimesinin İngilizcesi nedir?", options: ["Tuesday", "Monday", "Wednesday", "Sunday"], correctAnswer: "Monday", hint: "Haftanın ilk günü" },
      { id: 2, type: "translate-to-turkish", question: "\"Friday\" ne anlama gelir?", options: ["Perşembe", "Cumartesi", "Cuma", "Pazar"], correctAnswer: "Cuma", hint: "Haftanın son iş günü" },
      { id: 3, type: "translate-to-english", question: "\"Aralık\" kelimesinin İngilizcesi nedir?", options: ["November", "January", "December", "October"], correctAnswer: "December", hint: "Yılın son ayı" },
    ],
  },
  8: {
    words: [
      { id: 1, english: "Doctor", turkish: "Doktor", pronunciation: "DOK-ter", example: "The doctor is helpful.", exampleTurkish: "Doktor yardımcıdır." },
      { id: 2, english: "Teacher", turkish: "Öğretmen", pronunciation: "TEE-cher", example: "The teacher explains well.", exampleTurkish: "Öğretmen iyi açıklar." },
      { id: 3, english: "Engineer", turkish: "Mühendis", pronunciation: "en-jih-NEER", example: "The engineer builds bridges.", exampleTurkish: "Mühendis köprü inşa eder." },
      { id: 4, english: "Nurse", turkish: "Hemşire", pronunciation: "NURS", example: "The nurse helps patients.", exampleTurkish: "Hemşire hastalara yardım eder." },
      { id: 5, english: "Chef", turkish: "Aşçı", pronunciation: "SHEF", example: "The chef cooks delicious food.", exampleTurkish: "Aşçı lezzetli yemek pişirir." },
      { id: 6, english: "Lawyer", turkish: "Avukat", pronunciation: "LAW-yer", example: "The lawyer defends clients.", exampleTurkish: "Avukat müvekkilleri savunur." },
      { id: 7, english: "Pilot", turkish: "Pilot", pronunciation: "PY-let", example: "The pilot flies the plane.", exampleTurkish: "Pilot uçağı uçurur." },
      { id: 8, english: "Farmer", turkish: "Çiftçi", pronunciation: "FAR-mer", example: "The farmer grows vegetables.", exampleTurkish: "Çiftçi sebze yetiştirir." },
    ],
    questions: [
      { id: 1, type: "translate-to-english", question: "\"Öğretmen\" kelimesinin İngilizcesi nedir?", options: ["Doctor", "Engineer", "Teacher", "Nurse"], correctAnswer: "Teacher", hint: "Okullarda çalışır" },
      { id: 2, type: "translate-to-turkish", question: "\"Pilot\" ne anlama gelir?", options: ["Kaptan", "Pilot", "Sürücü", "Teknisyen"], correctAnswer: "Pilot", hint: "Uçak kullanır" },
    ],
  },
};

router.get("/lessons", (_req, res) => {
  res.json(lessonsData);
});

router.get("/lessons/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const lesson = lessonsData.find((l) => l.id === id);
  if (!lesson) {
    res.status(404).json({ error: "Ders bulunamadı" });
    return;
  }
  const detail = lessonDetailsData[id] || { words: [], questions: [] };
  res.json({ ...lesson, ...detail });
});

export default router;
