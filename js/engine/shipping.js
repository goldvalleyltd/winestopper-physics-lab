/**
 * WineStopper Physics Lab - B2B Export Carton & Air/Sea Freight Calculator
 * Anti-burst master carton packing (≤18.0 kg / 39.7 lbs per carton), actual vs dimensional weight & freight estimation
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WineStopperLab = root.WineStopperLab || {};
        root.WineStopperLab.shipping = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // Export master carton specs: Double-wall K=K corrugated carton (42 x 32 x 28 cm = 0.0376 CBM)
    const CARTON_SPECS = {
        lengthCm: 42.0,
        widthCm: 32.0,
        heightCm: 28.0,
        masterCartonTareKg: 0.95,
        unitGiftBoxTareGrams: 28.0, // Individual velvet/blister gift box + protective EVA foam insert
        maxSafeGrossKg: 18.0,       // Strict ≤18.0 kg (39.7 lbs) anti-burst & single-person handling limit
        volumetricDivisor: 5000.0
    };

    /**
     * Calculate export carton packing, gross weight, and Air Express vs DDP Sea freight estimates
     * @param {number} unitNetMassGrams Single wine stopper net assembly weight (g)
     * @param {number} [orderQty=500]   Total order quantity (pcs)
     * @param {string} [lang='en']      'en' | 'zh'
     */
    function calculateLogistics(unitNetMassGrams, orderQty = 500, lang = 'en') {
        const isZh = (lang === 'zh');
        const safeQty = Math.max(1, Math.round(Number(orderQty) || 500));
        const unitNet = Math.max(10, Number(unitNetMassGrams) || 85);

        // Single unit packed weight (including gift box + blister insert)
        const unitPackedGrams = unitNet + CARTON_SPECS.unitGiftBoxTareGrams;
        const unitPackedKg = unitPackedGrams / 1000.0;

        // Safe pieces per master carton (strictly capped at ≤18.0 kg gross weight and ≤100 gift boxes volume limit)
        const maxNetKgPerCarton = CARTON_SPECS.maxSafeGrossKg - CARTON_SPECS.masterCartonTareKg;
        let rawMaxPcs = Math.floor(maxNetKgPerCarton / unitPackedKg);
        rawMaxPcs = Math.min(100, Math.max(20, rawMaxPcs));
        const maxPiecesPerCarton = rawMaxPcs >= 40 ? Math.floor(rawMaxPcs / 10) * 10 : rawMaxPcs;

        // Total cartons required for the order
        const totalCartons = Math.ceil(safeQty / maxPiecesPerCarton);

        // Gross & net weights
        const totalNetWeightKg = (safeQty * unitNet) / 1000.0;
        const totalGrossWeightKg = (safeQty * unitPackedKg) + (totalCartons * CARTON_SPECS.masterCartonTareKg);
        const totalGrossWeightLbs = totalGrossWeightKg * 2.20462262;
        const grossWeightPerCartonKg = totalGrossWeightKg / totalCartons;
        const grossWeightPerCartonLbs = grossWeightPerCartonKg * 2.20462262;

        // Volumetric weight & CBM
        const singleCartonCbm = (CARTON_SPECS.lengthCm * CARTON_SPECS.widthCm * CARTON_SPECS.heightCm) / 1000000.0;
        const totalVolumeCbm = totalCartons * singleCartonCbm;
        const dimensionalWeightPerCartonKg =
            (CARTON_SPECS.lengthCm * CARTON_SPECS.widthCm * CARTON_SPECS.heightCm) / CARTON_SPECS.volumetricDivisor;
        const totalDimWeightKg = totalCartons * dimensionalWeightPerCartonKg;

        // Chargeable weight per carton and for entire order
        const chargeableWeightPerCartonKg = Math.max(grossWeightPerCartonKg, dimensionalWeightPerCartonKg);
        const totalChargeableWeightKg = Math.max(totalGrossWeightKg, totalDimWeightKg);
        const isActualWeightDominant = grossWeightPerCartonKg >= dimensionalWeightPerCartonKg;

        // Freight cost estimation (Air Express ~$6.8/kg vs DDP Sea/Rail ~$2.1/kg)
        const estimatedAirCourierUsd = Math.round(totalChargeableWeightKg * 6.8);
        const estimatedOceanLclUsd = Math.round(Math.max(165, totalChargeableWeightKg * 2.1));
        const savingsUsd = Math.max(0, estimatedAirCourierUsd - estimatedOceanLclUsd);

        let freightIndex = '$$ Standard';
        let freightTier = 'STANDARD';
        if (grossWeightPerCartonKg > 15.5) {
            freightIndex = '$$$$ Heavy Built';
            freightTier = 'HEAVY';
        } else if (grossWeightPerCartonKg > 11.5) {
            freightIndex = '$$$ Moderate-High';
            freightTier = 'MODERATE';
        } else if (grossWeightPerCartonKg < 8.5) {
            freightIndex = '$ Eco-Friendly';
            freightTier = 'ECO';
        }

        let logisticsTipEn = '';
        let logisticsTipZh = '';
        if (totalGrossWeightKg >= 110) {
            logisticsTipEn = `Heavy Barware Shipment: ${safeQty} pcs pack into ${totalCartons} cartons (${maxPiecesPerCarton} pcs/ctn max) with ${totalGrossWeightKg.toFixed(1)} kg (${totalGrossWeightLbs.toFixed(1)} lbs) gross weight. Air Express is ~$${estimatedAirCourierUsd} USD vs DDP Sea Freight ~$${estimatedOceanLclUsd} USD (saves ~$${savingsUsd} USD).`;
            logisticsTipZh = `💡 外贸物流筹划建议：${safeQty} 只酒塞共分装 ${totalCartons} 箱（每箱严控 ≤${maxPiecesPerCarton} 只防爆箱），整单总毛重 ${totalGrossWeightKg.toFixed(1)} kg (${totalGrossWeightLbs.toFixed(1)} lbs)。国际商业快递预估 ~$${estimatedAirCourierUsd} USD；若交期充裕建议走海运 DDP 包税专线（~$${estimatedOceanLclUsd} USD），立省约 $${savingsUsd} USD！`;
        } else {
            logisticsTipEn = `Express-Ready Batch: ${safeQty} pcs require ${totalCartons} cartons (${maxPiecesPerCarton} pcs/ctn, ${grossWeightPerCartonKg.toFixed(1)} kg/ctn ≤18 kg limit). Total chargeable weight is ${totalChargeableWeightKg.toFixed(1)} kg (${isActualWeightDominant ? 'Actual Deadweight' : 'Volumetric Weight'}); Air Express is ~$${estimatedAirCourierUsd} USD.`;
            logisticsTipZh = `💡 外贸物流筹划建议：${safeQty} 只酒塞共装 ${totalCartons} 箱（每箱 ${maxPiecesPerCarton} 只，单箱毛重 ${grossWeightPerCartonKg.toFixed(1)} kg 符合 ≤18 kg 防爆箱标准）。整单计费重 ${totalChargeableWeightKg.toFixed(1)} kg（按${isActualWeightDominant ? '实重重货' : '体积泡货'}计费），国际快递门到门预估 ~$${estimatedAirCourierUsd} USD。`;
        }

        return {
            orderQty: safeQty,
            pcsPerCarton: maxPiecesPerCarton,
            maxPiecesPerCarton,
            totalCartons,
            cartonDimensionsCm: `${CARTON_SPECS.lengthCm}×${CARTON_SPECS.widthCm}×${CARTON_SPECS.heightCm} cm`,
            unitPackedGrams: parseFloat(unitPackedGrams.toFixed(1)),
            netProductWeightKg: parseFloat(totalNetWeightKg.toFixed(2)),
            grossWeightPerCartonKg: parseFloat(grossWeightPerCartonKg.toFixed(2)),
            grossWeightPerCartonLbs: parseFloat(grossWeightPerCartonLbs.toFixed(1)),
            totalGrossWeightKg: parseFloat(totalGrossWeightKg.toFixed(1)),
            totalGrossWeightLbs: parseFloat(totalGrossWeightLbs.toFixed(1)),
            dimensionalWeightKg: parseFloat(dimensionalWeightPerCartonKg.toFixed(2)),
            chargeableWeightKg: parseFloat(chargeableWeightPerCartonKg.toFixed(2)),
            totalChargeableWeightKg: parseFloat(totalChargeableWeightKg.toFixed(1)),
            totalVolumeCbm: parseFloat(totalVolumeCbm.toFixed(3)),
            isActualWeightDominant,
            estimatedAirCourierUsd,
            estimatedOceanLclUsd,
            freightIndex,
            freightTier,
            logisticsTip: isZh ? logisticsTipZh : logisticsTipEn,
            logisticsTipEn,
            logisticsTipZh
        };
    }

    return {
        CARTON_SPECS,
        calculateLogistics
    };
}));
