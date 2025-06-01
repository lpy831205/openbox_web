import { SHA3 } from 'crypto-js';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// 创建FingerprintJS实例
let fpPromise = null;

/**
 * 设备指纹服务
 * 结合多种指纹识别技术，生成稳定的设备码
 */
export class DeviceFingerprintService {
  constructor() {
    // 初始化FingerprintJS
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    
    // 存储指纹组件
    this.components = {};
    
    // 备份存储
    this.dbName = 'deviceFingerprintDB';
    this.storeName = 'deviceFingerprint';
    this.dbVersion = 1;
  }
  
  /**
   * 生成设备指纹
   * @returns {Promise<string>} 设备指纹
   */
  async generateFingerprint() {
    try {
      // 1. 从IndexedDB获取存储的指纹
      const storedFingerprint = await this.getStoredFingerprint();
      if (storedFingerprint) {
        return storedFingerprint;
      }
      
      // 2. 收集设备信息
      await this.collectComponents();
      
      // 3. 生成指纹
      const fingerprint = this.calculateFingerprint();
      
      // 4. 存储指纹到IndexedDB
      await this.storeFingerprint(fingerprint);
      
      return fingerprint;
    } catch (error) {
      console.error('生成设备指纹失败:', error);
      // 降级方案：使用基本设备信息
      return this.generateBasicFingerprint();
    }
  }
  
  /**
   * 收集设备指纹组件
   */
  async collectComponents() {
    // 并行收集所有组件
    const [
      fpjsComponents,
      canvasFingerprint,
      webglFingerprint,
      audioFingerprint,
      hardwareInfo,
      fontList,
      screenInfo,
      browserInfo
    ] = await Promise.all([
      this.getFingerprintJSComponents(),
      this.getCanvasFingerprint(),
      this.getWebGLFingerprint(),
      this.getAudioFingerprint(),
      this.getHardwareInfo(),
      this.detectFonts(),
      this.getScreenInfo(),
      this.getBrowserInfo()
    ]);
    
    // 存储组件
    this.components = {
      fpjsComponents,
      canvasFingerprint,
      webglFingerprint,
      audioFingerprint,
      hardwareInfo,
      fontList,
      screenInfo,
      browserInfo
    };
  }
  
  /**
   * 计算最终指纹
   * @returns {string} 设备指纹
   */
  calculateFingerprint() {
    // 将所有组件转换为字符串
    const componentsStr = JSON.stringify(this.components);
    
    // 使用SHA3-512计算哈希
    return SHA3(componentsStr, { outputLength: 512 }).toString().toLowerCase();
  }
  
  /**
   * 获取FingerprintJS组件
   */
  async getFingerprintJSComponents() {
    try {
      const fp = await fpPromise;
      const result = await fp.get();
      return result.components;
    } catch (error) {
      console.error('获取FingerprintJS组件失败:', error);
      return {};
    }
  }
  
  /**
   * 获取Canvas指纹
   */
  getCanvasFingerprint() {
    return new Promise(resolve => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置Canvas大小
        canvas.width = 200;
        canvas.height = 50;
        
        // 绘制文本
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        
        // 混合颜色增加差异性
        ctx.fillStyle = '#069';
        ctx.fillText('设备指纹', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('设备指纹', 4, 17);
        
        // 添加一些特殊形状
        ctx.beginPath();
        ctx.arc(50, 25, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 获取Canvas数据
        const dataURL = canvas.toDataURL();
        resolve(dataURL);
      } catch (error) {
        console.error('获取Canvas指纹失败:', error);
        resolve('');
      }
    });
  }
  
