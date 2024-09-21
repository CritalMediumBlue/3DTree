import * as THREE from 'three';
import { CONFIG } from './config.js';

class Histogram {
    constructor(scene, xMin, xMax, yMin, yMax) {
        this.scene = scene;
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
        this.histogramData = {};
        this.cubes = [];

        this.initializeGrid();
    }

    initializeGrid() {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        const xStep = xRange / CONFIG.HISTOGRAM.GRID_SIZE;
        const yStep = yRange / CONFIG.HISTOGRAM.GRID_SIZE;

        for (let i = 0; i < CONFIG.HISTOGRAM.GRID_SIZE; i++) {
            for (let j = 0; j < CONFIG.HISTOGRAM.GRID_SIZE; j++) {
                const key = `${i},${j}`;
                this.histogramData[key] = 0;
            }
        }
    }

    addBacterium(x, y) {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        const xStep = xRange / CONFIG.HISTOGRAM.GRID_SIZE;
        const yStep = yRange / CONFIG.HISTOGRAM.GRID_SIZE;

        const gridX = Math.floor((x - this.xMin) / xStep);
        const gridY = Math.floor((y - this.yMin) / yStep);

        const key = `${gridX},${gridY}`;
        this.histogramData[key]++;

        this.updateVisualization(gridX, gridY);
    }

    updateVisualization(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        const height = this.histogramData[key];

        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        const xStep = xRange / CONFIG.HISTOGRAM.GRID_SIZE;
        const yStep = yRange / CONFIG.HISTOGRAM.GRID_SIZE;

        const x = this.xMin + (gridX + 0.5) * xStep;
        const y = this.yMin + (gridY + 0.5) * yStep;
        const z = height * CONFIG.HISTOGRAM.CUBE_SIZE / 2;

        const geometry = new THREE.BoxGeometry(xStep, yStep, CONFIG.HISTOGRAM.CUBE_SIZE);
        const wireframe = new THREE.WireframeGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: CONFIG.HISTOGRAM.COLOR,
            opacity: CONFIG.HISTOGRAM.OPACITY,
            transparent: true
        });
        const line = new THREE.LineSegments(wireframe, material);



      
        // Add the new cube
        line.position.set(x, y, z);

        this.scene.add(line);
        this.cubes.push(line);
    

        
    }

    reset() {
        for (const cube of this.cubes) {
            this.scene.remove(cube);
        }
        this.cubes = [];
        this.initializeGrid();
    }
}

export { Histogram };