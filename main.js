// Constants
const FOV = 75;  // Field of view
const NEAR_PLANE = 10;
const FAR_PLANE = 800;
const Z_POSITION = -150;
const Z_OFFSET = 2;
const ROTATION_SPEED = 0.005;
const ANIMATION_SPEED = 0.99;
const CONTAINER_SIZE = { width: 400, height: 240 };
const SCALE_FACTOR = 4;
const Y_OFFSET = 170;
const HALF_PI = Math.PI / 2;
const MAX_PARTICLES = 3000; // Maximum number of particles to keep in the scene
const allIds = [];
let interestingIdsSet; // Changed to a Set for faster lookups
const MAX_PARTICLES_CURRENT = 1200;
const MAX_CONTAINERS = 100;
let addTrace = true;
let end = false;
const lineOpacity = 0.5;

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR_PLANE, FAR_PLANE);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Fog setup
const farFog = Math.abs(Z_POSITION * 2);
const nearFog = Math.abs(Z_POSITION / 3);
scene.fog = new THREE.Fog(0x1a000a, nearFog, farFog);

// Particles
const particleData = [];
const particles = [];


// create particles, add them to the scene, ad set them to invisible
// The particles can be rendered as a box
function createParticlePool(maxParticles) {
    for (let i = 0; i < maxParticles; i++) {
        const particleMesh = new THREE.Line(particleGeometry, new THREE.LineBasicMaterial({color: 0xffffff}));
        particleMesh.visible = false;
        scene.add(particleMesh);
        particles.push(particleMesh);
    }
}
// Create shared geometries
const particleGeometry = new THREE.BoxGeometry(1, 0.001, 0);
const sharedEdges = new THREE.EdgesGeometry(particleGeometry);

createParticlePool(MAX_PARTICLES_CURRENT);

function updateParticles(timeStep) {
    const currentLayer = particleData[Math.floor(timeStep)] || [];
    let particleIndex = 0;
    let somethingWasUpdated = false;
   
    currentLayer.forEach(data => {
                if (interestingIdsSet.has(data.ID) && particleIndex < particles.length) {
                    const particle = particles[particleIndex];
                    const x = data.x * SCALE_FACTOR;
                    const y = (data.y - Y_OFFSET) * SCALE_FACTOR;
                    const z = -timeStep * Z_OFFSET - 0.5;
                    const length = (data.length + 1) * SCALE_FACTOR;
                    const angle = data.angle * Math.PI + HALF_PI;
        
                    particle.scale.set(length, 1, 1);
                    particle.position.set(x, y, z);
                    particle.rotation.z = angle;
                    particle.material = materialGreen;
                    particle.visible = true;
                    
                    particleIndex++;
                    somethingWasUpdated = true;

                }
                
            });

      
  
    // Hide unused particles
    for (let i = particleIndex; i < particles.length; i++) {
        particles[i].visible = false;
    }


    if (!somethingWasUpdated && currentTimeStep > 1) {
        end = true;
    }
}

    





let currentTimeStep = 0;
let numberOfTimeSteps = null;
const addedParticles = []; // Array to store added particles
const addedPoints = []; // Array to store added points
const addedContainers = []; // Array to store added container

// Create container
let container;
function createContainer(timeStep) {
    const thickness =  0;
    const containerGeometry = new THREE.BoxGeometry(CONTAINER_SIZE.width, CONTAINER_SIZE.height, thickness);
    const containerEdges = new THREE.EdgesGeometry(containerGeometry);
    container = new THREE.LineSegments(containerEdges, new THREE.LineBasicMaterial({color: 0xffffff}));
    container.position.z = -(Z_OFFSET * timeStep) ;
    scene.add(container);
    addedContainers.push(container);
}

createContainer(currentTimeStep);

const staticContainer = new THREE.BoxGeometry(CONTAINER_SIZE.width, CONTAINER_SIZE.height, 0);
const staticContainerEdges = new THREE.EdgesGeometry(staticContainer);
const staticContainerLine = new THREE.LineSegments(staticContainerEdges, new THREE.LineBasicMaterial({color: 0xffffff}));
staticContainerLine.position.z = 0;
scene.add(staticContainerLine);

const material = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: lineOpacity,
    linewidth: 4 // Increased line width (note: this may not be supported in all WebGL renderers)
});

