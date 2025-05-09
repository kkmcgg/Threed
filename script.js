let scene, camera, renderer, particlesMesh;
let particlesData = [];
let particleCount = 5000;
let particleSpeedFactor = 0.01;
let particleBaseColor = new THREE.Color(0x00ffaa);
let particleSize = 0.1;
let clock = new THREE.Clock();

const MAX_PARTICLES = 20000; // Safety limit

// --- Default Parameters ---
const defaultParams = {
    particleCount: 5000,
    speedFactor: 0.01,
    baseColor: new THREE.Color(0x00ffaa),
    size: 0.1,
    bgColor: new THREE.Color(0x111111)
};

function initThree() {
    const container = document.getElementById('three-canvas-container');

    scene = new THREE.Scene();
    scene.background = defaultParams.bgColor.clone();

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 20; // Adjusted for particle spread

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    resetParticles();

    window.addEventListener('resize', onWindowResize, false);
}

function createParticles() {
    if (particlesMesh) {
        scene.remove(particlesMesh);
        particlesMesh.geometry.dispose();
        particlesMesh.material.dispose();
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    particlesData = []; // Reset particle custom data

    const spread = 30; // How far particles can initially spread

    for (let i = 0; i < particleCount; i++) {
        // Positions
        positions[i * 3] = (Math.random() - 0.5) * spread * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 2;

        // Colors (slight variations from base)
        const color = particleBaseColor.clone();
        color.offsetHSL(Math.random() * 0.2 - 0.1, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // Store custom data for animation
        particlesData.push({
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            ),
            lifetime: Math.random() * 100 + 50, // Frames to live
            age: 0
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: particleSize,
        vertexColors: true,
        blending: THREE.AdditiveBlending, // Nice for glowing effects
        transparent: true,
        depthWrite: false // Often better for transparent particles
    });

    particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);
}

function animateParticles() {
    if (!particlesMesh) return;

    const positions = particlesMesh.geometry.attributes.position.array;
    const colors = particlesMesh.geometry.attributes.color.array;
    const deltaTime = clock.getDelta(); // For frame-rate independent speed

    const time = Date.now() * 0.0005; // For noise-based movement

    for (let i = 0; i < particleCount; i++) {
        const pData = particlesData[i];

        // Simple noise-like movement (can be replaced with Perlin noise for more complex flow)
        pData.velocity.x += (Math.random() - 0.5) * 0.05 * particleSpeedFactor;
        pData.velocity.y += (Math.random() - 0.5) * 0.05 * particleSpeedFactor;
        pData.velocity.z += (Math.random() - 0.5) * 0.05 * particleSpeedFactor;

        // Apply velocity
        positions[i * 3] += pData.velocity.x * deltaTime * 100 * particleSpeedFactor; // deltaTime adjustment
        positions[i * 3 + 1] += pData.velocity.y * deltaTime * 100 * particleSpeedFactor;
        positions[i * 3 + 2] += pData.velocity.z * deltaTime * 100 * particleSpeedFactor;

        // Boundary check and respawn (simple wrap-around)
        const boundary = 30;
        if (Math.abs(positions[i * 3]) > boundary) positions[i * 3] *= -0.95; // Dampen and reverse
        if (Math.abs(positions[i * 3 + 1]) > boundary) positions[i * 3 + 1] *= -0.95;
        if (Math.abs(positions[i * 3 + 2]) > boundary) positions[i * 3 + 2] *= -0.95;


        // Optional: Color evolution or fading (example: fade to black)
        // pData.age += deltaTime;
        // const lifeRatio = pData.age / pData.lifetime;
        // if (lifeRatio > 1) {
        //     // Respawn (could be more sophisticated)
        //     positions[i * 3] = (Math.random() - 0.5) * boundary;
        //     // ... reset other properties
        //     pData.age = 0;
        // }
        // colors[i * 3 + 0] = particleBaseColor.r * (1 - lifeRatio);
        // colors[i * 3 + 1] = particleBaseColor.g * (1 - lifeRatio);
        // colors[i * 3 + 2] = particleBaseColor.b * (1 - lifeRatio);
    }

    particlesMesh.geometry.attributes.position.needsUpdate = true;
    // if (colors were changed per frame) particlesMesh.geometry.attributes.color.needsUpdate = true;
}


function animate() {
    requestAnimationFrame(animate);
    animateParticles();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('three-canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- CLI ---
const cliInput = document.getElementById('cli-input');
const cliOutput = document.getElementById('cli-output');

function appendToOutput(text, type = 'info') {
    const p = document.createElement('p');
    p.textContent = text;
    if (type === 'error') p.style.color = '#ff6666';
    if (type === 'success') p.style.color = '#66ff66';
    cliOutput.appendChild(p);
    cliOutput.scrollTop = cliOutput.scrollHeight; // Auto-scroll
}

cliInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const commandText = cliInput.value.trim();
        if (commandText) {
            appendToOutput(`> ${commandText}`);
            processCommand(commandText);
            cliInput.value = '';
        }
    }
});

