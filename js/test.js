let link = document.querySelector('.links');
let ul = document.getElementById('chowMenu');
let sacendSpan = document.getElementById('span');

link.addEventListener('click', () => {
  if (window.getComputedStyle(ul).display === 'block') {
    ul.style.display = 'none';
    sacendSpan.style.width = '100%';
  } else {
    ul.style.display = 'block';
    sacendSpan.style.width = '60%';
  }
});

// End Header 

let quranData = [];
let selectedParts = new Set();
async function loadQuranData() {
  try {
    const response = await fetch('data/warsh.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid Quran data format');
    }
    
    quranData = data;
    prepareQuranData();
    console.log('تم تحميل بيانات القرآن بنجاح');
    return true;
  } catch (error) {
    console.error('Error loading Quran data:', error);
    alert('حدث خطأ في تحميل بيانات القرآن. الرجاء التأكد من وجود الملف وتنسيقه بشكل صحيح');
    quranData = [];
    return false;
  }
}

function prepareQuranData() {
  try {
    quranData.forEach((verse, index) => {
      verse.aya_text = verse.aya_text.slice(0, -2);
      verse.previous_aya = index > 0 ? quranData[index - 1].aya_text : null;
      verse.next_aya = index < quranData.length - 1 ? quranData[index + 1].aya_text : null;
    });
    console.log('تم تحضير بيانات القرآن للاستخدام');
  } catch (error) {
    console.error('Error preparing Quran data:', error);
    throw new Error('حدث خطأ في تحضير بيانات القرآن للاستخدام');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const loaded = await loadQuranData();
  if (!loaded) return;
  
  console.log('جاهز لبدء الاختبارات');
  
  const partList = Array.from({ length: 30 }, (_, i) => i + 1);
  const partContainer = document.querySelector('.juz-buttons');
  
  partList.forEach(part => {
    const btn = document.createElement('button');
    btn.className = 'juz-btn';
    btn.textContent = `الجزء ${part}`;
    
    if (part % 2 === 0) {
      btn.style.cssText = 'animation: slideIn 1.5s ease-in-out';
    } else {
      btn.style.cssText = 'animation: slideInR 1.5s ease-in-out';
    }
    btn.dataset.part = part;
    btn.addEventListener('click', togglePartSelection);
    partContainer.appendChild(btn);
  });
  
  function togglePartSelection(e) {
    const part = parseInt(e.target.dataset.part);
    if (selectedParts.has(part)) {
      selectedParts.delete(part);
      e.target.classList.remove('selected');
    } else {
      selectedParts.add(part);
      e.target.classList.add('selected');
    }
  }
  
  const startButtons = document.querySelectorAll('.start-btn');
  startButtons.forEach(btn => {
    btn.addEventListener('click', startTest);
  });
  
  function startTest(e) {
    if (selectedParts.size === 0) {
      alert('الرجاء اختيار جزء واحد على الأقل');
      return;
    }
    
    const card = e.target.closest('.test-card');
    let questionCount;
    
    if (card.classList.contains('flexible-test')) {
      questionCount = parseInt(card.querySelector('.question-count').value);
      if (questionCount < 1 || questionCount > 300) {
        alert('عدد الأسئلة يجب أن يكون بين 1 و 300');
        return;
      }
    } else {
      questionCount = parseInt(card.dataset.questions);
    }

    modeTest();
    
    startExam(Array.from(selectedParts), questionCount);
  }
  
  function startExam(parts, totalQuestions) {
    let currentQuestion = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let questions = [];
    let mistakes = []; // مصفوفة لتخزين الأخطاء
    let usedVerses = new Set();
    let timer;
    
    function generateQuestions() {
      const versesInParts = quranData.filter(verse =>
        parts.includes(verse.jozz) &&
        verse.previous_aya !== null &&
        verse.next_aya !== null
      );
      
      if (versesInParts.length < totalQuestions) {
        alert('عدد الأسئلة المطلوبة أكبر من عدد الآيات المتاحة في الأجزاء المختارة');
        return false;
      }
      
      while (questions.length < totalQuestions) {
        const randomIndex = Math.floor(Math.random() * versesInParts.length);
        const verse = versesInParts[randomIndex];
        
        if (!usedVerses.has(verse.id)) {
          const isPreviousQuestion = Math.random() > 0.5;
          questions.push({
            type: isPreviousQuestion ? 'previous' : 'next',
            verse: verse,
            correctAnswer: isPreviousQuestion ? verse.previous_aya : verse.next_aya,
            ayaRef: `سورة ${verse.sura_name_ar} الآية ${verse.aya_no}`,
            userAnswer: null // لإضافة إجابة المستخدم
          });
          usedVerses.add(verse.id);
        }
      }
      return true;
    }
    
    // عرض السؤال الحالي
    function displayQuestion() {
      if (currentQuestion >= questions.length) {
        saveTestResult(correctAnswers, wrongAnswers, parts, totalQuestions, mistakes);
        showResults();
        return;
      }
      
      const question = questions[currentQuestion];
      const questionContainer = document.querySelector('.question-container');
      
      // إزالة أي مؤقت سابق
      clearInterval(timer);
      
      // تحديث واجهة السؤال
      questionContainer.querySelector('.progress').textContent =
        `السؤال ${currentQuestion + 1} من ${totalQuestions}`;
      
      questionContainer.querySelector('.question-type').textContent =
        question.type === 'previous' ? 'ما هي الآية السابقة؟' : 'ما هي الآية التالية؟';
      
      questionContainer.querySelector('.current-verse').innerHTML = `
        <div class="aya-text">${question.verse.aya_text}</div>
        <div class="aya-ref">${question.ayaRef}</div>
      `;
      
      // توليد الخيارات
      const optionsContainer = questionContainer.querySelector('.options');
      optionsContainer.innerHTML = '';
      
      const options = generateOptions(question);
      options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.textContent = option.text;
        optionEl.dataset.isCorrect = option.isCorrect;
        optionEl.addEventListener('click', checkAnswer);
        optionsContainer.appendChild(optionEl);
      });
      
      // بدء المؤقت
      startTimer();
    }
    
    // توليد الخيارات العشوائية
    function generateOptions(question) {
      const correctOption = {
        text: question.correctAnswer,
        isCorrect: true
      };
      
      const wrongOptions = [];
      const allVerses = quranData.filter(v =>
        v.jozz === question.verse.jozz &&
        v.id !== question.verse.id
      );
      
      while (wrongOptions.length < 3 && wrongOptions.length < allVerses.length) {
        const randomVerse = allVerses[Math.floor(Math.random() * allVerses.length)];
        const wrongText = question.type === 'previous' ?
          randomVerse.previous_aya : randomVerse.next_aya;
        
        if (wrongText && !wrongOptions.some(o => o.text === wrongText)) {
          wrongOptions.push({
            text: wrongText,
            isCorrect: false
          });
        }
      }
      
      const options = [correctOption, ...wrongOptions.slice(0, 3)];
      return options.sort(() => Math.random() - 0.5);
    }
    
    // المؤقت الزمني
    function startTimer() {
      let timeLeft = 30;
      const timerElement = document.createElement('div');
      timerElement.className = 'timer';
      document.querySelector('.question-container').appendChild(timerElement);
      timer = setInterval(() => {
        timeLeft--;
        
        timerElement.textContent = `الوقت المتبقي: ${timeLeft} ثانية`;
        timerElement.style.color = timeLeft <= 10 ? 'red' : 'inherit';
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          handleTimeOut();
          timerElement.remove();
        }
      }, 1000);
    }
    
    // انتهاء الوقت
    function handleTimeOut() {
      wrongAnswers++;
      const options = document.querySelectorAll('.option');
      options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.dataset.isCorrect === 'true') {
          opt.classList.add('correct');
        }
      });
      
      // حفظ الخطأ
      mistakes.push(questions[currentQuestion]);
      
      setTimeout(() => {
        currentQuestion++;
        displayQuestion();
      }, 1500);
    }
    
    // التحقق من الإجابة
    function checkAnswer(e) {
      const isCorrect = e.target.dataset.isCorrect === 'true';
      const options = document.querySelectorAll('.option');
      
      options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.dataset.isCorrect === 'true') {
          opt.classList.add('correct');
        }
      });
      
      let timerElement = document.querySelector('.timer');
      if (isCorrect) {
        e.target.classList.add('correct');
        correctAnswers++;
        timerElement.remove();
        clearInterval(timer);
      } else {
        e.target.classList.add('wrong');
        wrongAnswers++;
        timerElement.remove();
        clearInterval(timer);
        
        // حفظ الخطأ
        mistakes.push(questions[currentQuestion]);
      }
      
      setTimeout(() => {
        currentQuestion++;
        displayQuestion();
      }, 1500);
    }
    
    // حفظ نتائج الاختبار
    function saveTestResult(correct, wrong, parts, totalQuestions, mistakes) {
      const percentage = Math.round((correct / totalQuestions) * 100);
      const testResult = {
        date: new Date().toLocaleString(),
        percentage,
        correctAnswers: correct,
        wrongAnswers: wrong,
        parts: parts,
        questionCount: totalQuestions,
        mistakes: mistakes
      };
      
      let testHistory = JSON.parse(localStorage.getItem('testHistory')) || [];
      testHistory.push(testResult);
      localStorage.setItem('testHistory', JSON.stringify(testHistory));
    }
    
    // عرض النتائج
    function showResults() {
      
      const resultScreen = document.querySelector('.result-screen');
      const history = JSON.parse(localStorage.getItem('testHistory')) || [];
      
      if (history.length === 0) {
        resultScreen.innerHTML = `
          <h2>لا توجد نتائج سابقة.</h2>
          <div class="actions">
            <button class="new-test-btn">اختبار جديد</button>
          </div>
        `;
        resultScreen.classList.remove('hidden');
        document.querySelector('.question-container').classList.add('hidden');
        resultScreen.querySelector('.new-test-btn').addEventListener('click', () => {
          resetTestUI();
        });
        return;
      }
      
      const lastResult = history[history.length - 1];
      const percentage = Math.round((lastResult.correctAnswers / lastResult.questionCount) * 100);
      
      let performanceLevel = '';
      let performanceClass = '';
      if (percentage >= 90) {
        performanceLevel = 'ممتاز';
        performanceClass = 'excellent';
      } else if (percentage >= 70) {
        performanceLevel = 'جيد جداً';
        performanceClass = 'very-good';
      } else if (percentage >= 50) {
        performanceLevel = 'مقبول';
        performanceClass = 'good';
      } else {
        performanceLevel = 'ضعيف';
        performanceClass = 'weak';
      }
      
      resultScreen.innerHTML = `
        <h2>نتيجة آخر إختبار</h2>
         <div class="info">
           <div class="date">بتاريخ: ${lastResult.date}</div>
           <div>الأجزاء: ${lastResult.parts.join(', ')}</div>
           <div>عدد الأسئلة: ${lastResult.questionCount}</div>
         </div>
        <div class="performance ${performanceClass}">${performanceLevel}</div>
        <div class="score">النسبة: <span>${percentage || 0}%</span></div>
        <div class="stats">
          <div class="correct">الإجابات الصحيحة: ${lastResult.correctAnswers || 0}</div>
          <div class="wrong">الإجابات الخاطئة: ${lastResult.wrongAnswers || 0}</div>
        </div>
        <div class="actions">
          <button class="restart-btn">إعادة الاختبار</button>
          <button class="new-test-btn">اختبار جديد</button>
          <button class="show-mistakes-btn">عرض الأخطاء</button>
        </div>
        <div class="mistakes-container hidden"></div>
      `;
      
      resultScreen.querySelector('.restart-btn').addEventListener('click', () => {
        startExam(lastResult.parts, lastResult.questionCount);
        modeTest();
      });
      
      resultScreen.querySelector('.new-test-btn').addEventListener('click', () => {
        resetTestUI();
      });
      
      resultScreen.querySelector('.show-mistakes-btn').addEventListener('click', () => {
        showMistakes(lastResult.mistakes);
      });
      
      document.querySelector('.question-container').classList.add('hidden');
      resultScreen.classList.remove('hidden');
    }
    
    // عرض الأخطاء
    function showMistakes(mistakes) {
      const mistakesContainer = document.querySelector('.mistakes-container');
      mistakesContainer.innerHTML = '<h3>الآيات التي أخطأت فيها:</h3>';
      
      if (mistakes.length === 0) {
        mistakesContainer.innerHTML += '<p>لم تُخطئ في أي آية! أحسنت.</p>';
      } else {
        mistakes.forEach((q, index) => {
          const mistakeEl = document.createElement('div');
          mistakeEl.className = 'mistake';
          mistakeEl.innerHTML = `
            <p><strong>السؤال ${index + 1}:</strong> ${q.type === 'previous' ? 'الآية السابقة لـ' : 'الآية التالية لـ'}</p>
            <p class="verse">${q.verse.aya_text}</p>
            <p class="correct-answer">الإجابة الصحيحة: ${q.correctAnswer}</p>
            <hr>
          `;
          mistakesContainer.appendChild(mistakeEl);
        });
      }
      mistakesContainer.classList.toggle('hidden');
    }
    
    // إعادة تعيين واجهة الاختبار
    function resetTestUI() {
      document.querySelector('.part-selection').classList.remove('hidden');
      document.querySelector('.test-cards').classList.remove('hidden');
      document.querySelector('.test-screen').classList.add('hidden');
      document.querySelector('.question-container').classList.remove('hidden');
      document.querySelector('.result-screen').classList.add('hidden');
      selectedParts.clear();
      document.querySelectorAll('.juz-btn').forEach(btn => {
        btn.classList.remove('selected');
      });
    }
    
    // بدء الاختبار
    if (generateQuestions()) {
      displayQuestion();
    } else {
      resetTestUI();
    }
  }
});

