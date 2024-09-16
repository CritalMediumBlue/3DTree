import * as THREE from 'three';
import { CONFIG } from './config.js';

export function setupScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a0000, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);

    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 1000);
    camera.position.set(0, 0, CONFIG.Z_INITIAL);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth - 17, window.innerHeight - 17);
    document.body.appendChild(renderer.domElement);

    return { scene, camera, renderer };
}

export function createContainer(scene, timeStep) {
    const containerGeometry = new THREE.BoxGeometry(CONFIG.CONTAINER_SIZE.width, CONFIG.CONTAINER_SIZE.height, 30);
    const containerEdges = new THREE.EdgesGeometry(containerGeometry);
    const container = new THREE.LineSegments(containerEdges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
    container.position.z = CONFIG.Z_STEP * timeStep;
    scene.add(container);
    return container;
}