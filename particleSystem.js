import * as THREE from 'three';
import { CONFIG } from './config.js';

let predefinedParticles = []; // Array to store many predefined particles. For performance reasons, we will reuse these particles instead of creating new ones.
const capsuleGeometryCache = new Map(); // Persistent cache for capsule geometries
const edgesGeometryCache = new Map(); // Persistent cache for edges geometries

function createCapsule() {
    const capsuleGeometry = new THREE.CapsuleGeometry(
        CONFIG.SCALE_FACTOR / 2,
        1,
        CONFIG.CAP_SEGMENTS,
        CONFIG.RADIAL_SEGMENTS
    );
    const capsuleMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color(`rgb(100, 100, 255)`)});
    return new THREE.Mesh(capsuleGeometry, capsuleMaterial);
}

function createWireframe(capsuleGeometry) {
    const wireframeGeometry = new THREE.EdgesGeometry(capsuleGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(`rgb(0, 0, 0)`) });
    return new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
}

export function initializeParticles(scene, maxParticles) {
    console.log('initializeParticles CONFIG:', CONFIG);
    for (let i = 0; i < maxParticles; i++) {
        const capsule = createAndAddCapsule(scene);
        predefinedParticles.push(capsule);
    }
}

function createAndAddCapsule(scene) {
    const capsule = createCapsule();
    const wireframe = createWireframe(capsule.geometry);

    capsule.add(wireframe);
    scene.add(capsule);
    capsule.visible = false;
    return capsule;
}

function updateGeometry(particle, adjustedLength) {
    let newGeometry = capsuleGeometryCache.get(adjustedLength);
    if (!newGeometry) {
        newGeometry = new THREE.CapsuleGeometry(CONFIG.SCALE_FACTOR / 2, adjustedLength, CONFIG.CAP_SEGMENTS, CONFIG.RADIAL_SEGMENTS);
        capsuleGeometryCache.set(adjustedLength, newGeometry);
        console.log('New particle geometry created', adjustedLength);
    } 

    if (particle.geometry !== newGeometry) {
        particle.geometry.dispose();
        particle.geometry = newGeometry;
    }

    let newWireframeGeometry = edgesGeometryCache.get(adjustedLength);
    if (!newWireframeGeometry) {
        newWireframeGeometry = new THREE.EdgesGeometry(newGeometry);
        edgesGeometryCache.set(adjustedLength, newWireframeGeometry);
        console.log('New wireframe geometry created', adjustedLength);
    } 
    const wireframe = particle.children[0]; 
    if (wireframe.geometry !== newWireframeGeometry) {
        wireframe.geometry.dispose();
        wireframe.geometry = newWireframeGeometry;
        wireframe.scale.set(1.005, 1.005, 1.005);
    } 
}

const OFFSET_Y = 170;

export function updateParticles(timeStep, particleData) {
    const z = 0;
    const layer = particleData.get(timeStep) || [];

    predefinedParticles.forEach(particle => particle.visible = false);

    layer.forEach((data, index) => {
        if (index >= predefinedParticles.length) return;

        const particle = predefinedParticles[index];
        updateParticle(particle, data, z);
    });
}

function updateParticle(particle, data, z) {
    const { x, y, length, angle } = data;
    const adjustedX = x * CONFIG.SCALE_FACTOR;
    const adjustedY = (y - OFFSET_Y) * CONFIG.SCALE_FACTOR;
    const adjustedLength = Math.round(length * CONFIG.SCALE_FACTOR);
    const adjustedAngle = angle * Math.PI;

    particle.position.set(adjustedX, adjustedY, z);
    particle.rotation.z = adjustedAngle;

    updateGeometry(particle, adjustedLength);
    particle.visible = true;
}


