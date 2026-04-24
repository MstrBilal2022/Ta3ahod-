import { header, scrollBar } from "./global.js";

header();
scrollBar();

// ==========================================
// 1. نظام التخزين المؤقت (Data Caching) للسرعة
// ==========================================
let globalQuranData = []; // سيحفظ بيانات القرآن كاملة (ورش/حفص)
let globalTafsirData = []; // سيحفظ بيانات التفسير
let soraHafsSaved = []; // سيحفظ آيات السورة الحالية
let quranSearchData = null; // مخصص لعملية البحث السريع

// دالة جديدة لجلب كل البيانات دفعة واحدة عند تحميل الصفحة
async function initializeApp() {
  try {
    // نجلب ملفات الرواية والبحث والتفسير معاً بشكل متوازٍ لتسريع التحميل
    let riwayat = document.querySelector("option:checked").value;
    let tafsirName = document.querySelector("#tafsirName option:checked").value;
    
    const [quranRes, searchRes, tafsirRes] = await Promise.all([
      fetch(`./data/${riwayat}.json`),
      fetch(`./data/hafs.json`), // للبحث و لدالة soraHafs
      fetch(`./data/${tafsirName}.json`)
    ]);
    
    globalQuranData = await quranRes.json();
    quranSearchData = await searchRes.json();
    globalTafsirData = await tafsirRes.json();
    
    // تشغيل باقي الوظائف بعد التأكد من جلب البيانات
    surahNames();
    let savedSoraNum = window.localStorage.getItem("sura_no") || 1;
    quran(savedSoraNum);
    
  } catch (error) {
    console.error("حدث خطأ في تحميل البيانات الأساسية:", error);
  }
}

// تشغيل التطبيق بمجرد أن يقرأ المتصفح الكود
initializeApp();

// ==========================================
// 2. التحكم بالتمرير (Scroll Controls)
// ==========================================
let btns = document.querySelector(".controls .buttons");
let lastScroll = 0;
let wait = false;
window.addEventListener("scroll", () => {
  if (wait) return;
  wait = true;
  requestAnimationFrame(() => { // أفضل للأداء من setTimeout
    let scroling = window.scrollY;
    if (scroling > 500 && scroling < lastScroll) {
      btns.classList.add("fixed");
      setTimeout(() => {
        btns.classList.remove("fixed");
      }, 6000);
    } else {
      btns.classList.remove("fixed");
    }
    lastScroll = scroling;
    wait = false;
  });
});

// ==========================================
// 3. قائمة السور (Surah Names)
// ==========================================
function surahNames() { // أزلنا الـ async لأن البيانات جاهزة
  let ul = document.getElementById("names");
  let revers = document.getElementById("reverse");
  
  revers.addEventListener("click", () => {
    let list = Array.from(document.querySelectorAll("#names li"));
    ul.innerHTML = "";
    list.reverse().forEach((li) => ul.append(li));
  });
  
  function removeDiacritics(text) {
    return text.replace(/[\u064B-\u0652]/g, "");
  }
  
  document.getElementById("search").addEventListener("input", (e) => {
    const searchTerm = removeDiacritics(e.target.value.toLowerCase());
    const surahElements = document.querySelectorAll("#names li");
    surahElements.forEach((li) => {
      const surahName = li.textContent.split(" ").slice(1).join(" ");
      li.style.display = removeDiacritics(surahName.toLowerCase()).includes(searchTerm) ? "block" : "none";
    });
  });
  // chow menu of sora names or hidden 
  let btn = document.querySelector(".menuSora .btn");
let box = document.querySelector(".menuSora .box");

let isMenuHidden = localStorage.getItem("isSoraListHidden") === "true";
//استخراج القيمة الأخيرة من التخزين المحلي
if (isMenuHidden) {
  box.classList.add("hidden");
  btn.textContent = "اظهار أسماء السور";
} else {
  box.classList.remove("hidden");
  btn.textContent = "اخفاء أسماء السور";
}

btn.addEventListener("click", (e) => {
  box.classList.toggle("hidden");
  
  // نتحقق من وجود كلاس hidden  على الزر
  let currentlyHidden = box.classList.contains("hidden");
  
  // تحديث نص الزر بناءً على الحالة الجديدة
  e.target.textContent = currentlyHidden ? "اظهار أسماء السور" : "اخفاء أسماء السور";
  
  //تخزين القيمة في localStorage  أو حذفها
  currentlyHidden ? localStorage.setItem("isSoraListHidden", currentlyHidden) : localStorage.removeItem("isSoraListHidden");
});


  ul.innerHTML = "";
  let names = new Set();
  
  // 🚀 نستخدم المتغير 
  globalQuranData.forEach((item) => {
    if (!names.has(item.sura_no)) {
      names.add(item.sura_no);
      let li = document.createElement("li");
      li.classList.add("border");
      li.dataset.soraNo = `${item.sura_no}`;
      li.style.cssText = item.sura_no % 2 === 0 ? "animation: slideIn 1.5s ease-in-out" : "animation: slideInR 1.5s ease-in-out";
      li.textContent = `{${item.sura_no}} ${item.sura_name_ar} `;
      ul.appendChild(li);
      
      li.addEventListener("click", (e) => {
        document.getElementById("sora").scrollIntoView({ behavior: "smooth" });
        quran(e.target.dataset.soraNo);
        window.localStorage.setItem("sura_no", e.target.dataset.soraNo);
      });
    }
  });
}

