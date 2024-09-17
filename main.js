import { setupScene } from './sceneSetup.js';
import { initializeParticles, updateParticles } from './particleSystem.js';
import { CONFIG } from './config.js';

// State variables
let currentTimeStep = 0;
 
// Three.js setup
const { scene, camera, renderer, controls } = setupScene();

// Add renderer to DOM
document.body.appendChild(renderer.domElement);

// Data storage
const particleData = new Map();

// Initialize particles
initializeParticles(scene, CONFIG.MAX_PARTICLES);

let numberOfTimeSteps = 0;

// Event listener for file input
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        particleData.clear();
        
        Object.entries(data).forEach(([key, value]) => {
            particleData.set(parseInt(key, 10), value.map(item => ({...item, ID: parseInt(item.ID, 10)})));
        });
        
        currentTimeStep = 0;
        numberOfTimeSteps = particleData.size; 

        controls.update();

        console.log('Data loaded:', particleData);
        console.log('Number of time steps:', numberOfTimeSteps);
    }; 

    reader.readAsText(file);
});

const updateScene = () => {
    if (particleData.size > 0) {
        updateParticles(currentTimeStep, particleData);
        currentTimeStep = (currentTimeStep + 1) % numberOfTimeSteps;
    }
    controls.update();
    renderer.render(scene, camera);
};

const animate = () => {
    requestAnimationFrame(animate);
    updateScene();
};

animate();

console.log('Initial setup complete. Please load a JSON file to see particles.');