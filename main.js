import { setupScene } from './sceneSetup.js';
import { initializeParticles, updateParticles } from './particleSystem.js';
import { CONFIG } from './config.js';

// State variables
const particleData = new Map();
let currentTimeStep = 0;
let numberOfTimeSteps = 0;
 
// Three.js setup
const { scene, camera, renderer, controls } = setupScene();


// Add renderer to DOM
document.body.appendChild(renderer.domElement);

// Initialize particles
initializeParticles(scene, CONFIG.MAX_PARTICLES);

// Event listener for file input
const handleFileInput = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = processFileData;
    reader.readAsText(file);
};

const processFileData = (e) => {
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

document.getElementById('fileInput').addEventListener('change', handleFileInput);


const animate = () => {
    requestAnimationFrame(animate);
    updateScene(); 
}; 

const updateScene = () => {
    if (particleData.size > 0) {
        updateParticles(currentTimeStep, particleData);
        currentTimeStep = (currentTimeStep + 1) % numberOfTimeSteps;
    }
    controls.update();
    renderer.render(scene, camera);
};

animate();

console.log('Initial setup complete. Please load a JSON file to see particles.');