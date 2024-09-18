import * as THREE from 'three';
import { quadtree } from 'd3-quadtree';
import { CONFIG } from './config.js';
import { BacteriumPool } from './bacteriumPool.js';

export class BacteriumSystem {
    constructor(scene) {
        this.scene = scene;
        this.bacteriumPool = new BacteriumPool(scene, CONFIG.INITIAL_POOL_SIZE);
        this.capsuleGeometryCache = new Map();
        this.edgesGeometryCache = new Map();
        this.quadtree = null;
      
    }

    updateGeometry(bacterium, adjustedLength) {
        let newGeometry = this.capsuleGeometryCache.get(adjustedLength);
        let newWireframeGeometry = this.edgesGeometryCache.get(adjustedLength);

        if (!newGeometry) {
            newGeometry = new THREE.CapsuleGeometry(1 / 2, adjustedLength, CONFIG.CAP_SEGMENTS, CONFIG.RADIAL_SEGMENTS);
            this.capsuleGeometryCache.set(adjustedLength, newGeometry);
            newWireframeGeometry = new THREE.EdgesGeometry(newGeometry);
            this.edgesGeometryCache.set(adjustedLength, newWireframeGeometry);
            console.log('New geometries created', adjustedLength);
        }

        if (bacterium.geometry !== newGeometry) {
            bacterium.geometry.dispose();
            bacterium.geometry = newGeometry;

            const wireframe = bacterium.children[0];
            wireframe.geometry.dispose();
            wireframe.geometry = newWireframeGeometry;
            wireframe.scale.set(CONFIG.WIREFRAME_SCALE, CONFIG.WIREFRAME_SCALE, CONFIG.WIREFRAME_SCALE);
        }
    }

    buildQuadtree(layer) {
        this.quadtree = quadtree()
            .x(d => d.x)
            .y(d => d.y);
        
        layer.forEach(data => {
            this.quadtree.add(data);
        });
    }

    countNeighbors(x, y, radius) {
        let count = 0;
        this.quadtree.visit((node, x1, y1, x2, y2) => {
            if (!node.length) {
                do {
                    const dx = node.data.x - x;
                    const dy = node.data.y - y;
                    if (dx * dx + dy * dy < radius * radius) {
                        count++;
                    }
                } while (node = node.next);
            }
            return x1 > x + radius || x2 < x - radius || y1 > y + radius || y2 < y - radius;
        });
        return count;
    }

    setColorBasedOnNeighbors(bacterium, x, y) {
        const neighborCount = this.countNeighbors(x, y, CONFIG.NEIGHBOR_RADIUS);
        const color = new THREE.Color(`rgb(${neighborCount*3}, 0, ${255 - neighborCount*3})`);
        bacterium.material.color.set(color);
    }

    updateBacteria(timeStep, bacteriumData) {
        const z = 0;
        const layer = bacteriumData.get(timeStep) || [];

        this.bacteriumPool.reset();
        this.buildQuadtree(layer);

        layer.forEach((data) => {
            const bacterium = this.bacteriumPool.getBacterium();
            this.updateBacterium(bacterium, data, z);
        });
    }

    calculateAdjustedPosition(x, y) {
        return {
            x: x,
            y: y
        };
    }

    setBacteriumTransform(bacterium, position, angle, zPosition) {
        bacterium.position.set(position.x, position.y, zPosition);
        bacterium.rotation.z = angle * Math.PI;
    }

    updateBacterium(bacterium, bacteriumData, zPosition) {
        const { x, y, length, angle } = bacteriumData;
        
        const adjustedPosition = this.calculateAdjustedPosition(x, y);
        const adjustedLength = Math.round(length);
    
        this.setBacteriumTransform(bacterium, adjustedPosition, angle, zPosition);
        this.updateGeometry(bacterium, adjustedLength);
        this.setColorBasedOnNeighbors(bacterium, adjustedPosition.x, adjustedPosition.y);
        bacterium.visible = true;
    }
}

export function createBacteriumSystem(scene) {
    return new BacteriumSystem(scene);
}

export function updateBacteria(bacteriumSystem, timeStep, bacteriumData) {
    bacteriumSystem.updateBacteria(timeStep, bacteriumData);
}
