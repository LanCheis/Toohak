if (!localStorage.getItem('currentUser')) {
    window.location.href = 'login.html';
}
const API =
  "https://script.google.com/macros/s/AKfycbwSIWBaW_QFUX2nDo2qKfqU-YaVxUX-U6Ox3xNdqv-MZwyfPDtClldyKREPc9Oc0W1Kag/exec";
// ________FAKE_DATA_______________
let questions;
// ________QUIZ_APP________________
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

// --- CÁC HẰNG SỐ CỦA BẠN (ĐÃ ĐÚNG) ---
const openSettingsBtn = document.querySelector("#open-settings-modal");
const closeSettingsBtn = document.querySelector("#close-settings-modal");
const settingsModal = document.querySelector("#settings-modal-overlay");
const bgMusicToggle = document.querySelector("#bg-music-toggle");
const sfxToggle = document.querySelector("#sfx-toggle");
// --- KẾT THÚC HẰNG SỐ ---

let currentIndex = null;
let listSubmit = []; // Lưu index đáp án đã chọn
let listResults = []; // Lưu index kết quả đúng, theo mảng đã random
let isSubmit = false;
function randomArray(array) {
  return (array = array.sort(() => Math.random() - Math.random()));
}
const quiz = {
  randomQuestions: function () {
    questions = randomArray(questions);
    questions.forEach((q) => {
      q.answers = randomArray(q.answers);
    });
  },

  // --- HÀM getQuestions CỦA BẠN (ĐÃ ĐÚNG) ---
  getQuestions: async function () {
    // Tên khóa để lưu cache
    const cacheKey = 'cachedQuestions';
    // Kiểm tra sự tồn tại của cache
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        console.log("Đã tải câu hỏi từ CACHE (LocalStorage)");
        questions = JSON.parse(cachedData);
    } else {
        // Cache null => gọi API
        console.log("Đang tải câu hỏi từ API (Lần đầu)");
        try {
            const response = await fetch(`${API}?category=english`);
            const data = await response.json();
            questions = data;
            // Lưu dữ liệu vào cache cho lần sau
            localStorage.setItem(cacheKey, JSON.stringify(data));
            console.log("Đã lưu câu hỏi vào cache");
        } catch (error) {
            alert("Da xay ra loi khi tai cau hoi");
        }
    }
  },
  getResults: async function () {
    quizSubmit.innerText = "Đang nộp bài";
    const postData = {
      category: "english",
      questions: questions,
    };
    try {
      const response = await fetch(API, {
        method: "POST",
        body: JSON.stringify(postData),
      });
      const results = await response.json();
      this.handleCheckResults(results);
      quizSubmit.innerText = "Kết quả";
      quizSubmit.style = "pointer-events:none";
    } catch (error) {
      alert("Da xay ra loi");
    }
  },

  // <-- HÀM MỚI: HỖ TRỢ PHÁT ÂM THANH -->
  playSound: function(soundId) {
    let quizSettings = JSON.parse(localStorage.getItem('quizSettings'));
    if (quizSettings && quizSettings['sound-fx'] === true) {
        const soundElement = document.getElementById(soundId);
        if (soundElement) {
            soundElement.currentTime = 0; 
            soundElement.play();
        }
    }
  },
  
  // <-- HÀM MỚI: XỬ LÝ MODAL CÀI ĐẶT -->
  handleSettingsModal: function() {
    // Mở Modal
    openSettingsBtn.addEventListener("click", () => {
        settingsModal.classList.add("show");
    });

    // Đóng Modal
    closeSettingsBtn.addEventListener("click", () => {
        settingsModal.classList.remove("show");
    });
    
    // Xử lý Bật/Tắt Nhạc nền
    bgMusicToggle.addEventListener("change", () => {
        const isChecked = bgMusicToggle.checked;
        let settings = JSON.parse(localStorage.getItem('quizSettings'));
        settings['bg-music'] = isChecked;
        localStorage.setItem('quizSettings', JSON.stringify(settings));

        const bgMusic = document.getElementById('background-music-audio');
        if (isChecked) {
            bgMusic.play();
        } else {
            bgMusic.pause();
        }
    });

    // Xử lý Bật/Tắt SFX
    sfxToggle.addEventListener("change", () => {
        const isChecked = sfxToggle.checked;
        let settings = JSON.parse(localStorage.getItem('quizSettings'));
        settings['sound-fx'] = isChecked;
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
    // THÊM LOGIC ẨN/HIỆN ĐÁP ÁN
    const currentQuestion = questions[currentIndex];
    quizAnswers.forEach(li => li.style.display = 'none'); // Ẩn tất cả
    
    quizAnswersItem.forEach((answer, index) => {
        if (currentQuestion.answers[index]) {
            answer.innerText = currentQuestion.answers[index];
            answer.parentElement.style.display = 'block'; // Hiển thị li (cha)
        }
    });
  },
  renderProgress: function () {
    quizProgress.style = `stroke-dasharray: 0 9999;`;
    quizProgressText.innerText = `0/${questions.length}`;
  },
  
  // HÀM renderTimer
  renderTimer: function () {
    let quizSettings = JSON.parse(localStorage.getItem('quizSettings'));
    if (!quizSettings) {
        quizSettings = { 'timer-enabled': false, 'total-timer': 15 };
    }
    if (quizSettings['timer-enabled'] === false) {
        document.querySelector('.quiz_timer').style.display = 'none';
        return; 
    }
    var timer = 60 * (parseInt(quizSettings['total-timer']) || 15);
    let _this = this;
    var countdownElement = document.getElementById("timer");

    function updateTimer() {
        var minutes = Math.floor(timer / 60);
        var seconds = timer % 60;
        var timerString = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        countdownElement.innerHTML = timerString;
        timer--;

        if (timer === 20 && !isSubmit) { 
            _this.playSound("sfx-timer-warning");
        }

        if (timer < 0) {
            countdownElement.innerHTML = "Hết thời gian!";
            _this.getResults();
        }
        if (isSubmit) {
            clearInterval(intervalId);
        }
    }
    var intervalId = setInterval(updateTimer, 1000);
  },
  renderResults: function () {
    if (listResults[currentIndex] === listSubmit[currentIndex]) {
      quizAnswers.forEach((item) => {
        item.classList.remove("incorrect");
      });
      quizAnswers[listResults[currentIndex]].classList.add("active");
    } else {
      quizAnswers.forEach((item) => {
        item.classList.remove("active");
        item.classList.remove("incorrect");
      });
      quizAnswers[listResults[currentIndex]].classList.add("active");
      quizAnswers[listSubmit[currentIndex]].classList.add("incorrect");
    }
  },
  handleProgress: function (correct) {
    const r = quizProgress.getAttribute("r");
    if (!isSubmit) {
      const progressLen = listSubmit.filter((item) => typeof item !== 'undefined' && item >= 0);
      quizProgress.style = `stroke-dasharray: ${
        (2 * Math.PI * r * progressLen.length) / questions.length
      } 9999;`;
      quizProgressText.innerText = `${progressLen.length}/${questions.length}`;
    } else {
      quizProgress.style = `stroke-dasharray: ${
        (2 * Math.PI * r * correct) / questions.length
      } 9999;`;
      quizProgressText.innerText = `${correct}/${questions.length}`;
    }
  },
  handleQuestionList: function () {
    quizQuestions.forEach((item, index) => {
      item.addEventListener("click", () => {
        item.scrollIntoView({
          behavior: "smooth",
          inline: "center",
        });
        quizQuestions.forEach((item) => item.classList.remove("active"));
        item.classList.add("active");
        currentIndex = index;
        this.renderCurrentQuestion();
        quizAnswers.forEach((item) => item.classList.remove("active"));
        const selected = listSubmit[currentIndex];

        if (typeof selected !== 'undefined' && selected >= 0) {
            quizAnswers[selected].classList.add("active");
        }
        if (isSubmit) {
          this.renderResults();
        }
      });
    });
    quizQuestions[0].click();
  },

  // HÀM handleAnswer
  handleAnswer: function () {
    quizAnswers.forEach((answer, index) => {
        answer.addEventListener("click", () => {
            if (isSubmit) return; 

            const isAlreadyActive = answer.classList.contains("active");

            if (isAlreadyActive) {
                // LOGIC BỎ CHỌN (UNDO)
                this.playSound("sfx-deselect");
                answer.classList.remove("active");
                quizQuestions[currentIndex].classList.remove("selected");
                listSubmit[currentIndex] = undefined; // <-- Xóa lựa chọn
            } else {
                // LOGIC CHỌN MỚI
                this.playSound("sfx-select");
                quizAnswers.forEach((item) => item.classList.remove("active"));
                answer.classList.add("active");
                quizQuestions[currentIndex].classList.add("selected");
                listSubmit[currentIndex] = index; // <-- Lưu lựa chọn
            }
            
            console.log(listSubmit);
            this.handleProgress();
        });
    });
  },

  // HÀM handleNext/handlePrev
  handleNext: function () {
    quizNext.addEventListener("click", () => {
        this.playSound("sfx-next");
        ++currentIndex;
        if (currentIndex > questions.length - 1) {
            currentIndex = 0;
        }
        quizQuestions[currentIndex].click();
    });
  },
  handlePrev: function () {
    quizPrev.addEventListener("click", () => {
        this.playSound("sfx-next");
        --currentIndex;
        if (currentIndex < 0) {
            currentIndex = questions.length - 1;
        }
        quizQuestions[currentIndex].click();
    });
  },

  // HÀM handleSubmit
  handleSubmit: function () {
    quizSubmit.addEventListener("click", () => {
        const progressLen = listSubmit.filter((item) => typeof item !== 'undefined' && item >= 0);
        
        if (progressLen.length === questions.length) {
            this.playSound("sfx-quiz-complete");
            this.getResults();
        } else {
            alert("Bạn chưa chọn hết đáp án");
        }
    });
  },
  handleCheckResults: function (results) {
    let correct = 0;
    questions.forEach((item, index) => {
      const result = results.find((r) => r.quiz_id === item.quiz_id);
      if (item.answers[listSubmit[index]] === result.answer) {
        listResults[index] = listSubmit[index];
        correct++;
      } else {
        quizQuestions[index].classList.add("incorrect");
        listResults[index] = item.answers.indexOf(result.answer);
      }
    });
    isSubmit = true;
    this.handleProgress(correct);
    quizQuestions[0].click();
  },
  handleKeyDown: function () {
    document.addEventListener("keydown", (e) => {
      console.log(e.key);
      switch (e.key) {
        case "ArrowRight":
          return quizNext.click();
        case "ArrowLeft":
          return quizPrev.click();
        default:
          return false;
      }
    });
  },
  render: function () {
    this.renderQuestionList();
    this.renderProgress();
    this.renderTimer();
  },

  // HÀM handle
  handle: function () {
    this.handleQuestionList();
    this.handleAnswer();
    this.handleNext();
    this.handlePrev();
    this.handleKeyDown();
    this.handleSubmit();
    this.handleSettingsModal();
  },

  // HÀM start
  start: async function () {
    let quizSettings = JSON.parse(localStorage.getItem('quizSettings'));
    if (!quizSettings) {
        quizSettings = {
            'bg-music': false, 'sound-fx': false, 'timer-enabled': false,
            'question-count': 5, 'total-timer': 15, 'avatar-url': ''
        };
    }

    // ĐỒNG BỘ TOGGLE VÀ BẬT NHẠC
    bgMusicToggle.checked = quizSettings['bg-music'];
    sfxToggle.checked = quizSettings['sound-fx'];
    if (quizSettings['bg-music'] === true) {
        document.getElementById('background-music-audio').play();
    }
    
    await this.getQuestions();

    // KIỂM TRA CACHE HỎNG
    if (!questions || questions.length === 0) {
        alert("Lỗi tải câu hỏi. Đang thử xóa cache và tải lại...");
        localStorage.removeItem('cachedQuestions'); // Tự động xóa cache hỏng
        await this.getQuestions(); // Thử tải lại
        if (!questions || questions.length === 0) {
            alert("Không thể tải câu hỏi. Vui lòng kiểm tra API hoặc file JSON.");
            return;
        }
    }

    this.randomQuestions();

    const numberOfQuestions = parseInt(quizSettings['question-count']) || 5;
    questions = questions.slice(0, numberOfQuestions);

    this.render();
    this.handle();
  },
  
};
quiz.start();