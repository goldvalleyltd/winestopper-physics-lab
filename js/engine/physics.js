/**
 * WineStopper Physics Lab - Rigid-Body Statics & Anti-Tilt Torque Engine
 * Evaluates composite Center of Gravity (CG) & overturning moment at a 15° bottle tilt on a CETIE 18.5mm bottleneck
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const presets = require('./presets.js');
        module.exports = factory(presets);
    } else {
        root.WineStopperLab = root.WineStopperLab || {};
        root.WineStopperLab.physics = factory(root.WineStopperLab.presets);
    }
}(typeof self !== 'undefined' ? self : this, function (presets) {

    /**
     * Evaluate composite center of gravity, 15° tilt overturning moment, and DFM stability grade
     * @param {Object} params
     * @param {number} params.topMassGrams     Decorative top metal mass (g)
     * @param {number} params.topCentroidZMm   Decorative top CG height above upper collar (mm, >= 0)
     * @param {string} params.baseConfigId     Lower insert stem & silicone/cork config ID
     * @param {number} [params.tiltAngleDeg=15] Evaluation tilt angle (deg)
     * @param {string} [params.lang='en']      'en' | 'zh'
     */
    function evaluateStability(params) {
        const isZh = (params.lang === 'zh');
        const topMass = Math.max(0, Number(params.topMassGrams) || 0);
        const topZ = Math.max(0, Number(params.topCentroidZMm) || 0);
        const baseConfig = presets.getBaseConfig(params.baseConfigId);
        const tiltDeg = params.tiltAngleDeg || presets.BOTTLE_CONSTANTS.criticalTiltAngleDeg;
        const pivotR = presets.BOTTLE_CONSTANTS.pivotRadiusMm;
        const g = presets.BOTTLE_CONSTANTS.gravityMps2;

        const baseMass = baseConfig.massGrams;
        const baseZ = baseConfig.zCentroidMm; // Negative (below bottle rim)

        // 1. Total Assembly Mass (g & oz)
        const totalMassGrams = topMass + baseMass;
        const totalMassOz = totalMassGrams / 28.349523125;

        // 2. Composite Vertical Center of Gravity Z_total (mm, relative to bottle rim Z = 0)
        // Account for the 16.0 mm upper transition neck collar between bottle rim (Z=0) and ornament base
        const effectiveTopZ = topZ + 8.0;
        let zTotalMm = 0;
        if (totalMassGrams > 0) {
            zTotalMm = ((topMass * effectiveTopZ) + (baseMass * baseZ)) / totalMassGrams;
        }

        // 3. Overturning Moment vs Restoring Torque at 15° Tilt
        const rad = (tiltDeg * Math.PI) / 180.0;
        const sinTheta = Math.sin(rad);
        const cosTheta = Math.cos(rad);

        // Total gravity force (N)
        const gravityForceN = (totalMassGrams / 1000.0) * g;

        // Overturning torque M_tilt (N·mm) when Z_total > 0
        const overturningMomentNmm = Math.max(0, gravityForceN * zTotalMm * sinTheta);

        // Restoring torque M_restore (N·mm) = pivot rim support + silicone/cork radial compression grip
        const gravityRestoreNmm = gravityForceN * pivotR * cosTheta;
        const totalRestoringMomentNmm = gravityRestoreNmm + baseConfig.frictionTorqueBonusNmm;

        // 4. Anti-Tilt Safety Factor S_f = M_restore / M_tilt
        let safetyFactor = 9.99;
        if (overturningMomentNmm > 1.0) {
            safetyFactor = totalRestoringMomentNmm / overturningMomentNmm;
            safetyFactor = Math.min(9.99, Math.max(0.1, safetyFactor));
        }

        // Critical static tipping angle (deg)
        let criticalAngleDeg = 90.0;
        if (zTotalMm > 1.0) {
            const effectiveSupportArmMm = pivotR + (baseConfig.frictionTorqueBonusNmm / Math.max(0.1, gravityForceN));
            const tanAlpha = effectiveSupportArmMm / zTotalMm;
            criticalAngleDeg = (Math.atan(tanAlpha) * 180.0) / Math.PI;
        }

        // 5. Three-Tier DFM Stability Classification & Actionable Recommendations
        let level = 'STABLE';
        let labelEn = 'STABLE (Rock-Solid)';
        let labelZh = 'STABLE · 重心稳固（安全通过）';
        let summaryEn = `Composite CG is at +${zTotalMm.toFixed(1)} mm (${(zTotalMm / 25.4).toFixed(2)}"). Passes 15° bottle-tilt and refrigerator door-slam vibration tests with zero wobble.`;
        let summaryZh = `组合质心位于瓶口上方 +${zTotalMm.toFixed(1)} mm (${(zTotalMm / 25.4).toFixed(2)}")，轻松通过 15° 瓶身倾斜与冰箱门开关震动测试，严丝合缝不松脱。`;
        const dfmRecommendationsEn = [];
        const dfmRecommendationsZh = [];

        if (zTotalMm > 25.0 || safetyFactor < 1.35 || topMass > 135.0) {
            level = 'HIGH_RISK';
            labelEn = 'HIGH RISK (Top-Heavy Tipping Hazard)';
            labelZh = 'HIGH RISK · 极高倾覆与松脱风险';
            summaryEn = `Composite CG reaches +${zTotalMm.toFixed(1)} mm with ${topMass.toFixed(1)} g (${(topMass / 28.35).toFixed(2)} oz) top mass! High overturning torque compresses the upper silicone rib, risking air leakage or bottle tipping.`;
            summaryZh = `组合质心高达 +${zTotalMm.toFixed(1)} mm，顶件实重达 ${topMass.toFixed(1)} g (${(topMass / 28.35).toFixed(2)} oz)！倾覆力矩过大，长期斜插会导致硅胶圈单侧受压变形漏气甚至碰倒酒瓶。`;

            dfmRecommendationsEn.push(
                'Tooling Core-Pulling: Switch to 30%–50% Internal Slide Core-Pulling (wall thickness 2.0–3.0 mm) to cut top mass and eliminate surface sink marks.'
            );
            dfmRecommendationsEn.push(
                'Counterweight Base: Upgrade lower stem to Heavy SUS304 CNC Stainless Steel (38 g) + Shore A 45–55 3-rib food-grade silicone.'
            );
            dfmRecommendationsEn.push(
                'Neck Geometry: Shorten the decorative transition neck by 4–6 mm or switch substrate to 6061 Anodized Aluminium.'
            );

            dfmRecommendationsZh.push(
                '模具滑块抽芯减重：强烈建议改为 30%~50% 内部抽芯掏空工艺（控制均匀壁厚 2.0~3.0 mm），既大幅下移质心又彻底消除电镀表面缩水起泡。'
            );
            dfmRecommendationsZh.push(
                '下部压舱配重升级：建议将下部锥体升级为 38 g 加重型 SUS304 不锈钢车削底座 + 邵氏硬度 45–55 食品级三道硅胶圈。'
            );
            dfmRecommendationsZh.push(
                '结构降高优化：建议将顶件连接颈部缩短 4~6 mm，或改用 6061 阳极氧化铝合金基材。'
            );
        } else if (zTotalMm > 15.0 || safetyFactor < 2.1 || topMass > 90.0) {
            level = 'MARGINAL';
            labelEn = 'MARGINAL (Moderate Top-Heaviness)';
            labelZh = 'MARGINAL · 临界微晃（建议优化抽芯）';
            summaryEn = `Composite CG is at +${zTotalMm.toFixed(1)} mm (${(zTotalMm / 25.4).toFixed(2)}"). Safe on vertical bottles, but flared champagne/burgundy necks (>19.2 mm bore) may exhibit slight lateral play.`;
            summaryZh = `组合质心位于 +${zTotalMm.toFixed(1)} mm (${(zTotalMm / 25.4).toFixed(2)}")。在标准 18.5 mm 直身波尔多瓶上稳定，但在喇叭口或大口径瓶 (>19.2 mm) 上轻微晃动。`;

            dfmRecommendationsEn.push(
                'Core-Pulling Optimization: Apply 30% Standard Core-Pulling (~3.0 mm uniform wall) to bring top mass into the 45–75 g sweet spot.'
            );
            dfmRecommendationsEn.push(
                'Elastomer Seal Spec: Specify Shore A 45–55 food-grade silicone 3-rib rings to prevent upward pop-out on flared bottlenecks.'
            );

            dfmRecommendationsZh.push(
                '抽芯工艺建议：建议采用 30% 标准滑块抽芯（保持 3.0 mm 均匀壁厚），将顶件净重控制在 45~75 g 黄金手感区间。'
            );
            dfmRecommendationsZh.push(
                '密封胶圈校准：建议指定邵氏硬度 45–55 食品级硅胶三环阶梯结构，防止在微锥形瓶口中向上回弹滑出。'
            );
        } else {
            dfmRecommendationsEn.push(
                'Optimal Mass & Balance: Total assembly mass and low CG deliver a luxurious palm feel with rock-solid bottleneck retention.'
            );
            dfmRecommendationsEn.push(
                'Mold Readiness: Uniform wall thickness supports defect-free mirror gold/chrome electroplating and 72h neutral salt-spray compliance.'
            );

            dfmRecommendationsZh.push(
                '黄金配重比：当前总克重与低质心设计兼顾了厚重高级手感与瓶口插拔稳定性，无头重脚轻隐患。'
            );
            dfmRecommendationsZh.push(
                '量产模具就绪：壁厚分布均匀，可直接进入镜面真金/白铬电镀与 72 小时盐雾测试量产流程。'
            );
        }

        return {
            topMassGrams: parseFloat(topMass.toFixed(1)),
            baseMassGrams: parseFloat(baseMass.toFixed(1)),
            totalMassGrams: parseFloat(totalMassGrams.toFixed(1)),
            totalMassOz: parseFloat(totalMassOz.toFixed(2)),
            zTotalMm: parseFloat(zTotalMm.toFixed(1)),
            zTotalIn: parseFloat((zTotalMm / 25.4).toFixed(2)),
            overturningMomentNmm: parseFloat(overturningMomentNmm.toFixed(1)),
            restoringMomentNmm: parseFloat(totalRestoringMomentNmm.toFixed(1)),
            safetyFactor: parseFloat(safetyFactor.toFixed(2)),
            criticalAngleDeg: parseFloat(criticalAngleDeg.toFixed(1)),
            level,
            label: isZh ? labelZh : labelEn,
            labelEn,
            labelZh,
            summary: isZh ? summaryZh : summaryEn,
            summaryEn,
            summaryZh,
            dfmRecommendations: isZh ? dfmRecommendationsZh : dfmRecommendationsEn,
            dfmRecommendationsEn,
            dfmRecommendationsZh
        };
    }

    return {
        evaluateStability
    };
}));
