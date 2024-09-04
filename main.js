// Constants
const FOV = 75;
const NEAR_PLANE = 10;
const FAR_PLANE = 400;
const Z_POSITION = -180;
const Z_OFFSET = 5;
const ROTATION_SPEED = 0.005;
const ANIMATION_SPEED = 0.5;
const CONTAINER_SIZE = { width: 400, height: 240 };
const SCALE_FACTOR = 4;
const Y_OFFSET = 170;
const HALF_PI = Math.PI / 2;

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR_PLANE, FAR_PLANE);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Fog setup
const farFog = Math.abs(Z_POSITION * 2.3);
const nearFog = Math.abs(Z_POSITION / 2.3);
scene.fog = new THREE.Fog(0x000000, nearFog, farFog);

// Particles
const particleData = [];
let currentTimeStep = 1;
let numberOfTimeSteps = null;

// Create container
const containerGeometry = new THREE.BoxGeometry(CONTAINER_SIZE.width, CONTAINER_SIZE.height, 10);
const containerEdges = new THREE.EdgesGeometry(containerGeometry);
const container = new THREE.LineSegments(containerEdges, new THREE.LineBasicMaterial({color: 0xffffff}));
scene.add(container);

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
            
            numberOfTimeSteps = particleData.length;
    };
    reader.readAsText(file);
});

function animate() {
    requestAnimationFrame(animate);

    if (particleData.length > 0) {
        currentTimeStep = (currentTimeStep + ANIMATION_SPEED) % numberOfTimeSteps;
        addParticles(currentTimeStep);
    }

    angle += ROTATION_SPEED * ANIMATION_SPEED;
    camera.position.set(120 * Math.cos(angle), 120 * Math.sin(angle), -Z_OFFSET*currentTimeStep + Z_POSITION);
    camera.lookAt(0, 0, -Z_OFFSET*currentTimeStep);    

    renderer.render(scene, camera);
}

function addParticles(timeStep) {
    const material = new THREE.LineBasicMaterial({color: 0xffffff});
  
    const z = -timeStep * Z_OFFSET;
    const layer = particleData[Math.floor(timeStep)] || [];
    
    layer.forEach(data => {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.5, 2, 2), material);
        particle.position.set(data.x * SCALE_FACTOR, (data.y - Y_OFFSET) * SCALE_FACTOR, z);
        scene.add(particle);
    });
}


animate();
