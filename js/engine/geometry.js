/**
 * WineStopper Physics Lab - Geometry Calculation Engine
 * Dual-channel 3D volume & centroid integration (Parametric Bounding Box & Gauss's Divergence Theorem)
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WineStopperLab = root.WineStopperLab || {};
        root.WineStopperLab.geometry = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    /**
     * Channel A: Parametric Bounding-Box Approximation (for buyers without 3D CAD files)
     * @param {number} lengthMm Width / span (X axis, mm)
     * @param {number} widthMm  Depth / thickness (Y/Z horizontal depth, mm)
     * @param {number} heightMm Vertical height above collar (mm)
     * @param {number} kShape   Shape fullness factor (0.1 ~ 0.9)
     * @param {number} eta      Core-pulling retention ratio (0.3 ~ 1.0)
     * @param {number} density  Alloy density (g/cm³)
     * @returns {Object} { boxVolumeCm3, solidVolumeCm3, weightGrams, zCentroidMm }
     */
    function estimateByBoundingBox(lengthMm, widthMm, heightMm, kShape, eta, density) {
        const boxVolumeCm3 = (lengthMm / 10.0) * (widthMm / 10.0) * (heightMm / 10.0);
        const rawSolidVolumeCm3 = boxVolumeCm3 * kShape;
        const solidVolumeCm3 = rawSolidVolumeCm3 * eta;
        const weightGrams = solidVolumeCm3 * density;

        // Empirical centroid height above collar base:
        // Sculpted busts & ornaments typically have CG at 45% of height; bottom/back core-pulling shifts CG slightly upward
        const centroidRatio = 0.45 + (1.0 - eta) * 0.12;
        const zCentroidMm = heightMm * centroidRatio;

        return {
            boxVolumeCm3: parseFloat(boxVolumeCm3.toFixed(2)),
            rawSolidVolumeCm3: parseFloat(rawSolidVolumeCm3.toFixed(2)),
            solidVolumeCm3: parseFloat(solidVolumeCm3.toFixed(2)),
            weightGrams: parseFloat(weightGrams.toFixed(1)),
            zCentroidMm: parseFloat(zCentroidMm.toFixed(1))
        };
    }

    /**
     * Channel B: Exact 3D STL / OBJ Mesh Divergence Theorem Solver
     * Integrates signed oriented tetrahedra relative to the bounding-box center to prevent floating-point cancellation.
     * @param {Float32Array|Array} positions Flat vertex coordinate array [x1,y1,z1, x2,y2,z2, ...]
     */
    function computeMeshVolumeAndCentroid(positions) {
        const numVertices = positions.length / 3;
        const numTriangles = Math.floor(numVertices / 3);

        if (numTriangles === 0) {
            throw new Error("Invalid mesh data: Triangle count is 0.");
        }

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i], y = positions[i + 1], z = positions[i + 2];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
        }

        const refX = (minX + maxX) * 0.5;
        const refY = (minY + maxY) * 0.5;
        const refZ = (minZ + maxZ) * 0.5;

        let totalSignedVolume = 0;
        let weightedCx = 0;
        let weightedCy = 0;
        let weightedCz = 0;
        let nxSum = 0, nySum = 0, nzSum = 0;
        let totalArea2 = 0;

        for (let i = 0; i < numTriangles; i++) {
            const i9 = i * 9;
            const x1 = positions[i9] - refX,     y1 = positions[i9 + 1] - refY, z1 = positions[i9 + 2] - refZ;
            const x2 = positions[i9 + 3] - refX, y2 = positions[i9 + 4] - refY, z2 = positions[i9 + 5] - refZ;
            const x3 = positions[i9 + 6] - refX, y3 = positions[i9 + 7] - refY, z3 = positions[i9 + 8] - refZ;

            // Surface normal integral check for manifold closure
            const e1x = x2 - x1, e1y = y2 - y1, e1z = z2 - z1;
            const e2x = x3 - x1, e2y = y3 - y1, e2z = z3 - z1;
            const fnx = e1y * e2z - e1z * e2y;
            const fny = e1z * e2x - e1x * e2z;
            const fnz = e1x * e2y - e1y * e2x;
            nxSum += fnx;
            nySum += fny;
            nzSum += fnz;
            totalArea2 += Math.sqrt(fnx * fnx + fny * fny + fnz * fnz);

            const crossX = y2 * z3 - z2 * y3;
            const crossY = z2 * x3 - x2 * z3;
            const crossZ = x2 * y3 - y2 * x3;

            const vTet = (x1 * crossX + y1 * crossY + z1 * crossZ) / 6.0;
            totalSignedVolume += vTet;

            weightedCx += vTet * ((x1 + x2 + x3) / 4.0);
            weightedCy += vTet * ((y1 + y2 + y3) / 4.0);
            weightedCz += vTet * ((z1 + z2 + z3) / 4.0);
        }

        const volumeMm3 = Math.abs(totalSignedVolume);
        const volumeCm3 = volumeMm3 / 1000.0;

        let centroidX = refX;
        let centroidY = refY;
        let centroidZ = refZ;
        if (Math.abs(totalSignedVolume) > 1e-7) {
            centroidX = refX + (weightedCx / totalSignedVolume);
            centroidY = refY + (weightedCy / totalSignedVolume);
            centroidZ = refZ + (weightedCz / totalSignedVolume);
        }

        const dimX = maxX - minX; // Width (X)
        const dimY = maxY - minY; // Vertical Height (Y in Three.js)
        const dimZ = maxZ - minZ; // Depth (Z)

        const normalResidual = Math.sqrt(nxSum * nxSum + nySum * nySum + nzSum * nzSum);
        const isClosedManifold = totalArea2 > 0 ? (normalResidual / totalArea2) < 0.01 : false;

        return {
            triangleCount: numTriangles,
            volumeMm3: parseFloat(volumeMm3.toFixed(2)),
            volumeCm3: parseFloat(volumeCm3.toFixed(3)),
            centroid: {
                x: parseFloat(centroidX.toFixed(2)),
                y: parseFloat(centroidY.toFixed(2)),
                z: parseFloat(centroidZ.toFixed(2))
            },
            bounds: {
                min: { x: minX, y: minY, z: minZ },
                max: { x: maxX, y: maxY, z: maxZ },
                dimensions: {
                    width: parseFloat(dimX.toFixed(1)),
                    height: parseFloat(dimY.toFixed(1)),
                    depth: parseFloat(dimZ.toFixed(1)),
                    lengthMm: parseFloat(dimX.toFixed(1)),
                    widthMm: parseFloat(dimZ.toFixed(1)),
                    heightMm: parseFloat(dimY.toFixed(1))
                }
            },
            isWatertight: isClosedManifold && volumeMm3 > 0.01
        };
    }

    return {
        estimateByBoundingBox,
        computeMeshVolumeAndCentroid
    };
}));
