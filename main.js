/* ==========================================================================
   1. AUTHENTICATION & GLOBAL STATE
   ========================================================================== */
if (!localStorage.getItem('currentUser')) {
    window.location.href = 'index.html';
}

let questions = [];
let currentIndex = null;
let listSubmit = [];
let isSubmit = false;

function randomArray(array) {
    return (array = array.sort(() => Math.random() - Math.random()));
}

/* ==========================================================================
   2. DOM ELEMENTS
   ========================================================================== */
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
const quizWrapper = document.querySelector('.quiz_wrapper');
const resultBox = document.getElementById('result-box');

// Settings DOM
const openSettingsBtn = document.querySelector("#open-settings-modal");
const closeSettingsBtn = document.querySelector("#close-settings-modal");
const settingsModal = document.querySelector("#settings-modal-overlay");
const bgMusicToggle = document.querySelector("#bg-music-toggle");
const bgVolumeSlider = document.querySelector("#bg-volume-slider");
const sfxToggle = document.querySelector("#sfx-toggle");

/* ==========================================================================
   3. QUIZ APPLICATION OBJECT
   ========================================================================== */
const quiz = {

    getAndPrepareQuestions: async function () {
        try {
            const fileName = localStorage.getItem('selectedSubjectFile') || 'questions.json';
            const response = await fetch(`./${fileName}`);
            if (!response.ok) throw new Error(`Không tìm thấy file ${fileName}`);
            let defaultQuestions = await response.json();

            defaultQuestions = randomArray(defaultQuestions);
            defaultQuestions.forEach(q => { q.answers = randomArray(q.answers); });

            const customQuestions = JSON.parse(localStorage.getItem('customQuestions')) || [];
            questions = defaultQuestions.concat(customQuestions);

        } catch (error) {
            alert("Lỗi tải dữ liệu: " + error);
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
        
        quizAnswers.forEach(li => {
            li.style.display = 'none';
            li.classList.remove('active', 'incorrect');
        });

        quizAnswersItem.forEach((answerSpan, index) => {
            if (currentQuestion.answers[index]) {
                answerSpan.innerText = currentQuestion.answers[index];
                answerSpan.parentElement.style.display = 'block'; 
            }
        });

        const selected = listSubmit[currentIndex];
        if (typeof selected !== 'undefined' && selected >= 0) {
            quizAnswers[selected].classList.add("active");
        }
        
        if (isSubmit) {
           this.renderResultsForCurrentPage();
        }
    },

    renderProgress: function () {
        quizProgress.style = `stroke-dasharray: 0 9999;`;
        quizProgressText.innerText = `0/${questions.length}`;
    },
    
    // --- LOGIC TIMER MỚI ---
    renderTimer: function () {
        let quizSettings = JSON.parse(localStorage.getItem('quizSettings')) || { 'timer-enabled': false };
        
        // Nếu người dùng tắt timer tổng thì ẩn đi
        if (!quizSettings['timer-enabled']) {
            document.querySelector('.quiz_timer').style.display = 'none';
            return; 
        }

        // --- CÔNG THỨC TÍNH GIỜ MỚI ---
        // (Số câu hỏi * 30 giây) + 30 giây bù giờ
        // Ví dụ: 5 câu -> (5 * 30) + 30 = 180 giây = 3 phút
        var timer = (questions.length * 30) + 30;

        let _this = this;
        var countdownElement = document.getElementById("timer");

        function updateTimer() {
            if (isSubmit) { clearInterval(intervalId); return; }
            
            var minutes = Math.floor(timer / 60);
            var seconds = timer % 60;
            // Hiển thị dạng MM:SS
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

    renderResultsForCurrentPage: function() {
        if(!isSubmit) return;
        const resultObj = questions[currentIndex];
        const correctText = resultObj.answer;
        const correctIndex = resultObj.answers.indexOf(correctText);
        const userSelectedIndex = listSubmit[currentIndex];

        quizAnswers.forEach(item => item.classList.remove("active", "incorrect"));

        if (userSelectedIndex === correctIndex) {
            if(userSelectedIndex !== -1) quizAnswers[userSelectedIndex].classList.add("active");
        } else {
            if (userSelectedIndex !== undefined && userSelectedIndex !== -1) {
                quizAnswers[userSelectedIndex].classList.add("incorrect");
            }
            if(correctIndex !== -1) quizAnswers[correctIndex].classList.add("active");
        }
    },

    // --- EVENT HANDLERS ---
    handleQuestionList: function () {
        quizQuestions.forEach((item, index) => {
            item.addEventListener("click", () => {
                this.playSound("sfx-next");
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
                if (isSubmit) return;

                const isAlreadyActive = answer.classList.contains("active");
                if (isAlreadyActive) {
                    this.playSound("sfx-deselect");
                    answer.classList.remove("active");
                    quizQuestions[currentIndex].classList.remove("selected");
                    listSubmit[currentIndex] = undefined;
                } else {
                    this.playSound("sfx-select");
                    quizAnswers.forEach((item) => item.classList.remove("active"));
                    answer.classList.add("active");
                    quizQuestions[currentIndex].classList.add("selected");
                    listSubmit[currentIndex] = index; 
                }
                const answeredCount = listSubmit.filter(i => i !== undefined).length;
                this.handleProgress(answeredCount);
            });
        });
    },

    handleNextClickLogic: function() {
        ++currentIndex;
        if (currentIndex > questions.length - 1) currentIndex = 0; 
        quizQuestions[currentIndex].click();
    },

    handleNext: function () {
        quizNext.addEventListener("click", () => {
            this.playSound("sfx-next");
            this.handleNextClickLogic();
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
            if (isSubmit) return; 
            const answeredCount = listSubmit.filter(i => i !== undefined).length;
            if (answeredCount === questions.length) {
                this.playSound("sfx-quiz-complete");
                this.getResults();
            } else {
                if(confirm(`Bạn mới làm ${answeredCount}/${questions.length} câu. Nộp bài?`)) {
                     this.playSound("sfx-quiz-complete");
                     this.getResults();
                }
            }
        });
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

        if(bgVolumeSlider) {
            bgVolumeSlider.addEventListener("input", () => {
                let settings = JSON.parse(localStorage.getItem('quizSettings')) || {};
                const vol = parseFloat(bgVolumeSlider.value);
                settings['volume'] = vol;
                localStorage.setItem('quizSettings', JSON.stringify(settings));
                
                const bgMusic = document.getElementById('background-music-audio');
                if(bgMusic) bgMusic.volume = vol;
            });
        }

        sfxToggle.addEventListener("change", () => {
            let settings = JSON.parse(localStorage.getItem('quizSettings')) || {};
            settings['sound-fx'] = sfxToggle.checked;
            localStorage.setItem('quizSettings', JSON.stringify(settings));
        });
    },

    handleReviewButton: function() {
        const btnReview = document.getElementById('btn-review');
        if(btnReview) {
            btnReview.addEventListener('click', () => {
                resultBox.style.display = 'none';
                quizWrapper.style.display = 'block';
                this.renderResultsForCurrentPage();
            });
        }
    },

    handleProgress: function (count) {
        const r = quizProgress.getAttribute("r");
        const val = (2 * Math.PI * r * count) / questions.length;
        quizProgress.style = `stroke-dasharray: ${val} 9999;`;
        quizProgressText.innerText = `${count}/${questions.length}`;
    },

    getResults: function () {
        isSubmit = true; 
        
        let correct = 0;
        questions.forEach((q, index) => {
            const userChoiceIndex = listSubmit[index];
            const correctText = q.answer;
            if (userChoiceIndex !== undefined && q.answers[userChoiceIndex] === correctText) {
                correct++;
            } else {
                if(quizQuestions[index]) quizQuestions[index].classList.add("incorrect");
            }
        });
        
        const total = questions.length;
        const percentage = Math.round((correct / total) * 100);

        const scoreNum = document.getElementById('score-number');
        const scorePct = document.getElementById('score-percentage');
        if (scoreNum) scoreNum.innerText = `${correct}/${total} câu`;
        if (scorePct) scorePct.innerText = `${percentage}%`;

        if (quizSubmit) {
            quizSubmit.innerText = "Quay lại Kết Quả"; 
            quizSubmit.style.display = 'block';
            quizSubmit.style.pointerEvents = 'auto'; 
            quizSubmit.onclick = () => {
                quizWrapper.style.display = 'none';
                resultBox.style.display = 'flex';
            };
        }

        quizWrapper.style.display = 'none';
        resultBox.style.display = 'flex';
        this.handleProgress(correct); 
    },

    start: async function () {
        let quizSettings = JSON.parse(localStorage.getItem('quizSettings')) || {};
        
        // Load Settings
        bgMusicToggle.checked = quizSettings['bg-music'];
        sfxToggle.checked = quizSettings['sound-fx'];
        
        const initialVol = (typeof quizSettings['volume'] !== 'undefined') ? quizSettings['volume'] : 0.5;
        if(bgVolumeSlider) bgVolumeSlider.value = initialVol;

        const bgAudio = document.getElementById('background-music-audio');
        if (bgAudio) {
            bgAudio.volume = initialVol;
            const savedTime = parseFloat(localStorage.getItem('bgMusicTime'));
            if (savedTime && !isNaN(savedTime)) {
                bgAudio.currentTime = savedTime; 
            }
            if (quizSettings['bg-music']) {
                bgAudio.play().catch(e => console.log("Cần tương tác để phát nhạc"));
            }
        }
        
        window.addEventListener('beforeunload', () => {
            if (bgAudio && !bgAudio.paused) {
                localStorage.setItem('bgMusicTime', bgAudio.currentTime);
            }
        });

        await this.getAndPrepareQuestions();

        const limit = parseInt(quizSettings['question-count']) || 5;
        console.log(`Đang thi với giới hạn: ${limit} câu.`);
        
        if (questions.length > limit) {
            questions = questions.slice(0, limit);
        }

        if (questions.length > 0) {
            currentIndex = 0;
            this.renderQuestionList();
            this.renderProgress();
            
            // Hàm Timer bây giờ sẽ tự tính toán dựa trên questions.length
            this.renderTimer();
            
            this.renderCurrentQuestion();
            this.handleQuestionList();
            this.handleAnswer();
            this.handleNext();
            this.handlePrev();
            this.handleSubmit();
            this.handleSettingsModal();
            this.handleReviewButton();
            
            quizQuestions[0].classList.add("active");
        } else {
            quizTitle.innerText = "Không có câu hỏi nào!";
            quizSubmit.style.display = 'none';
        }
    },
};

quiz.start();