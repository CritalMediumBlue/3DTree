import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/controls/OrbitControls.js';
import { CONFIG } from './config.js';

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
    scene.fog = new THREE.Fog(CONFIG.SCENE.FOG_COLOR, CONFIG.SCENE.FOG_NEAR, CONFIG.SCENE.FOG_FAR);
    return scene;
}

/**
 * Creates and returns a new THREE.PerspectiveCamera object.
 * @returns {THREE.PerspectiveCamera} The created camera.
 */
function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        CONFIG.SCENE.CAMERA_FOV,
        window.innerWidth / window.innerHeight,
        CONFIG.SCENE.CAMERA_NEAR,
        CONFIG.SCENE.CAMERA_FAR
    );
    camera.position.set(
        CONFIG.SCENE.CAMERA_POSITION.x,
        CONFIG.SCENE.CAMERA_POSITION.y,
        CONFIG.SCENE.CAMERA_POSITION.z
    );
    camera.lookAt(
        CONFIG.SCENE.CAMERA_LOOKAT.x,
        CONFIG.SCENE.CAMERA_LOOKAT.y,
        CONFIG.SCENE.CAMERA_LOOKAT.z
    );
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
 * @returns {OrbitControls} The created controls.
 */
function createControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.autoRotate = false;
    controls.screenSpacePanning = true;
    controls.maxDistance = CONFIG.SCENE.CONTROLS_MAX_DISTANCE;
    controls.minDistance = CONFIG.SCENE.CONTROLS_MIN_DISTANCE;
    controls.target.set(
        CONFIG.SCENE.CAMERA_LOOKAT.x,
        CONFIG.SCENE.CAMERA_LOOKAT.y,
        CONFIG.SCENE.CAMERA_LOOKAT.z
    );
    controls.update(); // Important! Call this after changing the target
    return controls;
}

/**
 * Adds a grid to the scene for reference.
 * @param {THREE.Scene} scene - The scene to add the grid to.
 */
