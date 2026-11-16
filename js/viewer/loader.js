/**
 * WineStopper Physics Lab - Client-side 3D File Loader
 * 纯客户端 STL (Binary / ASCII) 与 OBJ 文件本地离散解析器
 * 100% Client-Side Only - 零上传服务器，充分保护客户 3D 原创商业版权
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WineStopperLab = root.WineStopperLab || {};
        root.WineStopperLab.loader = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    /**
     * 解析 STL 二进制数据流
     * @param {ArrayBuffer} buffer 
     * @returns {Float32Array} 扁平顶点数组 [x1,y1,z1, x2,y2,z2, ...]
     */
    function parseBinarySTL(buffer) {
        if (!buffer || buffer.byteLength < 84) {
            throw new Error("STL 文件损坏或过小（不足 84 字节头部）");
        }
        const reader = new DataView(buffer);
        // 跳过 80 字节文件头
        const triangles = reader.getUint32(80, true);
        const expectedByteLength = 84 + triangles * 50;
        if (triangles === 0 || expectedByteLength > buffer.byteLength) {
            throw new Error("STL 二进制三角形计数与文件字节长度不匹配");
        }
        const positions = new Float32Array(triangles * 9);

        let offset = 84;
        let posIndex = 0;

        for (let i = 0; i < triangles; i++) {
            // 跳过 12 字节法向量 (3个 float32)
            offset += 12;

            // 读取 3 个顶点坐标 (每个顶点 3 个 float32 = 12 字节)
            for (let v = 0; v < 3; v++) {
                positions[posIndex++] = reader.getFloat32(offset, true);
                positions[posIndex++] = reader.getFloat32(offset + 4, true);
                positions[posIndex++] = reader.getFloat32(offset + 8, true);
                offset += 12;
            }

            // 跳过 2 字节属性字节计数 (attribute byte count)
            offset += 2;
        }

        return positions;
    }

    /**
     * 解析 ASCII 文本格式的 STL
     * @param {string} text 
     * @returns {Float32Array}
     */
    function parseAsciiSTL(text) {
        const vertexRegex = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
        const coords = [];
        let match;

        while ((match = vertexRegex.exec(text)) !== null) {
            coords.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
        }

        return new Float32Array(coords);
    }

    /**
     * 智能判定并解析 STL 文件 (自动识别二进制 vs ASCII)
     * @param {ArrayBuffer} buffer 
     * @returns {Float32Array}
     */
    function parseSTL(buffer) {
        if (!buffer || buffer.byteLength < 15) {
            throw new Error("STL 文件为空或长度无效");
        }
        // 判断是否为 ASCII：检查前 80 字节是否以 "solid" 开头且不含空字节
        const header = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 80));
        let isAscii = false;

        const headerStr = new TextDecoder('ascii').decode(header).trim().toLowerCase();
        if (headerStr.startsWith('solid')) {
            // 进一步验证是否为真实 ASCII：检查前 500 字节是否包含空字节 0，并确认含 "facet"
            const previewLen = Math.min(buffer.byteLength, 500);
            const previewBytes = new Uint8Array(buffer, 0, previewLen);
            let hasZero = false;
            for (let i = 0; i < previewLen; i++) {
                if (previewBytes[i] === 0) {
                    hasZero = true;
                    break;
                }
            }
            const previewText = new TextDecoder('ascii').decode(previewBytes).toLowerCase();
            if (!hasZero && previewText.includes('facet')) {
                isAscii = true;
            }
        }

        if (isAscii) {
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(buffer);
            return parseAsciiSTL(text);
        } else {
            return parseBinarySTL(buffer);
        }
    }

    /**
     * 简易纯客户端 Wavefront OBJ 解析器 (提取 v 与 f)
     * @param {string} text 
     * @returns {Float32Array} 展开后的三角形顶点数组
     */
    function parseOBJ(text) {
        const lines = text.split('\n');
        const rawVertices = [];
        const flatPositions = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('v ')) {
                const parts = line.split(/\s+/);
                rawVertices.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
            } else if (line.startsWith('f ')) {
                const parts = line.split(/\s+/).slice(1);
                // 仅处理三角形与四边形剖分
                const indices = parts.map(p => {
                    const idx = parseInt(p.split('/')[0], 10);
                    return idx < 0 ? rawVertices.length + idx : idx - 1; // 1-indexed 或负数相对索引
                });

                if (indices.length >= 3) {
                    // 三角形 1: 0, 1, 2
                    flatPositions.push(...rawVertices[indices[0]]);
                    flatPositions.push(...rawVertices[indices[1]]);
                    flatPositions.push(...rawVertices[indices[2]]);

                    // 若为四边形，进行三角剖分: 0, 2, 3
                    if (indices.length === 4) {
                        flatPositions.push(...rawVertices[indices[0]]);
                        flatPositions.push(...rawVertices[indices[2]]);
                        flatPositions.push(...rawVertices[indices[3]]);
                    }
                }
            }
        }

        return new Float32Array(flatPositions);
    }

    /**
     * 从浏览器 File 对象异步加载并解析 3D 几何数据
     * @param {File} file 
     * @returns {Promise<{ positions: Float32Array, fileName: string, fileType: string }>}
     */
    function loadFile(file) {
        return new Promise((resolve, reject) => {
            const ext = file.name.split('.').pop().toLowerCase();
            const reader = new FileReader();

            if (ext === 'stl') {
                reader.onload = function (e) {
                    try {
                        const positions = parseSTL(e.target.result);
                        resolve({ positions, fileName: file.name, fileType: 'stl' });
                    } catch (err) {
                        reject(new Error("解析 STL 文件失败：" + err.message));
                    }
                };
                reader.onerror = () => reject(new Error("读取文件失败"));
                reader.readAsArrayBuffer(file);
            } else if (ext === 'obj') {
                reader.onload = function (e) {
                    try {
                        const positions = parseOBJ(e.target.result);
                        resolve({ positions, fileName: file.name, fileType: 'obj' });
                    } catch (err) {
                        reject(new Error("解析 OBJ 文件失败：" + err.message));
                    }
                };
                reader.onerror = () => reject(new Error("读取文件失败"));
                reader.readAsText(file);
            } else {
                reject(new Error("不支持的文件格式。请上传 .stl 或 .obj 格式的 3D 模型文件。"));
            }
        });
    }

    return {
        parseSTL,
        parseOBJ,
        loadFile
    };
}));
