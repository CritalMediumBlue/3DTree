import * as THREE from 'three';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.2/+esm';
import { CONFIG } from './config.js';
import { setupScene, createContainer } from './sceneSetup.js';
import { colorInheritanceSimulation, addParticles } from './particleSystem.js';

// State variables
let end = false;
let cameraZ = CONFIG.Z_INITIAL;
let lookX = 0;
let lookY = 0;
let currentTimeStep = 0;
let numberOfTimeSteps = null;
let angle = 0;
let OffSet = 0;
let TwoDimentional = true;

// Three.js setup
let { scene, camera, renderer } = setupScene();

// Data storage
const particleData = new Map();
const addedParticles = [];
const addedContainers = []; 

// Helper functions
const removeOldObjects = (array, maxCount, removeFromScene = true) => {
    while (array.length > maxCount) {
        const oldest = array.shift();
        if (removeFromScene) scene.remove(oldest);
        oldest.geometry.dispose();
        oldest.material.dispose();
    }
};

// Event listeners
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        particleData.clear();
        
        Object.entries(data).forEach(([key, value]) => {
            particleData.set(parseInt(key, 10), value.map(item => ({...item, ID: parseInt(item.ID, 10)})));
        });
        
        numberOfTimeSteps = particleData.size;
        colorInheritanceSimulation(particleData);
    };
    reader.readAsText(file);
});

const restart = () => {
    currentTimeStep = 0;
    cameraZ = CONFIG.Z_INITIAL;

    [addedParticles, addedContainers].forEach(array => {
        array.forEach(item => {
            scene.remove(item);
            item.geometry.dispose();
            item.material.dispose();
        });
        array.length = 0;
    });

    addedContainers.push(createContainer(scene, currentTimeStep));
    colorInheritanceSimulation(particleData);
};

const keyActions = new Map([
    ['ArrowUp', () => cameraZ -= CONFIG.CAMERA_MOVE_STEP],
    ['ArrowDown', () => cameraZ += CONFIG.CAMERA_MOVE_STEP],
    ['ArrowLeft', () => angle -= CONFIG.ROTATION_SPEED / 2],
    ['ArrowRight', () => angle += CONFIG.ROTATION_SPEED / 2],
    ['r', restart],
    ['e', () => end = !end],
    ['w', () => lookY += CONFIG.LOOK_MOVE_STEP],
    ['s', () => lookY -= CONFIG.LOOK_MOVE_STEP],
    ['d', () => lookX -= CONFIG.LOOK_MOVE_STEP],
    ['a', () => lookX += CONFIG.LOOK_MOVE_STEP],
    ['+', () => OffSet += 1],
    ['-', () => OffSet -= 1]
]);

document.addEventListener('keydown', (event) => {
    const action = keyActions.get(event.key);
    if (action) action();
});

document.getElementById('plotButton').addEventListener('click', () => {
    if (!TwoDimentional) {
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 1000);
        camera.position.set(0, 0, CONFIG.Z_INITIAL);
        camera.lookAt(0, 0, 0);
    } else {
        camera = new THREE.OrthographicCamera(window.innerWidth / - 8, window.innerWidth / 8, window.innerHeight / 8, window.innerHeight / - 8, 1, 1000);
        camera.position.set(0, 0, 500);
        angle = 0;
        OffSet = 0;
        camera.lookAt(0, 0, 0);
    }
    TwoDimentional = !TwoDimentional;
});

let containerTimeStep = 0;
const animate = () => {
    containerTimeStep += 1;

    requestAnimationFrame(animate);

    if (containerTimeStep % CONFIG.CONTAINER_INTERVAL === 0) {
        if (particleData.size > 0 && !end) {
            currentTimeStep += CONFIG.ANIMATION_SPEED;

            if (currentTimeStep >= numberOfTimeSteps) {
                restart();
            }

            removeOldObjects(addedParticles, CONFIG.MAX_PARTICLES);
            removeOldObjects(addedContainers, CONFIG.MAX_CONTAINERS);

            if (containerTimeStep % CONFIG.CONTAINER_INTERVAL === 0) {
                addedContainers.push(createContainer(scene, currentTimeStep));
            }

            addedParticles.push(...addParticles(scene, currentTimeStep, particleData));
        }
        if (!end && currentTimeStep > 1) {
            cameraZ += CONFIG.Z_STEP * CONFIG.ANIMATION_SPEED;
        }
    }
    
    const cameraX = lookX + OffSet * Math.cos(angle);
    const cameraY = lookY + OffSet * Math.sin(angle);
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(lookX, lookY, CONFIG.Z_STEP * currentTimeStep);

    renderer.render(scene, camera);
};

// Initialize
addedContainers.push(createContainer(scene, currentTimeStep));
animate();