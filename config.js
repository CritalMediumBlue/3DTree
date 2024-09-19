export const CONFIG = {
    CAP_SEGMENTS: 2,
    RADIAL_SEGMENTS: 7,
    INITIAL_POOL_SIZE: 1000,
    POOL_GROWTH_FACTOR: 1.1,
    WIREFRAME_SCALE: 1.005,
    WIREFRAME_COLOR: 'rgb(100, 100, 100)',
    NEIGHBOR_RADIUS: 9, // Radius to check for neighbors (in scaled units)
    MAX_NEIGHBORS: 60, // Maximum number of neighbors for color scaling
    MIN_COLOR: 0x0000FF, // Blue color for bacteria with few neighbors
    MAX_COLOR: 0xFF0000, // Red color for bacteria with many neighbors
    MAGENTA_PHENOTYPE: 0xFF00FF, // Magenta color for bacteria
    CYAN_PHENOTYPE: 0x00FFFF, // Cyan color for bacteria
};