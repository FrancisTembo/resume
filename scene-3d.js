/**
 * Cyberpunk 3D Scene - Main Three.js scene management
 */

import * as THREE from 'three';
import { PerformanceMonitor } from './utils/performance.js';
import { lerp, random } from './utils/animations.js';
import { wireframeVertexShader } from './shaders/wireframe.vert.js';
import { wireframeFragmentShader } from './shaders/wireframe.frag.js';
import { particleVertexShader } from './shaders/particle.vert.js';
import { particleFragmentShader } from './shaders/particle.frag.js';
import { gridVertexShader, gridFragmentShader } from './shaders/grid.frag.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class CyberpunkScene {
    constructor(tierConfig) {
        this.config = tierConfig;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.bloomPass = null;
        this.performanceMonitor = new PerformanceMonitor();

        // Animation state
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.scroll = 0;
        this.time = 0;

        // 3D objects
        this.geometries = [];
        this.particleSystem = null;
        this.particlePositions = [];
        this.grid = null;
        this.easterEggCube = null;
        this.matrixMode = false;

        // Initialize scene
        this.init();

        // Initialize 3D objects
        this.initGeometries();
        this.initParticles();
        this.initGrid();
        this.initEasterEggCube();
    }

    init() {
        console.log('Initializing 3D scene with config:', this.config);

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0c0c0c, 15, 50);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 10);

        // Create renderer
        const canvas = document.getElementById('webgl-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: this.config.antialias,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(
            window.innerWidth * this.config.renderScale,
            window.innerHeight * this.config.renderScale
        );
        this.renderer.setPixelRatio(this.config.pixelRatio);
        this.renderer.setClearColor(0x000000, 0);

        // Enable shadows if supported
        if (this.config.shadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0x00ff88, 0.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Initialize post-processing if tier1
        if (this.config.postProcessing) {
            this.initPostProcessing();
        }

        // Setup event listeners
        this.setupEventListeners();

        console.log('3D scene initialized successfully');
    }

    initPostProcessing() {
        console.log('Initializing post-processing (bloom)');

        // Create composer
        this.composer = new EffectComposer(this.renderer);

        // Add render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Add bloom pass
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // strength
            0.4,  // radius
            0.8   // threshold
        );
        this.composer.addPass(this.bloomPass);

        console.log('✓ Post-processing initialized (bloom active)');
    }

    initGeometries() {
        const count = this.config.geometryCount;
        console.log(`Creating ${count} floating geometric shapes`);

        const geometryTypes = [
            new THREE.OctahedronGeometry(1, 0),
            new THREE.IcosahedronGeometry(1, 0),
            new THREE.TetrahedronGeometry(1, 0),
            new THREE.DodecahedronGeometry(1, 0)
        ];

        for (let i = 0; i < count; i++) {
            // Random geometry type
            const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)].clone();

            // Create wireframe material with custom shader
            const material = new THREE.ShaderMaterial({
                vertexShader: wireframeVertexShader,
                fragmentShader: wireframeFragmentShader,
                uniforms: {
                    color: { value: new THREE.Color(0x00ff88) },
                    opacity: { value: random(0.1, 0.25) }, // Reduced from 0.3-0.7 to 0.1-0.25
                    glowIntensity: { value: random(0.3, 0.6) }, // Reduced from 0.8-1.5
                    mousePos: { value: new THREE.Vector2(0, 0) }
                },
                transparent: true,
                wireframe: true,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Random position in 3D space (create depth layers)
            const depth = i < count / 3 ? -5 : i < (2 * count) / 3 ? 0 : 5; // Near, mid, far layers
            mesh.position.set(
                random(-15, 15),
                random(-10, 10),
                depth + random(-3, 3)
            );

            // Random scale
            const scale = random(0.5, 2.0);
            mesh.scale.set(scale, scale, scale);

            // Store velocity for animation
            mesh.userData = {
                velocity: new THREE.Vector3(
                    random(-0.02, 0.02),
                    random(-0.02, 0.02),
                    random(-0.01, 0.01)
                ),
                rotationVelocity: new THREE.Vector3(
                    random(-0.01, 0.01),
                    random(-0.01, 0.01),
                    random(-0.01, 0.01)
                ),
                originalPosition: mesh.position.clone()
            };

            this.geometries.push(mesh);
            this.scene.add(mesh);
        }

        console.log(`✓ Created ${this.geometries.length} geometric shapes`);
    }

    initParticles() {
        const count = this.config.particleCount;
        if (count === 0) return;

        console.log(`Creating ${count} particles`);

        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const alphas = new Float32Array(count);

        // Initialize particle positions and attributes
        for (let i = 0; i < count; i++) {
            const x = random(-20, 20);
            const y = random(-15, 15);
            const z = random(-10, 10);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            sizes[i] = random(2, 6);
            alphas[i] = random(0.15, 0.35); // Reduced from 0.3-0.8 to 0.15-0.35

            // Store position for connection line calculation
            this.particlePositions.push({
                x, y, z,
                vx: random(-0.01, 0.01),
                vy: random(-0.01, 0.01),
                vz: random(-0.005, 0.005)
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

        // Create particle material with custom shader
        const material = new THREE.ShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: {
                color: { value: new THREE.Color(0x00ff88) }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);

        // Create connection lines
        this.createParticleConnections();

        console.log(`✓ Created ${count} particles with connections`);
    }

    createParticleConnections() {
        const maxDistance = 5;
        const positions = [];

        // Find nearby particles and create connections
        for (let i = 0; i < this.particlePositions.length; i++) {
            for (let j = i + 1; j < this.particlePositions.length; j++) {
                const p1 = this.particlePositions[i];
                const p2 = this.particlePositions[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dz = p1.z - p2.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < maxDistance) {
                    positions.push(p1.x, p1.y, p1.z);
                    positions.push(p2.x, p2.y, p2.z);
                }
            }
        }

        if (positions.length > 0) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            const material = new THREE.LineBasicMaterial({
                color: 0x00ff88,
                opacity: 0.08, // Reduced from 0.15 to 0.08
                transparent: true,
                blending: THREE.AdditiveBlending
            });

            const lines = new THREE.LineSegments(geometry, material);
            this.scene.add(lines);
            this.particleConnections = lines;
        }
    }

    updateParticles() {
        if (!this.particleSystem) return;

        const positions = this.particleSystem.geometry.attributes.position.array;

        // Update particle positions
        for (let i = 0; i < this.particlePositions.length; i++) {
            const p = this.particlePositions[i];

            // Update position with velocity
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Boundary check and wrap around
            if (Math.abs(p.x) > 20) p.vx *= -1;
            if (Math.abs(p.y) > 15) p.vy *= -1;
            if (Math.abs(p.z) > 10) p.vz *= -1;

            // Mouse attraction
            const dx = this.mouse.x * 10 - p.x;
            const dy = this.mouse.y * 10 - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                p.vx += dx * 0.0001;
                p.vy += dy * 0.0001;
            }

            // Update buffer
            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;

        // Update connections
        this.updateParticleConnections();
    }

    updateParticleConnections() {
        if (!this.particleConnections) return;

        const maxDistance = 5;
        const positions = [];

        for (let i = 0; i < this.particlePositions.length; i++) {
            for (let j = i + 1; j < this.particlePositions.length; j++) {
                const p1 = this.particlePositions[i];
                const p2 = this.particlePositions[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dz = p1.z - p2.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < maxDistance) {
                    positions.push(p1.x, p1.y, p1.z);
                    positions.push(p2.x, p2.y, p2.z);
                }
            }
        }

        this.particleConnections.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        this.particleConnections.geometry.attributes.position.needsUpdate = true;
    }

    updateGeometries() {
        // Update each geometry's position and rotation
        for (const mesh of this.geometries) {
            // Drift animation
            mesh.position.add(mesh.userData.velocity);

            // Boundary check (loop back to opposite side)
            if (Math.abs(mesh.position.x) > 20) mesh.userData.velocity.x *= -1;
            if (Math.abs(mesh.position.y) > 12) mesh.userData.velocity.y *= -1;
            if (Math.abs(mesh.position.z - mesh.userData.originalPosition.z) > 5) {
                mesh.userData.velocity.z *= -1;
            }

            // Rotation
            mesh.rotation.x += mesh.userData.rotationVelocity.x;
            mesh.rotation.y += mesh.userData.rotationVelocity.y;
            mesh.rotation.z += mesh.userData.rotationVelocity.z;

            // Update shader uniforms (mouse position for interactive glow)
            if (mesh.material.uniforms) {
                mesh.material.uniforms.mousePos.value.set(this.mouse.x * 5, this.mouse.y * 5);
            }

            // Parallax effect based on depth
            const parallaxStrength = mesh.userData.originalPosition.z / 10;
            mesh.position.x += (this.mouse.x * parallaxStrength - mesh.position.x) * 0.01;
            mesh.position.y += (this.mouse.y * parallaxStrength - mesh.position.y) * 0.01;
        }
    }

    initGrid() {
        console.log('Creating infinite grid plane');

        // Create a large plane for the grid
        const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);

        // Create grid material with custom shader
        const material = new THREE.ShaderMaterial({
            vertexShader: gridVertexShader,
            fragmentShader: gridFragmentShader,
            uniforms: {
                color: { value: new THREE.Color(0x00ff88) },
                time: { value: 0 },
                fogNear: { value: 15 },
                fogFar: { value: 50 },
                gridSize: { value: 1.0 },
                lineWidth: { value: 0.05 }
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.grid = new THREE.Mesh(geometry, material);

        // Rotate to be horizontal
        this.grid.rotation.x = -Math.PI / 2;

        // Position below the scene
        this.grid.position.y = -8;

        this.scene.add(this.grid);

        console.log('✓ Created infinite grid plane');
    }

    initEasterEggCube() {
        console.log('Creating easter egg cube');

        // Create semi-transparent rotating cube in corner
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            opacity: 0.2, // Reduced from 0.4 to 0.2
            transparent: true
        });

        this.easterEggCube = new THREE.LineSegments(edges, material);
        this.easterEggCube.position.set(12, 8, -5);
        this.easterEggCube.userData = {
            rotationSpeed: { x: 0.01, y: 0.02, z: 0.01 },
            exploding: false,
            reforming: false,
            explosionParticles: [],
            colorCycle: 0
        };

        this.scene.add(this.easterEggCube);

        console.log('✓ Easter egg cube created at top-right');
    }

    updateEasterEggCube() {
        if (!this.easterEggCube) return;

        const cube = this.easterEggCube;

        // Color cycling
        cube.userData.colorCycle += 0.01;
        const hue = (cube.userData.colorCycle % 1.0) * 360;
        const color = this.hslToRgb(hue / 360, 1, 0.5);
        cube.material.color.setRGB(color.r, color.g, color.b);

        // Rotation animation
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
        cube.rotation.z += cube.userData.rotationSpeed.z;

        // Handle explosion
        if (cube.userData.exploding) {
            cube.userData.explosionParticles.forEach((p, index) => {
                p.position.add(p.velocity);
                p.velocity.multiplyScalar(0.98); // Friction
                p.material.opacity -= 0.02;

                if (p.material.opacity <= 0) {
                    this.scene.remove(p);
                    cube.userData.explosionParticles.splice(index, 1);
                }
            });

            // Start reforming after explosion is done
            if (cube.userData.explosionParticles.length === 0) {
                cube.userData.exploding = false;
                cube.userData.reforming = true;
                cube.material.opacity = 0;
                cube.visible = true;
            }
        }

        // Handle reforming
        if (cube.userData.reforming) {
            cube.material.opacity += 0.02;
            cube.scale.set(
                cube.scale.x * 0.95 + 1 * 0.05,
                cube.scale.y * 0.95 + 1 * 0.05,
                cube.scale.z * 0.95 + 1 * 0.05
            );

            if (cube.material.opacity >= 0.4) {
                cube.userData.reforming = false;
            }
        }
    }

    explodeEasterEggCube() {
        if (!this.easterEggCube || this.easterEggCube.userData.exploding) return;

        console.log('💥 Easter egg cube exploding!');

        this.easterEggCube.userData.exploding = true;
        this.easterEggCube.visible = false;

        // Create explosion particles
        for (let i = 0; i < 50; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0x00ff88 : 0x00ffff,
                transparent: true,
                opacity: 1
            });

            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.easterEggCube.position);

            // Random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = random(0.1, 0.5);
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                random(-0.2, 0.5),
                Math.sin(angle) * speed
            );

            this.scene.add(particle);
            this.easterEggCube.userData.explosionParticles.push(particle);
        }
    }

    // Helper: HSL to RGB conversion
    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return { r, g, b };
    }

    updateGrid() {
        if (!this.grid) return;

        // Update time for animated effects
        this.grid.material.uniforms.time.value = this.time;

        // Tilt grid based on scroll position
        const tiltAmount = this.scroll * 0.3; // Up to 0.3 radians
        this.grid.rotation.x = lerp(this.grid.rotation.x, -Math.PI / 2 + tiltAmount, 0.05);

        // Move grid position based on scroll (creates depth effect)
        this.grid.position.z = lerp(this.grid.position.z, this.scroll * -5, 0.05);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Mouse move for parallax
        document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);

        // Touch move for mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.onMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }, { passive: true });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
            window.innerWidth * this.config.renderScale,
            window.innerHeight * this.config.renderScale
        );

        // Update composer size if it exists
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    onMouseMove(event) {
        // Normalize mouse coordinates to -1 to 1 range
        this.mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    updateMousePosition() {
        // Smooth lerp to target position
        this.mouse.x = lerp(this.mouse.x, this.mouse.targetX, 0.05);
        this.mouse.y = lerp(this.mouse.y, this.mouse.targetY, 0.05);
    }

    updateScroll(scrollPercent) {
        this.scroll = scrollPercent;
    }

    update() {
        this.time += 0.01;
        this.updateMousePosition();

        // Scroll-based camera movement
        this.updateCameraFromScroll();

        // Update camera position based on mouse (parallax effect) - reduced intensity
        if (this.camera) {
            this.camera.position.x += lerp(0, this.mouse.x * 0.5, 0.03);
            this.camera.position.y += lerp(0, this.mouse.y * 0.5, 0.03);
            this.camera.lookAt(0, 0, 0);
        }

        // Update 3D objects
        this.updateGeometries();
        this.updateParticles();
        this.updateGrid();
        this.updateEasterEggCube();

        // Scroll-based scene morphing
        this.updateSceneMorphing();
    }

    updateCameraFromScroll() {
        if (!this.camera) return;

        // Camera dolly effect (move forward as user scrolls) - much more subtle
        const targetZ = 10 - this.scroll * 2; // Move from z=10 to z=8 (reduced range)
        this.camera.position.z = lerp(this.camera.position.z, targetZ, 0.03);

        // Very subtle rotation around Y-axis
        const targetRotationY = this.scroll * 0.05; // Reduced from 0.2 to 0.05
        this.camera.rotation.y = lerp(this.camera.rotation.y, targetRotationY, 0.03);
    }

    updateSceneMorphing() {
        const scrollPercent = this.scroll * 100;

        // 0-25%: Geometric shapes spread out
        if (scrollPercent < 25) {
            const spreadFactor = (scrollPercent / 25) * 1.5;
            this.geometries.forEach((mesh, i) => {
                const angle = (i / this.geometries.length) * Math.PI * 2;
                const targetX = mesh.userData.originalPosition.x + Math.cos(angle) * spreadFactor * 5;
                const targetY = mesh.userData.originalPosition.y + Math.sin(angle) * spreadFactor * 5;
                mesh.position.x = lerp(mesh.position.x, targetX, 0.02);
                mesh.position.y = lerp(mesh.position.y, targetY, 0.02);
            });
        }
        // 25-50%: Grid plane tilts up (handled in updateGrid)
        // 50-75%: Particle density increases (increase velocity)
        else if (scrollPercent >= 50 && scrollPercent < 75) {
            const densityFactor = ((scrollPercent - 50) / 25) * 2;
            this.particlePositions.forEach(p => {
                p.vx *= (1 + densityFactor * 0.01);
                p.vy *= (1 + densityFactor * 0.01);
            });
        }
        // 75-100%: Shapes converge into abstract formation
        else if (scrollPercent >= 75) {
            const convergeFactor = (scrollPercent - 75) / 25;
            this.geometries.forEach((mesh, i) => {
                const targetX = Math.sin(i * 0.5) * 3 * (1 - convergeFactor);
                const targetY = Math.cos(i * 0.5) * 3 * (1 - convergeFactor);
                const targetZ = (i % 3) * 2 * (1 - convergeFactor);

                mesh.position.x = lerp(mesh.position.x, targetX, 0.05);
                mesh.position.y = lerp(mesh.position.y, targetY, 0.05);
                mesh.position.z = lerp(mesh.position.z, mesh.userData.originalPosition.z + targetZ, 0.05);
            });
        }
    }

    render() {
        // Use composer if post-processing is enabled, otherwise use regular renderer
        if (this.composer) {
            this.composer.render();
        } else if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update performance monitor
        const fps = this.performanceMonitor.update();

        // Check if we should degrade quality
        if (this.performanceMonitor.shouldDegrade()) {
            console.warn('Performance degradation detected, FPS:', fps);
            // TODO: Implement quality reduction
        }

        // Update scene
        this.update();

        // Render
        this.render();
    }

    // Method to be called when entering "Matrix Mode" easter egg
    activateMatrixMode() {
        console.log('🟢 MATRIX MODE ACTIVATED');
        this.matrixMode = !this.matrixMode;

        if (this.matrixMode) {
            // Increase particle count
            this.config.particleCount = Math.min(this.config.particleCount * 2, 300);

            // Change colors to deeper green
            this.geometries.forEach(mesh => {
                if (mesh.material.uniforms) {
                    mesh.material.uniforms.color.value = new THREE.Color(0x00bb44);
                    mesh.material.uniforms.glowIntensity.value *= 1.5;
                }
            });

            // Increase particle velocity
            this.particlePositions.forEach(p => {
                p.vx *= 1.5;
                p.vy *= 1.5;
                p.vz *= 1.5;
            });

            // Pulse all objects
            let pulseCount = 0;
            const pulseInterval = setInterval(() => {
                this.geometries.forEach((mesh, i) => {
                    setTimeout(() => {
                        const scale = mesh.scale.x * 1.2;
                        mesh.scale.set(scale, scale, scale);
                        setTimeout(() => {
                            mesh.scale.set(scale / 1.2, scale / 1.2, scale / 1.2);
                        }, 100);
                    }, i * 50);
                });

                pulseCount++;
                if (pulseCount >= 3) {
                    clearInterval(pulseInterval);
                }
            }, 500);

            console.log('✓ Matrix Mode ON - Stronger effects activated');
        } else {
            // Restore original values
            this.geometries.forEach(mesh => {
                if (mesh.material.uniforms) {
                    mesh.material.uniforms.color.value = new THREE.Color(0x00ff88);
                    mesh.material.uniforms.glowIntensity.value /= 1.5;
                }
            });

            console.log('✓ Matrix Mode OFF');
        }
    }

    // Cleanup
    dispose() {
        this.renderer.dispose();
        // TODO: Dispose of all geometries, materials, textures
    }
}
