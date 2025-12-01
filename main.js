// 1. KIỂM TRA ĐĂNG NHẬP
if (!localStorage.getItem('currentUser')) {
    window.location.href = 'index.html';
}

// ________DATA_______________
let questions = [];

// ________DOM ELEMENTS________________
const quizTimer = document.querySelector("#timer");
const quizProgress = document.querySelector("#progress");
const quizProgressText = document.querySelector("#progress_text");
const quizSubmit = document.querySelector("#quiz_submit");
const quizPrev = document.querySelector("#quiz_prev");
const quizNext = document.querySelector("#quiz_next");
const quizCount = document.querySelector(".quiz_question h5");
const quizAnswers = document.querySelectorAll(".quiz_question ul li");
let quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
const quizQuestionList = document.querySelector(".quiz_numbers ul");
const quizAnswersItem = document.querySelectorAll(".quiz_answer_item");
const quizTitle = document.querySelector("#quiz_title");

// Settings DOM
const openSettingsBtn = document.querySelector("#open-settings-modal");
const closeSettingsBtn = document.querySelector("#close-settings-modal");
const settingsModal = document.querySelector("#settings-modal-overlay");
const bgMusicToggle = document.querySelector("#bg-music-toggle");
const sfxToggle = document.querySelector("#sfx-toggle");

let currentIndex = null;
let listSubmit = [];
let isSubmit = false;

// Hàm random mảng
function randomArray(array) {
  return (array = array.sort(() => Math.random() - Math.random()));
}