function processCommand(commandText) {
    const parts = commandText.toLowerCase().split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    try {
        switch (command) {
            case 'help':
                appendToOutput("Available commands:");
                appendToOutput("  help                          - Show this help message");
                appendToOutput("  particles <number>            - Set number of particles (e.g., particles 10000)");
                appendToOutput("  speed <factor>                - Set particle speed factor (e.g., speed 0.02)");
                appendToOutput("  color <r> <g> <b> / <hex>   - Set particle base color (0-1 or #RRGGBB, e.g., color 0 1 0 or color #00ff00)");
                appendToOutput("  bgcolor <r> <g> <b> / <hex> - Set background color (e.g., bgcolor 0.1 0.1 0.1 or bgcolor #222222)");
                appendToOutput("  size <value>                  - Set particle size (e.g., size 0.05)");
                appendToOutput("  reset                         - Reset all parameters to default");
                break;

            case 'particles':
                const num = parseInt(args[0]);
                if (isNaN(num) || num <= 0 || num > MAX_PARTICLES) {
                    appendToOutput(`Error: Invalid particle count. Must be between 1 and ${MAX_PARTICLES}.`, 'error');
                } else {
                    particleCount = num;
                    createParticles(); // Recreate with new count
                    appendToOutput(`Particle count set to ${particleCount}`, 'success');
                }
                break;

            case 'speed':
                const speed = parseFloat(args[0]);
                if (isNaN(speed) || speed < 0) {
                    appendToOutput('Error: Invalid speed factor. Must be a non-negative number.', 'error');
                } else {
                    particleSpeedFactor = speed;
                    appendToOutput(`Particle speed factor set to ${particleSpeedFactor}`, 'success');
                }
                break;

            case 'color':
            case 'bgcolor':
                let newColor = new THREE.Color();
                if (args.length === 1 && args[0].startsWith('#')) {
                    newColor.set(args[0]);
                } else if (args.length === 3) {
                    const r = parseFloat(args[0]);
                    const g = parseFloat(args[1]);
                    const b = parseFloat(args[2]);
                    if (isNaN(r) || isNaN(g) || isNaN(b) || r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
                        appendToOutput('Error: Invalid RGB values. Must be between 0 and 1.', 'error');
                        return;
                    }
                    newColor.setRGB(r, g, b);
                } else {
                    appendToOutput('Error: Invalid color format. Use <r> <g> <b> (0-1) or <#hex>.', 'error');
                    return;
                }

                if (command === 'color') {
                    particleBaseColor.copy(newColor);
                    // Re-color existing particles (or recreate for simplicity if colors are complex)
                    createParticles(); // Easiest way to update all colors with variations
                    appendToOutput(`Particle base color set to #${particleBaseColor.getHexString()}`, 'success');
                } else { // bgcolor
                    scene.background = newColor;
                    appendToOutput(`Background color set to #${newColor.getHexString()}`, 'success');
                }
                break;

            case 'size':
                const size = parseFloat(args[0]);
                if (isNaN(size) || size <= 0) {
                    appendToOutput('Error: Invalid particle size. Must be a positive number.', 'error');
                } else {
                    particleSize = size;
                    if (particlesMesh) {
                        particlesMesh.material.size = particleSize;
                        particlesMesh.material.needsUpdate = true; // Important!
                    }
                    appendToOutput(`Particle size set to ${particleSize}`, 'success');
                }
                break;

            case 'reset':
                resetParameters();
                appendToOutput('All parameters reset to default.', 'success');
                break;

            default:
                appendToOutput(`Error: Unknown command '${command}'. Type 'help' for options.`, 'error');
        }
    } catch (e) {
        appendToOutput(`Error processing command: ${e.message}`, 'error');
        console.error(e);
    }
}

function resetParticles() {
    // Called by initThree and resetParameters
    particleCount = defaultParams.particleCount;
    particleSpeedFactor = defaultParams.speedFactor;
    particleBaseColor.copy(defaultParams.baseColor);
    particleSize = defaultParams.size;
    createParticles(); // This will also apply the current color and size
}

function resetParameters() {
    resetParticles(); // Resets particle specific parameters and recreates them
    scene.background.copy(defaultParams.bgColor);
    if (particlesMesh) {
        particlesMesh.material.size = particleSize; // Ensure size is updated on material
        particlesMesh.material.needsUpdate = true;
    }
}


// --- Start ---
initThree();
animate();
