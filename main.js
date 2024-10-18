import { setupScene } from './sceneSetup.js';
import { createBacteriumSystem, updateBacteria, getMagentaCount, getCyanCount, clearColorMemo, setSignalValue, setAlphaValue, getAverageSimilarityWithNeighbors } from './bacteriumSystem.js';
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
let averageSimilarityHistory = [];
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

let IDsAddedToHistogram = new Set();

const resetDataStructures = () => {
    bacteriumData.clear();
    totalBacteriaCountHistory = [];
    magentaBacteriaCountHistory = [];
    cyanBacteriaCountHistory = [];
    averageSimilarityHistory = [];
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

// Add event listener for toggle button
document.getElementById('toggleColorButton').addEventListener('click', () => {
    CONFIG.BACTERIUM.COLOR_BY_INHERITANCE = !CONFIG.BACTERIUM.COLOR_BY_INHERITANCE;
    console.log('COLOR_BY_INHERITANCE toggled:', CONFIG.BACTERIUM.COLOR_BY_INHERITANCE);
});

document.getElementById('toggleFeedbackButton').addEventListener('click', () => {
    CONFIG.BACTERIUM.POSITIVE_FEEDBACK = !CONFIG.BACTERIUM.POSITIVE_FEEDBACK;
    console.log('POSITIVE_FEEDBACK toggled:', CONFIG.BACTERIUM.POSITIVE_FEEDBACK);
});

// Add event listener for signal slider
const signalSlider = document.getElementById('signalSlider');
const signalValue = document.getElementById('signalValue');

signalSlider.addEventListener('input', (event) => {
    const value = parseFloat(event.target.value);
    signalValue.textContent = value.toFixed(2);
    setSignalValue(bacteriumSystem, value);
});

// Add event listener for alpha slider
const alphaSlider = document.getElementById('alphaSlider');
const alphaValue = document.getElementById('alphaValue');

alphaSlider.addEventListener('input', (event) => {
    const value = parseFloat(event.target.value);
    alphaValue.textContent = value.toFixed(5);
    setAlphaValue(bacteriumSystem, value);
});

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
                const bacteriumID = bacterium.ID;
                const bacteriumIDHalf = bacterium.ID / 2n;
                
                if (bacteriumSystem.colorManager.colorMemo.has(bacteriumID) && bacteriumSystem.colorManager.colorMemo.has(bacteriumIDHalf)) {
                    const colorID = bacteriumSystem.colorManager.colorMemo.get(bacteriumID);
                    const colorIDHalf = bacteriumSystem.colorManager.colorMemo.get(bacteriumIDHalf);
        
                    if (!areColorsEqual(colorID, colorIDHalf) && !IDsAddedToHistogram.has(bacteriumID)) {
                        histogram.addBacterium(bacterium.x, bacterium.y);
                        IDsAddedToHistogram.add(bacteriumID);
                    }
                }
            }
        }

        const magentaCount = getMagentaCount(bacteriumSystem);
        const cyanCount = getCyanCount(bacteriumSystem);
        const totalCount = currentBacteria ? currentBacteria.length : 0;
        const averageSimilarity = getAverageSimilarityWithNeighbors(bacteriumSystem);

        // Log the average similarity
        //console.log('Average Similarity:', averageSimilarity);

        totalBacteriaCountHistory.push(totalCount);
        magentaBacteriaCountHistory.push(magentaCount);
        cyanBacteriaCountHistory.push(cyanCount);
        
        // Only add averageSimilarity to history if it's a valid number
        if (!isNaN(averageSimilarity) && isFinite(averageSimilarity)) {
            averageSimilarityHistory.push((averageSimilarity-0.5)*2800);
        } else {
            console.warn('Invalid average similarity:', averageSimilarity);
            // Optionally, you can push the last valid value or 0
            averageSimilarityHistory.push(averageSimilarityHistory.length > 0 ? averageSimilarityHistory[averageSimilarityHistory.length - 1] : 0);
        }

        // Update the plot every frame
        updatePlot(
            totalBacteriaCountHistory,
            magentaBacteriaCountHistory,
            cyanBacteriaCountHistory,
            averageSimilarityHistory
        );

        // Swap the sets instead of creating a new one
        [previousIDsContainedInTimeStep, IDsContainedInCurrentTimeStep] = [IDsContainedInCurrentTimeStep, previousIDsContainedInTimeStep];

        currentTimeStep = (currentTimeStep + 1) % numberOfTimeSteps;
        // Clean color memo if the current time step is 0
        if (currentTimeStep === 0) {
            clearColorMemo(bacteriumSystem);
            //histogram.reset();
            previousIDsContainedInTimeStep.clear();
            // Don't reset the history arrays when the simulation loops back to the beginning
            // This allows the plot to continue showing data beyond the initial cycle
        }
    }
    function areColorsEqual(color1, color2) {
        return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
    }
};

// Start animation loop
animate();
