import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createAndAddCapsule } from './particleFactory.js';

let predefinedParticles = [];
const capsuleGeometryCache = new Map();
const edgesGeometryCache = new Map();

export function initializeParticles(scene, maxParticles) {
    console.log('initializeParticles CONFIG:', CONFIG);
    for (let i = 0; i < maxParticles; i++) {
        const capsule = createAndAddCapsule(scene);
        predefinedParticles.push(capsule);
    }
}

function updateGeometry(particle, adjustedLength) {
    let newGeometry = capsuleGeometryCache.get(adjustedLength);
    let newWireframeGeometry = edgesGeometryCache.get(adjustedLength);

    if (!newGeometry) {
        newGeometry = new THREE.CapsuleGeometry(CONFIG.SCALE_FACTOR / 2, adjustedLength, CONFIG.CAP_SEGMENTS, CONFIG.RADIAL_SEGMENTS);
        capsuleGeometryCache.set(adjustedLength, newGeometry);
        newWireframeGeometry = new THREE.EdgesGeometry(newGeometry);
        edgesGeometryCache.set(adjustedLength, newWireframeGeometry);
        console.log('New geometries created', adjustedLength);
    }

    if (particle.geometry !== newGeometry) {
        particle.geometry.dispose();
        particle.geometry = newGeometry;

        const wireframe = particle.children[0];
        wireframe.geometry.dispose();
        wireframe.geometry = newWireframeGeometry;
        wireframe.scale.set(CONFIG.WIREFRAME_SCALE, CONFIG.WIREFRAME_SCALE, CONFIG.WIREFRAME_SCALE);
    }
}

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

function calculateAdjustedPosition(x, y) {
    return {
        x: x * CONFIG.SCALE_FACTOR,
        y: (y - CONFIG.OFFSET_Y) * CONFIG.SCALE_FACTOR
    };
}

function setParticleTransform(particle, position, angle, zPosition) {
    particle.position.set(position.x, position.y, zPosition);
    particle.rotation.z = angle * Math.PI;
}

function updateParticle(particle, particleData, zPosition) {
    const { x, y, length, angle } = particleData;
    const adjustedPosition = calculateAdjustedPosition(x, y);
    const adjustedLength = Math.round(length * CONFIG.SCALE_FACTOR);

    setParticleTransform(particle, adjustedPosition, angle, zPosition);
    updateGeometry(particle, adjustedLength);
    particle.visible = true;
}
