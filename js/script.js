// Enhanced Quiz Application with Modern Features
const quizData = {};
const state = {
    currentSection: "quantitative",
    questionQueue: [],
    retestQueue: [],
    history: [],
    sessionStats: { answered: 0, correct: 0 },
    globalStats: {},
    currentQuestionIndex: 0,
    totalQuestions: 0
};

// Enhanced DOM elements
const dom = {
    sectionTitle: document.getElementById("section-title"),
    questionArea: document.getElementById("question-area"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    resetBtn: document.getElementById("reset-btn"),
    progressText: document.getElementById("progress-text"),
    progressFill: document.getElementById("progress-fill"),
    progressLabel: document.getElementById("progress-label"),
    progressDots: document.getElementById("progress-dots"),
    totalQuestions: document.getElementById("total-questions"),
    answered: document.getElementById("answered"),
    correct: document.getElementById("correct"),
    accuracy: document.getElementById("accuracy"),
    answeredTrend: document.getElementById("answered-trend"),
    correctTrend: document.getElementById("correct-trend"),
    accuracyTrend: document.getElementById("accuracy-trend"),
    tabs: document.querySelectorAll(".tab-btn"),
};

// Enhanced sparkle animation
function triggerSparkle(element) {
    const sparkleCount = 20;
    const colors = ['#ffd700', '#ffed4e', '#fff700', '#ffaa00', '#ff6b6b'];
    
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        
        const angle = (Math.PI * 2 * i) / sparkleCount;
        const distance = Math.random() * 60 + 40;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        sparkle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        sparkle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        sparkle.style.background = color;
        sparkle.style.top = '50%';
        sparkle.style.left = '50%';
        sparkle.style.boxShadow = `0 0 6px ${color}`;
        
        element.appendChild(sparkle);
        
        sparkle.addEventListener('animationend', () => sparkle.remove());
    }
    
    // Add success sound effect (optional)
    playSuccessSound();
}

// Enhanced confetti animation for perfect scores
function triggerConfetti() {
    const confettiCount = 50;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.zIndex = '1000';
        confetti.style.borderRadius = '50%';
        confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Add confetti animation CSS
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confetti-fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
`;
document.head.appendChild(confettiStyle);

// Enhanced loading screen
function showLoader(message) {
    dom.questionArea.innerHTML = `
        <div class="loader">
            <div class="loader-animation"></div>
            <p>${message}</p>
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    updateButtonStates(true);
}

// Enhanced button state management
function updateButtonStates(loading = false) {
    dom.prevBtn.disabled = loading || state.history.length === 0;
    dom.nextBtn.disabled = loading || (state.questionQueue.length === 0 && state.retestQueue.length === 0) || !document.querySelector('.option.disabled');
    dom.resetBtn.disabled = loading;
}

// Enhanced array shuffling with Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Enhanced local storage management
function loadGlobalStats() {
    try {
        const stats = localStorage.getItem('quizGlobalStats');
        state.globalStats = stats ? JSON.parse(stats) : { 
            attemptCounts: {},
            sectionProgress: {},
            totalSessions: 0,
            bestAccuracy: 0
        };
    } catch (error) {
        console.warn('Failed to load global stats:', error);
        state.globalStats = { attemptCounts: {}, sectionProgress: {}, totalSessions: 0, bestAccuracy: 0 };
    }
}

function saveGlobalStats() {
    try {
        // Update session count
        state.globalStats.totalSessions = (state.globalStats.totalSessions || 0) + 1;
        
        // Update best accuracy
        const currentAccuracy = state.sessionStats.answered > 0 ? 
            Math.round((state.sessionStats.correct / state.sessionStats.answered) * 100) : 0;
        state.globalStats.bestAccuracy = Math.max(state.globalStats.bestAccuracy || 0, currentAccuracy);
        
        localStorage.setItem('quizGlobalStats', JSON.stringify(state.globalStats));
    } catch (error) {
        console.warn('Failed to save global stats:', error);
    }
}

