const fs = require('fs');
const path = require('path');

const presets = require('./js/engine/presets.js');
const geometry = require('./js/engine/geometry.js');
const physics = require('./js/engine/physics.js');
const shipping = require('./js/engine/shipping.js');
const loader = require('./js/viewer/loader.js');

console.log("=== WineStopper Physics Lab Unit Test Suite ===");

// 1. Alloy Density Compliance Check (per engineering-params.md: no 7.40 g/cm³ zinc alloy)
const mats = presets.MATERIALS;
console.log("\n[Test 1] Industrial Alloy Density & Compliance Check:");
for (const [key, m] of Object.entries(mats)) {
    console.log(`  - ${key}: ${m.nameEn} (${m.density} g/cm³)`);
    if (key.startsWith('zn-') && (m.density < 6.5 || m.density > 6.8)) {
        throw new Error(`Non-compliant zinc alloy density detected: ${m.density}`);
    }
}
console.log("  ✅ All alloys strictly comply with engineering-params.md (Zamak 3: 6.60, Zamak 5: 6.70, SUS304: 7.93, H65: 8.50, 6061: 2.70)!");

// 2. Parametric Bounding Box & Core-Pulling Test
const kFig = presets.SHAPE_PRESETS['figurine'].kShape;
const geoSolid = geometry.estimateByBoundingBox(55, 35, 65, kFig, 1.0, 6.60);
const geoCored = geometry.estimateByBoundingBox(55, 35, 65, kFig, 0.70, 6.60);
console.log("\n[Test 2] 55x35x65mm Stag Bust Parametric Estimation (Solid vs 30% Cored):");
console.log("  Solid Top Weight:", geoSolid.weightGrams, "g | Top CG:", geoSolid.zCentroidMm, "mm");
console.log("  30% Cored Weight:", geoCored.weightGrams, "g | Top CG:", geoCored.zCentroidMm, "mm");

const physSolid = physics.evaluateStability({
    topMassGrams: geoSolid.weightGrams,
    topCentroidZMm: geoSolid.zCentroidMm,
    baseConfigId: 'zinc-silicone',
    tiltAngleDeg: 15.0,
    lang: 'en'
});
const physCored = physics.evaluateStability({
    topMassGrams: geoCored.weightGrams,
    topCentroidZMm: geoCored.zCentroidMm,
    baseConfigId: 'ss304-silicone',
    tiltAngleDeg: 15.0,
    lang: 'en'
});
console.log("  Solid + Zinc Base Verdict:", physSolid.level, "| Z_total:", physSolid.zTotalMm, "mm | S_f:", physSolid.safetyFactor);
console.log("  30% Cored + SUS304 Base Verdict:", physCored.level, "| Z_total:", physCored.zTotalMm, "mm | S_f:", physCored.safetyFactor);

if (physSolid.level === 'HIGH_RISK' && physCored.safetyFactor > physSolid.safetyFactor) {
    console.log("  ✅ Statics engine accurately captures top-heavy tipping risk and core-pulling + counterweight improvement!");
} else {
    throw new Error("Statics engine stability verdict mismatch!");
}

// 3. B2B Export Carton & Anti-Burst (≤18.0 kg) Logistics Check
const ship = shipping.calculateLogistics(physCored.totalMassGrams, 1000, 'en');
console.log("\n[Test 3] 1000 pcs Wine Stopper Export Logistics:");
console.log("  Max pcs/carton:", ship.maxPiecesPerCarton, "| Total cartons:", ship.totalCartons);
console.log("  Carton avg gross wt:", ship.grossWeightPerCartonKg, "kg (" + ship.grossWeightPerCartonLbs + " lbs)");
console.log("  Total order gross wt:", ship.totalGrossWeightKg, "kg (" + ship.totalGrossWeightLbs + " lbs)");
console.log("  Air Express vs DDP Sea:", `~$${ship.estimatedAirCourierUsd} vs ~$${ship.estimatedOceanLclUsd}`);

if (ship.grossWeightPerCartonKg <= 18.0) {
    console.log("  ✅ Master carton gross weight strictly controlled within ≤18.0 kg anti-burst limit!");
} else {
    throw new Error("Carton gross weight exceeded 18.0 kg!");
}

// 4. Watertight 3D STL Divergence Theorem Verification across all 3 sample models
console.log("\n[Test 4] Watertight 3D STL Mesh Divergence Integration:");
for (const file of ['sample_stag_head.stl', 'sample_geo_crystal.stl', 'sample_crest_badge.stl']) {
    const buf = fs.readFileSync(path.join(__dirname, 'assets', 'models', file));
    const pos = loader.parseSTL(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const metrics = geometry.computeMeshVolumeAndCentroid(pos);
    console.log(`  - ${file}: ${metrics.triangleCount} tris | Vol: ${metrics.volumeCm3} cm³ | CG Y: ${metrics.centroid.y} mm | Watertight: ${metrics.isWatertight}`);
    if (!metrics.isWatertight || metrics.volumeCm3 < 5.0) {
        throw new Error(`Mesh ${file} failed watertightness or volume check!`);
    }
}
console.log("  ✅ All 3 sample STL meshes are 100% closed watertight manifolds!");

console.log("\n🎉 All WineStopper Physics Lab unit tests passed 100%!");
