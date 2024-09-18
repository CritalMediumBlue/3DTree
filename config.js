export const CONFIG = {
    SCALE_FACTOR: 2,
    CAP_SEGMENTS: 2,
    RADIAL_SEGMENTS: 7,
    INITIAL_POOL_SIZE: 1000,
    POOL_GROWTH_FACTOR: 1.5,
    OFFSET_Y: 170,
    WIREFRAME_SCALE: 1.005,
    WIREFRAME_COLOR: 'rgb(0, 100, 100)',
    NEIGHBOR_RADIUS: 5, // Radius to check for neighbors (in scaled units)
    MAX_NEIGHBORS: 20, // Maximum number of neighbors for color scaling
    MIN_COLOR: 0x0000FF, // Blue color for bacteria with few neighbors
    MAX_COLOR: 0xFF0000 // Red color for bacteria with many neighbors
};