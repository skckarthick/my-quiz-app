const quizData = {};
const state = {
    currentSection: "quantitative",
    questionQueue: [],
    retestQueue: [],
    history: [],
    sessionStats: { answered: 0, correct: 0 },
    globalStats: {}
};

const dom = {
    sectionTitle: document.getElementById("section-title"),
    questionArea: document.getElementById("question-area"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    resetBtn: document.getElementById("reset-btn"),
    progressText: document.getElementById("progress-text"),
    totalQuestions: document.getElementById("total-questions"),
    answered: document.getElementById("answered"),
    correct: document.getElementById("correct"),
    accuracy: document.getElementById("accuracy"),
    tabs: document.querySelectorAll(".tab-btn"),
};

function triggerSparkle(element) {
    for (let i = 0; i < 15; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 40 + 30;
        sparkle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        sparkle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        sparkle.style.top = '50%';
        sparkle.style.left = '50%';
        element.appendChild(sparkle);
        sparkle.addEventListener('animationend', () => sparkle.remove());
    }
}

function showLoader(message) {
    dom.questionArea.innerHTML = `<div class="loader">${message}</div>`;
    dom.prevBtn.disabled = true;
    dom.nextBtn.disabled = true;
    dom.resetBtn.disabled = true;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadGlobalStats() {
    const stats = localStorage.getItem('quizGlobalStats');
    state.globalStats = stats ? JSON.parse(stats) : { attemptCounts: {} };
}

function saveGlobalStats() {
    localStorage.setItem('quizGlobalStats', JSON.stringify(state.globalStats));
}

async function loadSection(sectionKey) {
    dom.tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.section === sectionKey));
    state.currentSection = sectionKey;
    showLoader(`Loading & Randomizing Questions...`);
    try {
        if (!quizData[sectionKey]) {
            const response = await fetch(`./questions/${sectionKey}.json`);
            if (!response.ok) throw new Error(`File not found: ${sectionKey}.json.`);
            quizData[sectionKey] = await response.json().then(questions => 
                questions.map((q, index) => ({ ...q, originalId: `${sectionKey}-${index}` }))
            );
        }
        initializeSection();
    } catch (error) {
        showLoader(`Error: ${error.message}`);
    }
}

function initializeSection() {
    const sectionKey = state.currentSection;
    const sectionTitle = sectionKey.split(/_|-/g).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    dom.sectionTitle.textContent = sectionTitle;
    
    state.sessionStats = { answered: 0, correct: 0 };
    state.retestQueue = [];
    state.history = [];

    state.questionQueue = [...quizData[sectionKey]];
    shuffleArray(state.questionQueue);

    dom.resetBtn.disabled = false;
    displayQuestion();
}

function displayQuestion() {
    if (state.questionQueue.length === 0 && state.retestQueue.length === 0) {
        dom.questionArea.innerHTML = `<div class="loader">🎉 Session Complete! Well done! 🎉</div>`;
        dom.nextBtn.disabled = true;
        return;
    }

    let currentQ;
    if (state.sessionStats.answered > 0 && state.sessionStats.answered % 4 === 0 && state.retestQueue.length > 0) {
        currentQ = state.retestQueue.shift();
    } else {
         currentQ = state.questionQueue.length > 0 ? state.questionQueue[0] : state.retestQueue.shift();
    }

    const attemptCount = state.globalStats.attemptCounts[currentQ.originalId] || 0;
    const attemptFlag = attemptCount > 0 ? `<span class="attempt-flag">${getOrdinal(attemptCount + 1)} attempt</span>` : '';

    const prefixes = ['A', 'B', 'C', 'D', 'E'];
    let optionsHTML = currentQ.options.map((option, index) => `
        <div class="option" data-index="${index}">
            <span class="option-prefix">${prefixes[index]}</span>
            <span class="option-text">${option}</span>
            <span class="feedback-icon"></span>
        </div>`
    ).join('');
    
    dom.questionArea.innerHTML = `
        <div class="question-header">
            <div class="question-text">${currentQ.question}</div>
            ${attemptFlag}
        </div>
        <div class="options-container">${optionsHTML}</div>
        <div class="explanation"></div>`;

    document.querySelectorAll('.option').forEach(opt => {
        opt.addEventListener('click', e => selectOption(parseInt(e.currentTarget.dataset.index), currentQ));
    });
    updateUI();
}

