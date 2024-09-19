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
        this.colorMemo = new Map(); // Memoization. Each ID has a color associated with it. The key is the ID and the value is the color.
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
    
        const materialColor = this.calculateColor(neighborCount, 3, 200, 255);
        const wireColor = this.calculateColor(neighborCount, 1.5, 100, 127.5);
    
        bacterium.material.color.set(materialColor);
        bacterium.children[0].material.color.set(wireColor);
    }

    setColorBasedOnPhenotypeInheritance(bacterium, ID) {
        const color = this.inheretenaceColor(ID);
        bacterium.material.color.set(color);
        bacterium.children[0].material.color.set(color.clone().multiplyScalar(0.5)); // Darker color for wireframe
    }

    inheretenaceColor(ID) {
        if (this.colorMemo.has(ID)) {
            return this.colorMemo.get(ID);
        }

        let color;
        if (ID >= 1000n && ID <= 2000n) {
            // Initial bacteria: assign a random color
            color = Math.random() < 0.5 ? 
                new THREE.Color(CONFIG.MAGENTA_PHENOTYPE) : 
                new THREE.Color(CONFIG.CYAN_PHENOTYPE);
        } else if (ID > 2000n) {
            // For subsequent bacteria, inherit color from parent
            const parentID = ID / 2n;
            color = this.inheretenaceColor(parentID);
        } else {
            // This case should not occur, but we'll handle it just in case
            console.warn(`Unexpected bacterium ID: ${ID}`);
            color = new THREE.Color(0xFFFFFF); // Default to white
        }

        this.colorMemo.set(ID, color);
        return color;
    }

    calculateColor(neighborCount, factor, baseGreen, baseBlue) {
        const red = neighborCount * factor;
        const green = baseGreen - neighborCount * factor;
        const blue = baseBlue - neighborCount * factor;
        return new THREE.Color(`rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`);
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

    setBacteriumTransform(bacterium, position, angle, zPosition) {
        bacterium.position.set(position.x, position.y, zPosition);
        bacterium.rotation.z = angle * Math.PI;
    }

    updateBacterium(bacterium, bacteriumData, zPosition) {
        const { x, y, length, angle, ID } = bacteriumData;
        
        const adjustedPosition = new THREE.Vector3(x, y, 0);
        const adjustedLength = Math.round(length);
    
        this.setBacteriumTransform(bacterium, adjustedPosition, angle, zPosition);
        this.updateGeometry(bacterium, adjustedLength);
        this.setColorBasedOnPhenotypeInheritance(bacterium, ID);
        // this.setColorBasedOnNeighbors(bacterium, x, y);
        bacterium.visible = true;
    }
}

export function createBacteriumSystem(scene) {
    return new BacteriumSystem(scene);
}

export function updateBacteria(bacteriumSystem, timeStep, bacteriumData) {
    bacteriumSystem.updateBacteria(timeStep, bacteriumData);
}
