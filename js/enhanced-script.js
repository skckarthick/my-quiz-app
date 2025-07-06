// Enhanced Quiz Application with Security and Advanced UX
const quizData = {};
const state = {
    currentSection: "quantitative",
    questionQueue: [],
    retestQueue: [],
    history: [],
    sessionStats: { answered: 0, correct: 0 },
    globalStats: {},
    currentQuestionIndex: 0,
    totalQuestions: 0,
    isOnline: navigator.onLine
};

// Initialize security and animation managers
const security = new SecurityManager();
const animations = new AnimationManager();

// Enhanced DOM elements with security
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

// Enhanced sparkle animation with particles
function triggerSparkle(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    animations.createCelebrationParticles(x, y, 30);
    
    // Original sparkle effect
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
    
    playSuccessSound();
}

// Enhanced loading with progress indication
function showLoader(message) {
    dom.questionArea.innerHTML = `
        <div class="enhanced-loader">
            <div class="loader-spinner"></div>
            <div class="loader-text">${security.escapeHtml(message)}</div>
            <div class="loader-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="loading-progress"></div>
                </div>
            </div>
        </div>
    `;
    
    // Animate progress bar
    let progress = 0;
    const progressBar = document.getElementById('loading-progress');
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }, 100);
    
    updateButtonStates(true);
}

// Enhanced button state management with animations
function updateButtonStates(loading = false) {
    const buttons = [dom.prevBtn, dom.nextBtn, dom.resetBtn];
    
    buttons.forEach(btn => {
        if (loading) {
            btn.classList.add('loading');
        } else {
            btn.classList.remove('loading');
        }
    });
    
    dom.prevBtn.disabled = loading || state.history.length === 0;
    dom.nextBtn.disabled = loading || (state.questionQueue.length === 0 && state.retestQueue.length === 0) || !document.querySelector('.option.disabled');
    dom.resetBtn.disabled = loading;
}

// Secure array shuffling with Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Enhanced local storage with security
function loadGlobalStats() {
    try {
        const stats = security.secureGetItem('quizGlobalStats');
        state.globalStats = stats || { 
            attemptCounts: {},
            sectionProgress: {},
            totalSessions: 0,
            bestAccuracy: 0,
            timeSpent: 0
        };
    } catch (error) {
        console.warn('Failed to load global stats:', error);
        state.globalStats = { attemptCounts: {}, sectionProgress: {}, totalSessions: 0, bestAccuracy: 0, timeSpent: 0 };
    }
}

function saveGlobalStats() {
    try {
        state.globalStats.totalSessions = (state.globalStats.totalSessions || 0) + 1;
        
        const currentAccuracy = state.sessionStats.answered > 0 ? 
            Math.round((state.sessionStats.correct / state.sessionStats.answered) * 100) : 0;
        state.globalStats.bestAccuracy = Math.max(state.globalStats.bestAccuracy || 0, currentAccuracy);
        
        security.secureSetItem('quizGlobalStats', state.globalStats);
    } catch (error) {
        console.warn('Failed to save global stats:', error);
    }
}