// Enhanced progress tracking
function updateProgressIndicator() {
    const totalQuestions = state.totalQuestions;
    const answeredQuestions = state.sessionStats.answered;
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    if (dom.progressFill) {
        dom.progressFill.style.width = `${progressPercentage}%`;
    }
    
    if (dom.progressLabel) {
        dom.progressLabel.textContent = `${Math.round(progressPercentage)}%`;
    }
    
    // Update progress dots
    if (dom.progressDots) {
        const dotsCount = Math.min(totalQuestions, 10);
        const dotsHTML = Array.from({ length: dotsCount }, (_, i) => {
            const isCompleted = i < (answeredQuestions / totalQuestions) * dotsCount;
            return `<span class="progress-dot ${isCompleted ? 'completed' : ''}"></span>`;
        }).join('');
        dom.progressDots.innerHTML = dotsHTML;
    }
}

// Enhanced section loading with better error handling
async function loadSection(sectionKey) {
    try {
        // Update active tab
        dom.tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.section === sectionKey));
        
        state.currentSection = sectionKey;
        showLoader(`Loading & Randomizing ${getSectionDisplayName(sectionKey)} Questions...`);
        
        if (!quizData[sectionKey]) {
            const response = await fetch(`./questions/${sectionKey}.json`);
            if (!response.ok) {
                throw new Error(`Questions file not found: ${sectionKey}.json`);
            }
            
            const questions = await response.json();
            quizData[sectionKey] = questions.map((q, index) => ({ 
                ...q, 
                originalId: `${sectionKey}-${index}`,
                difficulty: q.difficulty || 'medium',
                category: q.category || sectionKey
            }));
        }
        
        initializeSection();
    } catch (error) {
        console.error('Error loading section:', error);
        dom.questionArea.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <h3>Oops! Something went wrong</h3>
                <p>${error.message}</p>
                <button class="nav-btn primary" onclick="loadSection('${sectionKey}')">
                    <span>🔄</span>
                    <span>Try Again</span>
                </button>
            </div>
        `;
        updateButtonStates(true);
    }
}

// Get display name for section
function getSectionDisplayName(sectionKey) {
    const sectionNames = {
        quantitative: 'Quantitative',
        verbal: 'Verbal',
        logical: 'Logical',
        general_awareness: 'General Awareness',
        current_affairs: 'Current Affairs',
        domain1: 'Domain 1',
        domain2: 'Domain 2',
        domain3: 'Domain 3'
    };
    return sectionNames[sectionKey] || sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Enhanced section initialization
function initializeSection() {
    const sectionKey = state.currentSection;
    const sectionTitle = getSectionDisplayName(sectionKey);
    dom.sectionTitle.textContent = sectionTitle;
    
    // Reset session stats
    state.sessionStats = { answered: 0, correct: 0 };
    state.retestQueue = [];
    state.history = [];
    state.currentQuestionIndex = 0;
    
    // Shuffle questions
    state.questionQueue = shuffleArray([...quizData[sectionKey]]);
    state.totalQuestions = state.questionQueue.length;
    
    updateButtonStates(false);
    updateProgressIndicator();
    displayQuestion();
}

// Enhanced question display with better formatting
function displayQuestion() {
    if (state.questionQueue.length === 0 && state.retestQueue.length === 0) {
        displayCompletionMessage();
        return;
    }

    let currentQ;
    // Smart question selection: mix regular and retest questions
    if (state.sessionStats.answered > 0 && state.sessionStats.answered % 3 === 0 && state.retestQueue.length > 0) {
        currentQ = state.retestQueue.shift();
    } else {
        currentQ = state.questionQueue.length > 0 ? state.questionQueue[0] : state.retestQueue.shift();
    }

    const attemptCount = state.globalStats.attemptCounts[currentQ.originalId] || 0;
    const attemptFlag = attemptCount > 0 ? 
        `<span class="attempt-flag">${getOrdinal(attemptCount + 1)} attempt</span>` : '';

    const difficultyBadge = currentQ.difficulty ? 
        `<span class="difficulty-badge ${currentQ.difficulty}">${currentQ.difficulty}</span>` : '';

    const prefixes = ['A', 'B', 'C', 'D', 'E'];
    const optionsHTML = currentQ.options.map((option, index) => `
        <div class="option" data-index="${index}" tabindex="0" role="button" aria-label="Option ${prefixes[index]}: ${option}">
            <span class="option-prefix">${prefixes[index]}</span>
            <span class="option-text">${option}</span>
            <span class="feedback-icon" aria-hidden="true"></span>
        </div>
    `).join('');
    
    dom.questionArea.innerHTML = `
        <div class="question-container">
            <div class="question-header">
                <div class="question-meta">
                    <span class="question-number">Question ${state.sessionStats.answered + 1}</span>
                    ${difficultyBadge}
                    ${attemptFlag}
                </div>
                <div class="question-text">${currentQ.question}</div>
            </div>
            <div class="options-container" role="radiogroup" aria-label="Answer options">
                ${optionsHTML}
            </div>
            <div class="explanation" role="region" aria-label="Explanation"></div>
        </div>
    `;

    // Add event listeners for options
    document.querySelectorAll('.option').forEach((opt, index) => {
        opt.addEventListener('click', () => selectOption(index, currentQ));
        opt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(index, currentQ);
            }
        });
    });

    updateUI();
}

// Enhanced completion message
function displayCompletionMessage() {
    const accuracy = state.sessionStats.answered > 0 ? 
        Math.round((state.sessionStats.correct / state.sessionStats.answered) * 100) : 0;
    
    let message = "🎉 Session Complete! 🎉";
    let encouragement = "Well done!";
    
    if (accuracy >= 90) {
        message = "🏆 Outstanding Performance! 🏆";
        encouragement = "You're a quiz master!";
        triggerConfetti();
    } else if (accuracy >= 75) {
        message = "⭐ Great Job! ⭐";
        encouragement = "Excellent work!";
    } else if (accuracy >= 60) {
        message = "👍 Good Effort! 👍";
        encouragement = "Keep practicing!";
    } else {
        message = "📚 Learning in Progress 📚";
        encouragement = "Every attempt makes you stronger!";
    }
    
    dom.questionArea.innerHTML = `
        <div class="completion-message">
            <div class="completion-icon">${accuracy >= 90 ? '🏆' : accuracy >= 75 ? '⭐' : accuracy >= 60 ? '👍' : '📚'}</div>
            <h3>${message}</h3>
            <p>${encouragement}</p>
            <div class="completion-stats">
                <div class="completion-stat">
                    <span class="stat-number">${state.sessionStats.correct}</span>
                    <span class="stat-label">Correct</span>
                </div>
                <div class="completion-stat">
                    <span class="stat-number">${state.sessionStats.answered}</span>
                    <span class="stat-label">Total</span>
                </div>
                <div class="completion-stat">
                    <span class="stat-number">${accuracy}%</span>
                    <span class="stat-label">Accuracy</span>
                </div>
            </div>
            <button class="nav-btn primary" onclick="initializeSection()">
                <span>🔄</span>
                <span>Start New Session</span>
            </button>
        </div>
    `;
    
    dom.nextBtn.disabled = true;
    saveGlobalStats();
}

// Enhanced option selection with better feedback
function selectOption(selectedIndex, currentQ) {
    if (document.querySelector('.option.disabled')) return;

    const isCorrect = selectedIndex === currentQ.correctAnswer;
    
    // Update session stats
    state.sessionStats.answered++;
    if (isCorrect) state.sessionStats.correct++;
    
    // Handle retest queue
    const retestIndex = state.retestQueue.findIndex(q => q.originalId === currentQ.originalId);
    if (!isCorrect && retestIndex === -1) {
        state.retestQueue.push(currentQ);
    } else if (isCorrect && retestIndex > -1) {
        state.retestQueue.splice(retestIndex, 1);
    }
    
    // Update global stats
    state.globalStats.attemptCounts[currentQ.originalId] = 
        (state.globalStats.attemptCounts[currentQ.originalId] || 0) + 1;
    
    // Visual feedback for options
    const options = document.querySelectorAll('.option');
    options.forEach((opt, index) => {
        opt.classList.add('disabled');
        opt.setAttribute('aria-disabled', 'true');
        
        if (index === selectedIndex) {
            opt.classList.add('selected');
        }
        
        if (index === currentQ.correctAnswer) {
            opt.classList.add('correct');
            opt.querySelector('.feedback-icon').textContent = '✓';
            opt.setAttribute('aria-label', opt.getAttribute('aria-label') + ' - Correct answer');
        } else if (index === selectedIndex) {
            opt.classList.add('incorrect');
            opt.querySelector('.feedback-icon').textContent = '✗';
            opt.setAttribute('aria-label', opt.getAttribute('aria-label') + ' - Incorrect answer');
        }
    });
    
    // Show explanation
    const explanationEl = document.querySelector('.explanation');
    explanationEl.innerHTML = `
        <div class="explanation-header">
            <span class="explanation-icon">💡</span>
            <span class="explanation-title">Explanation</span>
        </div>
        <div class="explanation-content">${currentQ.explanation}</div>
    `;
    explanationEl.classList.add('show');
    explanationEl.setAttribute('aria-expanded', 'true');
    
    // Trigger sparkle animation for correct answers
    if (isCorrect) {
        const correctOptionEl = document.querySelector('.option.correct.selected');
        if (correctOptionEl) {
            setTimeout(() => triggerSparkle(correctOptionEl), 200);
        }
        playSuccessSound();
    } else {
        playErrorSound();
    }

    // Move question to history
    const mainQueueIndex = state.questionQueue.findIndex(q => q.originalId === currentQ.originalId);
    if (mainQueueIndex > -1) {
        state.history.push(state.questionQueue.splice(mainQueueIndex, 1)[0]);
    } else {
        state.history.push(currentQ);
    }

    dom.nextBtn.disabled = false;
    updateUI();
    updateProgressIndicator();
}

// Enhanced ordinal number function
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Enhanced UI updates with trends
function updateUI() {
    updateButtonStates();

    const totalInSection = quizData[state.currentSection]?.length || 0;
    const answeredCount = state.sessionStats.answered;
    const correctCount = state.sessionStats.correct;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    
    const remaining = state.questionQueue.length + state.retestQueue.length;
    dom.progressText.textContent = `Remaining: ${remaining}`;
    
    // Update stat values
    dom.totalQuestions.textContent = totalInSection;
    dom.answered.textContent = answeredCount;
    dom.correct.textContent = correctCount;
    dom.accuracy.textContent = `${accuracy}%`;
    
    // Update trend indicators
    if (dom.answeredTrend) {
        const progress = totalInSection > 0 ? (answeredCount / totalInSection) * 100 : 0;
        dom.answeredTrend.textContent = progress < 25 ? "Just started!" : 
                                       progress < 50 ? "Making progress!" :
                                       progress < 75 ? "Halfway there!" : "Almost done!";
    }
    
    if (dom.correctTrend) {
        dom.correctTrend.textContent = accuracy >= 90 ? "Excellent!" :
                                      accuracy >= 75 ? "Great job!" :
                                      accuracy >= 60 ? "Good work!" : "Keep trying!";
    }
    
    if (dom.accuracyTrend) {
        const trend = accuracy >= 80 ? "📈 Trending up!" :
                     accuracy >= 60 ? "📊 Steady progress" : "📉 Room to improve";
        dom.accuracyTrend.textContent = trend;
    }
}

// Enhanced navigation functions
function goToPrevious() {
    if (state.history.length > 0) {
        const lastQuestion = state.history.pop();
        state.questionQueue.unshift(lastQuestion);
        
        // Simplified undo - just show the question again
        displayQuestion();
    }
}

function nextQuestion() {
    displayQuestion();
}

function resetSession() {
    if (confirm('Are you sure you want to reset the current session? All progress will be lost.')) {
        initializeSection();
    }
}

// Sound effects (optional - can be enabled/disabled)
function playSuccessSound() {
    // Create a simple success sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        // Silently fail if audio context is not available
    }
}

function playErrorSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        // Silently fail if audio context is not available
    }
}

// Enhanced keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.target.closest('.option')) return; // Let option handle its own keyboard events
    
    switch (e.key) {
        case 'ArrowLeft':
            if (!dom.prevBtn.disabled) goToPrevious();
            break;
        case 'ArrowRight':
        case ' ':
            if (!dom.nextBtn.disabled) nextQuestion();
            e.preventDefault();
            break;
        case 'r':
        case 'R':
            if (e.ctrlKey && !dom.resetBtn.disabled) {
                e.preventDefault();
                resetSession();
            }
            break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
            const optionIndex = parseInt(e.key) - 1;
            const options = document.querySelectorAll('.option');
            if (options[optionIndex] && !options[optionIndex].classList.contains('disabled')) {
                options[optionIndex].click();
            }
            break;
    }
});

// Event listeners
dom.tabs.forEach(btn => btn.addEventListener('click', () => loadSection(btn.dataset.section)));
dom.nextBtn.addEventListener('click', nextQuestion);
dom.prevBtn.addEventListener('click', goToPrevious);
dom.resetBtn.addEventListener('click', resetSession);

// Enhanced initialization
window.addEventListener('DOMContentLoaded', () => {
    loadGlobalStats();
    
    // Add loading animation styles
    const loadingStyles = document.createElement('style');
    loadingStyles.textContent = `
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.3s ease;
        }
        
        .loading-content {
            text-align: center;
            color: white;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-dots {
            display: flex;
            justify-content: center;
            gap: 5px;
            margin-top: 20px;
        }
        
        .loading-dots span {
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            animation: loading-bounce 1.4s ease-in-out infinite both;
        }
        
        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes loading-bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        
        .error-message {
            text-align: center;
            padding: 40px;
            color: var(--text-primary);
        }
        
        .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .completion-message {
            text-align: center;
            padding: 40px;
        }
        
        .completion-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .completion-stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
        }
        
        .completion-stat {
            text-align: center;
        }
        
        .completion-stat .stat-number {
            display: block;
            font-size: 2rem;
            font-weight: bold;
            color: var(--text-accent);
        }
        
        .completion-stat .stat-label {
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .progress-indicator {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .progress-bar {
            flex-grow: 1;
            height: 8px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 4px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--accent-primary);
            border-radius: 4px;
            transition: width 0.3s ease;
            width: 0%;
        }
        
        .progress-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-secondary);
            min-width: 40px;
        }
        
        .progress-dots {
            display: flex;
            gap: 4px;
            margin-top: 10px;
        }
        
        .progress-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.3);
            transition: background 0.3s ease;
        }
        
        .progress-dot.completed {
            background: var(--text-accent);
        }
        
        .question-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .question-number {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-secondary);
            background: rgba(59, 130, 246, 0.1);
            padding: 4px 12px;
            border-radius: 12px;
        }
        
        .difficulty-badge {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 8px;
            text-transform: uppercase;
        }
        
        .difficulty-badge.easy {
            background: rgba(16, 185, 129, 0.2);
            color: #059669;
        }
        
        .difficulty-badge.medium {
            background: rgba(245, 158, 11, 0.2);
            color: #d97706;
        }
        
        .difficulty-badge.hard {
            background: rgba(239, 68, 68, 0.2);
            color: #dc2626;
        }
        
        .explanation-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .explanation-icon {
            font-size: 1.2rem;
        }
        
        .explanation-content {
            line-height: 1.6;
        }
        
        .header-stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .header-stat {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .stat-icon {
            font-size: 1.1rem;
        }
        
        .tab-icon {
            margin-right: 8px;
        }
        
        .btn-icon {
            font-size: 1.1rem;
        }
        
        .nav-btn.secondary {
            background: rgba(107, 114, 128, 0.1);
            color: var(--text-secondary);
        }
        
        .nav-btn.primary {
            background: var(--accent-primary);
        }
        
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .developer-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .developer-icon {
            font-size: 1.2rem;
        }
        
        .footer-links {
            display: flex;
            gap: 15px;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .stat-icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .stat-trend {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-top: 5px;
        }
    `;
    document.head.appendChild(loadingStyles);
    
    // Start the application
    loadSection('quantitative');
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(registrationError => console.log('SW registration failed'));
    });
}