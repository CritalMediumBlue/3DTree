
const Z_INITIAL = 150;
const Z_STEP = 6;
const ROTATION_SPEED = 0.05;
const ANIMATION_SPEED = 0.99;
const CONTAINER_SIZE = { width: 400, height: 240 };
const SCALE_FACTOR = 4;
const MAX_PARTICLES = 1000; // Maximum number of particles to keep in the scene
const allIds = [];
let interestingIdsSet; // Changed to a Set for faster lookups
const MAX_CONTAINERS = 5;
let addTrace = true;
let end = false;
let cameraZ = Z_INITIAL;
let lookX = 0;
let lookY = 0;


// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 2000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth-17, window.innerHeight-17);
document.body.appendChild(renderer.domElement);


// Fog setup
const farFog = 300;
const nearFog = 1;
scene.fog = new THREE.Fog(0x1a0000, nearFog, farFog);

// Particles
const particleData = [];
// Function to create a capsule-like shape
function createCapsuleShape(radius, height, radialSegments, heightSegments) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];

    // Create cylinder without caps
    const cylinderGeometry = new THREE.CylinderBufferGeometry(radius, radius, height, radialSegments, heightSegments, true); // true = no caps
    const cylinderPositions = cylinderGeometry.getAttribute('position').array;
    const cylinderIndices = cylinderGeometry.getIndex().array;

    positions.push(...cylinderPositions);
    indices.push(...cylinderIndices);

    // Create top hemisphere without caps
    const topSphereGeometry = new THREE.SphereBufferGeometry(radius, radialSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI / 2); // Create a hemisphere
    const topSpherePositions = topSphereGeometry.getAttribute('position').array;
    const topSphereIndices = topSphereGeometry.getIndex().array;

    const topOffset = positions.length / 3;
    for (let i = 0; i < topSpherePositions.length; i += 3) {
        positions.push(topSpherePositions[i], topSpherePositions[i + 1] + height / 2, topSpherePositions[i + 2]);
    }
    for (let i = 0; i < topSphereIndices.length; i++) {
        indices.push(topSphereIndices[i] + topOffset);
    }

    // Create bottom hemisphere without caps
    const bottomSphereGeometry = new THREE.SphereBufferGeometry(radius, radialSegments, heightSegments, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottomSpherePositions = bottomSphereGeometry.getAttribute('position').array;
    const bottomSphereIndices = bottomSphereGeometry.getIndex().array;

    const bottomOffset = positions.length / 3;
    for (let i = 0; i < bottomSpherePositions.length; i += 3) {
        positions.push(bottomSpherePositions[i], bottomSpherePositions[i + 1] - height / 2, bottomSpherePositions[i + 2]);
    }
    for (let i = 0; i < bottomSphereIndices.length; i++) {
        indices.push(bottomSphereIndices[i] + bottomOffset);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices); // Indices 
 
    return geometry;
}

let currentTimeStep = 0;
let numberOfTimeSteps = null;
const addedParticles = []; // Array to store added particles
const addedContainers = []; // Array to store added container
const addedWireframes = []; // Array to store added wireframes

// Create container
let container;
const thickness =  20;

function createContainer(timeStep) {
    const containerGeometry = new THREE.BoxGeometry(CONTAINER_SIZE.width, CONTAINER_SIZE.height, thickness);
    const containerEdges = new THREE.EdgesGeometry(containerGeometry);
    container = new THREE.LineSegments(containerEdges, new THREE.LineBasicMaterial({color: 0xffffff, 
        linewidth: 2}));
    container.position.z = (Z_STEP * timeStep) ;
    scene.add(container);
    addedContainers.push(container);
}

createContainer(currentTimeStep);

const staticContainer = new THREE.BoxGeometry(CONTAINER_SIZE.width, CONTAINER_SIZE.height, thickness);
const staticContainerEdges = new THREE.EdgesGeometry(staticContainer);
const staticContainerLine = new THREE.LineSegments(staticContainerEdges, new THREE.LineBasicMaterial({color: 0xffffff,
    linewidth: 2}));