//  《《《《《《《《  Stayle  》》》》》》》》》》》
function modeTest(){
  document.querySelector('.part-selection').classList.add('hidden');
  document.querySelector('.test-cards').classList.add('hidden');
  document.querySelector('.question-container').classList.remove('hidden');
  document.querySelector('.test-screen').classList.remove('hidden');
  document.querySelector('.result-screen').classList.add('hidden');
}

loadQuranData();
window.addEventListener('DOMContentLoaded', () => {
    // قراءة البيانات من localStorage
    const storedData = localStorage.getItem('testHistory'); // استبدل 'yourStorageKey' بالمفتاح الصحيح
    
    if (storedData) {
      try {
        const dataArray = JSON.parse(storedData);
        // نفترض أن البيانات المطلوبة هي العنصر الأول في المصفوفة
        const latestResult = dataArray[0];
        
        // تحديث عناصر HTML
        document.querySelector('.score').textContent = `النسبة: ${latestResult.percentage}%`;
        document.querySelector('.correct').textContent = `الإجابات الصحيحة: ${latestResult.correctAnswers}`;
        document.querySelector('.wrong').textContent = `الإجابات الخاطئة: ${latestResult.wrongAnswers}`;
      } catch (e) {
        console.error('خطأ في تحليل بيانات localStorage:', e);
      }
    } else {
      console.warn('لا توجد بيانات مخزنة في localStorage بالمفتاح المحدد');
    }
  });