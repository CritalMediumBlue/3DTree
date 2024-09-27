export const CONFIG = {
    SCENE: {
        FOG_COLOR: 0x0f0000,
        FOG_NEAR: 5,
        FOG_FAR: 100,
        CAMERA_FOV: 75,
        CAMERA_NEAR: 5,
        CAMERA_FAR: 1000,
        CAMERA_POSITION: { x: 0, y: 170, z: -70 },
        CAMERA_LOOKAT: { x: 0, y: 170, z: 0 },
        CONTROLS_MAX_DISTANCE: 400,
        CONTROLS_MIN_DISTANCE: 20
    },
    BACTERIUM: {
        CAP_SEGMENTS: 2,
        RADIAL_SEGMENTS: 7,
        INITIAL_POOL_SIZE: 1000,
        POOL_GROWTH_FACTOR: 1.1,
        WIREFRAME_SCALE: 1.005,
        WIREFRAME_COLOR: 'rgb(100, 100, 100)',
        NEIGHBOR_RADIUS: 7,
        MAX_NEIGHBORS: 60,
        COLOR_BY_INHERITANCE: true,
        POSITIVE_FEEDBACK: true,
        SIGNAL: {
            DEFAULT: 0.15,
            MIN: 0,
            MAX: 0.3
        },
        ALPHA: {
            DEFAULT: 0.0001,
            MIN: 0,
            MAX: 0.001
        }
    },
    COLORS: {
        MIN_COLOR: 0x0000FF,
        MAX_COLOR: 0xFF0000,
        MAGENTA_PHENOTYPE: 0xFF00FF,
        CYAN_PHENOTYPE: 0x00FFFF,
        DEFAULT_PHENOTYPE: 0xFFFFFF,
    },
    HISTOGRAM: {
        GRID_SIZE: 40,
        CUBE_SIZE: 0.2,
        COLOR: 0x808080,
        OPACITY: 0.8,
        X_MIN: -50,
        X_MAX: 50,
        Y_MIN: 140,
        Y_MAX: 200,
    },
    PLOT_RENDERER: {
        MAX_POINTS: 1000,
        POINT_SIZE:2,
        AXIS_COLOR: 0x808080,
        PLOT_WIDTH_RATIO: 1/4,
        PLOT_HEIGHT_RATIO: 1/4,
        MAX_Y_VALUE: 1600,
        Y_TICK_STEP: 200,
        UPDATE_PLOT_INTERVAL: 10,
    },
};