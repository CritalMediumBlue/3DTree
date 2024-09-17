import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Sets up the scene, camera, renderer, and controls.
 * @returns {Object} An object containing the scene, camera, renderer, and controls.
 */
export function setupScene() {
    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer();
    const controls = createControls(camera, renderer);

    window.addEventListener('resize', () => onWindowResize(camera, renderer));

    return { scene, camera, renderer, controls };
}

/**
 * Handles window resize events.
 * @param {THREE.Camera} camera - The camera to update.
 * @param {THREE.WebGLRenderer} renderer - The renderer to update.
 */
function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Creates and returns a new THREE.Scene object.
 * @returns {THREE.Scene} The created scene.
 */
function createScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 50, 250);
    return scene;
}

/**
 * Creates and returns a new THREE.PerspectiveCamera object.
 * @returns {THREE.PerspectiveCamera} The created camera.
 */
function createCamera() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 5, 1000);
    camera.position.set(0, 0, 80);
    return camera;
}

/**
 * Creates and returns a new THREE.WebGLRenderer object.
 * @returns {THREE.WebGLRenderer} The created renderer.
 */
function createRenderer() {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
}

/**
 * Creates and returns a new OrbitControls object.
 * @param {THREE.Camera} camera - The camera to control.
 * @param {THREE.WebGLRenderer} renderer - The renderer to control.
 * @param {Object} options - Options for the controls.
 * @returns {OrbitControls} The created controls.
 */
function createControls(camera, renderer, { enableDamping = false, autoRotate = false, screenSpacePanning = false, maxDistance = 1000, minDistance = 100 } = {}) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = enableDamping;
    controls.autoRotate = autoRotate;
    controls.screenSpacePanning = screenSpacePanning;
    controls.maxDistance = maxDistance;
    controls.minDistance = minDistance;
    return controls;
}