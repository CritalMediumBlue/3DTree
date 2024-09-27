import * as THREE from 'three';
import { quadtree } from 'd3-quadtree';
import { CONFIG } from './config.js';
import { BacteriumPool } from './bacteriumPool.js';

class ColorManager {
    constructor() {
        this.colorMemo = new Map();
        this.signal = CONFIG.BACTERIUM.SIGNAL.DEFAULT/100;
        this.alpha = CONFIG.BACTERIUM.ALPHA.DEFAULT;

    }

    setSignalValue(value) {
        this.signal = Math.max(CONFIG.BACTERIUM.SIGNAL.MIN, Math.min(CONFIG.BACTERIUM.SIGNAL.MAX, value))/100;
    }

    setAlphaValue(value) {
        this.alpha = Math.max(CONFIG.BACTERIUM.ALPHA.MIN, Math.min(CONFIG.BACTERIUM.ALPHA.MAX, value));
    }

    inheritanceColor(ID, neighbors) {
        const totalNeighbors = neighbors[0];
        const magentaNeighbors = neighbors[1];
        const cyanNeighbors = neighbors[2];

        const proportionMagenta = magentaNeighbors / totalNeighbors;    
        const proportionCyan = cyanNeighbors / totalNeighbors;

        let K_c2m;
        let K_m2c;

        if (CONFIG.BACTERIUM.POSITIVE_FEEDBACK) {
            K_c2m = this.alpha + proportionMagenta * this.signal;
            K_m2c = this.alpha + proportionCyan * this.signal;
        } else {
            K_c2m = this.alpha + proportionCyan * this.signal;
            K_m2c = this.alpha + proportionMagenta * this.signal;
        }
        
        let color;
        if (this.colorMemo.has(ID)) {
            const originalColor = this.colorMemo.get(ID);
            const rand = Math.random();
            
            const magentaColor = new THREE.Color(CONFIG.COLORS.MAGENTA_PHENOTYPE);
            const cyanColor = new THREE.Color(CONFIG.COLORS.CYAN_PHENOTYPE);
            
            if (originalColor.equals(magentaColor)) {
                color = rand < K_m2c ? cyanColor : magentaColor;
            } else if (originalColor.equals(cyanColor)) {
                color = rand < K_c2m ? magentaColor : cyanColor;
            } 
            
            this.colorMemo.set(ID, color);
            return color;
        } else if (ID > 2000n) {
            let currentID = ID / 2n;
            if (this.colorMemo.has(currentID)) {
                const color = this.colorMemo.get(currentID);
                this.colorMemo.set(ID, color);
                return color;
            }
        } else if (ID >= 1000n && ID <= 2000n){
            let random = Math.random();
            color = random < 0.5 ? new THREE.Color(CONFIG.COLORS.MAGENTA_PHENOTYPE) : new THREE.Color(CONFIG.COLORS.CYAN_PHENOTYPE);

            this.colorMemo.set(ID, color);
            return color;
        }
    }

    setColorBasedOnPhenotypeInheritance(bacterium, ID, neighbors) {
        const color = this.inheritanceColor(ID, neighbors);
        const totalNeighbors = neighbors[0];
        const magentaCount = neighbors[1];
        const cyanCount = neighbors[2];
        const magentaProportion = magentaCount / totalNeighbors;
        const cyanProportion = cyanCount / totalNeighbors;
        let scalar;
            
        if (color.equals(new THREE.Color(CONFIG.COLORS.MAGENTA_PHENOTYPE))) {

            scalar = Math.round(magentaProportion * 255);
            bacterium.similarity = magentaProportion;
            
        } else if (color.equals(new THREE.Color(CONFIG.COLORS.CYAN_PHENOTYPE))) {
            scalar = Math.round(cyanProportion * 255);
            bacterium.similarity = cyanProportion;
        }

        if (CONFIG.BACTERIUM.COLOR_BY_INHERITANCE) {
            bacterium.material.color.set(color);
            bacterium.children[0].material.color.set(color.clone().multiplyScalar(0.5)); // Darker color for wireframe
        } else if (!CONFIG.BACTERIUM.COLOR_BY_INHERITANCE) {
            const color = new THREE.Color(`rgb(${scalar}, ${scalar}, ${255-scalar})`);          
            bacterium.material.color.set(color);
            bacterium.children[0].material.color.set(color.clone().multiplyScalar(0.5)); // Darker color for wireframe
        }    
    }

