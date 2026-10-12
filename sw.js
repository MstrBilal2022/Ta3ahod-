const CACHE_NAME = "taahod-app-v3";
const assetsToCache = [
  "./",
  "./index.html",
  "./info.html", 
  "./read.html", 
  "./manifest.json",
  "./favicon.ico",
  
  // مجلد التصميم
  "./css/fremwork.css",
  "./css/style.css",
  "./css/read.css",
  "./css/info.css", 
  
  // مجلد البرمجة
  "./js/global.js",
  "./js/read.js",
  "./js/info.js", 
  
  // مجلد الخطوط
  "./font/Amiri-Bold.ttf",
  "./font/Amiri-BoldItalic.ttf",
  "./font/Amiri-Italic.ttf",
  "./font/Amiri-Regular.ttf",
  
  // مجلد البيانات
  "./data/hafs.json",
  "./data/jalalayn.json",
  "./data/saddi.json",
  "./data/warsh.json",
  "./data/telegram.png"
];

// 1. التثبيت والتفعيل الفوري
self.addEventListener("install", (e) => {
  self.skipWaiting(); // تجاوز الانتظار والتفعيل فوراً
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("جاري تخزين ملفات تعاهد للعمل أوفلاين...");
      return Promise.allSettled(
        assetsToCache.map((url) =>
          cache.add(url).catch((err) => console.warn(`تعذر تخزين الملف: ${url}`, err))
        )
      );
    })
  );
});

// 2. التفعيل: تنظيف الذاكرة القديمة واستلام التحكم فوراً
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log(`حذف الذاكرة القديمة: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // استلام التحكم بجميع الصفحات المفتوحة فوراً
  );
});

// 3. الجلب: استراتيجية Stale-While-Revalidate مع دعم الأوفلاين
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(e.request);

      // طلب النسخة الجديدة من الشبكة في الخلفية لتحديث الذاكرة
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // عند عدم توفر إنترنت وفتح صفحة جديدة، التوجيه إلى index.html
          if (e.request.mode === "navigate" && !cachedResponse) {
            return caches.match("./index.html");
          }
        });

      // إرجاع النسخة المخزنة فوراً للسرعة، أو الانتظار للشبكة إذا كان الملف جديداً
      return cachedResponse || fetchPromise;
    })
  );
});
