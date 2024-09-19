import { setupScene } from './sceneSetup.js';
import { createBacteriumSystem, updateBacteria } from './bacteriumSystem.js';
import { CONFIG } from './config.js';

// State variables
const bacteriumData = new Map();
let currentTimeStep = 0;
let numberOfTimeSteps = 0;

// Three.js setup 
const { scene, camera, renderer, controls } = setupScene();

// Add renderer to DOM
document.body.appendChild(renderer.domElement);

// Initialize bacterium system
const bacteriumSystem = createBacteriumSystem(scene);

/**
 * Handles file input and triggers file reading
 * @param {Event} event - The file input event
 */
const handleFileInput = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = processFileData;
    reader.readAsText(file);
};

/**
 * Processes the loaded file data
 * @param {ProgressEvent<FileReader>} e - The file reader event
 */
const processFileData = (e) => {
    try {
        const data = JSON.parse(e.target.result);
        initializeBacteriumData(data);
        controls.update();
        console.log('Number of time steps:', numberOfTimeSteps);
    } catch (error) {
        console.error('Error processing file data:', error);
        alert('Error processing file. Please ensure it is a valid JSON file.');
    }
};

/**
 * Initializes bacterium data from parsed JSON
 * @param {Object} data - The parsed JSON data
 */
const initializeBacteriumData = (data) => {
    bacteriumData.clear();
    Object.entries(data).forEach(([key, value]) => {
        // Skip the header row
        if (key === "time") return;
        
        bacteriumData.set(parseInt(key, 10), value.map(item => {
            // Skip items with non-numeric IDs
            if (isNaN(item.ID)) return null;
            return { ...item, ID: BigInt(item.ID) };
        }).filter(item => item !== null));
    });
    currentTimeStep = 0;
    numberOfTimeSteps = bacteriumData.size;
};

// Add event listener for file input
document.getElementById('fileInput').addEventListener('change', handleFileInput);

/**
 * Animation loop
 */
const animate = () => {
    requestAnimationFrame(animate);
        camera.lookAt(100, 100, 0);

    updateScene();
};

/**
 * Updates the scene for each frame
 */
const updateScene = () => {
    if (bacteriumData.size > 0) {
        updateBacteria(bacteriumSystem, Math.floor(currentTimeStep), bacteriumData);
        currentTimeStep = (currentTimeStep + 1) % numberOfTimeSteps;
        //clean color memo if the current time step is 0
        if (currentTimeStep === 0) {
            bacteriumSystem.colorMemo.clear(); // the function clear() removes all key-value pairs from the Map object
        }
    }
    controls.update();
    renderer.render(scene, camera);
};

// Start animation loop
animate();