staticContainerLine.position.z = 0;
scene.add(staticContainerLine);

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

        // Generate an array of all the IDs in the data and turn them into BigInts
        particleData.forEach(layer => {
            layer.forEach(data => {
                allIds.push(BigInt(data.ID));
            });
        });
        
        numberOfTimeSteps = particleData.length;
        generateInterestingIds( randomInt);
    };
    reader.readAsText(file);
});

let randomInt = 1466;

function generateInterestingIds(randomInt) {
    const interestingIds = [];
    const initialId = BigInt(randomInt);
    console.log(initialId);
    const generations = 14; // Number of generations to add

    // Add the initial ID
    interestingIds.push(initialId);
    // Generate IDs for the specified number of generations
    for (let generation = 0; generation < generations; generation++) {
        const currentGenerationSize = interestingIds.length;
        for (let i = 0; i < currentGenerationSize; i++) {
            const parentId = interestingIds[i];
            const leftChildId = parentId * BigInt(2);
            const rightChildId = parentId * BigInt(2) + BigInt(1);
            interestingIds.push(leftChildId);
            interestingIds.push(rightChildId);
        }
    }

    // Convert interesting IDs to a Set for faster lookups
    interestingIdsSet = new Set(interestingIds.map(id => id.toString()));
    // print length of interestingIds
    console.log(interestingIds.length);
}

// add an event listener to restart the animation when the user clicks the s key
document.addEventListener('keydown', (event) => {
    if (event.key === 'm') {
        restart()
        randomInt = Math.floor(Math.random() * (1000)) + 1000;
        generateInterestingIds(randomInt);
        createContainer(currentTimeStep);
    }
    else if (event.key === 't') {
        addTrace = !addTrace;
    }
    else if (event.key === 'ArrowUp') {
        cameraZ -= 4;
    }
    else if (event.key === 'ArrowDown') {
        cameraZ += 4;
    }
    else if (event.key === 'ArrowLeft') {
        angle -= ROTATION_SPEED/2;
    }
    else if (event.key === 'ArrowRight') {
        angle += ROTATION_SPEED/2;
    }
    else if (event.key === 'r') {
        generateInterestingIds(randomInt) 

        restart();
    }
    else if (event.key === 'e') {
        end = !end;
    } else if (event.key === 'w') {
        lookY += 2;
    } else if (event.key === 's') {
        lookY -= 2;
    } else if (event.key === 'd') {
        lookX -= 2;
    } else if (event.key === 'a') {
        lookX += 2;
    } 
    
});

document.getElementById('button1').addEventListener('click', () => {
    // Step 3: Change the variable's value
    randomInt = 1581;
    console.log('Button 1 clicked, myVariable:', randomInt);
});

document.getElementById('button2').addEventListener('click', () => {
    randomInt = 1697;
    console.log('Button 2 clicked, myVariable:', randomInt);
});

document.getElementById('button3').addEventListener('click', () => {
    randomInt = 1303;
    console.log('Button 3 clicked, myVariable:', randomInt);
});

document.getElementById('button4').addEventListener('click', () => {
    randomInt = 1772;
    console.log('Button 4 clicked, myVariable:', randomInt);
});

document.getElementById('button5').addEventListener('click', () => {
    randomInt = 1466;
    console.log('Button 5 clicked, myVariable:', randomInt);
}
);

