/**
 * Device detection and capability checking
 */

export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function supportsWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
        return false;
    }
}

export function supportsWebGL2() {
    try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
    } catch (e) {
        return false;
    }
}

export function supportsGyroscope() {
    return 'DeviceOrientationEvent' in window;
}

export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getDeviceInfo() {
    return {
        isMobile: isMobile(),
        isTouch: isTouch(),
        supportsWebGL: supportsWebGL(),
        supportsWebGL2: supportsWebGL2(),
        supportsGyroscope: supportsGyroscope(),
        prefersReducedMotion: prefersReducedMotion(),
        devicePixelRatio: window.devicePixelRatio,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
    };
}

export function logDeviceInfo() {
    const info = getDeviceInfo();
    console.log('=== Device Information ===');
    console.log('Mobile:', info.isMobile);
    console.log('Touch:', info.isTouch);
    console.log('WebGL:', info.supportsWebGL);
    console.log('WebGL2:', info.supportsWebGL2);
    console.log('Gyroscope:', info.supportsGyroscope);
    console.log('Reduced Motion:', info.prefersReducedMotion);
    console.log('Pixel Ratio:', info.devicePixelRatio);
    console.log('Viewport:', `${info.viewportWidth}x${info.viewportHeight}`);
    console.log('========================');
}
