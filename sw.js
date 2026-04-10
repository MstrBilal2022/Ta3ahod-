const CACHE_NAME = "taahod-app-v1";

//☆☆☆☆☆مازال  ملفات كجلد ال font ☆☆

const assetsToCache = [
  "/",
  "/index.html",
  "/info.html", // أضفته لأنه موجود في مجلدك
  "/read.html", // أضفته لأنه موجود في مجلدك
  "/manifest.json",
  "/favicon.ico",
  
  // مجلد التصميم
  "/css/fremwork.css",
  "/css/style.css",
  "/css/read.css",
  "/css/info.css", // أضفته لأنه موجود في المجلد
  
  // مجلد البرمجة
  "/js/global.js",
  "/js/read.js",
  "/js/info.js", // أضفته لأنه موجود في المجلد
  
  "/font/Amiri-Bold.ttf",
  "/font/Amiri-BoldItalic.ttf",
  "/font/Amiri-Italic.ttf",
  "/font/Amiri-Regular.ttf",
  
  // مجلد البيانات
  "/data/hafs.json",
  "/data/jalalayn.json",
  "/data/saddi.json",
  "/data/warsh.json",
  "/data/telegram.png"
];

// حدث التثبيت: حفظ الملفات في ذاكرة هاتف المستخدم
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("جاري تخزين ملفات تعاهد للعمل أوفلاين...");
      return cache.addAll(assetsToCache);
    })
  );
});

// حدث التفعيل: مسح أي نسخ قديمة إذا قمت بتحديث التطبيق
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
    })
  );
});

// حدث الجلب: تشغيل التطبيق من الذاكرة إذا لم يكن هناك إنترنت
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
