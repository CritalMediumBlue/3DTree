import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createCapsule() {
    const capsuleGeometry = new THREE.CapsuleGeometry(
        CONFIG.SCALE_FACTOR / 2,
        1,
        CONFIG.CAP_SEGMENTS,
        CONFIG.RADIAL_SEGMENTS
    );
    const capsuleMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(CONFIG.CAPSULE_COLOR) });
    return new THREE.Mesh(capsuleGeometry, capsuleMaterial);
}

export function createWireframe(capsuleGeometry) {
    const wireframeGeometry = new THREE.EdgesGeometry(capsuleGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(CONFIG.WIREFRAME_COLOR) });
    return new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
}

export function createAndAddCapsule(scene) {
    const capsule = createCapsule();
    const wireframe = createWireframe(capsule.geometry);

    capsule.add(wireframe);
    scene.add(capsule);
    capsule.visible = false;
    return capsule;
}