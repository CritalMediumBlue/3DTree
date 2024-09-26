import { setupScene } from './sceneSetup.js';
import { createBacteriumSystem, updateBacteria, getMagentaCount, getCyanCount, clearColorMemo } from './bacteriumSystem.js';
import { CONFIG } from './config.js';
import { initPlotRenderer, renderPlot, updatePlot } from './plotRenderer.js';
import { Histogram } from './histogram.js';

// State variables
const bacteriumData = new Map();
let currentTimeStep = 0;
let numberOfTimeSteps = 0;
let totalBacteriaCountHistory = [];
let magentaBacteriaCountHistory = [];
let cyanBacteriaCountHistory = [];
let IDsContainedInCurrentTimeStep = new Set();
let previousIDsContainedInTimeStep = new Set();

// Three.js setup 
const { scene, camera, renderer, controls } = setupScene();

// Add renderer to DOM
document.body.appendChild(renderer.domElement);

// Initialize bacterium system
const bacteriumSystem = createBacteriumSystem(scene);

// Initialize plot renderer
initPlotRenderer();

// Initialize histogram
const histogram = new Histogram(
    scene,
    CONFIG.HISTOGRAM.X_MIN,
    CONFIG.HISTOGRAM.X_MAX,
    CONFIG.HISTOGRAM.Y_MIN,
    CONFIG.HISTOGRAM.Y_MAX
);

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
        console.error('Error processing file:', error);

    }
};

/**
 * Initializes bacterium data from parsed JSON
 * @param {Object} data - The parsed JSON data
 */
const initializeBacteriumData = (data) => {
    resetDataStructures();
    processDataEntries(data);
    updateTimeStepInfo();
};

const resetDataStructures = () => {
    bacteriumData.clear();
    totalBacteriaCountHistory = [];
    magentaBacteriaCountHistory = [];
    cyanBacteriaCountHistory = [];
    histogram.reset();
};

const processDataEntries = (data) => {
    Object.entries(data).forEach(([key, value]) => {
        if (key === "time") return;
        const bacteriaForTimeStep = processBacteriaForTimeStep(value);
        bacteriumData.set(parseInt(key, 10), bacteriaForTimeStep);
    });
};

const processBacteriaForTimeStep = (bacteria) => {
    return bacteria
        .map(item => isNaN(item.ID) ? null : { ...item, ID: BigInt(item.ID) })
        .filter(item => item !== null);
};

const updateTimeStepInfo = () => {
    currentTimeStep = 0;
    numberOfTimeSteps = bacteriumData.size;
    previousIDsContainedInTimeStep.clear();
};

// Add event listener for file input
document.getElementById('fileInput').addEventListener('change', handleFileInput);

/**
 * Animation loop
 */
const animate = () => {
    requestAnimationFrame(animate);

    updateScene();
    renderPlot();
    
    controls.update();
    renderer.render(scene, camera);
};

/**
 * Updates the scene for each frame
 * @returns {void}
 */
const updateScene = () => {
    if (bacteriumData.size > 0) {
        updateBacteria(bacteriumSystem, Math.floor(currentTimeStep), bacteriumData);
        
        IDsContainedInCurrentTimeStep.clear(); // Reuse the existing Set
        const currentBacteria = bacteriumData.get(Math.floor(currentTimeStep));
        if (currentBacteria) {
            for (const bacterium of currentBacteria) {
                IDsContainedInCurrentTimeStep.add(bacterium.ID);
                if (!previousIDsContainedInTimeStep.has(bacterium.ID)) {
                    histogram.addBacterium(bacterium.x, bacterium.y);
                }
            }
        }

        const magentaCount = getMagentaCount(bacteriumSystem);
        const cyanCount = getCyanCount(bacteriumSystem);
        const totalCount = currentBacteria ? currentBacteria.length : 0;

        totalBacteriaCountHistory.push(totalCount);
        magentaBacteriaCountHistory.push(magentaCount);
        cyanBacteriaCountHistory.push(cyanCount);

        // Update the plot every frame
        updatePlot(
            totalBacteriaCountHistory,
            magentaBacteriaCountHistory,
            cyanBacteriaCountHistory
        );

        // Swap the sets instead of creating a new one
        [previousIDsContainedInTimeStep, IDsContainedInCurrentTimeStep] = [IDsContainedInCurrentTimeStep, previousIDsContainedInTimeStep];

       
        currentTimeStep = (currentTimeStep + 1) % numberOfTimeSteps;
        //clean color memo if the current time step is 0
        if (currentTimeStep === 0) {
            clearColorMemo(bacteriumSystem);
            histogram.reset();
            previousIDsContainedInTimeStep.clear();
            // Don't reset the history arrays when the simulation loops back to the beginning
            // This allows the plot to continue showing data beyond the initial cycle
        }
    }
};

// Start animation loop
animate();
