import { setupScene } from './sceneSetup.js';
import { colorInheritanceSimulation, addParticles } from './particleSystem.js';

// State variables
let currentTimeStep = 0;
let numberOfTimeSteps = null;

// Three.js setup
let { scene, camera, renderer, controls } = setupScene();

// Data storage
const particleData = new Map();
const particles = [];

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
        
        numberOfTimeSteps = particleData.size;
        colorInheritanceSimulation(particleData);
        currentTimeStep = 0;
        
        // Clear existing particles
        particles.forEach(particle => {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        });
        particles.length = 0;

        // Set initial camera position
        camera.position.set(0, 0, 1000);
        controls.update();
    };
    reader.readAsText(file);
});

const animate = () => {
    requestAnimationFrame(animate);

    if (particleData.size > 0) {
        // Remove particles from previous timestep
        particles.forEach(particle => scene.remove(particle));
        particles.length = 0;

        // Add new particles for current timestep
        const newParticles = addParticles(scene, currentTimeStep, particleData);
        particles.push(...newParticles);

        currentTimeStep = (currentTimeStep + 1) % numberOfTimeSteps;
    }
    
    controls.update();
    renderer.render(scene, camera);
};

// Initialize
animate();