function selectOption(selectedIndex, currentQ) {
    if (document.querySelector('.option.disabled')) return;

    const isCorrect = selectedIndex === currentQ.correctAnswer;
    
    state.sessionStats.answered++;
    if (isCorrect) state.sessionStats.correct++;
    
    const retestIndex = state.retestQueue.findIndex(q => q.originalId === currentQ.originalId);
    if (!isCorrect && retestIndex === -1) {
        state.retestQueue.push(currentQ);
    } else if (isCorrect && retestIndex > -1) {
        state.retestQueue.splice(retestIndex, 1);
    }
    
    state.globalStats.attemptCounts[currentQ.originalId] = (state.globalStats.attemptCounts[currentQ.originalId] || 0) + 1;
    saveGlobalStats();

    const options = document.querySelectorAll('.option');
    options.forEach((opt, index) => {
        opt.classList.add('disabled');
        if (index === selectedIndex) opt.classList.add('selected');
        if (index === currentQ.correctAnswer) {
            opt.classList.add('correct');
            opt.querySelector('.feedback-icon').textContent = '✓';
        } else if (index === selectedIndex) {
            opt.classList.add('incorrect');
            opt.querySelector('.feedback-icon').textContent = '✗';
        }
    });
    
    const explanationEl = document.querySelector('.explanation');
    explanationEl.textContent = currentQ.explanation;
    explanationEl.classList.add('show');
    
    if (isCorrect) {
        const correctOptionEl = dom.questionArea.querySelector('.option.correct.selected');
        if(correctOptionEl) setTimeout(() => triggerSparkle(correctOptionEl), 100);
    }

    const mainQueueIndex = state.questionQueue.findIndex(q => q.originalId === currentQ.originalId);
    if (mainQueueIndex > -1) {
        state.history.push(state.questionQueue.splice(mainQueueIndex, 1)[0]);
    } else {
         state.history.push(currentQ);
    }

    dom.nextBtn.disabled = false;
    updateUI();
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function updateUI() {
    dom.prevBtn.disabled = state.history.length === 0;
    dom.nextBtn.disabled = (state.questionQueue.length === 0 && state.retestQueue.length === 0) || !document.querySelector('.option.disabled');

    const totalInSection = quizData[state.currentSection]?.length || 0;
    const answeredCount = state.sessionStats.answered;
    const correctCount = state.sessionStats.correct;
    
    const remaining = state.questionQueue.length + state.retestQueue.length;
    dom.progressText.textContent = `Remaining: ${remaining}`;
    
    dom.totalQuestions.textContent = totalInSection;
    dom.answered.textContent = answeredCount;
    dom.correct.textContent = correctCount;
    dom.accuracy.textContent = `${answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%`;
}

function goToPrevious() {
    if (state.history.length > 0) {
        const lastQuestion = state.history.pop();
        state.questionQueue.unshift(lastQuestion);
        
        // This is a simplified "undo". We'll just show the question again.
        // A full undo would need to revert stats, which is complex.
        displayQuestion();
    }
}

dom.tabs.forEach(btn => btn.addEventListener('click', () => loadSection(btn.dataset.section)));
dom.nextBtn.addEventListener('click', displayQuestion);
dom.prevBtn.addEventListener('click', goToPrevious);
dom.resetBtn.addEventListener('click', initializeSection);

window.addEventListener('DOMContentLoaded', () => {
    loadGlobalStats();
    loadSection('quantitative');
});