// ==========================================
// 4. المحتوى القرآني وأسهم التنقل
// ==========================================
document.querySelector("select").addEventListener("change", async (e) => {
  // عند تغيير الرواية، يجب جلب الملف الجديد فقط
  let riwayat = e.target.value;
  let response = await fetch(`./data/${riwayat}.json`);
  globalQuranData = await response.json();
  quran(window.localStorage.getItem("sura_no") || 1);
});

const preBtn = document.getElementById("last");
const nextBtn = document.getElementById("next");

function updateNavigationButtons(soraNum) {
  preBtn.style.display = soraNum > 1 ? "inline" : "none";
  nextBtn.style.display = soraNum < 114 ? "inline" : "none";
}

preBtn.addEventListener("click", () => {
  let i = Number(window.localStorage.getItem("sura_no"));
  if (i > 1) {
    i -= 1;
    window.localStorage.setItem("sura_no", i);
    quran(i);
  }
});

nextBtn.addEventListener("click", () => {
  let i = Number(window.localStorage.getItem("sura_no"));
  if (i < 114) {
    i += 1;
    window.localStorage.setItem("sura_no", i);
    quran(i);
    setTimeout(()=>{
      document.getElementById("sora").scrollIntoView({ behavior: "smooth" });
    },1000)
  }
});

let soraForTafsir;

function quran(soraNum) {
  soraNum = Number(soraNum);
  updateNavigationButtons(soraNum);
  
  setTimeout(() => {
    document.querySelectorAll('#names li').forEach(li => li.style.cssText = ""); // تنظيف السابق
    const currentListItem = document.querySelector(`#names li[data-sora-no='${soraNum}']`);
    if (currentListItem) {
      currentListItem.style.cssText = "color:green;background-color:#FFD700;font-size:2.1em";
    }
  }, 100);
  
  const basmala = document.getElementById("basmala");
  basmala.addEventListener('dblclick', () => {
    tafsir(1, 1)
  })
  let currentRiwaya = document.querySelector("option:checked").value;
  if (soraNum === 9 || (currentRiwaya === "hafs" && soraNum === 1)) {
    basmala.style.display = "none";
  } else {
    basmala.style.display = "block";
  }
  
  soraForTafsir = soraNum;
  soraHafs(soraForTafsir); // تحديث بيانات حفص للتفسير فوراً
  
  let titleSora = document.getElementById("titleSora");
  let sora = document.getElementById("sora");
  sora.textContent = "";
  
  // 🚀 تقنية (Document Fragment) لتسريع العرض
  let fragment = document.createDocumentFragment();
  let soraFound = false;
  
  // 🚀 تصفية سريعة بدلاً من المرور على كل القرآن
  let currentSoraAyahs = globalQuranData.filter(item => item.sura_no === soraNum);
  
  currentSoraAyahs.forEach((item) => {
    if (!soraFound) {
      titleSora.textContent = `سورة ${item.sura_name_ar}`;
      soraFound = true;
    }
    let li = document.createElement("span");
    li.classList.add("ayaText");
    let span = document.createElement("span");
    span.classList.add("ayaNum");
    span.textContent = ` {${item.aya_no}} `;
    
    li.dataset.soraNum = item.sura_no;
    li.dataset.ayaNum = item.aya_no;
    span.dataset.soraNum = item.sura_no;
    span.dataset.ayaNum = item.aya_no;
    
    li.textContent = `${item.aya_text.slice(0, -2)}`;
    
    fragment.appendChild(li); // الإضافة للذاكرة الوهمية وليس للشاشة
    fragment.appendChild(span);
  });
  
  sora.appendChild(fragment); // طباعة الجدار كاملاً دفعة واحدة!
}

