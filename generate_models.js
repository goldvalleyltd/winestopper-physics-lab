const fs = require('fs');
const path = require('path');

function createBinarySTL(triangles) {
    const buffer = Buffer.alloc(84 + triangles.length * 50);
    buffer.write("Gold Valley Precision WineStopper Binary STL", 0, "utf8");
    buffer.writeUInt32LE(triangles.length, 80);

    let offset = 84;
    for (const tri of triangles) {
        // Compute outward unit normal from (B - A) x (C - A)
        const ax = tri[0][0], ay = tri[0][1], az = tri[0][2];
        const bx = tri[1][0], by = tri[1][1], bz = tri[1][2];
        const cx = tri[2][0], cy = tri[2][1], cz = tri[2][2];

        const ux = bx - ax, uy = by - ay, uz = bz - az;
        const vx = cx - ax, vy = cy - ay, vz = cz - az;
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= len; ny /= len; nz /= len;

        buffer.writeFloatLE(nx, offset);
        buffer.writeFloatLE(ny, offset + 4);
        buffer.writeFloatLE(nz, offset + 8);
        offset += 12;

        for (let i = 0; i < 3; i++) {
            buffer.writeFloatLE(tri[i][0], offset);
            buffer.writeFloatLE(tri[i][1], offset + 4);
            buffer.writeFloatLE(tri[i][2], offset + 8);
            offset += 12;
        }

        buffer.writeUInt16LE(0, offset);
        offset += 2;
    }
    return buffer;
}

/**
 * Helper: Add a closed, watertight frustum / tapered cylinder with outward CCW normals
 * Axis goes from p0 = [x0,y0,z0] (radius r0) to p1 = [x1,y1,z1] (radius r1)
 */
function addClosedFrustum(triangles, p0, p1, r0, r1, segs = 20) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const tx = dx / len, ty = dy / len, tz = dz / len;

    // Orthonormal basis (u, v, t) where u x v = t
    let upX = 0, upY = 0, upZ = 1;
    if (Math.abs(tz) > 0.9) { upX = 1; upY = 0; upZ = 0; }
    let ux = upY * tz - upZ * ty;
    let uy = upZ * tx - upX * tz;
    let uz = upX * ty - upY * tx;
    const uLen = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    ux /= uLen; uy /= uLen; uz /= uLen;

    // v = t x u so (u, v, t) is right-handed
    const vx = ty * uz - tz * uy;
    const vy = tz * ux - tx * uz;
    const vz = tx * uy - ty * ux;

    const ring0 = [];
    const ring1 = [];
    for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        ring0.push([
            p0[0] + r0 * (ca * ux + sa * vx),
            p0[1] + r0 * (ca * uy + sa * vy),
            p0[2] + r0 * (ca * uz + sa * vz)
        ]);
        ring1.push([
            p1[0] + r1 * (ca * ux + sa * vx),
            p1[1] + r1 * (ca * uy + sa * vy),
            p1[2] + r1 * (ca * uz + sa * vz)
        ]);
    }

    for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        const a0 = ring0[i], b0 = ring0[next];
        const a1 = ring1[i], b1 = ring1[next];

        // Side wall (outward normal)
        triangles.push([a0, b0, b1]);
        triangles.push([a0, b1, a1]);

        // Bottom cap (normal -t)
        triangles.push([p0, b0, a0]);

        // Top cap (normal +t)
        triangles.push([p1, a1, b1]);
    }
}

/**
 * Helper: Add a closed multi-section lofted solid along a spine [{p:[x,y,z], rx, rz}]
 */
function addClosedLoft(triangles, sections, segs = 24) {
    const rings = sections.map(sec => {
        const ring = [];
        for (let i = 0; i < segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            // In XZ plane with Y up: to make (ring[i+1] - ring[i]) x (up) point outward,
            // angle goes counter-clockwise when viewed from +Y: x = rx * sin(a), z = rz * cos(a)
            ring.push([
                sec.p[0] + sec.rx * Math.sin(a),
                sec.p[1],
                sec.p[2] + sec.rz * Math.cos(a)
            ]);
        }
        return ring;
    });

    for (let s = 0; s < rings.length - 1; s++) {
        const r0 = rings[s];
        const r1 = rings[s + 1];
        for (let i = 0; i < segs; i++) {
            const next = (i + 1) % segs;
            triangles.push([r0[i], r0[next], r1[next]]);
            triangles.push([r0[i], r1[next], r1[i]]);
        }
    }

    // Bottom cap (y = sections[0].p[1], normal -Y)
    const botCenter = sections[0].p;
    const botRing = rings[0];
    for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        triangles.push([botCenter, botRing[next], botRing[i]]);
    }

    // Top cap (y = sections[last].p[1], normal +Y)
    const topCenter = sections[sections.length - 1].p;
    const topRing = rings[rings.length - 1];
    for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        triangles.push([topCenter, topRing[i], topRing[next]]);
    }
}

