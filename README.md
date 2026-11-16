# 🍷 WineStopper Physics Lab
### Client-Side 3D Physics Simulator & Anti-Wobble Estimator for Custom Metal Wine Stoppers

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://goldvalleyltd.github.io/winestopper-physics-lab/)
[![Privacy Guaranteed](https://img.shields.io/badge/privacy-100%25%20Client--Side-success)](https://goldvalleyltd.github.io/winestopper-physics-lab/)
[![Manufacturing Partner](https://img.shields.io/badge/factory-Gold%20Valley%20Ltd.-orange)](https://www.goldvalleyltd.com/)

> **A browser-native physics calculator and 3D mesh analyzer for hardware merchandise, barware brands, independent artists, and manufacturing engineers.**  
> Calculates metal weight, 3-part assembly center of gravity ($Z_{cg}$), and tipping moments to prevent "top-heavy wobbling" and die-casting shrinkage before mold tooling.

---

## 🌟 Why WineStopper Physics Lab?

When brands and sculptors design custom metal wine bottle stoppers (especially sculptural heads like stags, wolves, owls, or ornate geometric crests), two costly mistakes frequently occur:
1. **Top-Heavy Wobble**: A heavy die-cast zinc head (50g–100g) shifts the center of gravity far above the bottle mouth. If the silicone anti-slip ribs lack proper contact compression, the stopper wobbles with every slight vibration, causing air leakage and tipping risks.
2. **Die-Casting Shrinkage**: Solid thick sections exceeding 6mm suffer sink marks, porosity, and high raw material costs during hot-chamber die casting. Structural hollowing (1.5–2.5mm target wall thickness) is mandatory.
3. **Logistics Budget Discrepancies**: Estimating air courier or ocean LCL costs before CAD completion is often pure guesswork.

**WineStopper Physics Lab** solves all three in real time right in your browser.

---

## ✨ Key Features

- 🔒 **100% Client-Side Privacy**: All 3D geometry calculations use pure in-browser JavaScript via Gauss's Divergence Theorem. **Your STL/OBJ files never leave your computer.**
- ⚡ **Dual Engine Calculation**:
  - **Quick Estimator (No-CAD Mode)**: Interactive bounding box ($L \times W \times H$) parametric estimation with factory shape factor ($K_{shape}$) matrices.
  - **Pro 3D Mesh Mode**: Drag-and-drop `.stl` or `.obj` files to compute exact surface mesh volumes, watertightness, and 3D centroid vectors.
- 🎯 **3-Part Assembly Stability Engine**:
  - Top sculpted ornament ($W_{ornament}, Z_1$)
  - Standard bottom metal cone weight ($W_{cone}, Z_2$)
  - Tiered food-grade silicone sealing ring ($W_{silicone}, Z_3$)
  - Real-time stability index based on bottle interface plane ($Z = 0$).
- 📦 **Export DFM Engineering Report**: One-click generation of a production-grade Design-for-Manufacturing evaluation sheet with tolerance recommendations.
- ✈️ **Air & Ocean Shipping Checker**: Compares actual gross weight against volumetric weight (L×W×H / 5000) for standard 100-pc master cartons.

---

## 📐 The Physics & Mathematics

### 1. Divergence Theorem for Arbitrary 3D Meshes
For an enclosed manifold triangular mesh with $N$ facets, the volume $V$ and centroid $\mathbf{C} = [X, Y, Z]^T$ are computed discretely:

$$V = \frac{1}{6} \left| \sum_{i=1}^{N} \mathbf{v}_{i1} \cdot (\mathbf{v}_{i2} \times \mathbf{v}_{i3}) \right|$$

$$\mathbf{C} = \frac{1}{24 V} \sum_{i=1}^{N} (\mathbf{v}_{i1} + \mathbf{v}_{i2} + \mathbf{v}_{i3}) \left[ \mathbf{v}_{i1} \cdot (\mathbf{v}_{i2} \times \mathbf{v}_{i3}) \right]$$

### 2. Combined Center of Gravity ($Z_{cg}$)
Relative to the bottle mouth opening plane ($Z = 0$):

$$Z_{cg} = \frac{W_{ornament} \cdot Z_1 + W_{cone} \cdot Z_2 + W_{silicone} \cdot Z_3}{W_{total}}$$

- 🟢 **Stable ($Z_{cg} \le +15\text{ mm}$)**: Optimal leverage ratio; zero wobble.
- 🟡 **Marginal ($+15\text{ mm} < Z_{cg} \le +25\text{ mm}$)**: Requires Shore A 60±5 food-grade silicone 3-rib rings and 30% standard core-pulling.
- 🔴 **High Risk ($Z_{cg} > +25\text{ mm}$)**: Severe top-heavy hazard. Recommend 30%–50% core-pulling hollowing or a heavy SUS304 stainless steel counterweight stem.

---

## 🚀 Getting Started

### Run in Browser
Simply open `index.html` in any modern web browser, or serve locally with any static HTTP server:

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```
Visit `http://localhost:8080` to start analyzing your stopper designs.

---

## 🏭 Industrial Partner & Calibration

The physical constants, hollowing thresholds, and silicone rib contact tolerances in this simulator are empirically calibrated and verified by:

**[Gold Valley Industrial Gifts Co., Ltd.](https://www.goldvalleyltd.com/)**  
*ISO 9001, RoHS, REACH, and FDA / LFGB food-contact compliant manufacturing facility.*  
Specialized in custom die-cast metal gifts, challenge coins, commemorative medals, barware, wine stoppers, and silicone hardware integration.

- 🍷 Product catalog: [Custom Metal Wine Stoppers](https://www.goldvalleyltd.com/wine-barware/wine-stoppers/)
- 📖 Engineering reference article: [Why Anti-Slip Rings Matter in Metal Wine Stoppers](https://www.goldvalleyltd.com/news/why-anti-slip-rings-matter-in-metal-wine-stoppers/)
- 🛠️ Inquire for free 3D mold tooling review & physical sampling: [https://www.goldvalleyltd.com/contact-us/](https://www.goldvalleyltd.com/contact-us/)

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