const materialGreen = new THREE.LineBasicMaterial({ 
    color: 0x00ffff, 
    transparent: true, 
    opacity: lineOpacity,
    linewidth: 10// Increased line width (note: this may not be supported in all WebGL renderers)
});
const materialPoints = new THREE.PointsMaterial({color: 0xff00ff, 
    size: 1.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: lineOpacity
});
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
        generateInterestingIds();
    };
    reader.readAsText(file);
});

let randomInt = 1697;//1466;

function generateInterestingIds() {
    const interestingIds = [];
    const initialId = BigInt(randomInt);
    console.log(initialId);
    const generations = 16; // Number of generations to add

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
    if (event.key === 's') {
        restart()

        randomInt = Math.floor(Math.random() * (1000)) + 1000;

        generateInterestingIds();
        createContainer(currentTimeStep);
    }
    else if (event.key === 't') {
        addTrace = !addTrace;
    }
    
});

function animate() {
    requestAnimationFrame(animate);

    if (particleData.length > 0 &&  end === false) {
        currentTimeStep = (currentTimeStep + ANIMATION_SPEED) % numberOfTimeSteps;

  

        if(addedParticles.length > MAX_PARTICLES) {
            removeOldParticles(); // Remove old particles before adding new ones
        }
        if(addedContainers.length > MAX_CONTAINERS) {
            removeOldContainers(); // Remove old containers before adding new ones
        }
        if (addTrace) {
        addParticles(currentTimeStep);
        }
        if (Math.floor(currentTimeStep) % 10 === 0) {
            createContainer(currentTimeStep);
        }

        updateParticles(currentTimeStep);

    
        
    }

    angle += ROTATION_SPEED * ANIMATION_SPEED;
    const cameraX = 120 * Math.cos(angle);
    const cameraY = 120 * Math.sin(angle);
    let cameraZ = -Z_OFFSET * currentTimeStep + Z_POSITION;
    if (end === false){
        cameraZ = -Z_OFFSET * currentTimeStep+ Z_POSITION;
    } else {
        cameraZ += 5;
    }
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(cameraX*0.5, cameraY*0.5, -Z_OFFSET * currentTimeStep);    
    staticContainerLine.position.z = -Z_OFFSET * currentTimeStep;
    renderer.render(scene, camera);
}

function restart() {
    currentTimeStep = 1;
    addedParticles.forEach(particle => {
        scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
    });
    addedParticles.length = 0;
    addedPoints.forEach(point => {
        scene.remove(point);
        point.geometry.dispose();
        point.material.dispose();
    });
    addedPoints.length = 0;
    addedContainers.forEach(container => {
        scene.remove(container);
        container.geometry.dispose();
        container.material.dispose();
    });
    addedContainers.length = 0;

    createContainer(currentTimeStep);

}


function addParticles(timeStep) {
    const z = -timeStep * Z_OFFSET;
    const layer = particleData[Math.floor(timeStep)] || [];

    layer.forEach(data => {
        if (interestingIdsSet.has(data.ID)) {
            const x = data.x * SCALE_FACTOR;
            const y = (data.y - Y_OFFSET) * SCALE_FACTOR;
            const length = (data.length+1) * SCALE_FACTOR;
            const angle = data.angle * Math.PI + HALF_PI;

            const startX = x - length * Math.cos(angle) / 2
            const startY = y - length * Math.sin(angle) / 2;
            const endX = x + length * Math.cos(angle) / 2;
            const endY = y + length * Math.sin(angle) / 2;
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(startX, startY, z),
                new THREE.Vector3(endX, endY, z)
            ]);

            //Let's place a point at the start and end of the line
             const points = [];
                points.push(new THREE.Vector3(startX, startY, z));
                points.push(new THREE.Vector3(endX, endY, z));
                const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);

                const pointsObject = new THREE.Points(geometryPoints, materialPoints);
                scene.add(pointsObject);
                addedPoints.push(pointsObject);


            const line = new THREE.Line(geometry, material);
            scene.add(line);
            addedParticles.push(line); // Store the added particle
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

    while (addedPoints.length > MAX_PARTICLES) {
        const oldestPoint = addedPoints.shift(); // Remove the oldest point from the array
        scene.remove(oldestPoint); // Remove the point from the scene
        oldestPoint.geometry.dispose(); // Dispose of the geometry
        oldestPoint.material.dispose(); // Dispose of the material
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
