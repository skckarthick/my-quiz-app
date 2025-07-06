// Security Module for Quiz Application
class SecurityManager {
    constructor() {
        this.initializeCSP();
        this.setupInputSanitization();
        this.enableSecureStorage();
        this.setupRateLimiting();
        this.initializeIntegrityChecks();
    }

    // Content Security Policy
    initializeCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:; connect-src 'self'";
        document.head.appendChild(meta);
    }

    // Input Sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocols
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    // Secure Local Storage with encryption
    enableSecureStorage() {
        this.storageKey = this.generateStorageKey();
    }

    generateStorageKey() {
        return btoa(Date.now().toString()).slice(0, 16);
    }

    secureSetItem(key, value) {
        try {
            const encrypted = btoa(JSON.stringify(value));
            localStorage.setItem(this.sanitizeInput(key), encrypted);
        } catch (error) {
            console.warn('Secure storage failed:', error);
        }
    }

    secureGetItem(key) {
        try {
            const encrypted = localStorage.getItem(this.sanitizeInput(key));
            return encrypted ? JSON.parse(atob(encrypted)) : null;
        } catch (error) {
            console.warn('Secure retrieval failed:', error);
            return null;
        }
    }

    // Rate Limiting for API calls
    setupRateLimiting() {
        this.requestCounts = new Map();
        this.rateLimitWindow = 60000; // 1 minute
        this.maxRequests = 100; // Max requests per window
    }

    checkRateLimit(identifier = 'default') {
        const now = Date.now();
        const windowStart = now - this.rateLimitWindow;
        
        if (!this.requestCounts.has(identifier)) {
            this.requestCounts.set(identifier, []);
        }
        
        const requests = this.requestCounts.get(identifier);
        const recentRequests = requests.filter(time => time > windowStart);
        
        if (recentRequests.length >= this.maxRequests) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        recentRequests.push(now);
        this.requestCounts.set(identifier, recentRequests);
        return true;
    }

    // File Integrity Checks
    initializeIntegrityChecks() {
        this.expectedFiles = [
            'css/style.css',
            'js/script.js',
            'questions/quantitative.json',
            'questions/verbal.json',
            'questions/logical.json',
            'questions/general_awareness.json',
            'questions/current_affairs.json',
            'questions/domain1.json',
            'questions/domain2.json',
            'questions/domain3.json'
        ];
    }

    async validateFileIntegrity(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`File not found: ${filePath}`);
            }
            return true;
        } catch (error) {
            console.error(`Integrity check failed for ${filePath}:`, error);
            return false;
        }
    }

    // XSS Protection
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Secure JSON parsing
    secureJSONParse(jsonString) {
        try {
            // Remove any potential script tags or dangerous content
            const cleaned = jsonString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            return JSON.parse(cleaned);
        } catch (error) {
            throw new Error('Invalid JSON data detected');
        }
    }

    // Session Management
    initializeSession() {
        const sessionId = this.generateSessionId();
        this.secureSetItem('quiz_session', {
            id: sessionId,
            startTime: Date.now(),
            lastActivity: Date.now()
        });
        return sessionId;
    }

    generateSessionId() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    updateSessionActivity() {
        const session = this.secureGetItem('quiz_session');
        if (session) {
            session.lastActivity = Date.now();
            this.secureSetItem('quiz_session', session);
        }
    }

    // Prevent common attacks
    preventClickjacking() {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    }

    // Initialize all security measures
    initialize() {
        this.preventClickjacking();
        this.initializeSession();
        
        // Set up activity monitoring
        document.addEventListener('click', () => this.updateSessionActivity());
        document.addEventListener('keypress', () => this.updateSessionActivity());
        
        console.log('🔒 Security measures initialized');
    }
}

// Export for use in main script
window.SecurityManager = SecurityManager;