import * as THREE from 'three';

// Constants
const {
    Z_INITIAL = 150,
    Z_STEP = 4,
    ROTATION_SPEED = 0.05,
    ANIMATION_SPEED = 1,
    CONTAINER_SIZE = { width: 400, height: 240 },
    SCALE_FACTOR = 4,
    MAX_PARTICLES = 5000,
    MAX_CONTAINERS = 4,
    FOG_FAR = 300,
    FOG_NEAR = 1,
    CAMERA_MOVE_STEP = 4,
    LOOK_MOVE_STEP = 2,
    CONTAINER_INTERVAL = 20,
    ID_THRESHOLD = 2000,
    COLOR_DELTA = 20,
    CAP_SEGMENTS = 2,
    RADIAL_SEGMENTS = 6        
} = {}; 

// State variables
let end = false;
let cameraZ = Z_INITIAL;
let lookX = 0;
let lookY = 0;
let currentTimeStep = 0;
let numberOfTimeSteps = null;
let angle = 0;
let colorMemo = new Map();
let OffSet = 0;

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth - 17, window.innerHeight - 17);
document.body.appendChild(renderer.domElement);

// Fog setup
scene.fog = new THREE.Fog(0x1a0000, FOG_NEAR, FOG_FAR);

// Data storage
const particleData = new Map();
const addedParticles = [];
const addedContainers = []; 
const addedWireframes = [];

// Helper functions
const createContainer = (timeStep) => {
    const containerGeometry = new THREE.BoxGeometry(CONTAINER_SIZE.width, CONTAINER_SIZE.height, 30);
    const containerEdges = new THREE.EdgesGeometry(containerGeometry);
    const container = new THREE.LineSegments(containerEdges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
    container.position.z = Z_STEP * timeStep;
    scene.add(container);
    addedContainers.push(container);
}; 

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
        colorInheritanceSimulation();
    };
    reader.readAsText(file);
});

const restart = () => {
    currentTimeStep = 0;
    cameraZ = Z_INITIAL;

    [addedParticles, addedContainers, addedWireframes].forEach(array => {
        array.forEach(item => {
            scene.remove(item);
            item.geometry.dispose();
            item.material.dispose();
    });
        array.length = 0;
    });

    createContainer(currentTimeStep);
    colorMemo.clear();
    colorInheritanceSimulation();
};

const keyActions = new Map([
    ['ArrowUp', () => cameraZ -= CAMERA_MOVE_STEP],
    ['ArrowDown', () => cameraZ += CAMERA_MOVE_STEP],
    ['ArrowLeft', () => angle -= ROTATION_SPEED / 2],
    ['ArrowRight', () => angle += ROTATION_SPEED / 2],
    ['r', restart],
    ['e', () => end = !end],
    ['w', () => lookY += LOOK_MOVE_STEP],
    ['s', () => lookY -= LOOK_MOVE_STEP],
    ['d', () => lookX -= LOOK_MOVE_STEP],
    ['a', () => lookX += LOOK_MOVE_STEP],
    ['+', () => OffSet += 1],
    ['-', () => OffSet -= 1]
]);

document.addEventListener('keydown', (event) => {
    const action = keyActions.get(event.key);
    if (action) action();
});

function colorInheritanceSimulation() {
    for (let timeStep = 1; timeStep < numberOfTimeSteps; timeStep++) {
        const lastFrameParticles = particleData.get(timeStep - 1) || [];
        const currentFrameParticles = particleData.get(timeStep);

        for (let particle of currentFrameParticles) {
            const parentID = Math.floor(particle.ID / 2);
            const parent = lastFrameParticles.find(p => p.ID === parentID);
            particle.color = computeColor(particle.ID, parent ? parent.color : null);
        }
    }
}

function computeColor(id, parentColor) {
    if (colorMemo.has(id)) return colorMemo.get(id);

    const deltaRed = Math.floor(Math.random() * COLOR_DELTA * 2 - COLOR_DELTA); 
    const deltaGreen = Math.floor(Math.random() * COLOR_DELTA * 2 - COLOR_DELTA);
    const deltaBlue = Math.floor(Math.random() * COLOR_DELTA * 2 - COLOR_DELTA);
    
    let color;
    if (id > ID_THRESHOLD) {
        if (parentColor === 'invisible') {
            color = 'invisible';
        } else if (parentColor === null) {
            // Generate a new random color if parentColor is null
            color = [
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256)
            ];
        } else {
            color = [
                Math.abs((parentColor[0] + deltaRed) % 256), 
                Math.abs((parentColor[1] + deltaGreen) % 256), 
                Math.abs((parentColor[2] + deltaBlue) % 256)
            ];
        }
    } else {
        color = (Math.random() < 0.1 ? [127, 127, 127] : 'invisible');
    }
    
    colorMemo.set(id, color);
    return color;
}

const BLACK_COLOR = 0x000000;

const addParticles = (timeStep) => {
    const z = timeStep * Z_STEP;
    const layer = particleData.get(Math.floor(timeStep)) || [];

    layer.forEach(data => {
        if (data.color === 'invisible') return;

        const { x, y, length, angle } = data;
        const adjustedX = x * SCALE_FACTOR;
        const adjustedY = (y - 170) * SCALE_FACTOR;
        const adjustedLength = length * SCALE_FACTOR;
        const adjustedAngle = angle * Math.PI;
        const radius = SCALE_FACTOR / 2;

        const capsuleGeometry = new THREE.CapsuleGeometry( radius, adjustedLength, CAP_SEGMENTS, RADIAL_SEGMENTS );
        const capsuleMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(`rgb(${data.color[0]}, ${data.color[1]}, ${data.color[2]})`) });
        const capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

        capsule.position.set(adjustedX, adjustedY, z);
        capsule.rotation.z = adjustedAngle;

        scene.add(capsule);
        addedParticles.push(capsule);

        const wireframeGeometry = new THREE.EdgesGeometry(capsuleGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ color: BLACK_COLOR, linewidth: 2 });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        wireframe.position.copy(capsule.position);
        wireframe.rotation.copy(capsule.rotation);
        //Avoiding z-fighting
        wireframe.scale.multiplyScalar(1.01);

        scene.add(wireframe);
        addedWireframes.push(wireframe);
    });
};
let containerTimeStep = 0;
const animate = () => {
    
    containerTimeStep += 1;

    requestAnimationFrame(animate);

    if (containerTimeStep % CONTAINER_INTERVAL === 0) {

        if (particleData.size > 0 && !end) {
            currentTimeStep += ANIMATION_SPEED;

            if (currentTimeStep >= numberOfTimeSteps) {
                restart();
            }

            removeOldObjects(addedParticles, MAX_PARTICLES);
            removeOldObjects(addedWireframes, MAX_PARTICLES);
            removeOldObjects(addedContainers, MAX_CONTAINERS);

                if (containerTimeStep % CONTAINER_INTERVAL === 0) {
                    createContainer(currentTimeStep);
                }

                addParticles(currentTimeStep);
            }
            if (!end && currentTimeStep > 1) {
                cameraZ += Z_STEP * ANIMATION_SPEED;
            }
  
}
        const cameraX = lookX + OffSet * Math.cos(angle);
        const cameraY = lookY + OffSet * Math.sin(angle);
        camera.position.set(cameraX, cameraY, cameraZ);
        camera.lookAt(lookX, lookY, Z_STEP * currentTimeStep);



    renderer.render(scene, camera);
};

// Initialize
createContainer(currentTimeStep);
animate();