// Enhanced section loading with security checks
async function loadSection(sectionKey) {
    try {
        // Security check
        security.checkRateLimit('section_load');
        
        // Sanitize section key
        sectionKey = security.sanitizeInput(sectionKey);
        
        // Update active tab with animation
        dom.tabs.forEach((btn, index) => {
            const isActive = btn.dataset.section === sectionKey;
            btn.classList.toggle('active', isActive);
            
            if (isActive) {
                setTimeout(() => {
                    animations.pulseElement(btn, 500);
                }, index * 50);
            }
        });
        
        state.currentSection = sectionKey;
        showLoader(`Loading & Randomizing ${getSectionDisplayName(sectionKey)} Questions...`);
        
        if (!quizData[sectionKey]) {
            // Validate file integrity
            const filePath = `./questions/${sectionKey}.json`;
            const isValid = await security.validateFileIntegrity(filePath);
            
            if (!isValid) {
                throw new Error(`Security validation failed for ${sectionKey}.json`);
            }
            
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Questions file not found: ${sectionKey}.json`);
            }
            
            const jsonText = await response.text();
            const questions = security.secureJSONParse(jsonText);
            
            quizData[sectionKey] = questions.map((q, index) => ({ 
                ...q, 
                originalId: `${sectionKey}-${index}`,
                difficulty: q.difficulty || 'medium',
                category: q.category || sectionKey,
                // Sanitize question content
                question: security.escapeHtml(q.question),
                options: q.options.map(opt => security.escapeHtml(opt)),
                explanation: security.escapeHtml(q.explanation)
            }));
        }
        
        initializeSection();
    } catch (error) {
        console.error('Error loading section:', error);
        showErrorMessage(error.message);
    }
}

// Enhanced error handling
function showErrorMessage(message) {
    dom.questionArea.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p class="error-message">${security.escapeHtml(message)}</p>
            <div class="error-actions">
                <button class="nav-btn primary" onclick="location.reload()">
                    <span>🔄</span>
                    <span>Refresh Page</span>
                </button>
                <button class="nav-btn secondary" onclick="loadSection('quantitative')">
                    <span>🏠</span>
                    <span>Go to Quantitative</span>
                </button>
            </div>
        </div>
    `;
    updateButtonStates(true);
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
    
    // Animate title change
    animations.typeText(dom.sectionTitle, sectionTitle, 30);
    
    // Reset session stats
    state.sessionStats = { answered: 0, correct: 0 };
    state.retestQueue = [];
    state.history = [];
    state.currentQuestionIndex = 0;
    
    // Shuffle questions securely
    state.questionQueue = shuffleArray([...quizData[sectionKey]]);
    state.totalQuestions = state.questionQueue.length;
    
    updateButtonStates(false);
    displayQuestion();
}

// Enhanced question display
function displayQuestion() {
    if (state.questionQueue.length === 0 && state.retestQueue.length === 0) {
        displayCompletionMessage();
        return;
    }

    let currentQ;
    // Smart question selection
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
        <div class="option enhanced-option" data-index="${index}" tabindex="0" role="button" aria-label="Option ${prefixes[index]}: ${option}">
            <span class="option-prefix">${prefixes[index]}</span>
            <span class="option-text">${option}</span>
            <span class="feedback-icon" aria-hidden="true"></span>
            <div class="option-ripple"></div>
        </div>
    `).join('');
    
    dom.questionArea.innerHTML = `
        <div class="question-container enhanced-question">
            <div class="question-header">
                <div class="question-meta">
                    <span class="question-number">Question ${state.sessionStats.answered + 1}</span>
                    ${difficultyBadge}
                    ${attemptFlag}
                </div>
                <div class="question-text">${currentQ.question}</div>
            </div>
            <div class="options-container enhanced-options" role="radiogroup" aria-label="Answer options">
                ${optionsHTML}
            </div>
            <div class="explanation enhanced-explanation" role="region" aria-label="Explanation"></div>
        </div>
    `;

    // Add enhanced event listeners
    document.querySelectorAll('.enhanced-option').forEach((opt, index) => {
        opt.addEventListener('click', (e) => {
            animations.createRipple(opt, e);
            selectOption(index, currentQ);
        });
        
        opt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(index, currentQ);
            }
        });
        
        // Add hover effects
        opt.addEventListener('mouseenter', () => {
            if (!opt.classList.contains('disabled')) {
                animations.pulseElement(opt, 200);
            }
        });
    });

    // Animate question appearance
    setTimeout(() => {
        document.querySelector('.enhanced-question').classList.add('animate-in');
    }, 100);

    updateUI();
}

// Enhanced completion message with celebration
function displayCompletionMessage() {
    const accuracy = state.sessionStats.answered > 0 ? 
        Math.round((state.sessionStats.correct / state.sessionStats.answered) * 100) : 0;
    
    let message = "🎉 Session Complete! 🎉";
    let encouragement = "Well done!";
    let celebrationLevel = 'basic';
    
    if (accuracy >= 90) {
        message = "🏆 Outstanding Performance! 🏆";
        encouragement = "You're a quiz master!";
        celebrationLevel = 'epic';
        // Trigger epic celebration
        setTimeout(() => animations.createCelebrationParticles(window.innerWidth / 2, window.innerHeight / 2, 100), 500);
    } else if (accuracy >= 75) {
        message = "⭐ Great Job! ⭐";
        encouragement = "Excellent work!";
        celebrationLevel = 'great';
    } else if (accuracy >= 60) {
        message = "👍 Good Effort! 👍";
        encouragement = "Keep practicing!";
        celebrationLevel = 'good';
    } else {
        message = "📚 Learning in Progress 📚";
        encouragement = "Every attempt makes you stronger!";
        celebrationLevel = 'encouraging';
    }
    
    dom.questionArea.innerHTML = `
        <div class="completion-message ${celebrationLevel}">
            <div class="completion-icon">${accuracy >= 90 ? '🏆' : accuracy >= 75 ? '⭐' : accuracy >= 60 ? '👍' : '📚'}</div>
            <h3 class="completion-title">${message}</h3>
            <p class="completion-subtitle">${encouragement}</p>
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
            <div class="completion-actions">
                <button class="nav-btn primary" onclick="initializeSection()">
                    <span>🔄</span>
                    <span>Start New Session</span>
                </button>
                <button class="nav-btn secondary" onclick="showDetailedStats()">
                    <span>📊</span>
                    <span>View Stats</span>
                </button>
            </div>
        </div>
    `;
    
    dom.nextBtn.disabled = true;
    saveGlobalStats();
    
    // Animate completion message
    setTimeout(() => {
        document.querySelector('.completion-message').classList.add('animate-in');
    }, 100);
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
    
    // Update global stats securely
    state.globalStats.attemptCounts[currentQ.originalId] = 
        (state.globalStats.attemptCounts[currentQ.originalId] || 0) + 1;
    
    // Enhanced visual feedback
    const options = document.querySelectorAll('.option');
    options.forEach((opt, index) => {
        opt.classList.add('disabled');
        opt.setAttribute('aria-disabled', 'true');
        
        if (index === selectedIndex) {
            opt.classList.add('selected');
            animations.pulseElement(opt, 300);
        }
        
        if (index === currentQ.correctAnswer) {
            opt.classList.add('correct');
            opt.querySelector('.feedback-icon').textContent = '✓';
            opt.setAttribute('aria-label', opt.getAttribute('aria-label') + ' - Correct answer');
            
            // Animate correct answer
            setTimeout(() => {
                opt.style.transform = 'scale(1.02)';
                setTimeout(() => opt.style.transform = '', 200);
            }, 100);
        } else if (index === selectedIndex) {
            opt.classList.add('incorrect');
            opt.querySelector('.feedback-icon').textContent = '✗';
            opt.setAttribute('aria-label', opt.getAttribute('aria-label') + ' - Incorrect answer');
            
            // Shake incorrect answer
            animations.shakeElement(opt);
        }
    });
    
    // Show enhanced explanation
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
    
    // Trigger celebration for correct answers
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
}

// Enhanced ordinal number function
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Enhanced UI updates with smooth animations
function updateUI() {
    updateButtonStates();

    const totalInSection = quizData[state.currentSection]?.length || 0;
    const answeredCount = state.sessionStats.answered;
    const correctCount = state.sessionStats.correct;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    
    const remaining = state.questionQueue.length + state.retestQueue.length;
    dom.progressText.textContent = `Remaining: ${remaining}`;
    
    // Animate stat updates
    animateStatUpdate(dom.totalQuestions, totalInSection);
    animateStatUpdate(dom.answered, answeredCount);
    animateStatUpdate(dom.correct, correctCount);
    animateStatUpdate(dom.accuracy, `${accuracy}%`);
}

// Animate stat updates
function animateStatUpdate(element, newValue) {
    const currentValue = element.textContent;
    if (currentValue !== newValue.toString()) {
        element.style.transform = 'scale(1.1)';
        element.style.color = 'var(--accent-primary)';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 150);
    }
}

// Enhanced navigation functions
function goToPrevious() {
    if (state.history.length > 0) {
        const lastQuestion = state.history.pop();
        state.questionQueue.unshift(lastQuestion);
        
        animations.morphButton(dom.prevBtn, 'Loading...', 200);
        setTimeout(() => displayQuestion(), 200);
    }
}

function nextQuestion() {
    animations.morphButton(dom.nextBtn, 'Loading...', 200);
    setTimeout(() => displayQuestion(), 200);
}

function resetSession() {
    if (confirm('Are you sure you want to reset the current session? All progress will be lost.')) {
        animations.morphButton(dom.resetBtn, 'Resetting...', 300);
        setTimeout(() => initializeSection(), 300);
    }
}

// Show detailed statistics
function showDetailedStats() {
    const stats = state.globalStats;
    const modal = document.createElement('div');
    modal.className = 'stats-modal';
    modal.innerHTML = `
        <div class="stats-modal-content">
            <div class="stats-modal-header">
                <h3>📊 Detailed Statistics</h3>
                <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="stats-modal-body">
                <div class="stat-item">
                    <span class="stat-icon">🎯</span>
                    <span class="stat-text">Total Sessions: ${stats.totalSessions || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🏆</span>
                    <span class="stat-text">Best Accuracy: ${stats.bestAccuracy || 0}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-text">Time Spent: ${Math.round((stats.timeSpent || 0) / 60)} minutes</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => modal.classList.add('show'), 10);
}

// Enhanced sound effects
function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a pleasant success chord
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
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
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        // Silently fail if audio context is not available
    }
}

// Enhanced keyboard navigation with security
document.addEventListener('keydown', (e) => {
    // Prevent potential XSS through keyboard events
    if (e.target.closest('.option')) return;
    
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
        case 'Escape':
            // Close any open modals
            document.querySelectorAll('.stats-modal').forEach(modal => modal.remove());
            break;
    }
});

