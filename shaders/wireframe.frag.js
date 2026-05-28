// Wireframe fragment shader with glow
export const wireframeFragmentShader = `
    uniform vec3 color;
    uniform float opacity;
    uniform float glowIntensity;
    uniform vec2 mousePos;

    varying vec3 vPosition;
    varying vec3 vNormal;

    void main() {
        // Distance to mouse (for interactive glow)
        vec2 pos2D = vPosition.xy;
        float distToMouse = distance(pos2D, mousePos);
        float mouseGlow = 1.0 - smoothstep(0.0, 5.0, distToMouse);

        // Fresnel effect for edge glow
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);

        // Combine glow effects
        float glow = mix(glowIntensity, glowIntensity * 2.0, fresnel);
        glow += mouseGlow * 0.5;

        // Final color with glow
        vec3 finalColor = color * glow;

        gl_FragColor = vec4(finalColor, opacity);
    }
`;
