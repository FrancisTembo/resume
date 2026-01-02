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

    // Typing effect for name
    const nameElement = document.getElementById('name-text');
    const fullName = 'Francis Tembo';
    let charIndex = 0;

    const typeName = () => {
        if (charIndex < fullName.length) {
            nameElement.textContent += fullName.charAt(charIndex);
            charIndex++;
            setTimeout(typeName, 150);
        }
    };

    // Start typing after a brief delay
    setTimeout(typeName, 300);

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
});