// ==========================================
// 5. التفاعل (حفظ الآية وفتح التفسير)
// ==========================================
let soraElement = document.getElementById("sora");
soraElement.addEventListener("dblclick", (e) => {
  if (e.target.classList.contains("ayaNum")) {
    e.target.classList.add("carruntSpan");
    setTimeout(() => { e.target.classList.remove("carruntSpan"); }, 3000);
    
    let saveAya = {
      soraNum: e.target.dataset.soraNum,
      ayaNum: e.target.dataset.ayaNum,
    };
    window.localStorage.setItem("saveAya", JSON.stringify(saveAya));
    savedAya(); // تحديث الزر
  } else if (e.target.classList.contains("ayaText")) {
    tafsir(e.target.dataset.soraNum, e.target.dataset.ayaNum);
    e.target.style.textShadow = '2px 2px 2px green'
  }
});

function savedAya() {
  let btn = document.getElementById("ayaSaved");
  let savedData = window.localStorage.getItem("saveAya");
  
  if (savedData) {
    btn.style.display = "inline-block";
    // إزالة المستمع القديم حتى لا يتضاعف التنفيذ
    let newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener("click", () => {
      let x = JSON.parse(savedData);
      quran(x.soraNum);
      window.localStorage.setItem("sura_no", x.soraNum);
      
      setTimeout(() => {
        let carruntSpan = document.querySelector(`.ayaNum[data-aya-num="${x.ayaNum}"]`);
        if (carruntSpan) {
          carruntSpan.scrollIntoView({ behavior: "smooth", block: "center" });
          carruntSpan.style.cssText = "color:var(--textColor); text-shadow: 2px 3px teal; font-weight: bolder";
        }
      }, 500);
    });
  } else {
    btn.style.display = "none";
  }
}
savedAya();

// ==========================================
// 6. محرك البحث
// ==========================================
function removeDiacritics(text) {
  return text.trim().replace(/[\u064B-\u0652]/g, "");
}

let timeoutId = null;
let sorah = document.getElementById("sora");
let title = document.getElementById("titleSora");

document.getElementById("searchAya").addEventListener("input", function(e) {
  const searchTerm = removeDiacritics(this.value.toLowerCase());
  if (searchTerm.length > 2 && quranSearchData) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      searchAya(searchTerm);
    }, 300);
  }
});