  /**
   * 获取WebGL指纹
   */
  getWebGLFingerprint() {
    return new Promise(resolve => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
          resolve('');
          return;
        }
        
        // 收集WebGL信息
        const info = {
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
          shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
          extensions: gl.getSupportedExtensions()
        };
        
        // 创建简单的WebGL场景
        canvas.width = 100;
        canvas.height = 100;
        
        // 清除背景
        gl.clearColor(0.2, 0.4, 0.6, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // 获取像素数据
        const pixels = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
        // 计算像素数据的哈希
        const pixelHash = Array.from(pixels.slice(0, 100)).join(',');
        
        resolve({
          info,
          pixelHash
        });
      } catch (error) {
        console.error('获取WebGL指纹失败:', error);
        resolve('');
      }
    });
  }
  
  /**
   * 获取音频指纹
   */
  getAudioFingerprint() {
    return new Promise(resolve => {
      try {
        // 检查AudioContext是否可用
        if (!window.AudioContext && !window.webkitAudioContext) {
          resolve('');
          return;
        }
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // 创建音频处理图
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        
        // 设置音频参数
        gainNode.gain.value = 0; // 静音
        oscillator.type = 'triangle'; // 三角波
        oscillator.frequency.value = 1000; // 1000Hz
        
        // 连接音频节点
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 收集音频数据
        const audioData = [];
        
        scriptProcessor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          const outputData = event.outputBuffer.getChannelData(0);
          
          // 复制输入到输出
          for (let i = 0; i < inputData.length; i++) {
            outputData[i] = inputData[i];
          }
          
          // 收集部分样本
          if (audioData.length < 100) {
            for (let i = 0; i < Math.min(100, inputData.length); i += 10) {
              audioData.push(inputData[i]);
            }
          } else {
            // 停止收集
            oscillator.stop();
            scriptProcessor.disconnect();
            analyser.disconnect();
            gainNode.disconnect();
            audioContext.close();
            
            // 计算指纹
            const fingerprint = audioData.map(v => v.toString().slice(0, 4)).join('');
            resolve(fingerprint);
          }
        };
        
        // 启动音频处理
        oscillator.start(0);
        
        // 设置超时，防止无限等待
        setTimeout(() => {
          if (audioData.length === 0) {
            oscillator.stop();
            scriptProcessor.disconnect();
            analyser.disconnect();
            gainNode.disconnect();
            audioContext.close();
            resolve('');
          }
        }, 1000);
      } catch (error) {
        console.error('获取音频指纹失败:', error);
        resolve('');
      }
    });
  }
  
  /**
   * 获取硬件信息
   */
  getHardwareInfo() {
    return {
      deviceMemory: navigator.deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      platform: navigator.platform || '',
      userAgent: navigator.userAgent,
      vendor: navigator.vendor || '',
      language: navigator.language || '',
      languages: navigator.languages ? Array.from(navigator.languages) : [],
      connection: this.getNetworkInfo(),
      devicePixelRatio: window.devicePixelRatio || 1,
      doNotTrack: navigator.doNotTrack || navigator.msDoNotTrack || window.doNotTrack || '',
      timezone: {
        offset: new Date().getTimezoneOffset(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      touchSupport: 'ontouchstart' in window
    };
  }
  
  /**
   * 获取网络信息
   */
  getNetworkInfo() {
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    
    if (!connection) {
      return {};
    }
    
    return {
      effectiveType: connection.effectiveType || '',
      rtt: connection.rtt || 0,
      downlink: connection.downlink || 0,
      saveData: connection.saveData || false
    };
  }
  
  /**
   * 检测系统字体
   * @returns {Promise<string[]>} 检测到的字体列表
   */
  async detectFonts() {
    return new Promise(resolve => {
      try {
        // 检测字体的基准字体
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        
        // 测试字体列表
        const fontTests = [
          'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 
          'Cambria Math', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
          'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
          'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times',
          'Times New Roman', 'Trebuchet MS', 'Verdana', '宋体', '微软雅黑', '黑体', '楷体'
        ];
        
        // 创建测试用的span元素
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';
        const h = document.createElement('div');
        
        h.style.cssText = 'position:absolute;left:-9999px;visibility:hidden;display:block';
        document.body.appendChild(h);
        
        // 检测宽度
        const defaultWidth = {};
        const defaultHeight = {};
        
        // 初始化基准字体的默认宽度
        for (let index = 0; index < baseFonts.length; index++) {
          const span = document.createElement('span');
          span.textContent = testString;
          span.style.cssText = `font-family:${baseFonts[index]};font-size:${testSize}`;
          h.appendChild(span);
          
          defaultWidth[baseFonts[index]] = span.offsetWidth;
          defaultHeight[baseFonts[index]] = span.offsetHeight;
        }
        
        // 检测字体是否存在
        const detected = [];
        
        for (let i = 0; i < fontTests.length; i++) {
          const font = fontTests[i];
          const result = this.isFontAvailable(font, defaultWidth, defaultHeight, h, testString, testSize, baseFonts);
          
          if (result) {
            detected.push(font);
          }
        }
        
        // 清理DOM
        document.body.removeChild(h);
        
        resolve(detected);
      } catch (error) {
        console.error('检测字体失败:', error);
        resolve([]);
      }
    });
  }
  
  /**
   * 检测字体是否可用
   */
  isFontAvailable(font, defaultWidth, defaultHeight, h, testString, testSize, baseFonts) {
    let detected = false;
    
    for (let j = 0; j < baseFonts.length; j++) {
      const span = document.createElement('span');
      span.textContent = testString;
      span.style.cssText = `font-family:${font},${baseFonts[j]};font-size:${testSize}`;
      h.appendChild(span);
      
      // 如果宽度与基准字体不同，则说明该字体可用
      const match = (span.offsetWidth !== defaultWidth[baseFonts[j]] || 
                     span.offsetHeight !== defaultHeight[baseFonts[j]]);
                     
      if (match) {
        detected = true;
      }
      
      h.removeChild(span);
    }
    
    return detected;
  }
  
  /**
   * 获取屏幕信息
   */
  getScreenInfo() {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      orientation: screen.orientation ? {
        type: screen.orientation.type,
        angle: screen.orientation.angle
      } : {
        type: '',
        angle: 0
      }
    };
  }
  
  /**
   * 获取浏览器信息
   */
  getBrowserInfo() {
    return {
      cookieEnabled: navigator.cookieEnabled,
      appCodeName: navigator.appCodeName,
      appName: navigator.appName,
      appVersion: navigator.appVersion,
      userAgent: navigator.userAgent,
      product: navigator.product,
      productSub: navigator.productSub,
      plugins: this.getPlugins()
    };
  }
  
  /**
   * 获取浏览器插件信息
   */
  getPlugins() {
    if (!navigator.plugins) {
      return [];
    }
    
    const plugins = [];
    
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      const pluginInfo = {
        name: plugin.name,
        description: plugin.description,
        filename: plugin.filename
      };
      
      plugins.push(pluginInfo);
    }
    
    return plugins;
  }
  
  /**
   * 生成基本指纹（降级方案）
   */
  generateBasicFingerprint() {
    const basicInfo = navigator.userAgent + 
                     navigator.language + 
                     screen.width + 
                     screen.height + 
                     navigator.hardwareConcurrency + 
                     navigator.deviceMemory + 
                     navigator.platform +
                     new Date().getTimezoneOffset();
    
    return SHA3(basicInfo, { outputLength: 512 }).toString().toLowerCase();
  }
  
  /**
   * 从IndexedDB获取存储的指纹
   */
  getStoredFingerprint() {
    return new Promise((resolve) => {
      try {
        // 检查IndexedDB是否可用
        if (!window.indexedDB) {
          resolve(null);
          return;
        }
        
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        
        request.onerror = () => {
          resolve(null);
        };
        
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const getRequest = store.get('fingerprint');
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              resolve(getRequest.result.value);
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = () => {
            resolve(null);
          };
        };
      } catch (error) {
        console.error('从IndexedDB获取指纹失败:', error);
        resolve(null);
      }
    });
  }
  
  /**
   * 存储指纹到IndexedDB
   * @param {string} fingerprint 
   */
  storeFingerprint(fingerprint) {
    return new Promise((resolve) => {
      try {
        // 检查IndexedDB是否可用
        if (!window.indexedDB) {
          resolve();
          return;
        }
        
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        
        request.onerror = () => {
          resolve();
        };
        
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          
          store.put({ id: 'fingerprint', value: fingerprint });
          
          transaction.oncomplete = () => {
            resolve();
          };
          
          transaction.onerror = () => {
            resolve();
          };
        };
      } catch (error) {
        console.error('存储指纹到IndexedDB失败:', error);
        resolve();
      }
    });
  }
}

// 创建单例实例
const deviceFingerprintService = new DeviceFingerprintService();

export default deviceFingerprintService; 