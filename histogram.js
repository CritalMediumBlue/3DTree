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
        this.boxes = {};
        this.wireframes = {};

        this.initializeGrid();
    }

    initializeGrid() {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        const xStep = xRange / 20;  // Changed from 10 to 20
        const yStep = yRange / 12;  // Changed from 6 to 12

        for (let i = 0; i < 20; i++) {  // Changed from 10 to 20
            for (let j = 0; j < 12; j++) {  // Changed from 6 to 12
                const key = `${i},${j}`;
                this.histogramData[key] = 0;
            }
        }
    }

    addBacterium(x, y) {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        const xStep = xRange / 20;  // Changed from 10 to 20
        const yStep = yRange / 12;  // Changed from 6 to 12

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
        const xStep = xRange / 20;  // Changed from 10 to 20
        const yStep = yRange / 12;  // Changed from 6 to 12

        // Reduce the size of each box by 5% to create gaps
        const boxWidthScale = 0.85;
        const boxDepthScale = 0.85;

        const x = this.xMin + (gridX + 0.5) * xStep;
        const y = this.yMin + (gridY + 0.5) * yStep;
        const z = height * CONFIG.HISTOGRAM.CUBE_SIZE / 2;

        if (!this.boxes[key]) {
            // Create a new box if it doesn't exist
            const geometry = new THREE.BoxGeometry(
                xStep * boxWidthScale,
                yStep * boxDepthScale,
                CONFIG.HISTOGRAM.CUBE_SIZE
            );
            const material = new THREE.MeshBasicMaterial({
                color: CONFIG.HISTOGRAM.COLOR,
                opacity: CONFIG.HISTOGRAM.OPACITY,
                transparent: true
            });
            const box = new THREE.Mesh(geometry, material);
            box.position.set(x, y, z);
            this.scene.add(box);
            this.boxes[key] = box;

            // Create wireframe
            const edges = new THREE.EdgesGeometry(geometry);
            const wireframeMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                linewidth: 1
            });
            const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
            wireframe.position.set(x, y, z);
            this.scene.add(wireframe);
            this.wireframes[key] = wireframe;
        } else {
            // Update existing box and wireframe
            const box = this.boxes[key];
            box.scale.z = height;
            box.position.z = z;

            const wireframe = this.wireframes[key];
            wireframe.scale.z = height;
            wireframe.position.z = z;
        }
    }

    reset() {
        for (const key in this.boxes) {
            this.scene.remove(this.boxes[key]);
            this.scene.remove(this.wireframes[key]);
        }
        this.boxes = {};
        this.wireframes = {};
        this.initializeGrid();
    }
}

export { Histogram };