function searchAya(searchTerm) {
  title.textContent = "نتائج البحث";
  sorah.textContent = "";
  
  let results = quranSearchData.filter((e) => new RegExp(searchTerm, "i").test(e.aya_text_emlaey));
  let fragment = document.createDocumentFragment();
  
  results.forEach(result => {
    let name = document.createElement("h3");
    name.textContent = `سورة ${result.sura_name_ar}`;
    fragment.append(name);
    
    let ul = document.createElement("ul");
    let li = document.createElement("li");
    li.dataset.soraNum = result.sura_no;
    li.dataset.ayaNum = result.aya_no;
    let span = document.createElement('span');
    span.classList.add("ayaNum");
    span.textContent = ` {${result.aya_no}} `;
    
    
     let clickTimer = null; //لتخزين مؤقت النقر 
   
    //حدث فتح سورة الآية والنزول إليها
    li.addEventListener('click', async () => { 
      clearTimeout(clickTimer);
      clickTimer = setTimeout(async () => {
      let selectRiwaya = document.querySelector('.btn');
      
      // 1. تغيير الرواية لحفص (إذا لم تكن حفص بالفعل) وتحديث البيانات
      if (selectRiwaya.value !== 'hafs') {
        selectRiwaya.value = 'hafs';
        try {
          // ننتظر جلب بيانات حفص قبل إكمال أي شيء
          let response = await fetch(`./data/hafs.json`);
          globalQuranData = await response.json();
        } catch (error) {
          console.error("حدث خطأ أثناء جلب رواية حفص:", error);
        }
      }
      
      // تحديث رقم السورة في الذاكرة المحلية لضمان استقرار التطبيق
      window.localStorage.setItem("sura_no", result.sura_no);
      
      // 2. فتح سورة الآية التي تم الضغط عليها
      quran(result.sura_no);
      
      // 3. نبحث عن الآية ونقوم بالنزول السلس
      // 💡 استخدمنا setTimeout بسيط جداً (50 ملي ثانية) لإعطاء المتصفح 
      // وقتاً لحساب أبعاد العناصر الجديدة في الشاشة قبل النزول إليها
      setTimeout(() => {
        let currentAya = document.querySelector(`span.ayaText[data-aya-num="${result.aya_no}"]`);
        
        if (currentAya) {
          // النزول السلس لتصبح الآية في منتصف الشاشة
          currentAya.scrollIntoView({ behavior: "smooth", block: "center" });
          
          // تلوين خلفية الآية لثانيتين لتمييزها للمستخدم
          let originalColor = currentAya.style.backgroundColor || "";
          let originalTextColor = currentAya.style.color || "";
          
          currentAya.style.backgroundColor = "#e6f7ff"; // لون التمييز
          currentAya.style.color = "teal"; // ضمان وضوح النص
          
          setTimeout(() => {
            currentAya.style.backgroundColor = originalColor; // إعادة اللون الطبيعي
            currentAya.style.color = originalTextColor; // إعادة لون النص الطبيعي
          }, 4000);
        }
      }, 50);
      },250);
    });
    
     
    //حدث جلب التفسير
    li.addEventListener('dblclick', () => {
      tafsir(li.dataset.soraNum, li.dataset.ayaNum);
      clearTimeout(clickTimer);
    })
    
    
    let text = result.aya_text_emlaey;
    let index = text.indexOf(searchTerm);
    let last = text.toLowerCase().lastIndexOf(searchTerm);
    
    if (index !== -1) {
      li.textContent = text.substring(0, index);
      let mark = document.createElement("mark");
      mark.textContent = text.substring(index, index + searchTerm.length);
      li.append(mark);
      li.append(text.substring(index + searchTerm.length));
      li.append(span);
    } else {
      li.textContent = text;
      li.append(span);
    }
    ul.append(li);
    fragment.append(ul);
  });
  
  sorah.append(fragment);
}

// =========================================
// 7. قسم التفسير 
// =========================================
const quranContainer = document.getElementById('quranContainer');
const tafsirContainer = document.getElementById('tafsirContainer');
let overlay = document.getElementById('overlay');

function tafsirMode() {
  overlay.classList.toggle("active");
  tafsirContainer.classList.toggle("active");
  quranContainer.classList.toggle('hidden');
}

overlay.addEventListener("click", tafsirMode);
tafsirContainer.addEventListener("dblclick", tafsirMode);

document.getElementById("tafsirName").addEventListener("change", async (e) => {
  let tafsirName = e.target.value;
  let response = await fetch(`./data/${tafsirName}.json`);
  globalTafsirData = await response.json();
});

let ulTafsir = document.getElementById("tafsirAya");

function soraHafs(number) {
  soraHafsSaved = [];
  if (quranSearchData) {
    let currentSoraAyahs = quranSearchData.filter(item => item.sura_no == number);
    currentSoraAyahs.forEach(e => {
      soraHafsSaved.push(e.aya_text.slice(0, -2));
    });
  }
}

function tafsir(soraNum, ayaNum) {
  tafsirMode();
  ulTafsir.textContent = "";
  
  let currentAya = Number(ayaNum);
  let start, end;
  let totalAyahs = soraHafsSaved.length;
  //جلب تفسير البسملة فقط
  if (soraNum === 1 && ayaNum === 1) {
    start = 0;
    end = 1;
  } else {
    //جلب تفسير السورة كاملة إذا كانت قصيرة (أقل من 5 آيات)
    if (totalAyahs <= 5) {
      start = 0;
      end = totalAyahs;
    } else if (currentAya <= 3) {
      start = 0;
      end = 5;
    } else if (currentAya >= totalAyahs - 1) {
      start = totalAyahs - 5;
      end = totalAyahs;
    } else {
      start = currentAya - 3;
      end = currentAya + 2;
    }
  }
  let fragment = document.createDocumentFragment();
  
  for (let i = start; i < end; i++) {
    let li = document.createElement("li");
    let aya = document.createElement("h4");
    
    aya.textContent = soraHafsSaved[i];
    li.textContent = globalTafsirData.tafsir[Number(soraNum) - 1][i];
    
    if (i === (currentAya - 1)) {
      li.classList.add("tafsirAya");
    }
    
    li.prepend(aya);
    fragment.append(li);
  }
  
  ulTafsir.append(fragment);
}
