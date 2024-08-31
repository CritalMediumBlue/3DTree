// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Constants
const size = 400;
const divisions = 40;
const planeOpacity = 0.1;
const gridOpacity = 0.5;
const xyColor = 0x0000ff;  // Blue color for XY plane

// Helper function to create grid helper and plane for XY plane
const createXYGridAndPlane = () => {
    const gridHelper = new THREE.GridHelper(size, divisions, xyColor, xyColor);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.material.fog = true;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = gridOpacity;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size*0.6),
        new THREE.MeshBasicMaterial({ color: xyColor, side: THREE.DoubleSide, transparent: true, opacity: planeOpacity, fog: true })
    );

    scene.add(gridHelper);
    scene.add(plane);
};

// Create grid and plane for XY plane
createXYGridAndPlane();

scene.fog = new THREE.Fog(0x000000, 0.05, 1000);

// Set up camera position
camera.position.set(200, 200, 200);
camera.lookAt(0, 0, 0);

let particleData = null;
let particles = [];
let currentTimeStep = 0;

// Function to create a particle
const createParticle = (x, y) => {
    const geometry = new THREE.SphereGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.set(x, y, 0);
    scene.add(particle);
    return particle;
};

// Function to update particle positions
const updateParticles = (timeStep) => {
    if (!particleData || !particleData[timeStep]) {
        console.warn(`No data available for time step ${timeStep}`);
        return;
    }

    const stepData = particleData[timeStep];
    stepData.forEach((data, index) => {
        if (index >= particles.length) {
            particles.push(createParticle(data.x*4, (data.y-170)*4));
        } else {
            particles[index].position.set(data.x*4, (data.y-170)*4, 0);
        }
    });
};

// Handle file upload
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            particleData = JSON.parse(e.target.result);
            currentTimeStep = 0;
            if (particleData && Object.keys(particleData).length > 0) {
                updateParticles(currentTimeStep.toString());
            } else {
                console.warn('Parsed data is empty or invalid');
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };

    reader.readAsText(file);
});

let angle = 0;

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);

    if (particleData && Object.keys(particleData).length > 0) {
        currentTimeStep = (currentTimeStep + 1) % (Object.keys(particleData).length);
        updateParticles(currentTimeStep.toString());
    }

    angle += 0.005;
    camera.position.x = 150 * Math.cos(angle);
    camera.position.y = 150 * Math.sin(angle);
    camera.position.z = 200;
    camera.lookAt(0, 0, 0);


    renderer.render(scene, camera);
};

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});