/**
 * WineStopper Physics Lab - Three.js Scene & Lighting Manager (Enhanced)
 * 工业五金暗黑科技风 3D 视窗、剖切透视 (Clipping)、动态瓶口口径与交互控制
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WineStopperLab = root.WineStopperLab || {};
        root.WineStopperLab.scene = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    class LabScene {
        constructor(containerElement) {
            this.container = containerElement;
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.modelGroup = null;
            this.bottleGroup = null;
            this.bottleMesh = null;
            this.bottleRingMesh = null;
            this.animationId = null;

            // 剖切平面 (沿着 Z 轴正向剖切，只显示 X >= 0 的半边模型以查看内部)
            this.clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
            this.isClippingEnabled = false;

            this.init();
        }

        init() {
            if (typeof THREE === 'undefined') {
                console.error("Three.js not found! Please check script tags.");
                return;
            }

            const width = this.container.clientWidth || 600;
            const height = this.container.clientHeight || 450;

            // 1. 场景
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x080C14); // 深邃科技黑蓝

            // 2. 相机 (适配全长红酒塞黄金观察视角)
            this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
            this.camera.position.set(0, 22, 165);

            // 3. 渲染器 (开启局部剖切支持与高精对数深度缓冲，彻底绝杀 Z-Fighting 共面闪烁)
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true, 
                preserveDrawingBuffer: true,
                logarithmicDepthBuffer: true
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.18;
            this.renderer.localClippingEnabled = true;

            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);

            // 4. 轨道控制器
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.maxPolarAngle = Math.PI / 2 + 0.25;
                this.controls.minDistance = 40;
                this.controls.maxDistance = 350;
                this.controls.target.set(0, 5, 0);
            }

            // 5. 摄影棚级五金 PBR 掠光照明与环境反射贴图
            this.setupLighting();
            this.setupStudioEnvironment();

            // 6. 辅助环境与半透明瓶颈
            this.setupEnvironment();

            // 7. 模型总装配分组
            this.modelGroup = new THREE.Group();
            this.scene.add(this.modelGroup);

            // 8. 窗口尺寸自适应
            window.addEventListener('resize', () => this.onWindowResize());

            // 9. 启动渲染循环
            this.animate = this.animate.bind(this);
            this.animate();
        }

        setupLighting() {
            // 基础环境天光 (中性灰，不偏色)
            const ambientLight = new THREE.AmbientLight(0x475569, 0.9);
            this.scene.add(ambientLight);

            // 主掠光 (纯正摄影棚冷白柔光箱，打出金属顶面与正面锐利高光)
            const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.4);
            keyLight.position.set(45, 85, 65);
            keyLight.castShadow = true;
            this.scene.add(keyLight);

            // 侧部补光 (温和浅暖白，柔和暗部阴影，不产生色相偏移)
            const fillLight = new THREE.DirectionalLight(0xFFFBEB, 1.2);
            fillLight.position.set(-50, 35, 45);
            this.scene.add(fillLight);

            // 顶部后侧背光/轮廓光 (纯净银白，专门用于勾勒多叉鹿角尖端晶莹倒角)
            const rimLight = new THREE.DirectionalLight(0xF8FAFC, 1.5);
            rimLight.position.set(0, 75, -55);
            this.scene.add(rimLight);
        }

        /**
         * 程序化生成高对比五金摄影棚 HDR 环境反射贴图 (Studio Softbox Environment)
         * 让 24K 真金、镜面白铬、拉丝古铜与枪黑呈现出真实的金属镜面高光反射
         */
        setupStudioEnvironment() {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
                bgGrad.addColorStop(0, '#0f172a');
                bgGrad.addColorStop(0.45, '#1e293b');
                bgGrad.addColorStop(0.5, '#090d16');
                bgGrad.addColorStop(1, '#020617');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, 512, 256);

                const softboxTop = ctx.createRadialGradient(256, 38, 5, 256, 38, 120);
                softboxTop.addColorStop(0, '#ffffff');
                softboxTop.addColorStop(0.55, '#64748b');
                softboxTop.addColorStop(1, 'transparent');
                ctx.fillStyle = softboxTop;
                ctx.fillRect(130, 0, 252, 130);

                const softboxLeft = ctx.createRadialGradient(75, 110, 2, 75, 110, 85);
                softboxLeft.addColorStop(0, '#ffffff');
                softboxLeft.addColorStop(0.4, '#94a3b8');
                softboxLeft.addColorStop(1, 'transparent');
                ctx.fillStyle = softboxLeft;
                ctx.fillRect(0, 25, 160, 170);

                const softboxRight = ctx.createRadialGradient(435, 110, 2, 435, 110, 85);
                softboxRight.addColorStop(0, '#ffffff');
                softboxRight.addColorStop(0.4, '#94a3b8');
                softboxRight.addColorStop(1, 'transparent');
                ctx.fillStyle = softboxRight;
                ctx.fillRect(350, 25, 162, 170);

                const strip = ctx.createLinearGradient(0, 120, 512, 120);
                strip.addColorStop(0, 'rgba(255,255,255,0.15)');
                strip.addColorStop(0.5, 'rgba(255,255,255,0.92)');
                strip.addColorStop(1, 'rgba(255,255,255,0.15)');
                ctx.fillStyle = strip;
                ctx.fillRect(0, 116, 512, 8);

                const canvasTexture = new THREE.CanvasTexture(canvas);
                canvasTexture.mapping = THREE.EquirectangularReflectionMapping;

                if (this.renderer && THREE.PMREMGenerator) {
                    const pmrem = new THREE.PMREMGenerator(this.renderer);
                    pmrem.compileEquirectangularShader();
                    const envRenderTarget = pmrem.fromEquirectangular(canvasTexture);
                    this.scene.environment = envRenderTarget.texture;
                    pmrem.dispose();
                } else {
                    this.scene.environment = canvasTexture;
                }
            } catch (e) {
                console.warn("Studio Environment setup fallback:", e);
            }
        }

        setupEnvironment() {
            // 地面微弱坐标网格
            const gridHelper = new THREE.GridHelper(180, 18, 0x1E293B, 0x0F172A);
            gridHelper.position.y = -50;
            this.scene.add(gridHelper);

            // 瓶口与玻璃颈部系统
            this.bottleGroup = new THREE.Group();
            this.updateBottleDimensions(18.5); // 默认波尔多瓶 18.5mm
            this.scene.add(this.bottleGroup);
        }

        /**
         * 动态调整半透明玻璃瓶颈口径 (支持波尔多/勃艮第/香槟/烈酒实时变形)
         * @param {number} innerDiameterMm 瓶口内径 mm
         */
        updateBottleDimensions(innerDiameterMm = 18.5) {
            // 清理旧几何体
            while (this.bottleGroup.children.length > 0) {
                const obj = this.bottleGroup.children[0];
                if (obj.geometry) obj.geometry.dispose();
                this.bottleGroup.remove(obj);
            }

            const innerRadius = innerDiameterMm / 2.0;
            const outerRadius = innerRadius + 4.5; // 玻璃壁厚约 4.5mm

            // 半透明翡翠绿波尔多酒瓶颈 (拉长至 68mm，完整包裹内部尖针与硅胶套)
            const bottleGeo = new THREE.CylinderGeometry(outerRadius, outerRadius + 2.0, 68, 36, 1, true);
            const bottleMat = new THREE.MeshPhysicalMaterial({
                color: 0x064E3B, // 经典波尔多酒瓶深绿透光玻璃
                transparent: true,
                opacity: 0.32,
                roughness: 0.12,
                transmission: 0.88,
                ior: 1.52,
                depthWrite: false
            });
            this.bottleMesh = new THREE.Mesh(bottleGeo, bottleMat);
            this.bottleMesh.position.y = -34;
            this.bottleGroup.add(this.bottleMesh);

            // Z = 0 瓶口接触面环线
            const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 48);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x38BDF8,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85
            });
            this.bottleRingMesh = new THREE.Mesh(ringGeo, ringMat);
            this.bottleRingMesh.rotation.x = Math.PI / 2;
            this.bottleRingMesh.position.y = 0;
            this.bottleGroup.add(this.bottleRingMesh);
        }

        /**
         * 切换 3D 剖切观察模式 (Cross-Section View)
         */
        toggleClipping() {
            this.isClippingEnabled = !this.isClippingEnabled;
            const planes = this.isClippingEnabled ? [this.clipPlane] : [];

            // 遍历所有模型材质应用剖切平面
            this.modelGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.clippingPlanes = planes);
                    } else {
                        child.material.clippingPlanes = planes;
                    }
                }
            });

            return this.isClippingEnabled;
        }

        /**
         * 平滑复位镜头视角
         */
        resetCamera() {
            if (this.controls) {
                this.controls.reset();
            }
            this.camera.position.set(0, 35, 140);
            if (this.controls) {
                this.controls.target.set(0, 15, 0);
            }
        }

        onWindowResize() {
            if (!this.container || !this.camera || !this.renderer) return;
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }

        animate() {
            this.animationId = requestAnimationFrame(this.animate);
            if (this.controls) {
                this.controls.update();
            }
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        }

        getCanvasDataURL() {
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
                return this.renderer.domElement.toDataURL('image/png');
            }
            return null;
        }

        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.remove();
            }
        }
    }

    return {
        LabScene
    };
}));
