/* ==========================================================================
   1. AUTHENTICATION & GLOBAL STATE (Xác thực & Biến toàn cục)
   ========================================================================== */

// Kiểm tra đăng nhập: Nếu chưa có tên -> Đá về trang Login
if (!localStorage.getItem('currentUser')) {
    window.location.href = 'index.html';
}

// Biến lưu dữ liệu
let questions = [];       // Danh sách câu hỏi
let currentIndex = null;  // Chỉ số câu hỏi hiện tại
let listSubmit = [];      // Mảng lưu đáp án người dùng chọn
let isSubmit = false;     // Trạng thái: Đã nộp bài hay chưa
let questionInterval = null; // Timer cho từng câu hỏi

// Hàm tiện ích: Trộn ngẫu nhiên mảng
function randomArray(array) {
    return (array = array.sort(() => Math.random() - Math.random()));
}


/* ==========================================================================
   2. DOM ELEMENTS (Lấy các phần tử HTML)
   ========================================================================== */

// Khu vực Quiz
const quizTimer = document.querySelector("#timer");
const quizProgress = document.querySelector("#progress");
const quizProgressText = document.querySelector("#progress_text");
const quizSubmit = document.querySelector("#quiz_submit");
const quizPrev = document.querySelector("#quiz_prev");
const quizNext = document.querySelector("#quiz_next");
const quizCount = document.querySelector(".quiz_question h5");
const quizAnswers = document.querySelectorAll(".quiz_question ul li");
let quizQuestions = document.querySelectorAll(".quiz_numbers ul li"); // NodeList này sẽ update lại
const quizQuestionList = document.querySelector(".quiz_numbers ul");
const quizAnswersItem = document.querySelectorAll(".quiz_answer_item");
const quizTitle = document.querySelector("#quiz_title");
const quizWrapper = document.querySelector('.quiz_wrapper');
const resultBox = document.getElementById('result-box');

// Khu vực Settings & Modal
const openSettingsBtn = document.querySelector("#open-settings-modal");
const closeSettingsBtn = document.querySelector("#close-settings-modal");
const settingsModal = document.querySelector("#settings-modal-overlay");
const bgMusicToggle = document.querySelector("#bg-music-toggle");
const sfxToggle = document.querySelector("#sfx-toggle");
const perQTimerToggle = document.querySelector("#per-question-timer");


/* ==========================================================================
   3. QUIZ APPLICATION OBJECT
   ========================================================================== */

