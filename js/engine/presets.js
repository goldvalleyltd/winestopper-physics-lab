/**
 * WineStopper Physics Lab - Industrial Engineering Presets
 * Calibrated per Gold Valley Engineering Parameters (Zamak 3/5, SUS304 7.93 g/cm³, H65 Brass 8.50 g/cm³, 6061 Al, Shore A 45–55)
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WineStopperLab = root.WineStopperLab || {};
        root.WineStopperLab.presets = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // 1. Decorative Top Metal Alloys (Strictly compliant with engineering-params.md)
    const MATERIALS = {
        'zn-zamak3': {
            id: 'zn-zamak3',
            name: 'Zamak 3 Zinc Alloy (6.60 g/cm³ · Die-Cast)',
            nameEn: 'Zamak 3 Zinc Alloy (6.60 g/cm³ · Die-Cast)',
            nameZh: '3号压铸锌合金 (Zamak 3 - 6.60 g/cm³)',
            density: 6.60,
            description: 'High-fluidity hot-chamber die-casting alloy for intricate 3D animal busts & sculptural ornaments (±0.15 mm)',
            descriptionEn: 'High-fluidity hot-chamber die-casting alloy for intricate 3D animal busts & sculptural ornaments (±0.15 mm)',
            descriptionZh: '高流动性热室压铸锌合金，适合复杂 3D 鹿头、皇冠与异形雕塑顶件（公差 ±0.15 mm）'
        },
        'zn-zamak5': {
            id: 'zn-zamak5',
            name: 'Zamak 5 High-Strength Zinc Alloy (6.70 g/cm³)',
            nameEn: 'Zamak 5 High-Strength Zinc Alloy (6.70 g/cm³)',
            nameZh: '5号高强锌合金 (Zamak 5 - 6.70 g/cm³)',
            density: 6.70,
            description: 'Copper-alloyed zinc die casting with higher tensile strength and plating hardness for luxury barware',
            descriptionEn: 'Copper-alloyed zinc die casting with higher tensile strength and plating hardness for luxury barware',
            descriptionZh: '含铜强化型压铸锌合金，抗拉强度与电镀结合力更高，高端酒具礼品首选'
        },
        'ss-304': {
            id: 'ss-304',
            name: 'SUS304 Food-Grade Stainless Steel (7.93 g/cm³)',
            nameEn: 'SUS304 Food-Grade Stainless Steel (7.93 g/cm³)',
            nameZh: 'SUS304 食品级不锈钢 (7.93 g/cm³)',
            density: 7.93,
            description: 'FDA 21 CFR & LFGB compliant corrosion-proof stainless steel for CNC-turned minimalist top pieces',
            descriptionEn: 'FDA 21 CFR & LFGB compliant corrosion-proof stainless steel for CNC-turned minimalist top pieces',
            descriptionZh: '符合 FDA 与欧盟 LFGB 食品接触标准，耐果酸腐蚀，适合 CNC 现代极简几何顶件'
        },
        'cu-h65': {
            id: 'cu-h65',
            name: 'H65 / C26800 Solid Brass (8.50 g/cm³)',
            nameEn: 'H65 / C26800 Solid Brass (8.50 g/cm³)',
            nameZh: 'H65 实心黄铜 (C26800 - 8.50 g/cm³)',
            density: 8.50,
            description: 'Maximum specific gravity and heirloom weight for executive distillery & reserve club releases',
            descriptionEn: 'Maximum specific gravity and heirloom weight for executive distillery & reserve club releases',
            descriptionZh: '高比重实心黄铜，打造极具威严感的酒庄年份典藏与威士忌俱乐部定制塞'
        },
        'al-6061': {
            id: 'al-6061',
            name: '6061 Anodized Aluminium Alloy (2.70 g/cm³)',
            nameEn: '6061 Anodized Aluminium Alloy (2.70 g/cm³)',
            nameZh: '6061 阳极氧化铝合金 (2.70 g/cm³)',
            density: 2.70,
            description: 'Ultra-lightweight alloy that lowers the center of gravity by >55% for tall oversized top sculptures',
            descriptionEn: 'Ultra-lightweight alloy that lowers the center of gravity by >55% for tall oversized top sculptures',
            descriptionZh: '超轻量化铝合金，专为超高大体积顶件设计，可将整体质心高度显著下移 >55%'
        }
    };

    // 2. Shape Fullness Factor Presets (k_shape = V_mesh / V_bounding_box, calibrated with 3D STL benchmarks)
    const SHAPE_PRESETS = {
        'geometric': {
            id: 'geometric',
            name: 'Faceted Sphere / Polyhedron (k = 0.48)',
            nameEn: 'Faceted Sphere / Polyhedron (k = 0.48)',
            nameZh: '几何多面体 / 切面球体 (k = 0.48)',
            kShape: 0.48,
            description: 'Compact faceted crystal, sphere, or octagonal knob with low center of gravity',
            descriptionEn: 'Compact faceted crystal, sphere, or octagonal knob with low center of gravity',
            descriptionZh: '紧凑型切面水晶球或八角柱头，体积充盈率高、重心低稳'
        },
        'figurine': {
            id: 'figurine',
            name: '3D Animal Bust / Stag Antlers (k = 0.18)',
            nameEn: '3D Animal Bust / Stag Antlers (k = 0.18)',
            nameZh: '复杂 3D 动物首 / 鹿角雕塑 (k = 0.18)',
            kShape: 0.18,
            description: 'Sculpted stag head, horse bust, or winged mascot with wide antler bounding box and elevated CG',
            descriptionEn: 'Sculpted stag head, horse bust, or winged mascot with wide antler bounding box and elevated CG',
            descriptionZh: '带分叉鹿角、马首或展翅瑞兽，外接包围盒跨度大而局部镂空多，需重点防控头重脚轻'
        },
        'crest': {
            id: 'crest',
            name: 'Flat Shield / Winery Medallion (k = 0.32)',
            nameEn: 'Flat Shield / Winery Medallion (k = 0.32)',
            nameZh: '扁平盾徽 / 酒庄浮雕徽标 (k = 0.32)',
            kShape: 0.32,
            description: 'Double-sided vertical winery crest, monogram coin, or heraldic shield',
            descriptionEn: 'Double-sided vertical winery crest, monogram coin, or heraldic shield',
            descriptionZh: '直立式双面酒庄家族盾徽、字母火漆印或纪念章式顶件'
        },
        'column': {
            id: 'column',
            name: 'Solid T-Bar / Cylindrical Cap (k = 0.65)',
            nameEn: 'Solid T-Bar / Cylindrical Cap (k = 0.65)',
            nameZh: '实心柱状 / T型酒塞头 (k = 0.65)',
            kShape: 0.65,
            description: 'Dense cylindrical, barrel, or bourbon T-top profile with high volume fill ratio',
            descriptionEn: 'Dense cylindrical, barrel, or bourbon T-top profile with high volume fill ratio',
            descriptionZh: '高充盈率圆柱体、橡木桶造型或威士忌 T 型实心平顶塞'
        }
    };

    // 3. Die-Casting Core-Pulling / Hollowing Ratio (eta = 1 - R_hollow)
    const HOLLOWING_LEVELS = {
        'solid': {
            id: 'solid',
            name: '100% Solid Cast (No Core-Pulling · η = 1.00)',
            nameEn: '100% Solid Cast (No Core-Pulling · η = 1.00)',
            nameZh: '100% 全实心浇注 (无抽芯 · η = 1.00)',
            eta: 1.00,
            wallThicknessMm: null,
            warning: 'DFM Shrinkage Alert: Thick solid castings (>15 mm cross-section) suffer internal shrinkage porosity and surface sink marks that cause electroplating blisters!',
            warningEn: 'DFM Shrinkage Alert: Thick solid castings (>15 mm cross-section) suffer internal shrinkage porosity and surface sink marks that cause electroplating blisters!',
            warningZh: '⚠️ 车间缩水与电镀起泡高危警报：大体积全实心压铸件（壁厚 >15 mm）冷却凝固时极易产生内部缩孔与表面缩水凹坑，电镀烘烤后会导致镀层起泡报废！'
        },
        'shallow': {
            id: 'shallow',
            name: '15% Shallow Back Recess (η = 0.85)',
            nameEn: '15% Shallow Back Recess (η = 0.85)',
            nameZh: '15% 背面浅凹减重槽 (η = 0.85)',
            eta: 0.85,
            wallThicknessMm: 4.5,
            warning: 'DFM Notice: Shallow recess reduces weight by 15%, but thick central bosses (>18 cm³) may still exhibit minor sink marks on mirror gold/chrome finishes.',
            warningEn: 'DFM Notice: Shallow recess reduces weight by 15%, but thick central bosses (>18 cm³) may still exhibit minor sink marks on mirror gold/chrome finishes.',
            warningZh: '⚠️ 工艺提示：背面浅凹槽仅减重 15%，若顶件头部核心壁厚仍超过 8 mm，镜面电镀表面仍有轻微缩水暗影风险，建议升级至 30% 标准抽芯。'
        },
        'light-core': {
            id: 'light-core',
            name: '30% Standard Core-Pulling (Wall ~3.0 mm · η = 0.70)',
            nameEn: '30% Standard Core-Pulling (Wall ~3.0 mm · η = 0.70)',
            nameZh: '30% 标准模具滑块抽芯 (壁厚 ~3.0 mm · η = 0.70)',
            eta: 0.70,
            wallThicknessMm: 3.0,
            warning: null,
            warningEn: null,
            warningZh: null
        },
        'deep-core': {
            id: 'deep-core',
            name: '50% Deep Thin-Wall Coring (Wall ~2.0 mm · η = 0.50)',
            nameEn: '50% Deep Thin-Wall Coring (Wall ~2.0 mm · η = 0.50)',
            nameZh: '50% 深度薄壁抽芯掏空 (壁厚 ~2.0 mm · η = 0.50)',
            eta: 0.50,
            wallThicknessMm: 2.0,
            warning: null,
            warningEn: null,
            warningZh: null
        }
    };

    // 4. Lower Tapered Insert Stem & Elastomer Seal Configurations (Z < 0 below bottle rim)
    // Standard CETIE 18.5 mm ± 0.5 mm bottleneck; elastomer Shore A 45–55 per Gold Valley wine-stopper teardown
    const BASE_CONFIGS = {
        'zinc-silicone': {
            id: 'zinc-silicone',
            name: 'Zamak 3 Tapered Stem + 3-Rib Food-Grade Silicone (26.5 g)',
            nameEn: 'Zamak 3 Tapered Stem + 3-Rib Food-Grade Silicone (26.5 g)',
            nameZh: '压铸锌合金锥体 + 三道食品级硅胶密封圈 (26.5 g)',
            massGrams: 26.5,
            zCentroidMm: -19.5,
            maxInsertDiameterMm: 20.5,
            minInsertDiameterMm: 15.0,
            frictionTorqueBonusNmm: 9.5,
            description: 'Standard commercial barware base with Shore A 45–55 food-grade silicone ribs (fits Ø17.5–19.5 mm necks)',
            descriptionEn: 'Standard commercial barware base with Shore A 45–55 food-grade silicone ribs (fits Ø17.5–19.5 mm necks)',
            descriptionZh: '主流商业酒塞底座，配邵氏硬度 45–55 食品级硅胶三环（适配 Ø17.5~19.5 mm 标准红酒瓶口）'
        },
        'ss304-silicone': {
            id: 'ss304-silicone',
            name: 'Heavy SUS304 CNC Stem + Silicone Counterweight (38.0 g)',
            nameEn: 'Heavy SUS304 CNC Stem + Silicone Counterweight (38.0 g)',
            nameZh: '加重型 SUS304 不锈钢车削底座 + 硅胶圈 (38.0 g)',
            massGrams: 38.0,
            zCentroidMm: -21.0,
            maxInsertDiameterMm: 20.8,
            minInsertDiameterMm: 15.2,
            frictionTorqueBonusNmm: 13.5,
            description: 'High-mass stainless steel lower counterweight that pulls overall CG downward and boosts anti-tilt torque',
            descriptionEn: 'High-mass stainless steel lower counterweight that pulls overall CG downward and boosts anti-tilt torque',
            descriptionZh: '高比重不锈钢下部压舱配重底座，强力下拽整体质心并提升瓶口抗倾覆恢复力矩'
        },
        'brass-cork': {
            id: 'brass-cork',
            name: 'Solid Brass Core + Natural Portuguese Cork (22.0 g)',
            nameEn: 'Solid Brass Core + Natural Portuguese Cork (22.0 g)',
            nameZh: '黄铜芯轴 + 天然葡萄牙软木塞底座 (22.0 g)',
            massGrams: 22.0,
            zCentroidMm: -18.0,
            maxInsertDiameterMm: 19.8,
            minInsertDiameterMm: 16.0,
            frictionTorqueBonusNmm: 6.5,
            description: 'Traditional spirits & bourbon T-stopper cork base; lower elastic retention than ribbed silicone',
            descriptionEn: 'Traditional spirits & bourbon T-stopper cork base; lower elastic retention than ribbed silicone',
            descriptionZh: '经典烈酒/威士忌软木塞结构，横向弹性抓地力矩略小于多环硅胶塞，顶件不宜过高过重'
        }
    };

    // 5. Bottleneck Physical Constants (CETIE Standard 750ml Wine Bottle)
    const BOTTLE_CONSTANTS = {
        standardBoreDiameterMm: 18.5,
        pivotRadiusMm: 9.25,
        criticalTiltAngleDeg: 15.0,
        gravityMps2: 9.80665
    };

    function getMaterial(id) {
        if (id === 'zn-standard') return MATERIALS['zn-zamak5'];
        return MATERIALS[id] || MATERIALS['zn-zamak3'];
    }

    function getShapePreset(id) {
        return SHAPE_PRESETS[id] || SHAPE_PRESETS['figurine'];
    }

    function getHollowingLevel(id) {
        return HOLLOWING_LEVELS[id] || HOLLOWING_LEVELS['light-core'];
    }

    function getBaseConfig(id) {
        return BASE_CONFIGS[id] || BASE_CONFIGS['zinc-silicone'];
    }

    // 6. Metric + Imperial Dual-Unit Helpers
    function mmToIn(mm, decimals = 2) {
        return (Number(mm) / 25.4).toFixed(decimals);
    }

    function formatMmIn(mm, mmDecimals = 0, inDecimals = 2) {
        const m = Number(mm).toFixed(mmDecimals);
        const i = mmToIn(mm, inDecimals);
        return `${m} mm (${i}")`;
    }

    return {
        MATERIALS,
        SHAPE_PRESETS,
        HOLLOWING_LEVELS,
        BASE_CONFIGS,
        BOTTLE_CONSTANTS,
        getMaterial,
        getShapePreset,
        getHollowingLevel,
        getBaseConfig,
        mmToIn,
        formatMmIn
    };
}));
