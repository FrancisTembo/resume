// Particle fragment shader
export const particleFragmentShader = `
    uniform vec3 color;

    varying float vAlpha;

    void main() {
        // Circular particle with soft edges
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);

        if (dist > 0.5) {
            discard;
        }

        // Soft edge fade
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        alpha *= vAlpha;

        gl_FragColor = vec4(color, alpha);
    }
`;
