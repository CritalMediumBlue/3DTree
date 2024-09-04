// Constants
const FOV = 75;
const NEAR_PLANE = 10;
const FAR_PLANE = 1000;
const Z_POSITION = -150;
const Z_OFFSET = 1;
const ROTATION_SPEED = 0.002;
const ANIMATION_SPEED = 0.99;
const CONTAINER_SIZE = { width: 400, height: 240 };
const SCALE_FACTOR = 4;
const Y_OFFSET = 170;
const HALF_PI = Math.PI / 2;
const MAX_PARTICLES = 2000; // Maximum number of particles to keep in the scene
const MAX_CONTAINER_SCALE = 50; // Maximum scale for the container
const allIds = [];
let interestingIdsSet; // Changed to a Set for faster lookups

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR_PLANE, FAR_PLANE);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Fog setup
const farFog = Math.abs(Z_POSITION * 3);
const nearFog = Math.abs(Z_POSITION / 3);
scene.fog = new THREE.Fog(0xff00ff, nearFog, farFog);

// Particles
const particleData = [];
let currentTimeStep = 1;
let numberOfTimeSteps = null;
const addedParticles = []; // Array to store added particles

// Create container
const containerGeometry = new THREE.BoxGeometry(CONTAINER_SIZE.width, CONTAINER_SIZE.height, 20);
const containerEdges = new THREE.EdgesGeometry(containerGeometry);
const container = new THREE.LineSegments(containerEdges, new THREE.LineBasicMaterial({color: 0xffffff}));
scene.add(container);
const material = new THREE.LineBasicMaterial({ color: 0xffffff, 
    transparent: true, 
    opacity: 0.5,
});
let angle = 0;

// File input handler
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        particleData.length = 0; // Clear existing data
        
        // Convert string keys to integer keys
        Object.keys(data).forEach(key => {
            const intKey = parseInt(key, 10); 
            particleData[intKey] = data[key];
        });

        // Generate an array of all the IDs in the data and turn them into BigInts
        particleData.forEach(layer => {
            layer.forEach(data => {
                allIds.push(BigInt(data.ID));
            });
        });
        
        numberOfTimeSteps = particleData.length;
        generateInterestingIds();
    };
    reader.readAsText(file);
});

let randomInt = 1697;//1466;

function generateInterestingIds() {
    const interestingIds = [];
    const initialId = BigInt(randomInt);
    console.log(initialId);
    const generations = 9; // Number of generations to add

    // Add the initial ID
    interestingIds.push(initialId);
    // Generate IDs for the specified number of generations
    for (let generation = 0; generation < generations; generation++) {
        const currentGenerationSize = interestingIds.length;
        for (let i = 0; i < currentGenerationSize; i++) {
            const parentId = interestingIds[i];
            const leftChildId = parentId * BigInt(2);
            const rightChildId = parentId * BigInt(2) + BigInt(1);
            interestingIds.push(leftChildId);
            interestingIds.push(rightChildId);
        }
    }

    // Convert interesting IDs to a Set for faster lookups
    interestingIdsSet = new Set(interestingIds.map(id => id.toString()));
}

// add an event listener to restart the animation when the user clicks the s key
document.addEventListener('keydown', (event) => {
    if (event.key === 's') {
        currentTimeStep = 1;
        addedParticles.forEach(particle => {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        });
        addedParticles.length = 0;
        randomInt = Math.floor(Math.random() * (1000)) + 1000;

        generateInterestingIds();
    }
});

function animate() {
    requestAnimationFrame(animate);

    if (particleData.length > 0) {
        currentTimeStep = (currentTimeStep + ANIMATION_SPEED) % numberOfTimeSteps;

        if(addedParticles.length > MAX_PARTICLES*1.1) {
            removeOldParticles(); // Remove old particles before adding new ones
        }

        addParticles(currentTimeStep);
        
        container.position.z = -Z_OFFSET * currentTimeStep;
    }

    angle += ROTATION_SPEED * ANIMATION_SPEED;
    const cameraX = 120 * Math.cos(angle);
    const cameraY = 120 * Math.sin(angle);
    const cameraZ = -Z_OFFSET * currentTimeStep + Z_POSITION;
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(0, 0, -Z_OFFSET * currentTimeStep);    

    renderer.render(scene, camera);
}

function addParticles(timeStep) {


    const z = -timeStep * Z_OFFSET;
    const layer = particleData[Math.floor(timeStep)] || [];

    layer.forEach(data => {
        if (interestingIdsSet.has(data.ID)) {
            const x = data.x * SCALE_FACTOR;
            const y = (data.y - Y_OFFSET) * SCALE_FACTOR;
            const length = data.length * SCALE_FACTOR;
            const angle = data.angle * Math.PI + HALF_PI;

            const startX = x - length * Math.cos(angle) / 2;
            const startY = y - length * Math.sin(angle) / 2;
            const endX = x + length * Math.cos(angle) / 2;
            const endY = y + length * Math.sin(angle) / 2;
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(startX, startY, z),
                new THREE.Vector3(endX, endY, z)
            ]);

            const line = new THREE.Line(geometry, material);
            line.lineWidth = 3;
            scene.add(line);
            addedParticles.push(line); // Store the added particle
        }
    });
}

function removeOldParticles() {
    while (addedParticles.length > MAX_PARTICLES) {
        const oldestParticle = addedParticles.shift(); // Remove the oldest particle from the array
        scene.remove(oldestParticle); // Remove the particle from the scene
        oldestParticle.geometry.dispose(); // Dispose of the geometry
        oldestParticle.material.dispose(); // Dispose of the material
        
    
    }
}

animate();


