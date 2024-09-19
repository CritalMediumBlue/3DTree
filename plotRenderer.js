import * as THREE from 'three';

let scene2D, camera2D, renderer2D;
let plotMesh;

export function initPlotRenderer() {
    scene2D = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    camera2D = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 100);
    camera2D.position.z = 1;

    renderer2D = new THREE.WebGLRenderer({ alpha: true });
    renderer2D.setSize(window.innerWidth/3, window.innerHeight/3);
    renderer2D.domElement.style.position = 'absolute';
    renderer2D.domElement.style.top = '0px';
    renderer2D.domElement.style.left = '0px';
    renderer2D.domElement.style.pointerEvents = 'none';
    document.getElementById('plot-overlay').appendChild(renderer2D.domElement);

    createPlot();

    window.addEventListener('resize', onWindowResize, false);
}

function createPlot() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
    plotMesh = new THREE.Line(geometry, material);
    scene2D.add(plotMesh);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera2D.left = -aspect;
    camera2D.right = aspect;
    camera2D.updateProjectionMatrix();
    renderer2D.setSize(window.innerWidth/3, window.innerHeight/3);
}

export function updatePlot(bacteriaCountHistory) {
    const points = [];
    const maxCount = Math.max(...bacteriaCountHistory);
    const xStep = 2 / (bacteriaCountHistory.length - 1);

    bacteriaCountHistory.forEach((count, index) => {
        const x = -1 + index * xStep;
        const y = (count / maxCount) * 0.8 - 0.9; // Scale to fit in the bottom part of the screen
        points.push(new THREE.Vector3(x, y, 0));
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    plotMesh.geometry.dispose();
    plotMesh.geometry = geometry;
}

export function renderPlot() {
    renderer2D.render(scene2D, camera2D);
}