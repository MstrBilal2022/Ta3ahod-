import { header, scrollBar } from "./global.js";

header();
scrollBar();
// end global


//إخفاء وإظهار الإرشادات
document.querySelectorAll('.hed, .hed button').forEach(element => {
  element.addEventListener('click', function(e) {
    // منع الانتشار لتجنب تنفيذ الحدث مرتين عند النقر على الزر
    e.stopPropagation();
    
    const parentContent = this.closest('.content');
    const paragraph = parentContent.querySelector('p');
    const button = parentContent.querySelector('button');
    
    // التحقق مما إذا كانت الفقرة معروضة حالياً
    const isActive = paragraph.classList.contains('activ');
    
    // إخفاء جميع الفقرات الأخرى
    document.querySelectorAll('.content p').forEach(p => {
      if (p !== paragraph) {
        p.classList.remove('activ');
      }
    });
    
    // تحديث جميع الأزرار الأخرى
    document.querySelectorAll('.content button').forEach(btn => {
      if (btn !== button) {
        btn.textContent = '+';
      }
    });
    
    // تبديل حالة الفقرة الحالية
    if (isActive) {
      paragraph.classList.remove('activ');
      button.textContent = '+';
    } else {
      paragraph.classList.add('activ');
      button.textContent = '-';
    }
  });
});



   
