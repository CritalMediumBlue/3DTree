import * as THREE from 'three';
import { quadtree } from 'd3-quadtree';
import { CONFIG } from './config.js';
import { BacteriumPool } from './bacteriumPool.js';

class ColorManager {
    constructor() {
        this.colorMemo = new Map();
    }

    inheritanceColor(ID) {
        if (this.colorMemo.has(ID)) {
            return this.colorMemo.get(ID);
        }

        let currentID = ID;
        while (currentID > 2000n) {
            currentID = currentID / 2n;
            if (this.colorMemo.has(currentID)) {
                const color = this.colorMemo.get(currentID);
                this.colorMemo.set(ID, color);
                return color;
            }
        }

        // Assign color for initial bacteria or unknown IDs
        const color = (currentID >= 1000n && currentID <= 2000n) ?
            (Math.random() < 0.5 ? new THREE.Color(CONFIG.COLORS.MAGENTA_PHENOTYPE) : new THREE.Color(CONFIG.COLORS.CYAN_PHENOTYPE))
            : new THREE.Color(CONFIG.COLORS.DEFAULT_PHENOTYPE);

        this.colorMemo.set(ID, color);
        return color;
    }

    setColorBasedOnPhenotypeInheritance(bacterium, ID) {
        const color = this.inheritanceColor(ID);
        bacterium.material.color.set(color);
        bacterium.children[0].material.color.set(color.clone().multiplyScalar(0.5)); // Darker color for wireframe
    }

    getMagentaCount(currentTimestepBacteria) {
        return this.getColorCount(currentTimestepBacteria, CONFIG.COLORS.MAGENTA_PHENOTYPE);
    }

    getCyanCount(currentTimestepBacteria) {
        return this.getColorCount(currentTimestepBacteria, CONFIG.COLORS.CYAN_PHENOTYPE);
    }

    getColorCount(currentTimestepBacteria, targetColor) {
        return Array.from(currentTimestepBacteria).reduce((count, ID) => {
            const color = this.colorMemo.get(ID);
            return color && color.equals(new THREE.Color(targetColor)) ? count + 1 : count;
        }, 0);
    }

    clearColorMemo() {
        this.colorMemo.clear();
    }
}

class GeometryManager {
    constructor() {
        this.capsuleGeometryCache = new Map();
        this.edgesGeometryCache = new Map();
    }

    updateGeometry(bacterium, adjustedLength) {
        let newGeometry = this.capsuleGeometryCache.get(adjustedLength);
        let newWireframeGeometry = this.edgesGeometryCache.get(adjustedLength);

        if (!newGeometry) {
            newGeometry = new THREE.CapsuleGeometry(1 / 2, adjustedLength, CONFIG.BACTERIUM.CAP_SEGMENTS, CONFIG.BACTERIUM.RADIAL_SEGMENTS);
            this.capsuleGeometryCache.set(adjustedLength, newGeometry);
            newWireframeGeometry = new THREE.EdgesGeometry(newGeometry);
            this.edgesGeometryCache.set(adjustedLength, newWireframeGeometry);
        }

        if (bacterium.geometry !== newGeometry) {
            bacterium.geometry.dispose();
            bacterium.geometry = newGeometry;

            const wireframe = bacterium.children[0];
            wireframe.geometry.dispose();
            wireframe.geometry = newWireframeGeometry;
            wireframe.scale.set(CONFIG.BACTERIUM.WIREFRAME_SCALE, CONFIG.BACTERIUM.WIREFRAME_SCALE, CONFIG.BACTERIUM.WIREFRAME_SCALE);
        }
    }
}

export class BacteriumSystem {
    constructor(scene) {
        this.scene = scene;
        this.bacteriumPool = new BacteriumPool(scene, CONFIG.BACTERIUM.INITIAL_POOL_SIZE);
        this.quadtree = null;
        this.currentTimestepBacteria = new Set();
        this.colorManager = new ColorManager();
        this.geometryManager = new GeometryManager();
    }

    buildQuadtree(layer) {
        this.quadtree = quadtree()
            .x(d => d.x)
            .y(d => d.y);
        
        layer.forEach(data => {
            this.quadtree.add(data);
        });
    }

    updateBacteria(timeStep, bacteriumData) {
        const z = 0;
        const layer = bacteriumData.get(timeStep) || [];

        this.bacteriumPool.reset();
        this.buildQuadtree(layer);
        this.currentTimestepBacteria.clear();

        layer.forEach((data) => {
            const bacterium = this.bacteriumPool.getBacterium();
            this.updateBacterium(bacterium, data, z);
            this.currentTimestepBacteria.add(data.ID);
        });
    }
/**
 * Updates a bacterium's properties based on the provided data
 * @param {THREE.Mesh} bacterium - The bacterium mesh to update
 * @param {Object} bacteriumData - The data for the bacterium
 * @param {number} bacteriumData.x - The x-coordinate
 * @param {number} bacteriumData.y - The y-coordinate
 * @param {number} bacteriumData.length - The length of the bacterium
 * @param {number} bacteriumData.angle - The angle of the bacterium
 * @param {BigInt} bacteriumData.ID - The unique identifier of the bacterium
 * @param {number} zPosition - The z-coordinate for the bacterium
 */
    updateBacterium(bacterium, bacteriumData, zPosition) {
        if (!bacterium || !bacteriumData) {
            console.error('Invalid input to updateBacterium');
            return;
        }
        const { x, y, length, angle, ID } = bacteriumData;
        if (x === undefined || y === undefined || length === undefined || angle === undefined || ID === undefined) {
            console.error('Missing required properties in bacteriumData');
            return;
        }
        
        const adjustedPosition = new THREE.Vector3(x, y, 0);
        const adjustedLength = Math.round(length);
    
        this.setBacteriumTransform(bacterium, adjustedPosition, angle, zPosition);
        this.geometryManager.updateGeometry(bacterium, adjustedLength);
        this.colorManager.setColorBasedOnPhenotypeInheritance(bacterium, ID);
        bacterium.visible = true;
    }

    setBacteriumTransform(bacterium, position, angle, zPosition) {
        bacterium.position.set(position.x, position.y, zPosition);
        bacterium.rotation.z = angle * Math.PI;
    }

    getMagentaCount() {
        return this.colorManager.getMagentaCount(this.currentTimestepBacteria);
    }

    getCyanCount() {
        return this.colorManager.getCyanCount(this.currentTimestepBacteria);
    }

    clearColorMemo() {
        this.colorManager.clearColorMemo();
    }
}

export function createBacteriumSystem(scene) {
    return new BacteriumSystem(scene);
}

export function updateBacteria(bacteriumSystem, timeStep, bacteriumData) {
    bacteriumSystem.updateBacteria(timeStep, bacteriumData);
}

export function getMagentaCount(bacteriumSystem) {
    return bacteriumSystem.getMagentaCount();
}

export function getCyanCount(bacteriumSystem) {
    return bacteriumSystem.getCyanCount();
}

export function clearColorMemo(bacteriumSystem) {
    bacteriumSystem.clearColorMemo();
}