const quiz = {
  // --- LOGIC MỚI: Tải và sắp xếp câu hỏi (Đã update chọn môn) ---
  getAndPrepareQuestions: async function () {
    try {
        // 1. Lấy tên file từ LocalStorage (do trang Menu lưu vào)
        // Nếu không có thì mặc định lấy 'questions.json'
        const fileName = localStorage.getItem('selectedSubjectFile') || 'questions.json';
        console.log("Đang tải môn học từ file:", fileName);

        // 2. Tải câu hỏi gốc từ file JSON đó
        const response = await fetch(`./${fileName}`);
        if (!response.ok) throw new Error(`Không tìm thấy file ${fileName}`);
        
        let defaultQuestions = await response.json();

        // 3. Random câu hỏi gốc (để câu hỏi mới luôn ở cuối)
        defaultQuestions = randomArray(defaultQuestions);
        // Random thứ tự đáp án của câu hỏi gốc
        defaultQuestions.forEach(q => { q.answers = randomArray(q.answers); });

        // 4. Lấy câu hỏi tự tạo từ LocalStorage
        const customQuestions = JSON.parse(localStorage.getItem('customQuestions')) || [];
        
        // 5. Nối câu hỏi tự tạo vào SAU CÙNG
        questions = defaultQuestions.concat(customQuestions);

        console.log(`Đã tải: ${defaultQuestions.length} câu gốc + ${customQuestions.length} câu mới.`);
        console.log("Tổng số câu hỏi:", questions.length);

    } catch (error) {
        alert("Lỗi tải dữ liệu: " + error);
        // Fallback: Nếu lỗi file json (ví dụ chưa tạo file môn mới) thì vẫn load câu hỏi custom
        questions = JSON.parse(localStorage.getItem('customQuestions')) || [];
    }
  },

  playSound: function(soundId) {
    let quizSettings = JSON.parse(localStorage.getItem('quizSettings')) || { 'sound-fx': false };
    if (quizSettings['sound-fx'] === true) {
        const soundElement = document.getElementById(soundId);
        if (soundElement) {
            soundElement.currentTime = 0; 
            soundElement.play();
        }
    }
  },
  
  handleSettingsModal: function() {
    if(!openSettingsBtn) return;
    openSettingsBtn.addEventListener("click", () => settingsModal.classList.add("show"));
    closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("show"));
    
    bgMusicToggle.addEventListener("change", () => {
        let settings = JSON.parse(localStorage.getItem('quizSettings')) || {};
        settings['bg-music'] = bgMusicToggle.checked;
        localStorage.setItem('quizSettings', JSON.stringify(settings));
        const bgMusic = document.getElementById('background-music-audio');
        bgMusicToggle.checked ? bgMusic.play() : bgMusic.pause();
    });

    sfxToggle.addEventListener("change", () => {
        let settings = JSON.parse(localStorage.getItem('quizSettings')) || {};
        settings['sound-fx'] = sfxToggle.checked;
        localStorage.setItem('quizSettings', JSON.stringify(settings));
    });
  },

  renderQuestionList: function () {
    let render = "";
    questions.forEach((question, index) => {
      render += `<li>${index + 1}</li>`;
    });
    quizQuestionList.innerHTML = render;
    quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
  },

  renderCurrentQuestion: function () {
    quizCount.innerText = `Question ${currentIndex + 1} of ${questions.length}`;
    quizTitle.innerText = questions[currentIndex].question;
    
    const currentQuestion = questions[currentIndex];
    
    // Reset hiển thị (ẩn hết đáp án trước khi fill data mới)
    quizAnswers.forEach(li => {
        li.style.display = 'none';
        li.classList.remove('active', 'incorrect');
    });

    // Hiển thị các đáp án có dữ liệu
    quizAnswersItem.forEach((answerSpan, index) => {
        if (currentQuestion.answers[index]) {
            answerSpan.innerText = currentQuestion.answers[index];
            answerSpan.parentElement.style.display = 'block'; 
        }
    });

    // Khôi phục trạng thái đã chọn (nếu user quay lại câu cũ)
    const selected = listSubmit[currentIndex];
    if (typeof selected !== 'undefined' && selected >= 0) {
        quizAnswers[selected].classList.add("active");
    }
    
    // Nếu đã nộp bài, hiện luôn kết quả đúng/sai
    if (isSubmit) {
       this.renderResultsForCurrentPage();
    }
  },

  renderProgress: function () {
    quizProgress.style = `stroke-dasharray: 0 9999;`;
    quizProgressText.innerText = `0/${questions.length}`;
  },
  
  renderTimer: function () {
    let quizSettings = JSON.parse(localStorage.getItem('quizSettings')) || { 'timer-enabled': false, 'total-timer': 15 };
    if (!quizSettings['timer-enabled']) {
        document.querySelector('.quiz_timer').style.display = 'none';
        return; 
    }
    var timer = 60 * (parseInt(quizSettings['total-timer']) || 15);
    let _this = this;
    var countdownElement = document.getElementById("timer");

    function updateTimer() {
        if (isSubmit) { clearInterval(intervalId); return; }
        var minutes = Math.floor(timer / 60);
        var seconds = timer % 60;
        countdownElement.innerHTML = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        timer--;
        if (timer === 20) _this.playSound("sfx-timer-warning");
        if (timer < 0) {
            countdownElement.innerHTML = "Hết giờ!";
            _this.getResults();
        }
    }
    var intervalId = setInterval(updateTimer, 1000);
  },

  // Hàm hỗ trợ tô màu đúng sai khi chuyển trang sau khi nộp
  renderResultsForCurrentPage: function() {
      if(!isSubmit) return;
      const resultObj = questions[currentIndex];
      const correctText = resultObj.answer;
      const correctIndex = resultObj.answers.indexOf(correctText);
      const userSelectedIndex = listSubmit[currentIndex];

      quizAnswers.forEach(item => item.classList.remove("active", "incorrect"));

      if (userSelectedIndex === correctIndex) {
          // Người dùng chọn đúng -> Tô xanh
          if(userSelectedIndex !== -1) quizAnswers[userSelectedIndex].classList.add("active");
      } else {
          // Người dùng chọn sai -> Tô đỏ cái sai, Tô xanh cái đúng
          if (userSelectedIndex !== undefined && userSelectedIndex !== -1) {
              quizAnswers[userSelectedIndex].classList.add("incorrect");
          }
          if(correctIndex !== -1) quizAnswers[correctIndex].classList.add("active");
      }
  },

  handleQuestionList: function () {
    quizQuestions.forEach((item, index) => {
      item.addEventListener("click", () => {
        item.scrollIntoView({ behavior: "smooth", inline: "center" });
        quizQuestions.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        currentIndex = index;
        this.renderCurrentQuestion();
      });
    });
  },

  handleAnswer: function () {
    quizAnswers.forEach((answer, index) => {
        answer.addEventListener("click", () => {
            if (isSubmit) return; // Nếu nộp bài rồi thì không cho chọn nữa

            const isAlreadyActive = answer.classList.contains("active");
            if (isAlreadyActive) {
                // Bỏ chọn (Undo)
                this.playSound("sfx-deselect");
                answer.classList.remove("active");
                quizQuestions[currentIndex].classList.remove("selected");
                listSubmit[currentIndex] = undefined;
            } else {
                // Chọn mới
                this.playSound("sfx-select");
                quizAnswers.forEach((item) => item.classList.remove("active"));
                answer.classList.add("active");
                quizQuestions[currentIndex].classList.add("selected");
                listSubmit[currentIndex] = index; 
            }
            // Cập nhật số câu đã làm
            const answeredCount = listSubmit.filter(i => i !== undefined).length;
            this.handleProgress(answeredCount);
        });
    });
  },

  handleNext: function () {
    quizNext.addEventListener("click", () => {
        this.playSound("sfx-next");
        ++currentIndex;
        if (currentIndex > questions.length - 1) currentIndex = 0;
        quizQuestions[currentIndex].click();
    });
  },
  handlePrev: function () {
    quizPrev.addEventListener("click", () => {
        this.playSound("sfx-next");
        --currentIndex;
        if (currentIndex < 0) currentIndex = questions.length - 1;
        quizQuestions[currentIndex].click();
    });
  },

  handleSubmit: function () {
    quizSubmit.addEventListener("click", () => {
        const answeredCount = listSubmit.filter(i => i !== undefined).length;
        if (answeredCount === questions.length) {
            this.playSound("sfx-quiz-complete");
            this.getResults();
        } else {
            // Cho phép nộp bài ngay cả khi chưa làm hết (tuỳ chọn)
            if(confirm(`Bạn mới làm ${answeredCount}/${questions.length} câu. Bạn có chắc muốn nộp bài không?`)) {
                 this.playSound("sfx-quiz-complete");
                 this.getResults();
            }
        }
    });
  },

  // --- SỬA LẠI HÀM getResults ---
  getResults: function () {
    // 1. Dừng timer câu hỏi (nếu có)
    if (typeof questionInterval !== 'undefined' && questionInterval) {
        clearInterval(questionInterval);
    }
    
    isSubmit = true; // Đánh dấu đã nộp bài
    
    // 2. Tính điểm
    let correct = 0;
    questions.forEach((q, index) => {
        const userChoiceIndex = listSubmit[index];
        const correctText = q.answer;
        
        if (userChoiceIndex !== undefined && q.answers[userChoiceIndex] === correctText) {
            correct++;
        } else {
            // Tô đỏ câu sai
            if(quizQuestions[index]) quizQuestions[index].classList.add("incorrect");
        }
    });
    
    // 3. Tính phần trăm
    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);

    // 4. Cập nhật số liệu lên giao diện Result
    const scoreNum = document.getElementById('score-number');
    const scorePct = document.getElementById('score-percentage');
    if (scoreNum) scoreNum.innerText = `${correct}/${total} câu`;
    if (scorePct) scorePct.innerText = `${percentage}%`;

    // 5. CẤU HÌNH NÚT "SUBMIT" THÀNH NÚT "QUAY LẠI KẾT QUẢ"
    if (quizSubmit) {
        quizSubmit.innerText = "Quay lại Kết Quả"; 
        quizSubmit.style.display = 'block';
        quizSubmit.style.pointerEvents = 'auto'; // Đảm bảo bấm được
        
        // Gán sự kiện mới: Ẩn Quiz -> Hiện Result
        quizSubmit.onclick = () => {
            document.querySelector('.quiz_wrapper').style.display = 'none';
            document.getElementById('result-box').style.display = 'flex';
        };
    }

    // 6. ẨN QUIZ - HIỆN RESULT
    const quizWrapper = document.querySelector('.quiz_wrapper');
    const resultBox = document.getElementById('result-box');
    
    if (quizWrapper) quizWrapper.style.display = 'none';
    if (resultBox) resultBox.style.display = 'flex';
    
    this.handleProgress(correct); 
  },

  start: async function () {
    let quizSettings = JSON.parse(localStorage.getItem('quizSettings')) || {};
    
    // Cài đặt âm thanh
    bgMusicToggle.checked = quizSettings['bg-music'];
    sfxToggle.checked = quizSettings['sound-fx'];
    if (quizSettings['bg-music']) {
        const bgAudio = document.getElementById('background-music-audio');
        if(bgAudio) bgAudio.play().catch(e => console.log("Cần tương tác để phát nhạc"));
    }

    // TẢI DỮ LIỆU
    await this.getAndPrepareQuestions();

    // Khởi tạo giao diện
    if (questions.length > 0) {
        currentIndex = 0;
        this.renderQuestionList();
        this.renderProgress();
        this.renderTimer();
        this.renderCurrentQuestion();
        
        this.handleQuestionList();
        this.handleAnswer();
        this.handleNext();
        this.handlePrev();
        this.handleSubmit();
        this.handleSettingsModal();

        this.handleReviewButton();
        
        // Active câu đầu tiên
        quizQuestions[0].classList.add("active");
    } else {
        quizTitle.innerText = "Không có câu hỏi nào! Hãy thêm câu hỏi hoặc kiểm tra file JSON.";
        quizSubmit.style.display = 'none';
    }
  },

  // --- XỬ LÝ NÚT XEM LẠI BÀI ---
  handleReviewButton: function() {
      const btnReview = document.getElementById('btn-review');
      if(btnReview) {
          btnReview.addEventListener('click', () => {
              // 1. Ẩn Bảng Kết Quả
              document.getElementById('result-box').style.display = 'none';

              // 2. Hiện lại Màn hình Quiz (để xem lại)
              document.querySelector('.quiz_wrapper').style.display = 'block';
              
              // 3. Render lại màu sắc câu hiện tại
              this.renderResultsForCurrentPage();
              
              // Lưu ý: Lúc này nút ở góc dưới đã biến thành "Quay lại Kết Quả" 
              // do hàm getResults phía trên đã cài đặt.
          });
      }
  },
};

// Bắt đầu ứng dụng
quiz.start();