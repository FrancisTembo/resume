// Import 3D scene and utilities
import * as THREE from 'three';
import { CyberpunkScene } from './scene-3d.js';
import { detectPerformanceTier, getTierConfig } from './utils/performance.js';
import { logDeviceInfo } from './utils/device.js';

document.addEventListener('DOMContentLoaded', () => {
    // Throttle utility for performance
    function throttle(func, wait) {
        let timeout = null;
        let previous = 0;

        return function executedFunction(...args) {
            const now = Date.now();
            const remaining = wait - (now - previous);

            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func.apply(this, args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    previous = Date.now();
                    timeout = null;
                    func.apply(this, args);
                }, remaining);
            }
        };
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ====================================================================
    // 3D Scene - DISABLED (using 2D matrix background instead)
    // ====================================================================
    let scene3D = null;
    console.log('✓ Using classic 2D matrix background (3D disabled)');
    // ====================================================================

    // Typing effect for name
    const nameElement = document.getElementById('name-text');
    const fullName = 'Francis Tembo';
    let charIndex = 0;

    const typeName = () => {
        if (charIndex < fullName.length) {
            nameElement.textContent += fullName.charAt(charIndex);
            charIndex++;
            setTimeout(typeName, 150);
        } else {
            // Start role typing after name is complete
            setTimeout(() => startRoleTyping(), 500);
        }
    };

    // Start typing after a brief delay
    setTimeout(typeName, 300);

    // ====================================================================
    // Typing Animation for Roles
    // ====================================================================
    const rolesElement = document.getElementById('typing-roles');
    const roles = [
        'Software Engineer',
        'Machine Learning Specialist',
        'Data Engineer',
        'Mechatronics Engineer',
        'Robotics Researcher',
        'Full-Stack Developer'
    ];

    let currentRoleIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function typeRole() {
        const currentRole = roles[currentRoleIndex];

        if (isDeleting) {
            // Delete character
            rolesElement.textContent = currentRole.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            typingSpeed = 50; // Faster when deleting
        } else {
            // Add character
            rolesElement.textContent = currentRole.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            typingSpeed = 100; // Normal typing speed
        }

        // Check if word is complete
        if (!isDeleting && currentCharIndex === currentRole.length) {
            // Pause at end of word
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && currentCharIndex === 0) {
            // Move to next role
            isDeleting = false;
            currentRoleIndex = (currentRoleIndex + 1) % roles.length;
            typingSpeed = 500; // Pause before next word
        }

        setTimeout(typeRole, typingSpeed);
    }

    function startRoleTyping() {
        if (rolesElement && !prefersReducedMotion) {
            typeRole();
            console.log('✓ Role typing animation started');
        } else if (rolesElement) {
            // Fallback: just show first role if motion is reduced
            rolesElement.textContent = roles[0];
        }
    }
    // ====================================================================

    // Dynamic Year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-links');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');

            // Update ARIA attribute
            const isExpanded = hamburger.classList.contains('active');
            hamburger.setAttribute('aria-expanded', isExpanded);

            // Prevent body scroll when menu is open
            document.body.style.overflow = isExpanded ? 'hidden' : '';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');

    const handleScroll = () => {
        // Add scrolled class to navbar
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active nav link based on scroll position
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', throttle(handleScroll, 100), { passive: true });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }

            // Close mobile menu when nav link is clicked
            if (hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    });

    // Cyberpunk Grid + Tron Lines Effect
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gridSize = 80;
    const particles = [];
    const particleCount = 20;
    const tronLines = [];
    const tronLineCount = 4;

    // Spatial partitioning for efficient particle connection detection
    class SpatialGrid {
        constructor(cellSize) {
            this.cellSize = cellSize;
            this.grid = new Map();
        }

        clear() {
            this.grid.clear();
        }

        getKey(x, y) {
            const cellX = Math.floor(x / this.cellSize);
            const cellY = Math.floor(y / this.cellSize);
            return `${cellX},${cellY}`;
        }

        insert(particle) {
            const key = this.getKey(particle.x, particle.y);
            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key).push(particle);
        }

        getNearby(particle, radius) {
            const nearby = [];
            const cellRadius = Math.ceil(radius / this.cellSize);
            const centerX = Math.floor(particle.x / this.cellSize);
            const centerY = Math.floor(particle.y / this.cellSize);

            for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
                for (let y = centerY - cellRadius; y <= centerY + cellRadius; y++) {
                    const key = `${x},${y}`;
                    if (this.grid.has(key)) {
                        nearby.push(...this.grid.get(key));
                    }
                }
            }
            return nearby;
        }
    }

    const spatialGrid = new SpatialGrid(200); // Cell size = connection radius

    // Particle class
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.size = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.5 + 0.3;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width ||
                this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }

        draw() {
            ctx.fillStyle = `rgba(0, 255, 136, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Tron Line class
    class TronLine {
        constructor() {
            this.reset();
        }

        reset() {
            this.horizontal = Math.random() > 0.5;
            if (this.horizontal) {
                this.x = -100;
                this.y = Math.random() * canvas.height;
                this.vx = Math.random() * 3 + 2;
                this.vy = 0;
            } else {
                this.x = Math.random() * canvas.width;
                this.y = -100;
                this.vx = 0;
                this.vy = Math.random() * 3 + 2;
            }
            this.length = Math.random() * 200 + 100;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.color = Math.random() > 0.8 ? '#00ffff' : '#00ff88'; // Cyan or Green
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.horizontal && this.x > canvas.width + 200) {
                this.reset();
            } else if (!this.horizontal && this.y > canvas.height + 200) {
                this.reset();
            }
        }

        draw() {
            const gradient = this.horizontal
                ? ctx.createLinearGradient(this.x - this.length, this.y, this.x, this.y)
                : ctx.createLinearGradient(this.x, this.y - this.length, this.x, this.y);

            gradient.addColorStop(0, `rgba(0, 255, 136, 0)`);
            gradient.addColorStop(0.5, `rgba(0, 255, 136, ${this.opacity})`);
            gradient.addColorStop(1, this.color === '#00ffff' ? `rgba(0, 255, 255, ${this.opacity})` : `rgba(0, 255, 136, ${this.opacity})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;

            ctx.beginPath();
            if (this.horizontal) {
                ctx.moveTo(this.x - this.length, this.y);
                ctx.lineTo(this.x, this.y);
            } else {
                ctx.moveTo(this.x, this.y - this.length);
                ctx.lineTo(this.x, this.y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Initialize Tron lines
    for (let i = 0; i < tronLineCount; i++) {
        tronLines.push(new TronLine());
    }

    let offset = 0;

    // Draw function
    function drawCyberpunkGrid() {
        // Clear with subtle fade
        ctx.fillStyle = 'rgba(12, 12, 12, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw very subtle grid
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Update and draw Tron lines
        tronLines.forEach(line => {
            line.update();
            line.draw();
        });

        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Clear and rebuild spatial grid
        spatialGrid.clear();
        particles.forEach(p => spatialGrid.insert(p));

        // Draw connections using spatial grid (O(n) average)
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.lineWidth = 0.5;

        const processed = new Set();
        particles.forEach(particle => {
            const nearby = spatialGrid.getNearby(particle, 200);
            nearby.forEach(neighbor => {
                if (particle !== neighbor && !processed.has(neighbor)) {
                    const dx = particle.x - neighbor.x;
                    const dy = particle.y - neighbor.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 200) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(neighbor.x, neighbor.y);
                        ctx.stroke();
                    }
                }
            });
            processed.add(particle);
        });

        offset += 0.1;
    }

    // Run the animation with requestAnimationFrame
    let animationFrameId;

    if (!prefersReducedMotion) {
        // Animate with requestAnimationFrame for better performance
        function animate() {
            drawCyberpunkGrid();
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    } else {
        // Static background for reduced motion
        ctx.fillStyle = 'rgba(12, 12, 12, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Resize canvas on window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Only add glitch effects if motion is enabled
    if (!prefersReducedMotion) {
        // Random glitch effect on experience cards
        const cards = document.querySelectorAll('.experience-card');
        setInterval(() => {
            const randomCard = cards[Math.floor(Math.random() * cards.length)];
            randomCard.style.animation = 'none';
            setTimeout(() => {
                randomCard.style.animation = '';
            }, 10);
        }, 4000);

        // Text glitch effect on hover
        const glitchElements = document.querySelectorAll('.experience-card, .skill-tag, .social-btn');

        glitchElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                // 40% chance to trigger glitch on hover
                if (Math.random() < 0.4) {
                    element.classList.add('glitch-active');
                    setTimeout(() => {
                        element.classList.remove('glitch-active');
                    }, 300);
                }
            });

            // Additional occasional glitch while hovering
            element.addEventListener('mouseover', () => {
                if (element.matches(':hover') && Math.random() < 0.15) {
                    element.classList.add('glitch-active');
                    setTimeout(() => {
                        element.classList.remove('glitch-active');
                    }, 300);
                }
            });
        });
    }

    // ====================================================================
    // Initialize Vanilla Tilt on Cards
    // ====================================================================
    function initCardTilt() {
        // Don't initialize tilt on mobile or if motion is reduced
        if (window.innerWidth < 768 || prefersReducedMotion) {
            console.log('Skipping card tilt (mobile or reduced motion)');
            return;
        }

        // Tilt options
        const tiltOptions = {
            max: 15,              // Maximum tilt rotation (degrees)
            perspective: 1000,    // Transform perspective
            scale: 1.05,          // Scale on hover
            speed: 400,           // Speed of transition
            glare: false,         // We have custom glare effect in CSS
            'max-glare': 0.5,
            gyroscope: false,     // Disable gyroscope on mobile
            reset: true,          // Reset on mouse leave
            'reset-to-start': false,
            easing: "cubic-bezier(.03,.98,.52,.99)"
        };

        // Apply tilt to experience cards
        const experienceCards = document.querySelectorAll('.experience-card');
        experienceCards.forEach((card, index) => {
            VanillaTilt.init(card, tiltOptions);

            // Update CSS custom properties for glare effect
            card.addEventListener('tiltChange', (e) => {
                const { percentageX, percentageY } = e.detail;
                card.style.setProperty('--mouse-x', `${percentageX}%`);
                card.style.setProperty('--mouse-y', `${percentageY}%`);
            });

            console.log(`✓ Tilt initialized on experience card ${index + 1}`);
        });

        // Apply tilt to project cards
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            VanillaTilt.init(card, tiltOptions);

            // Update CSS custom properties for glare effect
            card.addEventListener('tiltChange', (e) => {
                const { percentageX, percentageY } = e.detail;
                card.style.setProperty('--mouse-x', `${percentageX}%`);
                card.style.setProperty('--mouse-y', `${percentageY}%`);
            });

            console.log(`✓ Tilt initialized on project card ${index + 1}`);
        });

        // Apply tilt to skill tags (subtle effect)
        const skillTags = document.querySelectorAll('.skill-tag');
        const subtleTiltOptions = {
            ...tiltOptions,
            max: 8,
            scale: 1.1
        };

        skillTags.forEach((tag, index) => {
            VanillaTilt.init(tag, subtleTiltOptions);
        });

        console.log(`✓ Tilt effect initialized on ${experienceCards.length + projectCards.length} cards and ${skillTags.length} skill tags`);
    }

    // Initialize tilt after a short delay (ensure DOM is fully ready)
    setTimeout(initCardTilt, 500);
    // ====================================================================

    // ====================================================================
    // 3D Hero Name Text Effect
    // ====================================================================
    const heroName = document.querySelector('header h1');

    if (heroName && !prefersReducedMotion) {
        let heroRotX = 0;
        let heroRotY = 0;

        document.addEventListener('mousemove', (e) => {
            // Calculate rotation based on mouse position
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;

            // Target rotation values - reduced for readability
            const targetRotY = x * 3; // degrees (reduced from 10 to 3)
            const targetRotX = -y * 3; // degrees (reduced from 10 to 3)

            // Smooth lerp animation
            function animateHeroText() {
                heroRotY += (targetRotY - heroRotY) * 0.1;
                heroRotX += (targetRotX - heroRotX) * 0.1;

                heroName.style.transform = `perspective(1000px) rotateX(${heroRotX}deg) rotateY(${heroRotY}deg)`;

                // Continue animation if difference is significant
                if (Math.abs(targetRotY - heroRotY) > 0.1 || Math.abs(targetRotX - heroRotX) > 0.1) {
                    requestAnimationFrame(animateHeroText);
                }
            }

            animateHeroText();
        });

        console.log('✓ 3D hero name text effect initialized');
    }
    // ====================================================================

    // ====================================================================
    // Easter Eggs - DISABLED (3D scene not active)
    // ====================================================================
    console.log('Easter eggs disabled (3D scene not active)');
    // ====================================================================
});


