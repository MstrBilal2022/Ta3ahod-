const CACHE_NAME = "taahod-app-v2";
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

// حدث التثبيت: حفظ الملفات مع التسامح مع الأخطاء
self.addEventListener("install", (e) => {
  self.skipWaiting(); // التفعيل الفوري
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("جاري تخزين ملفات تعاهد للعمل أوفلاين...");
      // إدخال كل ملف على حدة لضمان عدم توقف التثبيت في حال فقدان ملف واحد
      return Promise.allSettled(
        assetsToCache.map((url) =>
          cache.add(url).catch((err) => console.warn(`تعذر تخزين الملف: ${url}`, err))
        )
      );
    })
  );
});

// حدث التفعيل: مسح النسخ القديمة واستلام التحكم فوراً
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// حدث الجلب: تقديم الملفات من الذاكرة المحلية مع دعم التنقل أوفلاين
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // إذا كان طلب فتح صفحة وكان الهاتف بدون إنترنت، توجيهه لـ index.html
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