    getMagentaCount(currentTimestepBacteria) {
        return this.getColorCount(currentTimestepBacteria, CONFIG.COLORS.MAGENTA_PHENOTYPE);
    }

    getCyanCount(currentTimestepBacteria) {
        return this.getColorCount(currentTimestepBacteria, CONFIG.COLORS.CYAN_PHENOTYPE);
    }

    getColorCount(currentTimestepBacteria, targetColor) {
        const targetThreeColor = new THREE.Color(targetColor);
        return Array.from(currentTimestepBacteria).reduce((count, ID) => {
            const color = this.colorMemo.get(ID);
            return color && color.equals(targetThreeColor) ? count + 1 : count;
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
        this.averageSimilarityWithNeighbors = 0;
    }

    buildQuadtree(layer) {
        this.quadtree = quadtree()
            .x(d => d.x)
            .y(d => d.y);
        
        layer.forEach(data => {
            this.quadtree.add(data);
        });
    }

    countNeighbors(x, y) {
        const neighborRadius = CONFIG.BACTERIUM.NEIGHBOR_RADIUS;
        let totalCount = 0;
        let magentaCount = 0;
        let cyanCount = 0;

        this.quadtree.visit((node, x1, y1, x2, y2) => {
            if (!node.length) {
                do {
                    if (node.data) {
                        const dx = node.data.x - x;
                        const dy = node.data.y - y;
                        if (dx * dx + dy * dy < neighborRadius * neighborRadius) {
                            totalCount++;
                            const color = this.colorManager.colorMemo.get(node.data.ID);
                            if (color && color.equals(new THREE.Color(CONFIG.COLORS.MAGENTA_PHENOTYPE))) {
                                magentaCount++;
                            } else if (color && color.equals(new THREE.Color(CONFIG.COLORS.CYAN_PHENOTYPE))) {
                                cyanCount++;
                            }
                        }
                    }
                } while (node = node.next);
            }
            return x1 > x + neighborRadius || x2 < x - neighborRadius || y1 > y + neighborRadius || y2 < y - neighborRadius;
        });

        return [totalCount, magentaCount, cyanCount];
    }

    updateBacteria(timeStep, bacteriumData) {
        this.averageSimilarityWithNeighbors = 0;
        const z = 0;
        const layer = bacteriumData.get(timeStep) || [];

        this.bacteriumPool.reset();
        this.buildQuadtree(layer);
        this.currentTimestepBacteria.clear();

        layer.forEach((data) => {
            const bacterium = this.bacteriumPool.getBacterium();
            this.updateBacterium(bacterium, data, z);
            this.currentTimestepBacteria.add(data.ID);
            this.averageSimilarityWithNeighbors += bacterium.similarity;
        });

        // Calculate average similarity with neighbors
        if (layer.length > 0) {
            this.averageSimilarityWithNeighbors /= layer.length;
        } else {
            this.averageSimilarityWithNeighbors = 0;
        }
    }

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
        
        const neighbors = this.countNeighbors(x, y);
        this.colorManager.setColorBasedOnPhenotypeInheritance(bacterium, ID, neighbors);

        
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

    getAverageSimilarityWithNeighbors() {
        return isNaN(this.averageSimilarityWithNeighbors) ? 0 : this.averageSimilarityWithNeighbors;
    }

    clearColorMemo() {
        this.colorManager.clearColorMemo();
    }

    setSignalValue(value) {
        this.colorManager.setSignalValue(value);
    }

    setAlphaValue(value) {
        this.colorManager.setAlphaValue(value);
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

export function setSignalValue(bacteriumSystem, value) {
    bacteriumSystem.setSignalValue(value);
}

export function setAlphaValue(bacteriumSystem, value) {
    bacteriumSystem.setAlphaValue(value);
}

export function getAverageSimilarityWithNeighbors(bacteriumSystem) {
    return bacteriumSystem.getAverageSimilarityWithNeighbors();
}
