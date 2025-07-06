// Advanced Animations Module
class AnimationManager {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
        this.setupIntersectionObserver();
        this.initializeParticleSystem();
    }

    // Intersection Observer for scroll animations
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerScrollAnimation(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
    }

    // Observe elements for scroll animations
    observeElement(element) {
        this.observer.observe(element);
    }

    // Trigger scroll-based animations
    triggerScrollAnimation(element) {
        element.classList.add('animate-in');
        
        if (element.classList.contains('stat-box')) {
            this.animateCounter(element);
        }
        
        if (element.classList.contains('tab-btn')) {
            this.staggerAnimation(element);
        }
    }

    // Counter animation for statistics
    animateCounter(element) {
        const valueElement = element.querySelector('.stat-value');
        if (!valueElement) return;

        const finalValue = parseInt(valueElement.textContent) || 0;
        const duration = 1000;
        const steps = 60;
        const increment = finalValue / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            current += increment;
            step++;
            
            if (step >= steps) {
                current = finalValue;
                clearInterval(timer);
            }
            
            valueElement.textContent = Math.floor(current);
        }, duration / steps);
    }

    // Stagger animation for multiple elements
    staggerAnimation(element) {
        const siblings = Array.from(element.parentElement.children);
        const index = siblings.indexOf(element);
        
        setTimeout(() => {
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
        }, index * 100);
    }

    // Particle system for celebrations
    initializeParticleSystem() {
        this.particles = [];
        this.particleCanvas = this.createParticleCanvas();
    }

    createParticleCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        canvas.style.opacity = '0';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        this.resizeCanvas(canvas);
        
        window.addEventListener('resize', () => this.resizeCanvas(canvas));
        
        return { canvas, ctx };
    }

    resizeCanvas(canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Create celebration particles
    createCelebrationParticles(x, y, count = 50) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x || window.innerWidth / 2,
                y: y || window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                life: 1,
                decay: Math.random() * 0.02 + 0.01,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
        
        this.startParticleAnimation();
    }

    startParticleAnimation() {
        this.particleCanvas.canvas.style.opacity = '1';
        this.animateParticles();
    }

    animateParticles() {
        const { canvas, ctx } = this.particleCanvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3; // gravity
            particle.life -= particle.decay;
            
            if (particle.life > 0) {
                ctx.save();
                ctx.globalAlpha = particle.life;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
            }
            return false;
        });
        
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animateParticles());
        } else {
            this.particleCanvas.canvas.style.opacity = '0';
        }
    }

    // Morphing button animation
    morphButton(button, newText, duration = 300) {
        const originalText = button.textContent;
        const originalWidth = button.offsetWidth;
        
        button.style.transition = `all ${duration}ms ease`;
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            button.textContent = newText;
            button.style.transform = 'scale(1)';
        }, duration / 2);
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.width = originalWidth + 'px';
        }, duration * 2);
    }

    // Ripple effect
    createRipple(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    // Floating elements animation
    createFloatingElements() {
        const container = document.querySelector('.container');
        const shapes = ['circle', 'triangle', 'square'];
        
        for (let i = 0; i < 5; i++) {
            const shape = document.createElement('div');
            shape.className = `floating-shape floating-${shapes[Math.floor(Math.random() * shapes.length)]}`;
            shape.style.cssText = `
                position: absolute;
                width: ${Math.random() * 20 + 10}px;
                height: ${Math.random() * 20 + 10}px;
                background: rgba(59, 130, 246, 0.1);
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float-${i} ${Math.random() * 10 + 10}s ease-in-out infinite;
                pointer-events: none;
                z-index: -1;
            `;
            container.appendChild(shape);
        }
    }

    // Text typing animation
    typeText(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const timer = setInterval(() => {
            element.textContent += text[i];
            i++;
            
            if (i >= text.length) {
                clearInterval(timer);
            }
        }, speed);
    }

    // Shake animation for errors
    shakeElement(element) {
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    // Pulse animation for notifications
    pulseElement(element, duration = 1000) {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    // Initialize all animations
    initialize() {
        // Add CSS for animations
        this.addAnimationStyles();
        
        // Observe elements for scroll animations
        document.querySelectorAll('.stat-box, .tab-btn, .quiz-container').forEach(el => {
            this.observeElement(el);
        });
        
        // Create floating elements
        this.createFloatingElements();
        
        // Add ripple effect to buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .option')) {
                this.createRipple(e.target, e);
            }
        });
        
        console.log('✨ Animation system initialized');
    }

    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple-animation {
                to { transform: scale(2); opacity: 0; }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .animate-in {
                animation: slideInUp 0.6s ease-out;
            }
            
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            ${Array.from({length: 5}, (_, i) => `
                @keyframes float-${i} {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-${Math.random() * 20 + 10}px) rotate(${Math.random() * 10 + 5}deg); }
                    66% { transform: translateY(${Math.random() * 20 + 10}px) rotate(-${Math.random() * 10 + 5}deg); }
                }
            `).join('')}
        `;
        document.head.appendChild(style);
    }
}

// Export for use in main script
window.AnimationManager = AnimationManager;