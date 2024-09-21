import * as THREE from 'three';
import { CONFIG } from './config.js';

class PlotRenderer {
    constructor() {
        this.scene2D = null;
        this.camera2D = null;
        this.renderer2D = null;
        this.totalPlotMesh = null;
        this.magentaPlotMesh = null;
        this.cyanPlotMesh = null;
        this.xAxis = null;
        this.yAxis = null;
        this.xTicks = null;
        this.yTicks = null;
    }

    init() {
        this.scene2D = new THREE.Scene();

        const aspect = window.innerWidth / window.innerHeight;
        this.camera2D = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 100);
        this.camera2D.position.z = 1;

        this.renderer2D = new THREE.WebGLRenderer({ alpha: false });
        this.renderer2D.setSize(window.innerWidth * CONFIG.PLOT_RENDERER.PLOT_WIDTH_RATIO, window.innerHeight * CONFIG.PLOT_RENDERER.PLOT_HEIGHT_RATIO);
        this.renderer2D.domElement.style.position = 'absolute';
        document.getElementById('plot-overlay').appendChild(this.renderer2D.domElement);
        this.createPlot();
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    createPlot() {
        this.createPlotGeometries();
        this.createPlotMaterials();
        this.createPlotMeshes();
        this.createAxes();
        this.createTicks();
    }

    createPlotGeometries() {
        this.totalGeometry = new THREE.BufferGeometry();
        this.magentaGeometry = new THREE.BufferGeometry();
        this.cyanGeometry = new THREE.BufferGeometry();

        const positions = new Float32Array(CONFIG.PLOT_RENDERER.MAX_POINTS * 3);
        this.totalGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
        this.magentaGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
        this.cyanGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    }

    createPlotMaterials() {
        this.totalMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: CONFIG.PLOT_RENDERER.POINT_SIZE });
        this.magentaMaterial = new THREE.PointsMaterial({ color: 0xff00ff, size: CONFIG.PLOT_RENDERER.POINT_SIZE });
        this.cyanMaterial = new THREE.PointsMaterial({ color: 0x00ffff, size: CONFIG.PLOT_RENDERER.POINT_SIZE });
    }

    createPlotMeshes() {
        this.totalPlotMesh = new THREE.Points(this.totalGeometry, this.totalMaterial);
        this.magentaPlotMesh = new THREE.Points(this.magentaGeometry, this.magentaMaterial);
        this.cyanPlotMesh = new THREE.Points(this.cyanGeometry, this.cyanMaterial);

        this.scene2D.add(this.totalPlotMesh, this.magentaPlotMesh, this.cyanPlotMesh);
    }

    createAxes() {
        const axisMaterial = new THREE.LineBasicMaterial({ color: CONFIG.PLOT_RENDERER.AXIS_COLOR });

        // X-axis
        const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(CONFIG.PLOT_RENDERER.Y_AXIS_X, CONFIG.PLOT_RENDERER.X_AXIS_Y, 0),
            new THREE.Vector3(CONFIG.PLOT_RENDERER.X_MAX_Y, CONFIG.PLOT_RENDERER.X_AXIS_Y, 0)
        ]);
        this.xAxis = new THREE.Line(xAxisGeometry, axisMaterial);
        this.scene2D.add(this.xAxis);

        // Y-axis
        const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(CONFIG.PLOT_RENDERER.Y_AXIS_X, CONFIG.PLOT_RENDERER.X_AXIS_Y, 0),
            new THREE.Vector3(CONFIG.PLOT_RENDERER.Y_AXIS_X, CONFIG.PLOT_RENDERER.Y_MAX_X, 0),
        ]);
        this.yAxis = new THREE.Line(yAxisGeometry, axisMaterial);
        this.scene2D.add(this.yAxis);
    }

    createTicks() {
        const tickMaterial = new THREE.LineBasicMaterial({ color: CONFIG.PLOT_RENDERER.AXIS_COLOR });

        this.yTicks = new THREE.Group();

        this.createYTicks(tickMaterial);

        this.scene2D.add(this.yTicks);
    }

 

    createYTicks(tickMaterial) {
        for (let i = 0; i <= CONFIG.PLOT_RENDERER.MAX_Y_VALUE; i += CONFIG.PLOT_RENDERER.Y_TICK_STEP) {
            const y = (i / CONFIG.PLOT_RENDERER.MAX_Y_VALUE) * CONFIG.PLOT_RENDERER.PLOT_Y_SCALE + CONFIG.PLOT_RENDERER.PLOT_Y_OFFSET;
            const tickGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(CONFIG.PLOT_RENDERER.Y_AXIS_X, y, 0),
                new THREE.Vector3(CONFIG.PLOT_RENDERER.Y_AXIS_X + 0.03, y, 0)
            ]);
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            this.yTicks.add(tick);
        }
    }

    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera2D.left = -aspect;
        this.camera2D.right = aspect;
        this.camera2D.updateProjectionMatrix();
        this.renderer2D.setSize(window.innerWidth * CONFIG.PLOT_RENDERER.PLOT_WIDTH_RATIO, window.innerHeight * CONFIG.PLOT_RENDERER.PLOT_HEIGHT_RATIO);
    }

    updatePlot(totalHistory, magentaHistory, cyanHistory) {
        const updateGeometry = (geometry, history) => {
            const positions = geometry.attributes.position.array;
            const historyLength = history.length;
            
            if (historyLength > 1) {
                const xStep = 2 / (historyLength - 1);
                history.forEach((count, index) => {
                    const x = -1 + index * xStep;
                    const y = (count / CONFIG.PLOT_RENDERER.MAX_Y_VALUE) * CONFIG.PLOT_RENDERER.PLOT_Y_SCALE + CONFIG.PLOT_RENDERER.PLOT_Y_OFFSET;
                    positions[index * 3] = x;
                    positions[index * 3 + 1] = y;
                    positions[index * 3 + 2] = 0;
                });
            } else if (historyLength === 1) {
                positions[0] = -1;
                positions[1] = (history[0] / CONFIG.PLOT_RENDERER.MAX_Y_VALUE) * CONFIG.PLOT_RENDERER.PLOT_Y_SCALE + CONFIG.PLOT_RENDERER.PLOT_Y_OFFSET;
                positions[2] = 0;
            }

            geometry.attributes.position.needsUpdate = true;
            geometry.setDrawRange(0, historyLength);
        };

        updateGeometry(this.totalPlotMesh.geometry, totalHistory);
        updateGeometry(this.magentaPlotMesh.geometry, magentaHistory);
        updateGeometry(this.cyanPlotMesh.geometry, cyanHistory);
    }

    render() {
        this.renderer2D.render(this.scene2D, this.camera2D);
    }

}

const plotRendererInstance = new PlotRenderer();

export function initPlotRenderer() {
    plotRendererInstance.init();
}

export function updatePlot(totalHistory, magentaHistory, cyanHistory) {
    plotRendererInstance.updatePlot(totalHistory, magentaHistory, cyanHistory);
}

export function renderPlot() {
    plotRendererInstance.render();
}
