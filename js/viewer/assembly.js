/**
 * WineStopper Physics Lab - Assembly & Animation Manager (Factory Exact Edition)
 * 1:1 严格复刻金瓒工艺实物红酒塞工程结构：
 * 1. 上部外露金属圆台 (Upper Collar): 顶粗底微细，坐落于瓶口截面之上 (Z: 0 ~ +16mm)
 * 2. 中部食品级硅胶密封套: 6 层超薄渐进阶梯弹性肋片咬合瓶颈 (Z: 0 ~ -18mm)
 * 3. 底部修长实心金属锥针 (Bottom Spike): 长达 38mm 的细长尖针深入瓶底充当压舱石 (Z: -18 ~ -56mm)
 * 4. 顶部立体圆雕: 严丝合缝生根于上部金属圆台之上，呈现大师级五金压铸质感
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WineStopperLab = root.WineStopperLab || {};
        root.WineStopperLab.assembly = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // 奢华五金真金属电镀色标 (校准为高档拉丝真金与镜面亮铬)
    const FINISH_MATERIALS = {
        'gold': {
            color: 0xD4AF37,
            metalness: 0.88,
            roughness: 0.16,
            name: '24K Mirror Gold Plating',
            nameEn: '24K Mirror Gold Plating',
            nameZh: '24K 真金镜面抛光电镀'
        },
        'chrome': {
            color: 0xF8FAFC,
            metalness: 0.95,
            roughness: 0.10,
            name: 'Bright Nickel / Mirror Chrome',
            nameEn: 'Bright Nickel / Mirror Chrome',
            nameZh: '镜面亮镍 / 白铬色'
        },
        'bronze': {
            color: 0xA16207,
            metalness: 0.82,
            roughness: 0.30,
            name: 'Antique Brushed Bronze',
            nameEn: 'Antique Brushed Bronze',
            nameZh: '复古拉丝古青铜'
        },
        'black': {
            color: 0x1E293B,
            metalness: 0.86,
            roughness: 0.24,
            name: 'Satin Gunmetal / Black Nickel',
            nameEn: 'Satin Gunmetal / Black Nickel',
            nameZh: '高档哑光枪黑拉丝'
        }
    };

    class StopperAssembly {
        constructor(sceneManager) {
            this.sceneManager = sceneManager;
            this.group = sceneManager.modelGroup;

            this.currentFinish = 'gold';
            this.isWireframe = false;

            this.topMesh = null;
            this.upperCollarMesh = null;
            this.siliconeMesh = null;
            this.bottomSpikeMesh = null;
            this.centroidMarker = null;
            this.dimensionLineGroup = null;

            this.isAnimatingWobble = false;
            this.wobbleStartTime = 0;
            this.wobbleAmplitude = 0.24;
            this.wobbleDamping = 3.5;

            this.initStaticComponents();
            this.initDimensionLeader();
        }

        /**
         * 严格对照金瓒工厂实拍图构建三段式精密塞体
         */
        initStaticComponents() {
            const mat = this.createMetalMaterial(this.currentFinish);

            // =========================================================================
            // 构件 1：上部外露金属倒锥台 (Upper Metal Collar)
            // 位于瓶口截面以上 (Y: 0 ~ +16mm)
            // 顶端直径 22.4mm (半径 11.2mm), 底部直径 18.0mm (半径 9.0mm), 高度 16.0mm
            // 单一精细连续倒圆台，彻底根除内部几何体重合共面引起的 Z-fighting 闪烁
            const collarGeo = new THREE.CylinderGeometry(11.2, 9.0, 16.0, 48);
            collarGeo.translate(0, 8.0, 0); // 底部严格对齐 Y = 0 (瓶口接触基准面)
            this.upperCollarMesh = new THREE.Mesh(collarGeo, mat);
            this.upperCollarMesh.castShadow = true;
            this.upperCollarMesh.receiveShadow = true;
            this.group.add(this.upperCollarMesh);

            // =========================================================================
            // 构件 2：中部食品级硅胶密封圈 (Silicone Sleeve with 6 Thin Fins)
            // 位于瓶口截面以下 (Y: 0 ~ -18mm)
            // 实拍图特征：套在中轴上的黑色硅胶套，带有 6 层极薄、微带弧度、渐进收窄的阶梯肋片
            // =========================================================================
            const siliconeGroup = new THREE.Group();
            const siliconeMat = new THREE.MeshStandardMaterial({
                color: 0x0F172A, // 纯正深色食品级防滑硅胶
                roughness: 0.60,
                metalness: 0.05
            });

            // 硅胶内套主体柱 (上外径 15mm, 下外径 11mm, 长 18mm)
            const sleeveCoreGeo = new THREE.CylinderGeometry(7.5, 5.5, 18.0, 36);
            sleeveCoreGeo.translate(0, -9.0, 0);
            const sleeveCoreMesh = new THREE.Mesh(sleeveCoreGeo, siliconeMat);
            siliconeGroup.add(sleeveCoreMesh);

            // 6 层薄阶梯弹性肋片 (厚度仅 0.8mm，外径由上到下渐进收窄：20.0 -> 17.5mm)
            const finCount = 6;
            const topFinRadius = 10.0; // 直径 20.0mm
            const btmFinRadius = 8.75; // 直径 17.5mm
            const finThickness = 0.85;
            const startY = -2.2;
            const stepY = 2.6;

            for (let i = 0; i < finCount; i++) {
                const curY = startY - i * stepY;
                const curRadius = topFinRadius - (i / (finCount - 1)) * (topFinRadius - btmFinRadius);
                
                // 薄圆台肋片 (微向下倾斜 15°，模拟插入瓶口时的形变受力感)
                const finGeo = new THREE.CylinderGeometry(curRadius, curRadius * 0.96, finThickness, 36);
                const finMesh = new THREE.Mesh(finGeo, siliconeMat);
                finMesh.position.y = curY;
                siliconeGroup.add(finMesh);
            }

            this.siliconeMesh = siliconeGroup;
            this.group.add(this.siliconeMesh);

            // =========================================================================
            // 构件 3：底部修长尖锐金属锥针 (Bottom Slender Tapered Metal Spike)
            // 位于硅胶圈下方 (Y: -18mm ~ -56mm，长达 38mm！)
            // 实拍图特征：修长优雅的倒圆锥针，下部收缩为钝圆尖头，不仅易插入，更是降低重心的关键压舱构件
            // =========================================================================
            const spikeGeo = new THREE.CylinderGeometry(5.4, 1.4, 38.0, 36);
            spikeGeo.translate(0, -37.0, 0); // 顶接 Y = -18mm，底端延伸至 Y = -56mm
            this.bottomSpikeMesh = new THREE.Mesh(spikeGeo, mat);
            this.bottomSpikeMesh.castShadow = true;
            this.bottomSpikeMesh.receiveShadow = true;
            this.group.add(this.bottomSpikeMesh);

            // 尖端钝化倒角球
            const spikeTipGeo = new THREE.SphereGeometry(1.4, 16, 16);
            spikeTipGeo.translate(0, -56.0, 0);
            const spikeTipMesh = new THREE.Mesh(spikeTipGeo, mat);
            this.bottomSpikeMesh.add(spikeTipMesh);

            // =========================================================================
            // 构件 4：质心脉冲红光指示球与光晕
            // =========================================================================
            const markerGroup = new THREE.Group();
            const sphereGeo = new THREE.SphereGeometry(2.2, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
            const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
            markerGroup.add(sphereMesh);

            const haloGeo = new THREE.RingGeometry(2.6, 4.4, 24);
            const haloMat = new THREE.MeshBasicMaterial({
                color: 0xEF4444,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.75
            });
            const haloMesh = new THREE.Mesh(haloGeo, haloMat);
            haloMesh.rotation.x = Math.PI / 2;
            markerGroup.add(haloMesh);

            this.centroidMarker = markerGroup;
            this.centroidMarker.position.set(0, 10, 0);
            this.group.add(this.centroidMarker);
        }

        /**
         * 质心与 Z=0 瓶口基准面的动态 CAD 尺寸标注系统 (CAD Dimension Callout)
         * 直观展示：从内部重心高度到瓶口受力面的机械制图引线与实时数值
         */
        initDimensionLeader() {
            this.dimensionLineGroup = new THREE.Group();

            const lineMat = new THREE.LineDashedMaterial({
                color: 0xFCD34D,
                dashSize: 1.8,
                gapSize: 1.2,
                linewidth: 2,
                transparent: true,
                opacity: 0.9
            });

            // 垂直主尺寸线
            const points = [
                new THREE.Vector3(22, 0, 0),
                new THREE.Vector3(22, 15, 0)
            ];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            this.dimensionLine = new THREE.Line(lineGeo, lineMat);
            this.dimensionLine.computeLineDistances();
            this.dimensionLineGroup.add(this.dimensionLine);

            const solidMat = new THREE.LineBasicMaterial({
                color: 0xFCD34D,
                transparent: true,
                opacity: 0.75
            });

            // 顶部与底部尺寸界线 (Extension Ticks)
            const tickBottomGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(18, 0, 0), new THREE.Vector3(26, 0, 0)]);
            const tickTopGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(18, 15, 0), new THREE.Vector3(26, 15, 0)]);
            this.tickBottom = new THREE.Line(tickBottomGeo, solidMat);
            this.tickTop = new THREE.Line(tickTopGeo, solidMat);
            this.dimensionLineGroup.add(this.tickBottom);
            this.dimensionLineGroup.add(this.tickTop);

            // 从中心轴质心向外引出的水平投影辅助线 (从内部球体连出，消除悬空感)
            const projMat = new THREE.LineDashedMaterial({
                color: 0xF59E0B,
                dashSize: 1.2,
                gapSize: 1.0,
                transparent: true,
                opacity: 0.5
            });
            const projTopGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 15, 0), new THREE.Vector3(22, 15, 0)]);
            this.projLineTop = new THREE.Line(projTopGeo, projMat);
            this.projLineTop.computeLineDistances();
            this.dimensionLineGroup.add(this.projLineTop);

            // 动态 Canvas 2D 悬浮数值标签 (Billboard Sprite，随视角自动正对观众)
            this.dimensionCanvas = document.createElement('canvas');
            this.dimensionCanvas.width = 400;
            this.dimensionCanvas.height = 72;
            this.dimensionTexture = new THREE.CanvasTexture(this.dimensionCanvas);
            this.dimensionTexture.minFilter = THREE.LinearFilter;

            const spriteMat = new THREE.SpriteMaterial({
                map: this.dimensionTexture,
                transparent: true,
                depthTest: false
            });
            this.dimensionSprite = new THREE.Sprite(spriteMat);
            this.dimensionSprite.scale.set(27, 5.0, 1);
            this.dimensionSprite.position.set(38, 7.5, 0);
            this.dimensionLineGroup.add(this.dimensionSprite);

            this.updateDimensionLabel(4.86);

            this.group.add(this.dimensionLineGroup);
        }

        /**
         * 绘制工业胶囊风格的 CAD 尺寸标注文字 (公英制双显)
         */
        updateDimensionLabel(zMm) {
            if (!this.dimensionCanvas) return;
            const ctx = this.dimensionCanvas.getContext('2d');
            ctx.clearRect(0, 0, 400, 72);

            // 科技感半透明圆角胶囊背景
            ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
            ctx.strokeStyle = '#FCD34D';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(4, 4, 392, 64, 14);
            ctx.fill();
            ctx.stroke();

            // 尺寸数值 (mm + in)
            ctx.fillStyle = '#FCD34D';
            ctx.font = 'bold 21px "JetBrains Mono", Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const numZ = Number(zMm) || 0;
            const sign = numZ > 0 ? '+' : '';
            const zIn = (numZ / 25.4).toFixed(2);
            ctx.fillText(`Z_cg: ${sign}${numZ.toFixed(1)}mm (${sign}${zIn}")`, 200, 36);

            if (this.dimensionTexture) {
                this.dimensionTexture.needsUpdate = true;
            }
        }

        createMetalMaterial(finishKey) {
            const finish = FINISH_MATERIALS[finishKey] || FINISH_MATERIALS['gold'];
            return new THREE.MeshStandardMaterial({
                color: finish.color,
                metalness: finish.metalness,
                roughness: finish.roughness,
                wireframe: this.isWireframe,
                side: THREE.DoubleSide
            });
        }

        setFinish(finishKey) {
            this.currentFinish = finishKey;
            const newMat = this.createMetalMaterial(finishKey);

            // 深度递归遍历更新所有金属构件，杜绝任何子组件材质残留脱节
            const updateMeshMaterial = (targetGroup) => {
                if (!targetGroup) return;
                if (targetGroup.isMesh) {
                    targetGroup.material = newMat;
                }
                if (targetGroup.traverse) {
                    targetGroup.traverse(child => {
                        if (child.isMesh) child.material = newMat;
                    });
                }
            };

            updateMeshMaterial(this.upperCollarMesh);
            updateMeshMaterial(this.bottomSpikeMesh);
            updateMeshMaterial(this.topMesh);
        }

        toggleWireframe() {
            this.isWireframe = !this.isWireframe;
            this.setFinish(this.currentFinish);
            return this.isWireframe;
        }

        /**
         * 沿 3D 样条曲线生成自然有机粗细渐变的鹿角管道
         */
        createTaperedTube(pointsArray, rootRadius, tipRadius, mat) {
            const vectors = pointsArray.map(p => new THREE.Vector3(p[0], p[1], p[2]));
            const curve = new THREE.CatmullRomCurve3(vectors);
            const segments = 24;
            const radialSegments = 10;
            const tubeGeo = new THREE.TubeGeometry(curve, segments, rootRadius, radialSegments, false);

            const pos = tubeGeo.attributes.position;
            for (let i = 0; i <= segments; i++) {
                const factor = 1.0 - (i / segments) * (1.0 - tipRadius / rootRadius);
                const t = i / segments;
                const center = curve.getPointAt(t);

                for (let j = 0; j <= radialSegments; j++) {
                    const vertexIndex = i * (radialSegments + 1) + j;
                    if (vertexIndex < pos.count) {
                        let vx = pos.getX(vertexIndex);
                        let vy = pos.getY(vertexIndex);
                        let vz = pos.getZ(vertexIndex);

                        vx = center.x + (vx - center.x) * factor;
                        vy = center.y + (vy - center.y) * factor;
                        vz = center.z + (vz - center.z) * factor;

                        pos.setXYZ(vertexIndex, vx, vy, vz);
                    }
                }
            }

            tubeGeo.computeVertexNormals();
            return new THREE.Mesh(tubeGeo, mat);
        }

        /**
         * 构建大师级立体圆雕造型（严丝合缝生根于 Upper Collar 顶面 Y = 16mm 之上）
         */
        updateProceduralTop(shapeType, lMm, wMm, hMm) {
            if (this.topMesh) {
                this.group.remove(this.topMesh);
                this.topMesh = null;
            }

            const group = new THREE.Group();
            const mat = this.createMetalMaterial(this.currentFinish);

            // 基底起始高度对齐在上部金属圆台顶面 Y = 16.0mm
            const startY = 16.0;

            if (shapeType === 'geometric') {
                // 切面几何水晶球 / 多面体（带底部衔接柱座）
                const pedestalGeo = new THREE.CylinderGeometry(10.5, 9.5, 4.0, 32);
                pedestalGeo.translate(0, startY + 2.0, 0);
                group.add(new THREE.Mesh(pedestalGeo, mat));

                const crystalGeo = new THREE.DodecahedronGeometry(1.0, 1);
                crystalGeo.scale(lMm * 0.46, Math.max(10, hMm - 4) * 0.48, wMm * 0.46);
                crystalGeo.translate(0, startY + 4.0 + Math.max(10, hMm - 4) * 0.46, 0);
                group.add(new THREE.Mesh(crystalGeo, mat));

            } else if (shapeType === 'crest') {
                // 直立式双面酒庄盾徽 / 纪念章式顶件（正面朝向 +Z 观察视角）
                const radius = Math.min(lMm, hMm) * 0.45;
                const centerY = startY + radius + 3.0;
                const rimThickness = Math.max(4.5, Math.min(wMm * 0.72, 16.0));
                const coreThickness = Math.max(rimThickness + 2.0, Math.min(wMm, 18.0));

                // 衔接底座支柱
                const neckGeo = new THREE.CylinderGeometry(7.2, 9.5, 6.0, 32);
                neckGeo.translate(0, startY + 3.0, 0);
                group.add(new THREE.Mesh(neckGeo, mat));

                // 外圈纪念章边框 (面向 +Z 轴)
                const rimGeo = new THREE.CylinderGeometry(radius, radius, rimThickness, 48);
                rimGeo.rotateX(Math.PI / 2);
                rimGeo.translate(0, centerY, 0);
                group.add(new THREE.Mesh(rimGeo, mat));

                // 双面立体六角盾徽浮点浮雕
                const shieldGeo = new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, coreThickness, 6);
                shieldGeo.rotateX(Math.PI / 2);
                shieldGeo.translate(0, centerY, 0);
                group.add(new THREE.Mesh(shieldGeo, mat));

                // 顶冠宝石凸起装饰
                const finialGeo = new THREE.SphereGeometry(Math.max(2.6, radius * 0.14), 16, 16);
                finialGeo.translate(0, centerY + radius + 1.2, 0);
                group.add(new THREE.Mesh(finialGeo, mat));

            } else if (shapeType === 'column') {
                // 实心柱状 / CNC 威士忌 T 型平顶塞头
                const collarAdapterGeo = new THREE.CylinderGeometry(11.0, 9.5, 5.0, 40);
                collarAdapterGeo.translate(0, startY + 2.5, 0);
                group.add(new THREE.Mesh(collarAdapterGeo, mat));

                const capHeight = Math.max(14.0, hMm - 5.0);
                if (lMm >= wMm * 1.35) {
                    // T 型横木酒塞头 (Bourbon T-Top)
                    const stemGeo = new THREE.CylinderGeometry(9.0, 10.5, capHeight * 0.45, 36);
                    stemGeo.translate(0, startY + 5.0 + capHeight * 0.225, 0);
                    group.add(new THREE.Mesh(stemGeo, mat));

                    const barRadius = Math.max(7.5, Math.min(wMm * 0.45, capHeight * 0.35));
                    const barLen = Math.max(24.0, lMm - barRadius * 2);
                    const barGeo = new THREE.CylinderGeometry(barRadius, barRadius, barLen, 36);
                    barGeo.rotateZ(Math.PI / 2);
                    barGeo.translate(0, startY + 5.0 + capHeight * 0.65, 0);
                    group.add(new THREE.Mesh(barGeo, mat));

                    // 两端半球封口
                    const endCapGeo = new THREE.SphereGeometry(barRadius, 24, 24);
                    const leftEnd = new THREE.Mesh(endCapGeo, mat);
                    leftEnd.position.set(-barLen / 2, startY + 5.0 + capHeight * 0.65, 0);
                    group.add(leftEnd);

                    const rightEnd = new THREE.Mesh(endCapGeo, mat);
                    rightEnd.position.set(barLen / 2, startY + 5.0 + capHeight * 0.65, 0);
                    group.add(rightEnd);
                } else {
                    // 圆柱体 / 橡木桶式倒角柱头
                    const radius = Math.min(lMm, wMm) * 0.46;
                    const bodyH = Math.max(10.0, capHeight - 4.0);
                    const barrelGeo = new THREE.CylinderGeometry(radius, radius * 0.9, bodyH, 48);
                    barrelGeo.translate(0, startY + 5.0 + bodyH * 0.5, 0);
                    group.add(new THREE.Mesh(barrelGeo, mat));

                    const chamferTopGeo = new THREE.CylinderGeometry(radius * 0.84, radius, 4.0, 48);
                    chamferTopGeo.translate(0, startY + 5.0 + bodyH + 2.0, 0);
                    group.add(new THREE.Mesh(chamferTopGeo, mat));
                }

            } else {
                // 经典公鹿兽首圆雕 (生根于金属倒锥台之上)
                const stagGroup = new THREE.Group();

                // 1. 挺拔强壮的鹿颈肌肉管体 (下径 10mm 牢固生根在 Upper Collar 上)
                const neckCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 7, 2),
                    new THREE.Vector3(0, 16, 5)
                ]);
                const neckGeo = new THREE.TubeGeometry(neckCurve, 16, 6.0, 18, false);
                stagGroup.add(new THREE.Mesh(neckGeo, mat));

                // 2. 额颅脑门
                const craniumGeo = new THREE.SphereGeometry(8.0, 20, 20);
                craniumGeo.scale(0.9, 1.0, 1.25);
                craniumGeo.translate(0, 20, 6);
                stagGroup.add(new THREE.Mesh(craniumGeo, mat));

                // 3. 优雅前伸的鹿口吻部
                const muzzleCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(0, 20, 10),
                    new THREE.Vector3(0, 16, 17),
                    new THREE.Vector3(0, 13, 23) // 鼻尖
                ]);
                const muzzleGeo = new THREE.TubeGeometry(muzzleCurve, 14, 4.0, 16, false);
                stagGroup.add(new THREE.Mesh(muzzleGeo, mat));

                // 下颌肌肉
                const jawGeo = new THREE.SphereGeometry(3.8, 16, 16);
                jawGeo.scale(1.1, 0.8, 1.4);
                jawGeo.translate(0, 13, 13);
                stagGroup.add(new THREE.Mesh(jawGeo, mat));

                // 4. 双耳 (斜向后上方自然扬起)
                const earGeo = new THREE.ConeGeometry(2.6, 9.0, 14);
                earGeo.scale(1.2, 1.0, 0.5);

                const earL = new THREE.Mesh(earGeo, mat);
                earL.position.set(-7.0, 23, 3.5);
                earL.rotation.set(-Math.PI / 6, 0, Math.PI / 3);
                stagGroup.add(earL);

                const earR = new THREE.Mesh(earGeo, mat);
                earR.position.set(7.0, 23, 3.5);
                earR.rotation.set(-Math.PI / 6, 0, -Math.PI / 3);
                stagGroup.add(earR);

                // 5. 鹿角体系 (Tube CatmullRom 样条构建)
                const leftMainPts = [
                    [-3.5, 24, 6],
                    [-10, 30, 7],
                    [-17, 39, 6],
                    [-21, 50, 2],
                    [-18, 60, -2],
                    [-11, 66, -4]
                ];
                stagGroup.add(this.createTaperedTube(leftMainPts, 2.5, 0.8, mat));

                const leftBrowPts = [
                    [-7.5, 28, 6.5],
                    [-12, 34, 12],
                    [-14, 40, 16]
                ];
                stagGroup.add(this.createTaperedTube(leftBrowPts, 1.8, 0.6, mat));

                const leftMidPts = [
                    [-15, 38, 6],
                    [-24, 44, 8],
                    [-28, 50, 10]
                ];
                stagGroup.add(this.createTaperedTube(leftMidPts, 1.8, 0.6, mat));

                const leftTopPts = [
                    [-20, 53, 1],
                    [-22, 58, -5],
                    [-20, 62, -8]
                ];
                stagGroup.add(this.createTaperedTube(leftTopPts, 1.5, 0.5, mat));

                // 镜像右角
                const rightMainPts = leftMainPts.map(p => [-p[0], p[1], p[2]]);
                stagGroup.add(this.createTaperedTube(rightMainPts, 2.5, 0.8, mat));

                const rightBrowPts = leftBrowPts.map(p => [-p[0], p[1], p[2]]);
                stagGroup.add(this.createTaperedTube(rightBrowPts, 1.8, 0.6, mat));

                const rightMidPts = leftMidPts.map(p => [-p[0], p[1], p[2]]);
                stagGroup.add(this.createTaperedTube(rightMidPts, 1.8, 0.6, mat));

                const rightTopPts = leftTopPts.map(p => [-p[0], p[1], p[2]]);
                stagGroup.add(this.createTaperedTube(rightTopPts, 1.5, 0.5, mat));

                // 鹿首基础坐标自然跨度约为 L=56mm (-28~+28), H=66mm (0~66), W=36mm
                const stagScaleX = lMm / 56.0;
                const stagScaleY = hMm / 66.0;
                const stagScaleZ = wMm / 36.0;
                stagGroup.scale.set(stagScaleX, stagScaleY, stagScaleZ);
                stagGroup.position.y = startY;
                group.add(stagGroup);
            }

            group.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.topMesh = group;
            this.group.add(this.topMesh);
        }

        /**
         * 载入外部 STL / OBJ 真实网格
         */
        loadCustomMesh(positions, bounds) {
            if (this.topMesh) {
                this.group.remove(this.topMesh);
                this.topMesh = null;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.computeVertexNormals();

            const minY = bounds.min.y;
            const midX = (bounds.min.x + bounds.max.x) / 2.0;
            const midZ = (bounds.min.z + bounds.max.z) / 2.0;
            // 真实网格底部严格对齐在 Upper Collar 顶面 Y = 16.0mm
            geo.translate(-midX, -minY + 16.0, -midZ);

            const mat = this.createMetalMaterial(this.currentFinish);
            this.topMesh = new THREE.Mesh(geo, mat);
            this.topMesh.castShadow = true;
            this.topMesh.receiveShadow = true;
            this.group.add(this.topMesh);
        }

        /**
         * 实时更新质心小球位置与 CAD 尺寸标注系统
         */
        updateCentroidMarker(zCentroidMm) {
            if (this.centroidMarker) {
                this.centroidMarker.position.y = zCentroidMm;
            }

            if (this.dimensionLineGroup) {
                const targetZ = Math.max(0.5, zCentroidMm);

                // 更新竖直主尺寸线
                const points = [
                    new THREE.Vector3(22, 0, 0),
                    new THREE.Vector3(22, targetZ, 0)
                ];
                this.dimensionLine.geometry.setFromPoints(points);
                this.dimensionLine.computeLineDistances();

                // 更新上下界线
                this.tickBottom.position.set(0, 0, 0);
                this.tickTop.position.set(0, targetZ, 0);

                // 更新从中心轴质心向外引出的水平投影线
                if (this.projLineTop) {
                    const projPts = [
                        new THREE.Vector3(0, targetZ, 0),
                        new THREE.Vector3(22, targetZ, 0)
                    ];
                    this.projLineTop.geometry.setFromPoints(projPts);
                    this.projLineTop.computeLineDistances();
                }

                // 悬浮文字标签定位在标尺垂直中点右侧
                if (this.dimensionSprite) {
                    this.dimensionSprite.position.set(38, targetZ / 2, 0);
                }

                // 刷新 Canvas 尺寸数字
                this.updateDimensionLabel(zCentroidMm);
            }
        }

        /**
         * 自然物理倾斜摇摆测试
         */
        triggerWobbleTest(stabilityLevel) {
            if (this.isAnimatingWobble) return;
            this.isAnimatingWobble = true;
            this.wobbleStartTime = performance.now();

            if (stabilityLevel === 'HIGH_RISK') {
                this.wobbleDamping = 1.3;
                this.wobbleAmplitude = 0.32;
            } else if (stabilityLevel === 'MARGINAL') {
                this.wobbleDamping = 2.4;
                this.wobbleAmplitude = 0.22;
            } else {
                this.wobbleDamping = 4.6;
                this.wobbleAmplitude = 0.15;
            }

            const animateWobble = (now) => {
                const elapsedSec = (now - this.wobbleStartTime) / 1000.0;
                const omega = 11.5;
                const decay = Math.exp(-this.wobbleDamping * elapsedSec);

                const angleZ = this.wobbleAmplitude * decay * Math.cos(omega * elapsedSec);
                const angleX = (this.wobbleAmplitude * 0.32) * decay * Math.sin(omega * elapsedSec);

                this.group.rotation.z = angleZ;
                this.group.rotation.x = angleX;

                if (elapsedSec < 2.8 && (Math.abs(angleZ) > 0.002 || Math.abs(angleX) > 0.002)) {
                    requestAnimationFrame(animateWobble);
                } else {
                    this.group.rotation.z = 0;
                    this.group.rotation.x = 0;
                    this.isAnimatingWobble = false;
                }
            };

            requestAnimationFrame(animateWobble);
        }
    }

    return {
        StopperAssembly,
        FINISH_MATERIALS
    };
}));
