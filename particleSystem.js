import * as THREE from 'three';
import { CONFIG } from './config.js';

const colorMemo = new Map();

export function colorInheritanceSimulation(particleData) {
    const numberOfTimeSteps = particleData.size;
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

    const deltaRed = Math.floor(Math.random() * CONFIG.COLOR_DELTA * 2 - CONFIG.COLOR_DELTA);
    const deltaGreen = Math.floor(Math.random() * CONFIG.COLOR_DELTA * 2 - CONFIG.COLOR_DELTA);
    const deltaBlue = Math.floor(Math.random() * CONFIG.COLOR_DELTA * 2 - CONFIG.COLOR_DELTA);
    
    let color;
    if (id > CONFIG.ID_THRESHOLD) {
        if (parentColor === 'invisible') {
            color = 'invisible';
        } else if (parentColor === null) {
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

export function addParticles(scene, timeStep, particleData) {
    const z = 0;
    const layer = particleData.get(Math.floor(timeStep)) || [];
    const addedObjects = [];

    layer.forEach(data => {

        const { x, y, length, angle } = data;
        const adjustedX = x * CONFIG.SCALE_FACTOR;
        const adjustedY = (y - 170) * CONFIG.SCALE_FACTOR;
        const adjustedLength = length * CONFIG.SCALE_FACTOR;
        const adjustedAngle = angle * Math.PI;
        const radius = CONFIG.SCALE_FACTOR / 2;

        const capsuleGeometry = new THREE.CapsuleGeometry(radius, adjustedLength, CONFIG.CAP_SEGMENTS, CONFIG.RADIAL_SEGMENTS);
        const capsuleMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color(`rgb(255, 255, 255)`)});
        const capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);

        capsule.position.set(adjustedX, adjustedY, z);
        capsule.rotation.z = adjustedAngle;

        scene.add(capsule);
        addedObjects.push(capsule);

        const wireframeGeometry = new THREE.EdgesGeometry(capsuleGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(`rgb(0, 0, 0)`) });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        wireframe.position.copy(capsule.position);
        wireframe.rotation.copy(capsule.rotation);
        wireframe.scale.multiplyScalar(1.005);

        scene.add(wireframe);
        addedObjects.push(wireframe);
    });

    return addedObjects;
}