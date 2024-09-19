import * as THREE from 'three';

let scene2D, camera2D, renderer2D;
let totalPlotMesh, magentaPlotMesh, cyanPlotMesh, xAxis, yAxis, xTicks, yTicks;

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
    const totalGeometry = new THREE.BufferGeometry();
    const magentaGeometry = new THREE.BufferGeometry();
    const cyanGeometry = new THREE.BufferGeometry();

    const totalMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 3 });
    const magentaMaterial = new THREE.PointsMaterial({ color: 0xff00ff, size: 3 });
    const cyanMaterial = new THREE.PointsMaterial({ color: 0x00ffff, size: 3 });

    totalPlotMesh = new THREE.Points(totalGeometry, totalMaterial);
    magentaPlotMesh = new THREE.Points(magentaGeometry, magentaMaterial);
    cyanPlotMesh = new THREE.Points(cyanGeometry, cyanMaterial);

    scene2D.add(totalPlotMesh);
    scene2D.add(magentaPlotMesh);
    scene2D.add(cyanPlotMesh);

    createAxes();
    createTicks();
}

function createAxes() {
    const axisColor = 0xffffff;
    const axisMaterial = new THREE.LineBasicMaterial({ color: axisColor, linewidth: 3 });

    // X-axis
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1, -0.9, 0),
        new THREE.Vector3(1, -0.9, 0)
    ]);
    xAxis = new THREE.Line(xAxisGeometry, axisMaterial);
    scene2D.add(xAxis);

    // Y-axis
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1, -0.9, 0),
        new THREE.Vector3(-1, 0.9, 0)
    ]);
    yAxis = new THREE.Line(yAxisGeometry, axisMaterial);
    scene2D.add(yAxis);
}

function createTicks() {
    const tickColor = 0xffffff;
    const tickMaterial = new THREE.LineBasicMaterial({ color: tickColor, linewidth: 3 });

    xTicks = new THREE.Group();
    yTicks = new THREE.Group();

    // X-axis ticks
    for (let i = -0.8; i <= 1; i += 0.2) {
        const tickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i, -0.9, 0),
            new THREE.Vector3(i, -0.87, 0)
        ]);
        const tick = new THREE.Line(tickGeometry, tickMaterial);
        xTicks.add(tick);
    }

    // Y-axis ticks (fixed from 0 to 1500)
    for (let i = 0; i <= 1500; i += 300) {
        const y = (i / 1500) * 1.8 - 0.9;
        const tickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, y, 0),
            new THREE.Vector3(-0.97, y, 0)
        ]);
        const tick = new THREE.Line(tickGeometry, tickMaterial);
        yTicks.add(tick);
    }

    scene2D.add(xTicks);
    scene2D.add(yTicks);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera2D.left = -aspect;
    camera2D.right = aspect;
    camera2D.updateProjectionMatrix();
    renderer2D.setSize(window.innerWidth/3, window.innerHeight/3);
}

export function updatePlot(totalHistory, magentaHistory, cyanHistory) {
    const totalPoints = [];
    const magentaPoints = [];
    const cyanPoints = [];
    const xStep = 2 / (totalHistory.length - 1);

    totalHistory.forEach((count, index) => {
        const x = -1 + index * xStep;
        const y = (count / 1500) * 1.8 - 0.9; // Scale to fit in the visible area (0 to 1500)
        totalPoints.push(new THREE.Vector3(x, y, 0));
    });

    magentaHistory.forEach((count, index) => {
        const x = -1 + index * xStep;
        const y = (count / 1500) * 1.8 - 0.9;
        magentaPoints.push(new THREE.Vector3(x, y, 0));
    });

    cyanHistory.forEach((count, index) => {
        const x = -1 + index * xStep;
        const y = (count / 1500) * 1.8 - 0.9;
        cyanPoints.push(new THREE.Vector3(x, y, 0));
    });

    totalPlotMesh.geometry.dispose();
    totalPlotMesh.geometry = new THREE.BufferGeometry().setFromPoints(totalPoints);

    magentaPlotMesh.geometry.dispose();
    magentaPlotMesh.geometry = new THREE.BufferGeometry().setFromPoints(magentaPoints);

    cyanPlotMesh.geometry.dispose();
    cyanPlotMesh.geometry = new THREE.BufferGeometry().setFromPoints(cyanPoints);
}

export function renderPlot() {
    renderer2D.render(scene2D, camera2D);
}