function animate() {
    requestAnimationFrame(animate);

    if (particleData.length > 0 &&  end === false) {
        if (currentTimeStep >= numberOfTimeSteps) {
            restart();
        } else {
        currentTimeStep = (currentTimeStep + ANIMATION_SPEED);
        }

        if(addedParticles.length > MAX_PARTICLES) {
            removeOldParticles(); // Remove old particles before adding new ones
        }
        if(addedContainers.length > MAX_CONTAINERS) {
            removeOldContainers(); // Remove old containers before adding new ones
        }
        if (addTrace) {
        addParticles(currentTimeStep);
        }
        if (Math.floor(currentTimeStep) % 15 === 0) {
            createContainer(currentTimeStep);
        }
    }

    const cameraX = lookX + 120 * Math.cos(angle);
    const cameraY = lookY + 120 * Math.sin(angle);
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(lookX, lookY, Z_STEP * currentTimeStep);
    if (end === false && currentTimeStep > 1) {
        cameraZ +=  Z_STEP;
    } 
    staticContainerLine.position.z = Z_STEP * currentTimeStep;
    renderer.render(scene, camera);
}

function restart() {
    currentTimeStep = 0;
    addedParticles.forEach(particle => {
        scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
    });
    addedParticles.length = 0;

    addedContainers.forEach(container => {
        scene.remove(container);
        container.geometry.dispose();
        container.material.dispose();
    });
    addedContainers.length = 0;

    addedWireframes.forEach(wireframe => {
        scene.remove(wireframe);
        wireframe.geometry.dispose();
        wireframe.material.dispose();
    });
    addedWireframes.length = 0;

    createContainer(currentTimeStep);
    cameraZ = Z_INITIAL;

}

function addParticles(timeStep) {
    const z = timeStep * Z_STEP;
    const layer = particleData[Math.floor(timeStep)] || [];

    layer.forEach(data => {
        if (interestingIdsSet.has(data.ID)) {
            const x = data.x * SCALE_FACTOR;
            const y = (data.y - 170) * SCALE_FACTOR;
            const length = (data.length) * SCALE_FACTOR;
            const angle = data.angle * Math.PI;
            const radius = 0.5 * SCALE_FACTOR;

            // Create capsule
            const capsuleGeometry = createCapsuleShape(radius, length, 8, 3);
            const capsuleMaterial = new THREE.MeshBasicMaterial({color: 0x0082c6});
            const capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

            capsule.position.set(x, y, z);
            capsule.rotation.z = angle;

            scene.add(capsule);
            addedParticles.push(capsule);

            // Create wireframe for capsule perimeter
            const wireframeGeometry = new THREE.EdgesGeometry(capsuleGeometry);
            const wireframeMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                linewidth: 1.5
            });
            const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

            // Scale the wireframe slightly larger to avoid z-fighting
            wireframe.scale.set(1.005, 1.005, 1.005);

            // Set the same position and rotation as the capsule
            wireframe.position.copy(capsule.position);
            wireframe.rotation.copy(capsule.rotation);

            scene.add(wireframe);
            addedWireframes.push(wireframe);
        }
    });
}

function removeOldParticles() {
    while (addedParticles.length > MAX_PARTICLES) {
        const oldestParticle = addedParticles.shift(); // Remove the oldest particle from the array
        scene.remove(oldestParticle); // Remove the particle from the scene
        oldestParticle.geometry.dispose(); // Dispose of the geometry
        oldestParticle.material.dispose(); // Dispose of the material
    }

    while (addedWireframes.length > MAX_PARTICLES) {
        const oldestWireframe = addedWireframes.shift(); // Remove the oldest wireframe from the array
        scene.remove(oldestWireframe); // Remove the wireframe from the scene
        oldestWireframe.geometry.dispose(); // Dispose of the geometry
        oldestWireframe.material.dispose(); // Dispose of the material
    }

}

function removeOldContainers() {
    while (addedContainers.length > MAX_CONTAINERS) {
        const oldestContainer = addedContainers.shift(); // Remove the oldest container from the array
        scene.remove(oldestContainer); // Remove the container from the scene
        oldestContainer.geometry.dispose(); // Dispose of the geometry
        oldestContainer.material.dispose(); // Dispose of the material
    }
}

animate();
