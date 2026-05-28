// Infinite grid vertex shader
export const gridVertexShader = `
    varying vec3 vWorldPosition;

    void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Infinite grid fragment shader
export const gridFragmentShader = `
    uniform vec3 color;
    uniform float time;
    uniform float fogNear;
    uniform float fogFar;
    uniform float gridSize;
    uniform float lineWidth;

    varying vec3 vWorldPosition;

    float grid(vec2 st, float size) {
        vec2 grid = abs(fract(st / size - 0.5) - 0.5) / fwidth(st / size);
        float line = min(grid.x, grid.y);
        return 1.0 - min(line, 1.0);
    }

    void main() {
        // Calculate grid
        float gridPattern = grid(vWorldPosition.xz, gridSize);

        // Add thicker lines every 5 units
        float majorGrid = grid(vWorldPosition.xz, gridSize * 5.0);
        gridPattern = max(gridPattern * 0.5, majorGrid);

        // Animated scan lines
        float scanLine = abs(sin((vWorldPosition.z + time * 2.0) * 0.5));
        scanLine = smoothstep(0.98, 1.0, scanLine);

        // Data pulse effect (random vertical lines that move across)
        float pulseX = fract(time * 0.1);
        float pulse = smoothstep(0.02, 0.0, abs(fract(vWorldPosition.x * 0.1) - pulseX));

        // Combine effects
        float finalGrid = gridPattern + scanLine * 0.3 + pulse * 0.5;

        // Distance fog
        float depth = length(vWorldPosition - cameraPosition);
        float fogFactor = smoothstep(fogNear, fogFar, depth);

        // Final color with fog
        vec3 finalColor = color * finalGrid;
        float alpha = (1.0 - fogFactor) * gridPattern * 0.3;

        // Add extra glow for scan lines and pulses
        alpha += (scanLine + pulse) * 0.2 * (1.0 - fogFactor);

        gl_FragColor = vec4(finalColor, alpha);
    }
`;