const quiz = {

    // ----------------------------------------------------------------------
    // A. DATA HANDLING (Xử lý dữ liệu)
    // ----------------------------------------------------------------------

    // Tải câu hỏi từ file JSON và LocalStorage
    getAndPrepareQuestions: async function () {
        try {
            // 1. Lấy tên file từ bộ nhớ (do Menu chọn), mặc định questions.json
            const fileName = localStorage.getItem('selectedSubjectFile') || 'questions.json';
            console.log("Đang tải dữ liệu từ:", fileName);

            // 2. Fetch dữ liệu gốc
            const response = await fetch(`./${fileName}`);
            if (!response.ok) throw new Error(`Không tìm thấy file ${fileName}`);
            let defaultQuestions = await response.json();

            // 3. Random câu hỏi gốc và đáp án
            defaultQuestions = randomArray(defaultQuestions);
            defaultQuestions.forEach(q => { q.answers = randomArray(q.answers); });

            // 4. Lấy câu hỏi tự tạo (Custom Questions)
            const customQuestions = JSON.parse(localStorage.getItem('customQuestions')) || [];

            // 5. Gộp lại: Câu hỏi gốc trước, câu hỏi tự tạo sau
            questions = defaultQuestions.concat(customQuestions);

            console.log(`Đã tải: ${defaultQuestions.length} câu gốc + ${customQuestions.length} câu mới.`);

        } catch (error) {
            alert("Lỗi tải dữ liệu: " + error);
            // Fallback: Chỉ tải câu hỏi tự tạo nếu file lỗi
            questions = JSON.parse(localStorage.getItem('customQuestions')) || [];
        }
    },

    // Phát âm thanh (nếu được bật trong cài đặt)
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


    // ----------------------------------------------------------------------
    // B. UI RENDERING (Hiển thị giao diện)
    // ----------------------------------------------------------------------

    // Vẽ danh sách số câu hỏi (1, 2, 3...) ở dưới cùng
    renderQuestionList: function () {
        let render = "";
        questions.forEach((question, index) => {
            render += `<li>${index + 1}</li>`;
        });
        quizQuestionList.innerHTML = render;
        // Cập nhật lại NodeList sau khi render HTML mới
        quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
    },

    // Hiển thị nội dung câu hỏi hiện tại
    renderCurrentQuestion: function () {
        // Cập nhật số thứ tự và nội dung
        quizCount.innerText = `Question ${currentIndex + 1} of ${questions.length}`;
        quizTitle.innerText = questions[currentIndex].question;
        
        const currentQuestion = questions[currentIndex];
        
        // Reset giao diện đáp án: Ẩn hết trước
        quizAnswers.forEach(li => {
            li.style.display = 'none';
            li.classList.remove('active', 'incorrect');
        });

        // Chỉ hiện các đáp án có dữ liệu
        quizAnswersItem.forEach((answerSpan, index) => {
            if (currentQuestion.answers[index]) {
                answerSpan.innerText = currentQuestion.answers[index];
                answerSpan.parentElement.style.display = 'block'; 
            }
        });

        // Khôi phục lựa chọn cũ (nếu user quay lại câu đã làm)
        const selected = listSubmit[currentIndex];
        if (typeof selected !== 'undefined' && selected >= 0) {
            quizAnswers[selected].classList.add("active");
        }
        
        // Nếu đã nộp bài: Hiển thị màu đúng/sai ngay lập tức
        if (isSubmit) {
           this.renderResultsForCurrentPage();
        }
    },

    // Hiển thị thanh tiến độ (Vòng tròn)
    renderProgress: function () {
        // Mặc định ban đầu là 0
        quizProgress.style = `stroke-dasharray: 0 9999;`;
        quizProgressText.innerText = `0/${questions.length}`;
    },
    
    // Logic Timer tổng (Đếm ngược toàn bài)
    renderTimer: function () {
        let quizSettings = JSON.parse(localStorage.getItem('quizSettings')) || { 'timer-enabled': false, 'total-timer': 15 };
        
        // Nếu tắt timer thì ẩn đi
        if (!quizSettings['timer-enabled']) {
            document.querySelector('.quiz_timer').style.display = 'none';
            return; 
        }

        var timer = 60 * (parseInt(quizSettings['total-timer']) || 15);
        let _this = this;
        var countdownElement = document.getElementById("timer");

        function updateTimer() {
            if (isSubmit) { clearInterval(intervalId); return; } // Dừng nếu đã nộp
            
            var minutes = Math.floor(timer / 60);
            var seconds = timer % 60;
            countdownElement.innerHTML = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
            timer--;

            // Cảnh báo khi còn 20 giây
            if (timer === 20) _this.playSound("sfx-timer-warning");
            
            // Hết giờ -> Tự động nộp bài
            if (timer < 0) {
                countdownElement.innerHTML = "Hết giờ!";
                _this.getResults();
            }
        }
        var intervalId = setInterval(updateTimer, 1000);
    },

    // Logic Timer từng câu (30s)
    startQuestionTimer: function() {
        // DOM hiển thị timer câu hỏi
        const questionTimerDisplay = document.querySelector("#q-timer");
        
        // 1. Xóa timer cũ nếu có
        if (questionInterval) clearInterval(questionInterval);
        
        // 2. Kiểm tra cài đặt
        let quizSettings = JSON.parse(localStorage.getItem('quizSettings')) || {};
        if (!quizSettings['per-question-timer']) {
            if(questionTimerDisplay) questionTimerDisplay.style.display = 'none';
            return;
        }
  
        // 3. Bắt đầu đếm ngược 30s
        if(questionTimerDisplay) {
            questionTimerDisplay.style.display = 'block';
            let timeLeft = 30;
            questionTimerDisplay.innerText = `⏳ ${timeLeft}s`;
  
            questionInterval = setInterval(() => {
                timeLeft--;
                questionTimerDisplay.innerText = `⏳ ${timeLeft}s`;
                
                if (timeLeft <= 0) {
                    clearInterval(questionInterval);
                    // Hết giờ -> Tự động chuyển câu
                    this.playSound("sfx-next"); 
                    this.handleNextClickLogic(); // Gọi hàm chuyển câu
                }
            }, 1000);
        }
    },

    // Hỗ trợ tô màu đúng/sai khi đang xem lại bài (Review Mode)
    renderResultsForCurrentPage: function() {
        if(!isSubmit) return;
        
        const resultObj = questions[currentIndex];
        const correctText = resultObj.answer; // Text đáp án đúng
        const correctIndex = resultObj.answers.indexOf(correctText); // Vị trí đáp án đúng
        const userSelectedIndex = listSubmit[currentIndex]; // Vị trí user chọn

        // Xóa class cũ
        quizAnswers.forEach(item => item.classList.remove("active", "incorrect"));

        if (userSelectedIndex === correctIndex) {
            // User chọn ĐÚNG: Tô xanh cái đã chọn
            if(userSelectedIndex !== -1) quizAnswers[userSelectedIndex].classList.add("active");
        } else {
            // User chọn SAI: Tô đỏ cái chọn, Tô xanh cái đúng
            if (userSelectedIndex !== undefined && userSelectedIndex !== -1) {
                quizAnswers[userSelectedIndex].classList.add("incorrect");
            }
            if(correctIndex !== -1) quizAnswers[correctIndex].classList.add("active");
        }
    },


    // ----------------------------------------------------------------------
    // C. EVENT HANDLERS (Xử lý sự kiện)
    // ----------------------------------------------------------------------

    // Xử lý khi click vào số câu hỏi bên dưới
    handleQuestionList: function () {
        quizQuestions.forEach((item, index) => {
            item.addEventListener("click", () => {
                // --- THÊM DÒNG NÀY ĐỂ CÓ ÂM THANH ---
                this.playSound("sfx-next"); 

                item.scrollIntoView({ behavior: "smooth", inline: "center" });
                
                // Highlight số câu đang chọn
                quizQuestions.forEach((i) => i.classList.remove("active"));
                item.classList.add("active");
                
                // Chuyển câu hỏi
                currentIndex = index;
                this.renderCurrentQuestion();
                
                // Reset Timer cho câu mới (nếu đang bật)
                if(!isSubmit) this.startQuestionTimer();
            });
        });
    },

    // Xử lý khi chọn đáp án
    handleAnswer: function () {
        quizAnswers.forEach((answer, index) => {
            answer.addEventListener("click", () => {
                if (isSubmit) return; // Nếu nộp rồi thì khóa chọn

                const isAlreadyActive = answer.classList.contains("active");
                
                if (isAlreadyActive) {
                    // Logic: Bỏ chọn (Undo)
                    this.playSound("sfx-deselect");
                    answer.classList.remove("active");
                    quizQuestions[currentIndex].classList.remove("selected");
                    listSubmit[currentIndex] = undefined;
                } else {
                    // Logic: Chọn mới
                    this.playSound("sfx-select");
                    quizAnswers.forEach((item) => item.classList.remove("active")); // Bỏ chọn cái khác
                    answer.classList.add("active");
                    quizQuestions[currentIndex].classList.add("selected");
                    listSubmit[currentIndex] = index; 
                }
                
                // Cập nhật thanh progress
                const answeredCount = listSubmit.filter(i => i !== undefined).length;
                this.handleProgress(answeredCount);
            });
        });
    },

    // Hàm logic chung cho việc chuyển câu tiếp theo
    handleNextClickLogic: function() {
        ++currentIndex;
        if (currentIndex > questions.length - 1) currentIndex = 0; // Loop về đầu
        quizQuestions[currentIndex].click();
    },

    // Xử lý nút Next
    handleNext: function () {
        quizNext.addEventListener("click", () => {
            this.playSound("sfx-next");
            this.handleNextClickLogic();
        });
    },

    // Xử lý nút Prev
    handlePrev: function () {
        quizPrev.addEventListener("click", () => {
            this.playSound("sfx-next");
            --currentIndex;
            if (currentIndex < 0) currentIndex = questions.length - 1; // Loop về cuối
            quizQuestions[currentIndex].click();
        });
    },

    // Xử lý nút Nộp bài (Submit)
    handleSubmit: function () {
        quizSubmit.addEventListener("click", () => {
            // --- Không chạy logic nộp nếu đã nộp bài ---
            if (isSubmit) return; 

            const answeredCount = listSubmit.filter(i => i !== undefined).length;
            
            // Nếu đã làm hết
            if (answeredCount === questions.length) {
                this.playSound("sfx-quiz-complete");
                this.getResults();
            } else {
                // Nếu chưa làm hết -> Hỏi xác nhận
                if(confirm(`Bạn mới làm ${answeredCount}/${questions.length} câu. Bạn có chắc muốn nộp bài không?`)) {
                     this.playSound("sfx-quiz-complete");
                     this.getResults();
                }
            }
        });
    },

    // Xử lý logic Modal Cài đặt (Bật/Tắt ngay trong Quiz)
    handleSettingsModal: function() {
        if(!openSettingsBtn) return;
        
        // Mở/Đóng Modal
        openSettingsBtn.addEventListener("click", () => settingsModal.classList.add("show"));
        closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("show"));
        
        // Xử lý sự kiện Toggle
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

        // Toggle Timer từng câu
        if(perQTimerToggle) {
            perQTimerToggle.addEventListener("change", () => {
                let settings = JSON.parse(localStorage.getItem('quizSettings')) || {};
                settings['per-question-timer'] = perQTimerToggle.checked;
                localStorage.setItem('quizSettings', JSON.stringify(settings));
                
                // Nếu bật thì chạy ngay, tắt thì ẩn
                if(perQTimerToggle.checked) this.startQuestionTimer();
                else {
                    if(questionInterval) clearInterval(questionInterval);
                    const qTimer = document.querySelector("#q-timer");
                    if(qTimer) qTimer.style.display = 'none';
                }
            });
        }
    },

    // Xử lý nút "Xem lại bài" trong bảng kết quả
    handleReviewButton: function() {
        const btnReview = document.getElementById('btn-review');
        if(btnReview) {
            btnReview.addEventListener('click', () => {
                // 1. Ẩn Bảng Kết Quả
                resultBox.style.display = 'none';

                // 2. Hiện lại Màn hình Quiz (Review Mode)
                quizWrapper.style.display = 'block';
                
                // 3. Render lại màu sắc câu hiện tại
                this.renderResultsForCurrentPage();
            });
        }
    },


    // ----------------------------------------------------------------------
    // D. RESULT & CALCULATION (Tính điểm & Kết quả)
    // ----------------------------------------------------------------------

    // Hàm cập nhật thanh Progress Bar
    handleProgress: function (count) {
        const r = quizProgress.getAttribute("r");
        const val = (2 * Math.PI * r * count) / questions.length;
        quizProgress.style = `stroke-dasharray: ${val} 9999;`;
        quizProgressText.innerText = `${count}/${questions.length}`;
    },

    // Hàm Tính điểm & Hiển thị Bảng Kết Quả
    getResults: function () {
        // Dừng timer câu hỏi (nếu có)
        if (typeof questionInterval !== 'undefined' && questionInterval) {
            clearInterval(questionInterval);
        }
        
        isSubmit = true; // Flag đã nộp bài
        
        // 1. Tính số câu đúng
        let correct = 0;
        questions.forEach((q, index) => {
            const userChoiceIndex = listSubmit[index];
            const correctText = q.answer;
            
            if (userChoiceIndex !== undefined && q.answers[userChoiceIndex] === correctText) {
                correct++;
            } else {
                // Đánh dấu đỏ lên thanh số câu hỏi
                if(quizQuestions[index]) quizQuestions[index].classList.add("incorrect");
            }
        });
        
        // 2. Tính phần trăm
        const total = questions.length;
        const percentage = Math.round((correct / total) * 100);

        // 3. Hiển thị dữ liệu lên Bảng Kết Quả
        const scoreNum = document.getElementById('score-number');
        const scorePct = document.getElementById('score-percentage');
        if (scoreNum) scoreNum.innerText = `${correct}/${total} câu`;
        if (scorePct) scorePct.innerText = `${percentage}%`;

        // 4. Cấu hình lại nút SUBMIT thành nút "Quay lại Kết Quả"
        // Để khi đang xem lại bài, bấm nút này sẽ về lại bảng điểm
        if (quizSubmit) {
            quizSubmit.innerText = "Quay lại Kết Quả"; 
            quizSubmit.style.display = 'block';
            quizSubmit.style.pointerEvents = 'auto'; 
            
            quizSubmit.onclick = () => {
                quizWrapper.style.display = 'none';
                resultBox.style.display = 'flex';
            };
        }

        // 5. Chuyển đổi màn hình: Ẩn Quiz -> Hiện Result
        quizWrapper.style.display = 'none';
        resultBox.style.display = 'flex';
        
        // Cập nhật progress lần cuối cho đúng số liệu
        this.handleProgress(correct); 
    },


    // ----------------------------------------------------------------------
    // E. INITIALIZATION (Khởi chạy ứng dụng)
    // ----------------------------------------------------------------------

    start: async function () {
        let quizSettings = JSON.parse(localStorage.getItem('quizSettings')) || {};
        
        // --- 1. Áp dụng Cài đặt ---
        bgMusicToggle.checked = quizSettings['bg-music'];
        sfxToggle.checked = quizSettings['sound-fx'];
        if(perQTimerToggle) perQTimerToggle.checked = quizSettings['per-question-timer'];

        if (quizSettings['bg-music']) {
            const bgAudio = document.getElementById('background-music-audio');
            if(bgAudio) bgAudio.play().catch(e => console.log("Cần tương tác để phát nhạc"));
        }

        // --- 2. Tải & Chuẩn bị câu hỏi ---
        await this.getAndPrepareQuestions();

        // --- 3. Giới hạn số câu hỏi (Theo cài đặt) ---
        const limit = parseInt(quizSettings['question-count']) || 5;
        console.log(`Đang thi với giới hạn: ${limit} câu.`);
        
        if (questions.length > limit) {
            questions = questions.slice(0, limit);
        }

        // --- 4. Render Giao diện & Gắn sự kiện ---
        if (questions.length > 0) {
            currentIndex = 0;
            this.renderQuestionList();
            this.renderProgress();
            this.renderTimer();
            this.renderCurrentQuestion(); // Sẽ gọi startQuestionTimer bên trong nếu cần
            if(!isSubmit) this.startQuestionTimer(); // Gọi lần đầu
            
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
            quizTitle.innerText = "Không có câu hỏi nào!";
            quizSubmit.style.display = 'none';
        }
    },
};

// --- CHẠY ỨNG DỤNG ---
quiz.start();