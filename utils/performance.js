/**
 * Performance monitoring and tier detection for adaptive 3D quality
 */

export class PerformanceMonitor {
    constructor() {
        this.frameTimes = [];
        this.maxSamples = 60;
        this.currentFPS = 60;
        this.degradationCount = 0;
        this.lastTime = performance.now();
    }

    update() {
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        this.frameTimes.push(delta);
        if (this.frameTimes.length > this.maxSamples) {
            this.frameTimes.shift();
        }

        // Calculate average FPS
        const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.currentFPS = Math.round(1000 / avgDelta);

        return this.currentFPS;
    }

    shouldDegrade() {
        if (this.currentFPS < 30) {
            this.degradationCount++;
            // Degrade if FPS is consistently low for 2 seconds
            return this.degradationCount > 120;
        }
        this.degradationCount = 0;
        return false;
    }

    getFPS() {
        return this.currentFPS;
    }
}

export function detectPerformanceTier() {
    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        console.log('WebGL not supported - using fallback');
        return 'fallback';
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('Reduced motion preferred - using fallback');
        return 'fallback';
    }

    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Try to get GPU info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let renderer = 'unknown';

    if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        console.log('GPU Detected:', renderer);
    }

    // Detect GPU tier
    if (isMobile) {
        // Mobile device detection
        if (renderer.includes('mali-t') || renderer.includes('adreno 4') || renderer.includes('adreno 5')) {
            console.log('Low-end mobile GPU detected - tier3');
            return 'tier3';
        }
        if (renderer.includes('adreno 6') || renderer.includes('mali-g')) {
            console.log('Mid-range mobile GPU detected - tier2');
            return 'tier2';
        }
        // High-end mobile
        console.log('High-end mobile device - tier2');
        return 'tier2';
    }

    // Desktop device
    // Check for integrated vs dedicated GPU
    if (renderer.includes('intel') || renderer.includes('intel(r) hd') || renderer.includes('intel(r) uhd')) {
        console.log('Integrated GPU detected - tier2');
        return 'tier2';
    }

    // Check for low-end dedicated GPUs
    if (renderer.includes('gt 1030') || renderer.includes('gt 730') || renderer.includes('rx 550')) {
        console.log('Low-end dedicated GPU - tier2');
        return 'tier2';
    }

    // Default to high performance for desktop
    console.log('High-performance device detected - tier1');
    return 'tier1';
}

export function getTierConfig(tier) {
    const configs = {
        tier1: {
            particleCount: 150,
            geometryCount: 20,
            postProcessing: true,
            shadows: true,
            antialias: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            renderScale: 1.0
        },
        tier2: {
            particleCount: 75,
            geometryCount: 10,
            postProcessing: false,
            shadows: false,
            antialias: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            renderScale: 1.0
        },
        tier3: {
            particleCount: 30,
            geometryCount: 5,
            postProcessing: false,
            shadows: false,
            antialias: false,
            pixelRatio: 1,
            renderScale: 0.75
        },
        fallback: {
            particleCount: 0,
            geometryCount: 0,
            postProcessing: false,
            shadows: false,
            antialias: false,
            pixelRatio: 1,
            renderScale: 1.0
        }
    };

    return configs[tier] || configs.tier2;
}
