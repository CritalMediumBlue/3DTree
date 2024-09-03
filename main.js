const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const Z_position = 100;

scene.fog = new THREE.Fog(0x000000, 5, Z_position*2.5);

const particleData = [];
const particles = [];
let currentTimeStep = 1;
let numberOfTimeSteps = null;
const numberOflayers = 7;

const getMaterial = (Z) => {
    const maxOpacity = 1;
    const maxRed = 1;
    const maxGreen = 1;

    const opacity = maxOpacity - Math.abs(maxOpacity - (2 / (numberOflayers * Z_OFFSET)) * Z);
    
    const r = Math.floor(255 * (Math.abs(maxRed - (2 / (numberOflayers * Z_OFFSET)) * Z)));
    const g = Math.floor(255 * (maxGreen - Math.abs(maxGreen - (2 / (numberOflayers * Z_OFFSET)) * Z)));
    const color = (r << 16) | (g << 8);
    
    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
    });
    return material;
}
const Z_OFFSET = 2; // Offset between timesteps

// Create a base geometry for the particles
const baseGeometry = new THREE.BoxGeometry(1, 1, 0);  // (length, width, height)
const edges = new THREE.EdgesGeometry(baseGeometry);

let angle = 0;

const speed = 1;

// Particle pool for better performance
const createParticlePool = (maxParticles) => {
    for (let i = 0; i < maxParticles; i++) {
        const particleMesh = new THREE.LineSegments(edges, getMaterial(0));
        particleMesh.visible = false;
        scene.add(particleMesh);
        particles.push(particleMesh);
    }
};

const updateParticles = (timeStep) => {
    const integerPart = Math.floor(timeStep);
    const fractionalPart = timeStep % 1;
    const baseZ = fractionalPart * Z_OFFSET;

    const layers = [];
    const materials = [];

    for (let i = numberOflayers-1; i >= 0; i--) {
        layers.push(particleData[integerPart + i]);
        materials.push(getMaterial(baseZ + Z_OFFSET * (numberOflayers-1 - i)));
    }

    let particleIndex = 0;
    layers.forEach((layer, layerIndex) => {
        layer.forEach(data => {
            if (particleIndex < particles.length) {
                const particle = particles[particleIndex];
                updateParticle(particle, data, baseZ + Z_OFFSET * layerIndex, materials[layerIndex]);
                particle.visible = true;
                particleIndex++;
            }
        });
    });

    // Hide unused particles
    for (let i = particleIndex; i < particles.length; i++) {
        particles[i].visible = false;
    }
};

const updateParticle = (particle, data, z, material) => {
    const x = data.x * 4;
    const y = (data.y - 170) * 4;
    const length = data.length * 4;
    const width = 1.5; // You can adjust this value to change the width of the particles
    const particleAngle = data.angle * Math.PI + Math.PI / 2;

    particle.scale.set(length, width, 1);  
    particle.position.set(x, y, z);
    particle.rotation.z = particleAngle;
    particle.material = material;
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
        createParticlePool(maxParticles * numberOflayers);
    };
    reader.readAsText(file);
});

const animate = () => {
    requestAnimationFrame(animate);

    if (particleData.length > 0) {
        currentTimeStep = (currentTimeStep + speed * 0.1) % numberOfTimeSteps;  // this is a number between 0 and numberOfTimeSteps.
        updateParticles(currentTimeStep);
    }

    angle = angle + 0.0005 * speed;
    camera.position.set(150 * Math.cos(angle), 150 * Math.sin(angle), -Z_position);
    camera.lookAt(0, 0, 0);    

    renderer.render(scene, camera);
};

animate();