// 1. Generate Watertight Stag Head Bust STL (55 x 35 x 66 mm, ~31.5 cm³ solid volume, high CG)
function generateStagHeadSTL() {
    const triangles = [];

    // Sculpted pedestal & muscular stag neck/chest/cranium loft (Y: 0 -> 38 mm)
    addClosedLoft(triangles, [
        { p: [0, 0.0, 0.0], rx: 11.5, rz: 11.5 },
        { p: [0, 4.0, 0.0], rx: 10.5, rz: 10.5 },
        { p: [0, 12.0, -1.0], rx: 12.5, rz: 13.5 },
        { p: [0, 22.0, 1.5], rx: 11.5, rz: 13.0 },
        { p: [0, 31.0, 4.5], rx: 10.0, rz: 12.0 },
        { p: [0, 38.0, 3.0], rx: 6.5, rz: 7.5 }
    ], 28);

    // Snout & muzzle projecting forward
    addClosedFrustum(triangles, [0, 28.0, 8.0], [0, 25.0, 21.5], 6.8, 3.8, 20);

    // Left & Right Ears
    addClosedFrustum(triangles, [-6.5, 34.0, 2.0], [-14.5, 41.0, -1.0], 3.2, 1.2, 14);
    addClosedFrustum(triangles, [6.5, 34.0, 2.0], [14.5, 41.0, -1.0], 3.2, 1.2, 14);

    // Royal 8-Point Antlers (Left & Mirrored Right)
    const antlerBeams = [
        { p0: [5.0, 36.0, 2.5], p1: [13.5, 44.0, 4.0], r0: 3.4, r1: 2.8 },
        { p0: [13.5, 44.0, 4.0], p1: [21.5, 54.0, 1.5], r0: 2.8, r1: 2.3 },
        { p0: [21.5, 54.0, 1.5], p1: [25.0, 66.0, -3.5], r0: 2.3, r1: 1.2 },
        // Brow tine
        { p0: [11.0, 42.0, 3.5], p1: [16.5, 49.0, 13.5], r0: 2.2, r1: 0.9 },
        // Bez tine
        { p0: [18.5, 50.0, 2.5], p1: [27.5, 58.0, 8.5], r0: 2.0, r1: 0.9 },
        // Royal crown tine
        { p0: [22.0, 56.0, 0.5], p1: [16.5, 65.0, -6.5], r0: 1.8, r1: 0.8 }
    ];

    for (const seg of antlerBeams) {
        // Right side
        addClosedFrustum(triangles, seg.p0, seg.p1, seg.r0, seg.r1, 14);
        // Left side (mirrored X)
        addClosedFrustum(
            triangles,
            [-seg.p0[0], seg.p0[1], seg.p0[2]],
            [-seg.p1[0], seg.p1[1], seg.p1[2]],
            seg.r0,
            seg.r1,
            14
        );
    }

    return createBinarySTL(triangles);
}

// 2. Generate Watertight Faceted Crystal STL (36 x 36 x 42 mm, ~18.5 cm³, low CG)
function generateGeoCrystalSTL() {
    const triangles = [];
    addClosedLoft(triangles, [
        { p: [0, 0.0, 0], rx: 11.0, rz: 11.0 },
        { p: [0, 10.0, 0], rx: 16.5, rz: 16.5 },
        { p: [0, 24.0, 0], rx: 18.0, rz: 18.0 },
        { p: [0, 35.0, 0], rx: 12.5, rz: 12.5 },
        { p: [0, 42.0, 0], rx: 3.0, rz: 3.0 }
    ], 8); // Octagonal faceted crystal
    return createBinarySTL(triangles);
}

// 3. Generate Watertight Heraldic Crest Medallion STL (44 x 12 x 46 mm, ~11.8 cm³)
function generateCrestBadgeSTL() {
    const triangles = [];
    // Pedestal base
    addClosedLoft(triangles, [
        { p: [0, 0.0, 0], rx: 10.0, rz: 5.5 },
        { p: [0, 6.0, 0], rx: 12.0, rz: 5.5 },
        { p: [0, 16.0, 0], rx: 20.0, rz: 5.8 },
        { p: [0, 28.0, 0], rx: 22.0, rz: 6.0 },
        { p: [0, 39.0, 0], rx: 17.0, rz: 5.5 },
        { p: [0, 46.0, 0], rx: 7.0, rz: 4.0 }
    ], 24);
    return createBinarySTL(triangles);
}

const outDir = path.join(__dirname, 'assets', 'models');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'sample_stag_head.stl'), generateStagHeadSTL());
fs.writeFileSync(path.join(outDir, 'sample_geo_crystal.stl'), generateGeoCrystalSTL());
fs.writeFileSync(path.join(outDir, 'sample_crest_badge.stl'), generateCrestBadgeSTL());

console.log("✅ Successfully generated watertight STL models in assets/models/!");
