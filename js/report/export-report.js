/**
 * WineStopper Physics Lab - High-Resolution DFM & Logistics Report Generator
 * Pure client-side HTML5 Canvas 2D synthesis (1200 x 1600 px) with bilingual EN/ZH & Metric/Imperial support
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WineStopperLab = root.WineStopperLab || {};
        root.WineStopperLab.report = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    /**
     * Generate a 1200x1600 px DFM Engineering & Export Logistics Report PNG
     * @param {Object} reportData
     * @returns {Promise<string>} Base64 PNG DataURL
     */
    async function generateSpecReportImage(reportData) {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1600;
        const ctx = canvas.getContext('2d');
        const isZh = (reportData.lang === 'zh');

        // 1. Deep Navy Blueprint Background
        const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1600);
        bgGrad.addColorStop(0, '#080C14');
        bgGrad.addColorStop(0.5, '#0F172A');
        bgGrad.addColorStop(1, '#080C14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1200, 1600);

        // Engineering grid overlay
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1200; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1600); ctx.stroke();
        }
        for (let y = 0; y < 1600; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
        }

        // 2. Top Brand Header Banner
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(0, 0, 1200, 130);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(1200, 130); ctx.stroke();

        // GV Badge
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.roundRect(50, 32, 64, 64, 12);
        ctx.fill();
        ctx.fillStyle = '#080C14';
        ctx.font = 'bold 30px "Inter", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GV', 82, 75);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 28px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(
            isZh ? 'GOLD VALLEY | 金属红酒塞重心力学与模具 DFM 评估报告' : 'GOLD VALLEY | WINESTOPPER CG & DFM ENGINEERING REPORT',
            134,
            64
        );

        ctx.fillStyle = '#94A3B8';
        ctx.font = '16px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        const dateStr = new Date().toISOString().split('T')[0];
        ctx.fillText(
            isZh
                ? `评估编号: GV-WS-${Math.floor(100000 + Math.random() * 900000)}   |   瓶颈基准: CETIE Ø18.5 mm   |   日期: ${dateStr}`
                : `Ref ID: GV-WS-${Math.floor(100000 + Math.random() * 900000)}   |   Bottleneck Std: CETIE Ø18.5 mm   |   Date: ${dateStr}`,
            134,
            96
        );

        // 3. Left Panel: 3D Viewport Snapshot (520 x 430)
        drawCard(ctx, 50, 165, 520, 430, isZh ? '3D 重心与模具壁厚仿真视图' : '3D CG & CROSS-SECTION SIMULATION');
        if (reportData.viewportDataUrl) {
            try {
                const img = await loadImage(reportData.viewportDataUrl);
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(66, 215, 488, 360, 8);
                ctx.clip();
                ctx.drawImage(img, 66, 215, 488, 360);
                ctx.restore();
            } catch (e) {
                console.warn('Failed to render 3D snapshot:', e);
            }
        }

        // 4. Right Panel: Engineering Input Specs (560 x 430)
        drawCard(ctx, 590, 165, 560, 430, isZh ? '结构与模具工艺输入参数 (DFM Specs)' : 'STRUCTURAL & TOOLING SPECIFICATIONS');

        const specs = [
            [isZh ? '测算通道 (Channel)' : 'Calculation Mode', reportData.modeLabel],
            [isZh ? '顶件外形尺寸 (Top Dims)' : 'Top Ornament Dims', reportData.dimensionsStr],
            [isZh ? '顶件合金材质 (Top Alloy)' : 'Top Metal Alloy', reportData.materialName],
            [isZh ? '模具抽芯掏空率 (Coring)' : 'Core-Pulling Ratio', reportData.hollowingName],
            [isZh ? '电镀表面处理 (Finish)' : 'Plating Finish', reportData.finishName || '24K Mirror Gold'],
            [isZh ? '下部塞体结构 (Base Stem)' : 'Lower Insert Base', reportData.baseConfigName]
        ];

        let specY = 236;
        specs.forEach(([label, val]) => {
            ctx.fillStyle = '#94A3B8';
            ctx.font = '15.5px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.fillText(label, 616, specY);

            ctx.fillStyle = '#F8FAFC';
            ctx.font = 'bold 15.5px "Consolas", "Inter", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(String(val || '').substring(0, 42), 1124, specY);
            ctx.textAlign = 'left';

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(616, specY + 14); ctx.lineTo(1124, specY + 14); ctx.stroke();
            specY += 54;
        });

        // 5. Core Physics & CG Metrics (4 KPI Cards)
        drawCard(ctx, 50, 625, 1100, 205, isZh ? '核心克重、质心高度与抗倾覆力学指标' : 'CORE MASS, CENTER OF GRAVITY & ANTI-TILT METRICS');

        const p = reportData.physics;
        const kpis = [
            {
                title: isZh ? '整塞装配总克重' : 'TOTAL ASSEMBLY MASS',
                val: `${p.totalMassGrams} g`,
                sub: `${p.totalMassOz} oz (Top ${p.topMassGrams}g + Base ${p.baseMassGrams}g)`
            },
            {
                title: isZh ? '组合质心高度 (Z_total)' : 'COMPOSITE CG HEIGHT',
                val: `${p.zTotalMm > 0 ? '+' : ''}${p.zTotalMm} mm`,
                sub: `${p.zTotalIn > 0 ? '+' : ''}${p.zTotalIn}" above bottle rim`
            },
            {
                title: isZh ? '15° 抗倾覆安全系数' : '15° TILT SAFETY FACTOR',
                val: `${p.safetyFactor}×`,
                sub: isZh ? `临界倾角: ${p.criticalAngleDeg}°` : `Critical Tipping Angle: ${p.criticalAngleDeg}°`
            },
            {
                title: isZh ? '综合稳定性评级' : 'STABILITY VERDICT',
                val: p.level,
                sub: p.label,
                color: p.level === 'STABLE' ? '#10B981' : (p.level === 'MARGINAL' ? '#F59E0B' : '#EF4444')
            }
        ];

        kpis.forEach((k, idx) => {
            const kx = 76 + idx * 266;
            const ky = 682;

            ctx.fillStyle = 'rgba(11, 19, 43, 0.85)';
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.30)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(kx, ky, 248, 125, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#94A3B8';
            ctx.font = 'bold 13px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.fillText(k.title, kx + 16, ky + 28);

            ctx.fillStyle = k.color || '#38BDF8';
            ctx.font = 'bold 26px "Consolas", monospace';
            ctx.fillText(k.val, kx + 16, ky + 70);

            ctx.fillStyle = '#CBD5E1';
            ctx.font = '12.5px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.fillText(String(k.sub).substring(0, 34), kx + 16, ky + 102);
        });

        // 6. Factory DFM Diagnosis & Actionable Recommendations
        drawCard(ctx, 50, 855, 1100, 275, isZh ? '金瓒模具车间 DFM 结构诊断与优化建议' : 'FACTORY DFM DIAGNOSIS & MOLDING RECOMMENDATIONS');

        let statusColor = '#10B981';
        if (p.level === 'MARGINAL') statusColor = '#F59E0B';
        if (p.level === 'HIGH_RISK') statusColor = '#EF4444';

        ctx.fillStyle = statusColor;
        ctx.font = 'bold 19px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(`● ${p.label}`, 80, 922);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '15px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        let curY = wrapText(ctx, p.summary, 80, 952, 1040, 23);

        curY += 8;
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '14.5px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        (p.dfmRecommendations || []).forEach((rec, i) => {
            curY = wrapText(ctx, `${i + 1}. ${rec}`, 80, curY, 1040, 22);
            curY += 4;
        });

        // 7. B2B Export Carton & Freight Estimation
        drawCard(ctx, 50, 1155, 1100, 240, isZh ? 'B2B 外贸防爆箱装箱规格与海空运费测算 (≤18.0 kg / 39.7 lbs)' : 'B2B EXPORT CARTON PACKING & FREIGHT ESTIMATION (≤18.0 kg / 39.7 lbs)');

        const s = reportData.shipping;
        const shipCols = isZh
            ? [
                { label: `采购批量 (${s.orderQty} pcs)`, val: `${s.totalCartons} 箱 (${s.maxPiecesPerCarton} pcs/箱)` },
                { label: '整单预估总毛重 (Gross Wt)', val: `${s.totalGrossWeightKg} kg (${s.totalGrossWeightLbs} lbs)` },
                { label: '单箱均重 & 总体积', val: `${s.grossWeightPerCartonKg} kg/箱 | ${s.totalVolumeCbm} CBM` },
                { label: '空运快递 vs 海运专线预估', val: `~$${s.estimatedAirCourierUsd} vs ~$${s.estimatedOceanLclUsd}` }
            ]
            : [
                { label: `Order Qty (${s.orderQty} pcs)`, val: `${s.totalCartons} Ctns (${s.maxPiecesPerCarton} pcs/ctn)` },
                { label: 'Total Gross Weight', val: `${s.totalGrossWeightKg} kg (${s.totalGrossWeightLbs} lbs)` },
                { label: 'Carton Avg & Volume', val: `${s.grossWeightPerCartonKg} kg/ctn | ${s.totalVolumeCbm} CBM` },
                { label: 'Air Express vs DDP Sea', val: `~$${s.estimatedAirCourierUsd} vs ~$${s.estimatedOceanLclUsd}` }
            ];

        shipCols.forEach((sc, idx) => {
            const sx = 80 + idx * 265;
            const sy = 1222;
            ctx.fillStyle = '#94A3B8';
            ctx.font = '13.5px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.fillText(sc.label, sx, sy);

            ctx.fillStyle = '#38BDF8';
            ctx.font = 'bold 18px "Consolas", "Inter", "Microsoft YaHei", sans-serif';
            ctx.fillText(sc.val, sx, sy + 28);
        });

        ctx.fillStyle = '#CBD5E1';
        ctx.font = '14.5px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        wrapText(ctx, s.logisticsTip || '', 80, 1298, 1040, 22);

        // 8. Bottom Factory Verification & Contact Footer
        ctx.fillStyle = '#060A12';
        ctx.fillRect(0, 1430, 1200, 170);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 1430); ctx.lineTo(1200, 1430); ctx.stroke();

        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 20px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('Gold Valley Industrial Gifts Co., Ltd. (金瓒五金工艺制品厂)', 50, 1475);

        ctx.fillStyle = '#FBBF24';
        ctx.font = '15.5px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(
            isZh
                ? 'OEM/ODM 精密锌合金压铸与酒具工程源头工厂  |  FDA / LFGB 食品级硅胶与 72h 盐雾测试认证'
                : 'Direct OEM/ODM Zinc Die-Casting & Barware Factory  |  FDA / LFGB Food-Contact & 72h Salt-Spray Certified',
            50,
            1508
        );

        ctx.fillStyle = '#94A3B8';
        ctx.font = '14.5px "Consolas", "Inter", sans-serif';
        ctx.fillText('Web: https://www.goldvalleyltd.com   |   Email: paula@goldvalleyltd.com', 50, 1540);
        ctx.fillText('Catalogs: /wine-barware/wine-stoppers/  •  /news/why-anti-slip-rings-matter-in-metal-wine-stoppers/', 50, 1568);

        // Official Stamp
        ctx.save();
        ctx.translate(1030, 1510);
        ctx.rotate(-0.12);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.78)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-115, -40, 230, 80, 8);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.88)';
        ctx.font = 'bold 16px "Consolas", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GOLD VALLEY LAB', 0, -8);
        ctx.font = 'bold 13px "Consolas", monospace';
        ctx.fillText('DFM VERIFIED SPEC', 0, 18);
        ctx.restore();

        return canvas.toDataURL('image/png');
    }

    function drawCard(ctx, x, y, w, h, title) {
        ctx.fillStyle = 'rgba(17, 24, 39, 0.90)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, 40, [14, 14, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 14.5px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, x + 20, y + 26);
    }

    /**
     * Word-boundary + CJK aware text wrapper
     */
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        if (!text) return y;
        const tokens = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]|[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\s]+\s*|\s+/g) || [text];
        let line = '';
        let curY = y;

        for (let i = 0; i < tokens.length; i++) {
            const testLine = line + tokens[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line.trim().length > 0) {
                ctx.fillText(line.trimEnd(), x, curY);
                line = tokens[i].trimStart();
                curY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line.trim().length > 0) {
            ctx.fillText(line.trimEnd(), x, curY);
            curY += lineHeight;
        }
        return curY;
    }

    function loadImage(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = dataUrl;
        });
    }

    return {
        generateSpecReportImage
    };
}));
