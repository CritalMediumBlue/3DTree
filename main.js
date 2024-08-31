// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Constants
const size = 1.5;
const divisions = 40;
const planeOpacity = 0.1;
const gridOpacity = 0.5;

// Helper function to create grid helpers
function createGridHelper(size, divisions, color, rotation) {
    const gridHelper = new THREE.GridHelper(size, divisions, color, color);
    if (rotation) {
        gridHelper.rotation.set(rotation.x, rotation.y, rotation.z);
    }
    gridHelper.material.fog = true;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = gridOpacity;
    return gridHelper;
}

// Helper function to create planes
function createPlane(size, color, rotation) {
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: planeOpacity, fog: true })
    );
    if (rotation) {
        plane.rotation.set(rotation.x, rotation.y, rotation.z);
    }
    return plane;
}

// Helper function to create points
function createPoint(color, position) {
    const point = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 0, 0),
        new THREE.MeshBasicMaterial({ color: color })
    );
    point.position.set(position.x, position.y, position.z);
    return point;
}

// Add XY plane and grid
scene.add(createGridHelper(size, divisions, 0x0000ff, { x: Math.PI / 2, y: 0, z: 0 }));
scene.add(createPlane(size, 0x0000ff));


scene.add(createPoint(0xff0000, { x: size / 2, y: 0, z: 0 }));
scene.add(createPoint(0x00ff00, { x: 0, y: size / 2, z: 0 }));


scene.fog = new THREE.Fog(0x000000, 0.05, 4);

//////////////////////////////////////// Data visualization  ////////////////////////////////////////

// Position and orient the camera
let angle = 0;
let quaternionPosition = new THREE.Quaternion();
let quaternionLookAt = new THREE.Quaternion();



// Create an animation loop to render the scene
function animate() {
    requestAnimationFrame(animate);
    angle += 0.002;

    let x = 1 / Math.sqrt(8);
    let y = 1 / Math.sqrt(8);
    let z = Math.sqrt(3 / 4);

    quaternionPosition.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);  
    const cameraPosition = new THREE.Vector3(x, y, z); 
    cameraPosition.applyQuaternion(quaternionPosition); 
    camera.position.copy(cameraPosition);

    const directionToOrigin = cameraPosition.normalize().multiplyScalar(-1); // Direction to the origin

    quaternionLookAt.setFromUnitVectors(new THREE.Vector3(0, 0, -1), directionToOrigin);

    camera.quaternion.copy(quaternionLookAt);

    renderer.render(scene, camera);
}

animate();