// Network status monitoring
window.addEventListener('online', () => {
    state.isOnline = true;
    console.log('🌐 Connection restored');
});

window.addEventListener('offline', () => {
    state.isOnline = false;
    console.log('📡 Working offline');
});

// Event listeners with enhanced security
dom.tabs.forEach(btn => {
    btn.addEventListener('click', () => {
        const section = security.sanitizeInput(btn.dataset.section);
        loadSection(section);
    });
});

dom.nextBtn.addEventListener('click', nextQuestion);
dom.prevBtn.addEventListener('click', goToPrevious);
dom.resetBtn.addEventListener('click', resetSession);

// Enhanced initialization with security
window.addEventListener('DOMContentLoaded', () => {
    // Initialize security
    security.initialize();
    
    // Initialize animations
    animations.initialize();
    
    // Load global stats securely
    loadGlobalStats();
    
    // Start with quantitative section
    loadSection('quantitative');
    
    console.log('🚀 Enhanced Quiz Application initialized');
});

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('📱 Service Worker registered'))
            .catch(registrationError => console.log('❌ Service Worker registration failed'));
    });
}

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`⚡ Page loaded in ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
        }, 0);
    });
}

// Smart Google Search Trigger after Stable Selection
let lastSelectedText = "";
let selectionTimeout = null;

function handleStableSelection() {
    const selection = window.getSelection().toString().trim();

    if (
        selection.length > 2 &&
        selection !== lastSelectedText
    ) {
        const selectionAnchor = window.getSelection().anchorNode;
        if (!selectionAnchor) return;

        const container = selectionAnchor.parentElement.closest('.question-container, .options-container, .explanation');
        if (container) {
            lastSelectedText = selection;

            const searchQuery = encodeURIComponent(selection);
            const searchURL = `https://www.google.com/search?q=${searchQuery}`;
            window.open(searchURL, '_blank');
        }
    }
}

// Debounced selection change listener (waits for user to stop selecting)
document.addEventListener('selectionchange', () => {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
        handleStableSelection();
    }, 2000); // Adjust delay here (2000ms is ideal)
});

// ✅ Enter key triggers next question when ready (after answering)
document.addEventListener('keydown', function (e) {
    // Allow Enter key even when an option is focused
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
    if (isTyping) return;

    // Check if Enter is pressed
    if (e.key === 'Enter') {
        const nextBtn = document.getElementById('next-btn');
        const anyOptionDisabled = document.querySelector('.option.disabled');

        // Only go to next if button is enabled AND answer was selected
        if (nextBtn && !nextBtn.disabled && anyOptionDisabled) {
            nextBtn.click();
            e.preventDefault();
        }
    }
});

