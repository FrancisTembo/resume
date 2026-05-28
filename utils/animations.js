/**
 * Shared animation utilities and easing functions
 */

// Linear interpolation
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Smooth step interpolation
export function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

// Easing functions
export const easing = {
    // Ease in cubic
    easeInCubic: (t) => t * t * t,

    // Ease out cubic
    easeOutCubic: (t) => (--t) * t * t + 1,

    // Ease in-out cubic
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    // Ease in expo
    easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),

    // Ease out expo
    easeOutExpo: (t) => t === 1 ? 1 : -Math.pow(2, -10 * t) + 1,

    // Elastic ease out
    easeOutElastic: (t) => {
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },

    // Bounce ease out
    easeOutBounce: (t) => {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
};

// Map a value from one range to another
export function map(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

// Clamp a value between min and max
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Get random value in range
export function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Get random integer in range
export function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

// Normalize mouse coordinates to -1 to 1 range
export function normalizeMouseCoords(clientX, clientY) {
    return {
        x: (clientX / window.innerWidth) * 2 - 1,
        y: -(clientY / window.innerHeight) * 2 + 1
    };
}

// Convert scroll position to 0-1 range
export function normalizeScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return clamp(window.scrollY / maxScroll, 0, 1);
}

// Spring physics simulation
export class Spring {
    constructor(stiffness = 0.1, damping = 0.8) {
        this.position = 0;
        this.velocity = 0;
        this.target = 0;
        this.stiffness = stiffness;
        this.damping = damping;
    }

    setTarget(target) {
        this.target = target;
    }

    update() {
        const force = (this.target - this.position) * this.stiffness;
        this.velocity += force;
        this.velocity *= this.damping;
        this.position += this.velocity;

        return this.position;
    }

    isAtRest(threshold = 0.01) {
        return Math.abs(this.velocity) < threshold &&
               Math.abs(this.target - this.position) < threshold;
    }
}

// Throttle function for event handlers
export function throttle(func, wait) {
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

// Debounce function for event handlers
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
