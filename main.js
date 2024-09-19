import { setupScene } from './sceneSetup.js';
import { createBacteriumSystem, updateBacteria, getMagentaCount, getCyanCount, clearColorMemo } from './bacteriumSystem.js';
import { CONFIG } from './config.js';
import { initPlotRenderer, renderPlot, updatePlot } from './plotRenderer.js';

// State variables
const bacteriumData = new Map();
let currentTimeStep = 0;
let numberOfTimeSteps = 0;
let totalBacteriaCountHistory = [];
let magentaBacteriaCountHistory = [];
let cyanBacteriaCountHistory = [];
let IDsContainedInCurrentTimeStep = new Set();

// Three.js setup 
const { scene, camera, renderer, controls } = setupScene();

// Add renderer to DOM
document.body.appendChild(renderer.domElement);

// Initialize bacterium system
const bacteriumSystem = createBacteriumSystem(scene);

// Initialize plot renderer
initPlotRenderer();

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
    totalBacteriaCountHistory = [];
    Object.entries(data).forEach(([key, value]) => {
        // Skip the header row
        if (key === "time") return;
        
        const bacteriaForTimeStep = value.map(item => {
            // Skip items with non-numeric IDs
            if (isNaN(item.ID)) return null;
            return { ...item, ID: BigInt(item.ID) };
        }).filter(item => item !== null);
        
        bacteriumData.set(parseInt(key, 10), bacteriaForTimeStep);
        
        const totalCount = bacteriaForTimeStep.length;
     
        totalBacteriaCountHistory.push(totalCount);
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
    renderPlot();
};

/**
 * Updates the scene for each frame
 */
const updateScene = () => {
    if (bacteriumData.size > 0) {
        updateBacteria(bacteriumSystem, Math.floor(currentTimeStep), bacteriumData);
        IDsContainedInCurrentTimeStep.clear();
        
        // Add all the IDs contained in the current time step to the set
        const currentBacteria = bacteriumData.get(Math.floor(currentTimeStep));
        if (currentBacteria) {
            for (const bacterium of currentBacteria) {
                IDsContainedInCurrentTimeStep.add(bacterium.ID);
            }
        }

        const magentaCount = getMagentaCount(bacteriumSystem);
        const cyanCount = getCyanCount(bacteriumSystem);

        magentaBacteriaCountHistory.push(magentaCount);
        cyanBacteriaCountHistory.push(cyanCount);
        
        updatePlot(
            totalBacteriaCountHistory.slice(0, currentTimeStep + 1),
            magentaBacteriaCountHistory.slice(0, currentTimeStep + 1),
            cyanBacteriaCountHistory.slice(0, currentTimeStep + 1)
        );
        currentTimeStep = (currentTimeStep + 1) % numberOfTimeSteps;
        //clean color memo if the current time step is 0
        if (currentTimeStep === 0) {
            clearColorMemo(bacteriumSystem);
        }
    }
    controls.update();
    renderer.render(scene, camera);
};

// Start animation loop
animate();
