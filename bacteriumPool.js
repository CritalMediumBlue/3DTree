import { createAndAddCapsule } from './bacteriumFactory.js';
import { CONFIG } from './config.js';

export class BacteriumPool {
    constructor(scene, initialSize) {
        this.scene = scene;
        this.bacteria = [];
        this.activeCount = 0;
        this.growthFactor = CONFIG.BACTERIUM.POOL_GROWTH_FACTOR;
        this.expandPool(initialSize);

    }

    getBacterium() {
        if (this.activeCount >= this.bacteria.length) {
            this.expandPool(Math.ceil(this.bacteria.length * this.growthFactor));
        }
        return this.bacteria[this.activeCount++];
    }

    

    expandPool(newSize) {
        while (this.bacteria.length < newSize) {
            const bacterium = createAndAddCapsule(this.scene);
            this.bacteria.push(bacterium);
        }
    }

    reset() {
        this.activeCount = 0;
        this.bacteria.forEach(bacterium => {
            bacterium.visible = false;
            // Reset the colorSet flag
            if (bacterium.userData) {
                bacterium.userData.colorSet = false;
            }

        });
    }

    getActiveBacteria() {
        return this.bacteria.slice(0, this.activeCount);
    }
}