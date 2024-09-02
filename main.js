const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const size = 100;
const divisions = 20;
const gridHelper = new THREE.GridHelper(size * 4, divisions);
gridHelper.rotation.x = Math.PI / 2;
gridHelper.material.fog = true;
scene.add(gridHelper);
scene.fog = new THREE.Fog(0x000000, 20, 450);

const particleData = [];
const particles = [];
let currentTimeStep = 0;
let numberOfTimeSteps = null;

const material = new THREE.MeshBasicMaterial({
    color: 0xf00000,
    transparent: true,
    opacity: 0.5
});
const geometry = new THREE.PlaneGeometry(1, 2); // (length, width)
let angle = 0;
camera.position.z = 100;

const speed = 0.1;
const Z_OFFSET = 15; // Offset between timesteps

// Particle pool for better performance
const createParticlePool = (maxParticles) => {
    for (let i = 0; i < maxParticles; i++) {
        const particleMesh = new THREE.Mesh(geometry, material);
        particleMesh.visible = false;
        scene.add(particleMesh);
        particles.push(particleMesh);
    }
};

const updateParticles = (timeStep) => {
    const currentStepData = particleData[Math.floor(timeStep)];
    const nextStepData = particleData[Math.floor((timeStep + 1) % numberOfTimeSteps)];
    
    const fractionalPart = timeStep % 1;
    const baseZ = fractionalPart * Z_OFFSET;

    particles.forEach((particle, index) => {
        if (index < currentStepData.length) {
            const data = currentStepData[index];
            updateParticle(particle, data, baseZ);
            particle.visible = true;
        } else if (index < currentStepData.length + nextStepData.length) {
            const data = nextStepData[index - currentStepData.length];
            updateParticle(particle, data, baseZ + Z_OFFSET);
            particle.visible = true;
        } else {
            particle.visible = false;
        }
    });
};

const updateParticle = (particle, data, z) => {
    const x = data.x * 4;
    const y = (data.y - 170) * 4;
    const length = data.length * 4;
    const particleAngle = data.angle * Math.PI + Math.PI / 2;

    particle.scale.set(length, 1.5, 1);
    particle.position.set(x, y, z);
    particle.rotation.z = particleAngle;
};

// File input handler
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        particleData.length = 0; // Clear existing data
        
        // Convert string keys to integer keys
        Object.keys(data).forEach(key => {
            const intKey = parseInt(key, 10);
            particleData[intKey] = data[key];
        });
        
        numberOfTimeSteps = Object.keys(particleData).length;
        let maxParticles = Math.max(...Object.values(particleData).map(step => step.length));
        let meanAmount = Object.values(particleData).reduce((acc, step) => acc + step.length, 0) / Object.keys(particleData).length;
        console.log(`Mean amount of particles: ${meanAmount}`);
        createParticlePool(maxParticles * 2);
    };
    reader.readAsText(file);
});

const animate = () => {
    requestAnimationFrame(animate);

    if (particleData.length > 0) {
        currentTimeStep = (currentTimeStep + speed * 0.1) % numberOfTimeSteps;
        updateParticles(currentTimeStep);
    }

    angle = angle + 0.005 * speed;
    camera.position.set(200 * Math.cos(angle), 200 * Math.sin(angle), 150 + 50 * Math.sin(angle * 0.5));
    camera.lookAt(0, 0, Z_OFFSET * 2);    

    renderer.render(scene, camera);
};

animate();
