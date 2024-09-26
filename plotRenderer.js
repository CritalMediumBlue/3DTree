import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Represents a 2D plot renderer using Three.js.
 * @class
 */
class PlotRenderer {
    /**
     * Creates an instance of PlotRenderer.
     * @constructor
     */
    constructor() {
        this.scene2D = null;
        this.camera2D = null;
        this.renderer2D = null;
        this.totalPlotPoints = null;
        this.magentaPlotPoints = null;
        this.cyanPlotPoints = null;
        this.yTicks = null;
        this.needsRender = false;
        this.currentIndex = 0;
        this.offset = 0;
    }

    /**
     * Initializes the PlotRenderer, setting up the scene, camera, and renderer.
     * @public
     */
    init() {
        this.scene2D = new THREE.Scene();
        this.camera2D = new THREE.OrthographicCamera(-2, 2, 1, -1, 0.1, 100);
        this.camera2D.position.z = 1;
        this.renderer2D = new THREE.WebGLRenderer({ alpha: true });
        this.renderer2D.setSize(window.innerWidth * CONFIG.PLOT_RENDERER.PLOT_WIDTH_RATIO, window.innerHeight * CONFIG.PLOT_RENDERER.PLOT_HEIGHT_RATIO);
        this.renderer2D.domElement.style.position = 'absolute';
        document.getElementById('plot-overlay').appendChild(this.renderer2D.domElement);
        this.createPlot();
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    /**
     * Creates the plot by setting up geometries, materials, points, and ticks.
     * @private
     */
    createPlot() {
        this.createPlotGeometries();
        this.createPlotMaterials();
        this.createPlotPoints();
        this.createTicks();
    }

    /**
     * Creates the geometries for the plot.
     * @private
     */
    createPlotGeometries() {
        const positions = new Float32Array(CONFIG.PLOT_RENDERER.MAX_POINTS * 3);
        const createGeometry = () => {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
            return geometry;
        };
        
        this.totalGeometry = createGeometry();
        this.magentaGeometry = createGeometry();
        this.cyanGeometry = createGeometry();
    }

    /**
     * Creates the materials for the plot.
     * @private
     */
    createPlotMaterials() {
        this.totalMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: CONFIG.PLOT_RENDERER.POINT_SIZE });
        this.magentaMaterial = new THREE.PointsMaterial({ color: 0xff00ff, size: CONFIG.PLOT_RENDERER.POINT_SIZE });
        this.cyanMaterial = new THREE.PointsMaterial({ color: 0x00ffff, size: CONFIG.PLOT_RENDERER.POINT_SIZE });
    }

    /**
     * Creates the point clouds for the plot and adds them to the scene.
     * @private
     */
    createPlotPoints() {
        this.totalPlotPoints = new THREE.Points(this.totalGeometry, this.totalMaterial);
        this.magentaPlotPoints = new THREE.Points(this.magentaGeometry, this.magentaMaterial);
        this.cyanPlotPoints = new THREE.Points(this.cyanGeometry, this.cyanMaterial);

        this.scene2D.add(this.totalPlotPoints, this.magentaPlotPoints, this.cyanPlotPoints);
    }

    /**
     * Creates the ticks for the plot.
     * @private
     */
    createTicks() {
        const tickMaterial = new THREE.LineBasicMaterial({ color: CONFIG.PLOT_RENDERER.AXIS_COLOR });
        this.yTicks = new THREE.Group();
        this.createYTicks(tickMaterial);
        this.scene2D.add(this.yTicks);
    }

    /**
     * Creates the Y-axis ticks for the plot.
     * @private
     * @param {THREE.Material} tickMaterial - The material to use for the ticks.
     */
    createYTicks(tickMaterial) {
        const points = [];
        for (let i = 0; i <= CONFIG.PLOT_RENDERER.MAX_Y_VALUE; i += CONFIG.PLOT_RENDERER.Y_TICK_STEP) {
            const y = (i / CONFIG.PLOT_RENDERER.MAX_Y_VALUE) * 2 - 0.999;
            points.push(new THREE.Vector3(-2, y, 0), new THREE.Vector3(2, y, 0));
        }
        const tickGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const ticks = new THREE.LineSegments(tickGeometry, tickMaterial);
        this.yTicks.add(ticks);
    }

    /**
     * Handles window resize events by updating the renderer size.
     * @private
     */
    onWindowResize() {
        this.renderer2D.setSize(window.innerWidth * CONFIG.PLOT_RENDERER.PLOT_WIDTH_RATIO, window.innerHeight * CONFIG.PLOT_RENDERER.PLOT_HEIGHT_RATIO);
        this.needsRender = true;
    }

    /**
     * Updates the plot with new data.
     * @public
     * @param {number[]} totalHistory - Array of total bacteria counts.
     * @param {number[]} magentaHistory - Array of magenta bacteria counts.
     * @param {number[]} cyanHistory - Array of cyan bacteria counts.
     */
    updatePlot(totalHistory, magentaHistory, cyanHistory) {
        const updateGeometry = (geometry, history) => {
            const positions = geometry.attributes.position.array;
            const xStep = 4 / CONFIG.PLOT_RENDERER.MAX_POINTS;
            
            for (let i = 0; i < CONFIG.PLOT_RENDERER.MAX_POINTS; i++) {
                const historyIndex = this.offset + i;
                const x = -2 + i * xStep;
                const y = historyIndex < history.length ? (history[historyIndex] / CONFIG.PLOT_RENDERER.MAX_Y_VALUE) * 2 - 0.999 : -1;
                const index = i * 3;
                positions[index] = x;
                positions[index + 1] = y;
                positions[index + 2] = 0;
            }
            
            geometry.attributes.position.needsUpdate = true;
            geometry.setDrawRange(0, Math.min(this.currentIndex, CONFIG.PLOT_RENDERER.MAX_POINTS));
        };
        
        updateGeometry(this.totalPlotPoints.geometry, totalHistory);
        updateGeometry(this.magentaPlotPoints.geometry, magentaHistory);
        updateGeometry(this.cyanPlotPoints.geometry, cyanHistory);
        
        this.currentIndex++;
        if (this.currentIndex > CONFIG.PLOT_RENDERER.MAX_POINTS) {
            this.offset++;
        }
        this.needsRender = true;
    }

    /**
     * Renders the plot.
     * @public
     */
    render() {
        if (this.needsRender) {
            this.renderer2D.render(this.scene2D, this.camera2D);
            this.needsRender = false;
        }
    }
}

const plotRendererInstance = new PlotRenderer();

/**
 * Initializes the PlotRenderer instance.
 * @function
 */
export function initPlotRenderer() {
    plotRendererInstance.init();
}

/**
 * Updates the plot with new data.
 * @function
 * @param {number[]} totalHistory - Array of total bacteria counts.
 * @param {number[]} magentaHistory - Array of magenta bacteria counts.
 * @param {number[]} cyanHistory - Array of cyan bacteria counts.
 */
export function updatePlot(totalHistory, magentaHistory, cyanHistory) {
    plotRendererInstance.updatePlot(totalHistory, magentaHistory, cyanHistory);
}

/**
 * Renders the plot.
 * @function
 */
export function renderPlot() {
    plotRendererInstance.render();
}
