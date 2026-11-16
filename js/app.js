/**
 * WineStopper Physics Lab - Main Application Controller
 * Bilingual (EN/ZH), Metric + Imperial dual-unit readouts, 3D CG Viewport & Native <dialog> Report Export
 */

document.addEventListener('DOMContentLoaded', () => {
    const presets = window.WineStopperLab.presets;
    const geometry = window.WineStopperLab.geometry;
    const physics = window.WineStopperLab.physics;
    const shipping = window.WineStopperLab.shipping;
    const LabScene = window.WineStopperLab.scene.LabScene;
    const StopperAssembly = window.WineStopperLab.assembly.StopperAssembly;
    const FINISH_MATERIALS = window.WineStopperLab.assembly.FINISH_MATERIALS;
    const loader = window.WineStopperLab.loader;
    const report = window.WineStopperLab.report;

    // 1. Global Application State
    const state = {
        lang: 'en',              // 'en' (default for global B2B) | 'zh'
        mode: 'quick',           // 'quick' | 'pro'
        shapePreset: 'figurine',
        lengthMm: 55,
        widthMm: 35,
        heightMm: 65,
        material: 'zn-zamak3',
        hollowing: 'light-core',
        finish: 'gold',
        baseConfig: 'zinc-silicone',
        boreDiameterMm: 18.5,
        orderQty: 500,

        // Pro 3D Mesh Data
        customMesh: null,

        // Latest Calculation Results
        lastGeoResult: null,
        lastPhysicsResult: null,
        lastShippingResult: null
    };

    // 2. Initialize 3D Scene & Assembly
    const canvasContainer = document.getElementById('three-canvas-container');
    const labScene = new LabScene(canvasContainer);
    const assembly = new StopperAssembly(labScene);

    // 3. Language Switching Engine (EN / 中文)
    const btnLangToggle = document.getElementById('btn-lang-toggle');
    const langToggleLabel = document.getElementById('lang-toggle-label');

    function applyLanguage(lang) {
        state.lang = lang;
        const isZh = (lang === 'zh');
        document.documentElement.lang = isZh ? 'zh-CN' : 'en';
        if (langToggleLabel) {
            langToggleLabel.textContent = isZh ? 'EN' : '中文';
        }

        document.querySelectorAll('[data-i18n-en]').forEach(el => {
            const targetText = isZh ? el.getAttribute('data-i18n-zh') : el.getAttribute('data-i18n-en');
            if (!targetText) return;
            if (targetText.includes('<br>')) {
                el.innerHTML = targetText;
            } else {
                el.textContent = targetText;
            }
        });

        updateBoreFitDiagnosis(state.boreDiameterMm);
        if (state.customMesh) {
            updateCustomMeshReadout();
        }
        recalculate(false);
    }

    if (btnLangToggle) {
        btnLangToggle.addEventListener('click', () => {
            applyLanguage(state.lang === 'en' ? 'zh' : 'en');
        });
    }

    // 4. Bind UI Events
    bindModeTabs();
    bindQuickModeControls();
    bindCommonControls();
    bindProModeControls();
    bindViewportToolbar();
    bindExportActions();

    // 5. Initial Calculation & 3D Build
    updateBoreFitDiagnosis(state.boreDiameterMm);
    recalculate(true);

    // =========================================================================
    // Event Binding Implementations
    // =========================================================================

    function bindModeTabs() {
        const tabQuick = document.getElementById('tab-quick');
        const tabPro = document.getElementById('tab-pro');
        const secQuick = document.getElementById('section-quick-mode');
        const secPro = document.getElementById('section-pro-mode');
        const modeText = document.getElementById('viewport-mode-text');

        tabQuick.addEventListener('click', () => {
            state.mode = 'quick';
            tabQuick.classList.add('active');
            tabQuick.setAttribute('aria-selected', 'true');
            tabPro.classList.remove('active');
            tabPro.setAttribute('aria-selected', 'false');
            secQuick.style.display = 'block';
            secPro.style.display = 'none';
            modeText.textContent = state.lang === 'zh'
                ? '3D 实时组合质心与 15° 抗倾覆力矩求解器'
                : '3D Real-Time CG & 15° Anti-Tilt Statics Engine';
            recalculate(true);
        });

        tabPro.addEventListener('click', () => {
            state.mode = 'pro';
            tabPro.classList.add('active');
            tabPro.setAttribute('aria-selected', 'true');
            tabQuick.classList.remove('active');
            tabQuick.setAttribute('aria-selected', 'false');
            secQuick.style.display = 'none';
            secPro.style.display = 'block';
            modeText.textContent = state.lang === 'zh'
                ? 'Pro 3D 网格高斯散度微积分引擎'
                : 'Pro 3D Mesh Gauss Divergence Engine';

            if (!state.customMesh) {
                loadBuiltInSample('stag_head');
            } else {
                recalculate(true);
            }
        });
    }

    function bindQuickModeControls() {
        const selectShape = document.getElementById('select-shape-preset');
        const sliderLength = document.getElementById('slider-length');
        const sliderWidth = document.getElementById('slider-width');
        const sliderHeight = document.getElementById('slider-height');

        const valLength = document.getElementById('val-length');
        const valWidth = document.getElementById('val-width');
        const valHeight = document.getElementById('val-height');

        selectShape.addEventListener('change', (e) => {
            state.shapePreset = e.target.value;
            recalculate(true);
        });

        sliderLength.addEventListener('input', (e) => {
            state.lengthMm = Number(e.target.value);
            valLength.textContent = presets.formatMmIn(state.lengthMm, 0, 2);
            recalculate(true);
        });

        sliderWidth.addEventListener('input', (e) => {
            state.widthMm = Number(e.target.value);
            valWidth.textContent = presets.formatMmIn(state.widthMm, 0, 2);
            recalculate(true);
        });

        sliderHeight.addEventListener('input', (e) => {
            state.heightMm = Number(e.target.value);
            valHeight.textContent = presets.formatMmIn(state.heightMm, 0, 2);
            recalculate(true);
        });
    }

    function bindCommonControls() {
        const selectMaterial = document.getElementById('select-material');
        const selectHollowing = document.getElementById('select-hollowing');
        const selectBase = document.getElementById('select-base-config');
        const sliderBore = document.getElementById('slider-bore');
        const inputQty = document.getElementById('input-order-qty');

        selectMaterial.addEventListener('change', (e) => {
            state.material = e.target.value;
            recalculate(false);
        });

        selectHollowing.addEventListener('change', (e) => {
            state.hollowing = e.target.value;
            recalculate(false);
        });

        selectBase.addEventListener('change', (e) => {
            state.baseConfig = e.target.value;
            updateBoreFitDiagnosis(state.boreDiameterMm);
            recalculate(false);
        });

        const boreChips = document.querySelectorAll('.bore-chips .chip-btn[data-bore]');
        const syncBoreChips = (boreMm) => {
            boreChips.forEach(chip => {
                const chipVal = Number(chip.getAttribute('data-bore'));
                chip.classList.toggle('active', Math.abs(chipVal - boreMm) < 0.01);
            });
        };

        if (sliderBore) {
            sliderBore.addEventListener('input', (e) => {
                const boreMm = Number(e.target.value);
                state.boreDiameterMm = boreMm;
                syncBoreChips(boreMm);
                labScene.updateBottleDimensions(boreMm);
                updateBoreFitDiagnosis(boreMm);
            });
        }

        boreChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const boreMm = Number(chip.getAttribute('data-bore'));
                if (!Number.isFinite(boreMm)) return;
                state.boreDiameterMm = boreMm;
                if (sliderBore) sliderBore.value = String(boreMm);
                syncBoreChips(boreMm);
                labScene.updateBottleDimensions(boreMm);
                updateBoreFitDiagnosis(boreMm);
            });
        });

        if (inputQty) {
            inputQty.addEventListener('input', (e) => {
                state.orderQty = Math.max(10, parseInt(e.target.value, 10) || 500);
                recalculate(false);
            });
        }

        // Electroplating Finish Swatches
        const swatches = document.querySelectorAll('.swatch-btn');
        const finishLabel = document.getElementById('val-finish-name');
        swatches.forEach(btn => {
            btn.addEventListener('click', () => {
                swatches.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const finishKey = btn.getAttribute('data-finish');
                state.finish = finishKey;
                assembly.setFinish(finishKey);
                if (finishLabel && FINISH_MATERIALS[finishKey]) {
                    finishLabel.textContent = state.lang === 'zh'
                        ? FINISH_MATERIALS[finishKey].nameZh
                        : FINISH_MATERIALS[finishKey].nameEn;
                }
            });
        });
    }

    /**
     * Real-time bottleneck bore vs silicone/cork interference fit diagnosis
     */
    function updateBoreFitDiagnosis(boreMm) {
        const isZh = (state.lang === 'zh');
        const valBore = document.getElementById('val-bore');
        const hintEl = document.getElementById('bore-fit-hint');
        const baseObj = presets.getBaseConfig(state.baseConfig);
        const boreIn = presets.mmToIn(boreMm, 2);

        let bottleTypeEn = 'Standard Bordeaux';
        let bottleTypeZh = '标准波尔多瓶';
        if (boreMm <= 17.5) {
            bottleTypeEn = 'Narrow Half-Bottle';
            bottleTypeZh = '窄口冰酒/半瓶装';
        } else if (boreMm >= 20.0) {
            bottleTypeEn = 'Wide Champagne / Spirits';
            bottleTypeZh = '宽口香槟/烈酒瓶';
        } else if (boreMm >= 19.0) {
            bottleTypeEn = 'Burgundy / Rhône';
            bottleTypeZh = '勃艮第/罗纳河谷瓶';
        }

        if (valBore) {
            valBore.textContent = `${boreMm.toFixed(1)} mm (${boreIn}" · ${isZh ? bottleTypeZh : bottleTypeEn})`;
        }

        if (!hintEl) return;

        const maxSealD = baseObj.maxInsertDiameterMm || 20.5;
        const minSealD = baseObj.minInsertDiameterMm || 15.0;
        const interferenceMm = maxSealD - boreMm;

        if (interferenceMm < 0.3) {
            hintEl.style.color = '#EF4444';
            hintEl.textContent = isZh
                ? `🚨 漏气与滑脱警报：瓶口 (${boreMm.toFixed(1)} mm) 接近或大于硅胶圈外径 (${maxSealD} mm)，缺乏过盈压缩力，极易晃动漏气！`
                : `🚨 Loose Fit Alert: Bore (${boreMm.toFixed(1)} mm) exceeds or nears seal OD (${maxSealD} mm). Insufficient radial compression — risk of air leak & wobble!`;
        } else if (boreMm < minSealD + 1.5) {
            hintEl.style.color = '#F59E0B';
            hintEl.textContent = isZh
                ? `⚠️ 瓶口偏窄提醒：内径 (${boreMm.toFixed(1)} mm) 较紧，插入阻尼较大（过盈量 +${interferenceMm.toFixed(1)} mm）。`
                : `⚠️ Tight Insertion Notice: Bore (${boreMm.toFixed(1)} mm) is narrow; requires firm push-in force (+${interferenceMm.toFixed(1)} mm interference).`;
        } else {
            hintEl.style.color = '#10B981';
            hintEl.textContent = isZh
                ? `✓ 黄金过盈密封区（硅胶肋片压缩量 +${interferenceMm.toFixed(1)} mm，气密性与抓地力俱佳）`
                : `✓ Optimal Compression Seal (+${interferenceMm.toFixed(1)} mm radial interference fit, airtight & slip-free)`;
        }
    }

    /**
     * Evaluate die-casting shrinkage porosity & plating blister risk based on hollowing level & solid volume
     */
    function checkHollowingDefectRisk(hollowingKey, rawSolidVolumeCm3) {
        const warningBox = document.getElementById('hollowing-warning-box');
        if (!warningBox) return;

        const isZh = (state.lang === 'zh');
        const hObj = presets.getHollowingLevel(hollowingKey);
        const warningText = isZh ? hObj.warningZh : hObj.warningEn;

        warningBox.className = 'hollowing-alert';
        if (warningText && (hollowingKey === 'solid' || (hollowingKey === 'shallow' && rawSolidVolumeCm3 > 14.0))) {
            warningBox.classList.add(hollowingKey === 'solid' ? 'critical' : 'warning');
            warningBox.textContent = warningText;
        } else {
            warningBox.textContent = '';
        }
    }

    function updateCustomMeshReadout() {
        if (!state.customMesh) return;
        const { filename, bounds, metrics } = state.customMesh;
        const d = bounds.dimensions;
        document.getElementById('mesh-info-box').style.display = 'block';
        document.getElementById('mesh-filename').textContent = filename;
        document.getElementById('mesh-dims').textContent =
            `${d.width} × ${d.depth} × ${d.height} mm (${presets.mmToIn(d.width)}" × ${presets.mmToIn(d.height)}")`;
        document.getElementById('mesh-vol').textContent = `${metrics.volumeCm3.toFixed(2)} cm³`;
    }

    function bindProModeControls() {
        const dropzone = document.getElementById('dropzone-box');
        const fileInput = document.getElementById('file-input');
        const sampleBtns = document.querySelectorAll('.sample-model-btn');

        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                await handleUploadedFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                await handleUploadedFile(e.target.files[0]);
            }
        });

        sampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sampleType = btn.getAttribute('data-sample');
                loadBuiltInSample(sampleType);
            });
        });
    }

    async function handleUploadedFile(file) {
        try {
            const { positions, fileName } = await loader.loadFile(file);
            applyCustomMesh(fileName || file.name, positions);
        } catch (err) {
            alert('3D Mesh Parse Error: ' + err.message);
        }
    }

    async function loadBuiltInSample(sampleType) {
        try {
            const fileMap = {
                'stag_head': 'assets/models/sample_stag_head.stl',
                'geo_crystal': 'assets/models/sample_geo_crystal.stl',
                'crest_badge': 'assets/models/sample_crest_badge.stl'
            };
            const url = fileMap[sampleType] || fileMap['stag_head'];
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load sample STL');
            const buffer = await response.arrayBuffer();
            const positions = loader.parseSTL(buffer);
            applyCustomMesh(`sample_${sampleType}.stl`, positions);
        } catch (err) {
            console.warn('Sample STL fetch fallback to procedural geometry:', err);
            const fallbackShape = sampleType === 'geo_crystal' ? 'geometric' : (sampleType === 'crest_badge' ? 'crest' : 'figurine');
            state.shapePreset = fallbackShape;
            recalculate(true);
        }
    }

    function applyCustomMesh(filename, positions) {
        const metrics = geometry.computeMeshVolumeAndCentroid(positions);
        const bounds = metrics.bounds;

        state.customMesh = {
            filename,
            positions,
            bounds,
            metrics
        };

        updateCustomMeshReadout();
        assembly.loadCustomMesh(positions, bounds);
        recalculate(false);
    }

    function bindViewportToolbar() {
        const btnWobble = document.getElementById('btn-wobble-test');
        const btnClip = document.getElementById('btn-toggle-clip');
        const btnWireframe = document.getElementById('btn-toggle-wireframe');
        const btnReset = document.getElementById('btn-reset-cam');

        btnWobble.addEventListener('click', () => {
            const level = state.lastPhysicsResult ? state.lastPhysicsResult.level : 'STABLE';
            assembly.triggerWobbleTest(level);
        });

        if (btnClip) {
            btnClip.addEventListener('click', () => {
                const isClip = labScene.toggleClipping();
                btnClip.classList.toggle('active', isClip);
                btnClip.setAttribute('aria-pressed', String(isClip));
            });
        }

        btnWireframe.addEventListener('click', () => {
            const isWire = assembly.toggleWireframe();
            btnWireframe.classList.toggle('active', isWire);
            btnWireframe.setAttribute('aria-pressed', String(isWire));
        });

        btnReset.addEventListener('click', () => {
            labScene.resetCamera();
        });
    }

    // =========================================================================
    // Core Physics, DFM & Logistics Recalculation Pipeline
    // =========================================================================

    function recalculate(rebuildProcedural3D) {
        const isZh = (state.lang === 'zh');
        const matObj = presets.getMaterial(state.material);
        const hollowingObj = presets.getHollowingLevel(state.hollowing);
        const shapeObj = presets.getShapePreset(state.shapePreset);

        // Keep finish badge synchronized with active language
        const finishLabel = document.getElementById('val-finish-name');
        if (finishLabel && FINISH_MATERIALS[state.finish]) {
            finishLabel.textContent = isZh
                ? FINISH_MATERIALS[state.finish].nameZh
                : FINISH_MATERIALS[state.finish].nameEn;
        }

        let solidVolumeCm3 = 0;
        let rawSolidVolumeCm3 = 0;
        let topMassGrams = 0;
        let topCentroidZMm = 0;

        if (state.mode === 'pro' && state.customMesh) {
            rawSolidVolumeCm3 = state.customMesh.metrics.volumeCm3;
            solidVolumeCm3 = rawSolidVolumeCm3 * hollowingObj.eta;
            topMassGrams = solidVolumeCm3 * matObj.density;

            // Vertical height of centroid above collar base (min.y)
            const baseCentroidZ = Math.max(4.0, state.customMesh.metrics.centroid.y - state.customMesh.bounds.min.y);
            const centroidShiftRatio = 1.0 + (1.0 - hollowingObj.eta) * 0.08;
            topCentroidZMm = baseCentroidZ * centroidShiftRatio;

            state.lastGeoResult = {
                rawSolidVolumeCm3: parseFloat(rawSolidVolumeCm3.toFixed(2)),
                solidVolumeCm3: parseFloat(solidVolumeCm3.toFixed(2)),
                weightGrams: parseFloat(topMassGrams.toFixed(1)),
                zCentroidMm: parseFloat(topCentroidZMm.toFixed(1))
            };
        } else {
            const geoRes = geometry.estimateByBoundingBox(
                state.lengthMm,
                state.widthMm,
                state.heightMm,
                shapeObj.kShape,
                hollowingObj.eta,
                matObj.density
            );

            rawSolidVolumeCm3 = geoRes.rawSolidVolumeCm3;
            solidVolumeCm3 = geoRes.solidVolumeCm3;
            topMassGrams = geoRes.weightGrams;
            topCentroidZMm = geoRes.zCentroidMm;
            state.lastGeoResult = geoRes;

            if (rebuildProcedural3D) {
                assembly.updateProceduralTop(
                    state.shapePreset,
                    state.lengthMm,
                    state.widthMm,
                    state.heightMm
                );
            }
        }

        // Evaluate die-casting shrinkage / blister risk
        checkHollowingDefectRisk(state.hollowing, rawSolidVolumeCm3);

        // Preserve cross-section clipping state if enabled
        if (labScene.isClippingEnabled) {
            labScene.applyClippingPlanes(labScene.modelGroup, [labScene.clipPlane]);
        }

        // 2. Statics & 15° Tilt Stability Evaluation
        const physRes = physics.evaluateStability({
            topMassGrams,
            topCentroidZMm,
            baseConfigId: state.baseConfig,
            tiltAngleDeg: 15.0,
            lang: state.lang
        });
        state.lastPhysicsResult = physRes;

        // 3. Update 3D Centroid Marker Position
        assembly.updateCentroidMarker(physRes.zTotalMm);

        // 4. B2B Export Carton & Freight Calculation
        const shipRes = shipping.calculateLogistics(physRes.totalMassGrams, state.orderQty, state.lang);
        state.lastShippingResult = shipRes;

        // 5. Refresh Dashboard UI
        renderDashboardUI(state.lastGeoResult, physRes, shipRes, hollowingObj);
    }

    function renderDashboardUI(geoRes, physRes, shipRes, hollowingObj) {
        const isZh = (state.lang === 'zh');

        // KPI 1: Total Assembly Mass (g + oz)
        document.getElementById('kpi-total-mass').textContent = physRes.totalMassGrams.toFixed(1);
        document.getElementById('kpi-total-unit').textContent = `g (${physRes.totalMassOz} oz)`;
        document.getElementById('kpi-mass-breakdown').textContent = isZh
            ? `顶件: ${physRes.topMassGrams} g + 底座: ${physRes.baseMassGrams} g`
            : `Top: ${physRes.topMassGrams} g + Base: ${physRes.baseMassGrams} g`;

        // KPI 2: Composite Center of Gravity (mm + in)
        const zSign = physRes.zTotalMm > 0 ? '+' : '';
        document.getElementById('kpi-z-centroid').textContent = `${zSign}${physRes.zTotalMm.toFixed(1)}`;
        document.getElementById('kpi-z-unit').textContent = `mm (${zSign}${physRes.zTotalIn}")`;
        document.getElementById('kpi-z-desc').textContent = isZh
            ? '相对瓶口基准面 (Z = 0 mm)'
            : 'Relative to Bottle Rim (Z = 0)';

        // KPI 3: 15° Anti-Tilt Safety Factor
        document.getElementById('kpi-safety-factor').textContent = physRes.safetyFactor.toFixed(2);
        document.getElementById('kpi-critical-angle').textContent = isZh
            ? `极限静态倾覆角: ${physRes.criticalAngleDeg}°`
            : `Critical Tipping Angle: ${physRes.criticalAngleDeg}°`;

        // KPI 4: Effective Top Metal Volume
        document.getElementById('kpi-volume').textContent = geoRes.solidVolumeCm3.toFixed(2);
        const hollowPercent = Math.round((1.0 - hollowingObj.eta) * 100);
        document.getElementById('kpi-hollowing-desc').textContent = hollowPercent > 0
            ? (isZh ? `已扣除 ${hollowPercent}% 内部抽芯减重` : `${hollowPercent}% Core-Pulling Applied`)
            : (isZh ? '100% 全实心无抽芯' : '100% Solid Cast (No Coring)');

        // Stability Verdict Banner
        const banner = document.getElementById('stability-banner');
        banner.className = `stability-banner ${physRes.level}`;

        const iconMap = {
            'STABLE': '🟢',
            'MARGINAL': '🟡',
            'HIGH_RISK': '🔴'
        };
        document.getElementById('stability-icon').textContent = iconMap[physRes.level] || '🟢';
        document.getElementById('stability-label').textContent = physRes.label;
        document.getElementById('stability-summary').textContent = physRes.summary;

        // DFM Advice List
        const adviceList = document.getElementById('dfm-advice-list');
        adviceList.innerHTML = '';
        physRes.dfmRecommendations.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            adviceList.appendChild(li);
        });

        // Torque Readout
        document.getElementById('val-m-tilt').textContent = physRes.overturningMomentNmm.toFixed(1);
        document.getElementById('val-m-rest').textContent = physRes.restoringMomentNmm.toFixed(1);

        // Export Logistics Readout
        document.getElementById('ship-cartons').textContent = isZh
            ? `${shipRes.totalCartons} 箱 (${shipRes.maxPiecesPerCarton} pcs/箱)`
            : `${shipRes.totalCartons} Ctns (${shipRes.maxPiecesPerCarton} pcs/ctn)`;
        document.getElementById('ship-gross').textContent = isZh
            ? `单箱均重: ${shipRes.grossWeightPerCartonKg} kg (${shipRes.grossWeightPerCartonLbs} lbs)`
            : `${shipRes.grossWeightPerCartonKg} kg (${shipRes.grossWeightPerCartonLbs} lbs) / ctn`;

        document.getElementById('ship-total-gross').textContent =
            `${shipRes.totalGrossWeightKg} kg (${shipRes.totalGrossWeightLbs} lbs)`;
        document.getElementById('ship-dim').textContent = isZh
            ? `体积重: ${shipRes.dimensionalWeightKg} kg/箱 | ${shipRes.totalVolumeCbm} CBM`
            : `Volumetric: ${shipRes.dimensionalWeightKg} kg/ctn | ${shipRes.totalVolumeCbm} CBM`;

        document.getElementById('ship-chargeable').textContent = `${shipRes.totalChargeableWeightKg} kg`;
        document.getElementById('ship-dominant-tag').textContent = shipRes.isActualWeightDominant
            ? (isZh ? '按实重计费 (五金纯重货)' : 'Billed by Actual Deadweight')
            : (isZh ? '按体积泡重计费' : 'Billed by Volumetric Weight');

        document.getElementById('ship-index').textContent =
            `~$${shipRes.estimatedAirCourierUsd} vs ~$${shipRes.estimatedOceanLclUsd}`;
        const adviceBox = document.getElementById('ship-advice-text');
        if (adviceBox) {
            adviceBox.textContent = shipRes.logisticsTip;
        }
    }

    // =========================================================================
    // Native <dialog> Modal & High-Res PNG Export
    // =========================================================================

    function bindExportActions() {
        const btnExport = document.getElementById('btn-export-report');
        const dialog = document.getElementById('report-modal');
        const btnCloseModal = document.getElementById('btn-close-modal');
        const btnDownloadPng = document.getElementById('btn-download-png');
        const previewImg = document.getElementById('report-preview-img');

        // Light-dismiss pointer fallback for browsers without native closedby="any" support
        if (dialog && !('closedBy' in dialog)) {
            let downTarget = null;
            dialog.addEventListener('pointerdown', (e) => { downTarget = e.target; });
            dialog.addEventListener('pointerup', (e) => {
                if (e.target === dialog && downTarget === dialog) {
                    dialog.close('light-dismiss');
                }
                downTarget = null;
            });
        }

        btnExport.addEventListener('click', async () => {
            const isZh = (state.lang === 'zh');
            const viewportDataUrl = labScene.getCanvasDataURL();
            const matObj = presets.getMaterial(state.material);
            const hollowObj = presets.getHollowingLevel(state.hollowing);
            const baseObj = presets.getBaseConfig(state.baseConfig);
            const finishObj = FINISH_MATERIALS[state.finish];

            let dimsStr = `${state.lengthMm} × ${state.widthMm} × ${state.heightMm} mm (${presets.mmToIn(state.lengthMm)}" × ${presets.mmToIn(state.heightMm)}")`;
            let modeLabel = isZh ? '快速参数拟合法 (Quick Mode)' : 'Parametric Quick Mode';
            if (state.mode === 'pro' && state.customMesh) {
                const d = state.customMesh.bounds.dimensions;
                dimsStr = `${d.width} × ${d.depth} × ${d.height} mm (${state.customMesh.filename})`;
                modeLabel = isZh ? '3D 网格散度微积分 (Pro STL)' : 'Pro 3D STL Divergence Integration';
            }

            const reportData = {
                lang: state.lang,
                viewportDataUrl,
                modeLabel,
                dimensionsStr: dimsStr,
                materialName: isZh ? matObj.nameZh : matObj.nameEn,
                hollowingName: isZh ? hollowObj.nameZh : hollowObj.nameEn,
                finishName: finishObj ? (isZh ? finishObj.nameZh : finishObj.nameEn) : '24K Mirror Gold',
                baseConfigName: isZh ? baseObj.nameZh : baseObj.nameEn,
                physics: state.lastPhysicsResult,
                shipping: state.lastShippingResult
            };

            const pngDataUrl = await report.generateSpecReportImage(reportData);
            previewImg.src = pngDataUrl;
            if (dialog && typeof dialog.showModal === 'function') {
                dialog.showModal();
            }
        });

        btnCloseModal.addEventListener('click', () => {
            if (dialog) dialog.close('close-button');
        });

        btnDownloadPng.addEventListener('click', () => {
            if (!previewImg.src) return;
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `GoldValley_WineStopper_DFM_Report_${timestamp}.png`;
            link.href = previewImg.src;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});
