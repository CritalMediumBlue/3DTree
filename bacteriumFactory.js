import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Creates a capsule mesh for a bacterium
 * @returns {THREE.Mesh} The created capsule mesh
 */
export function createCapsule() {
    const capsuleGeometry = new THREE.CapsuleGeometry(
        1 / 2,
        1,
        CONFIG.BACTERIUM.CAP_SEGMENTS,
        CONFIG.BACTERIUM.RADIAL_SEGMENTS
    );
    const capsuleMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff) });
    return new THREE.Mesh(capsuleGeometry, capsuleMaterial);
}

/**
 * Creates a wireframe for the capsule
 * @param {THREE.BufferGeometry} capsuleGeometry - The geometry of the capsule
 * @returns {THREE.LineSegments} The created wireframe
 */
export function createWireframe(capsuleGeometry) {
    const wireframeGeometry = new THREE.EdgesGeometry(capsuleGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(CONFIG.BACTERIUM.WIREFRAME_COLOR) });
    return new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
}

/**
 * Creates a capsule with wireframe and adds it to the scene
 * @param {THREE.Scene} scene - The scene to add the capsule to
 * @returns {THREE.Mesh} The created capsule mesh
 */
export function createAndAddCapsule(scene) {
    const capsule = createCapsule();
    const wireframe = createWireframe(capsule.geometry);

    capsule.add(wireframe);
    scene.add(capsule);
    capsule.visible = false;
    return capsule;
}