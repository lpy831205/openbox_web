import CryptoJS from 'crypto-js'
import {JSEncrypt} from 'jsencrypt'

export class CryptoService {
    constructor(encryptor = null) {
        this.aesKey = null
        // 允许传入外部encryptor实例，如果没有则创建新的
        this.encryptor = encryptor || new JSEncrypt({ default_key_size: 3072 })
    }

    // 生成随机AES密钥
    generateAESKey() {
        const randomBytes = CryptoJS.lib.WordArray.random(32) // 256位
        this.aesKey = randomBytes
        return this.aesKey
    }

    // 生成随机IV
    generateIV() {
        return CryptoJS.lib.WordArray.random(16) // 128位
    }

    // AES-CBC加密
    encryptAES(data, key = this.aesKey, iv) {
        if (!key) throw new Error('AES密钥未设置')
        if (!iv) iv = this.generateIV()

        // 确保数据是字符串格式
        const dataString = typeof data === 'string' ? data : JSON.stringify(data)

        const encrypted = CryptoJS.AES.encrypt(
            dataString,
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        )

        return {
            iv: iv,
            encryptedData: encrypted.ciphertext,
            combined: iv.concat(encrypted.ciphertext)
        }
    }

    // AES-CBC解密
    decryptAES(encryptedData, key = this.aesKey, iv) {
        if (!key) throw new Error('AES密钥未设置')

        try {
            const decrypted = CryptoJS.AES.decrypt(
                {ciphertext: encryptedData},
                key,
                {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            )

            const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedStr) {
                throw new Error('解密结果为空');
            }

            try {
                return JSON.parse(decryptedStr)
            } catch {
                return decryptedStr
            }
        } catch (error) {
            throw new Error('解密失败: ' + error.message);
        }
    }

    encryptKey(aesKey, publicKey) {
        if (!publicKey) throw new Error('公钥未设置')
        if (!aesKey) throw new Error('AES密钥未设置')

        // 确保公钥已设置，如果不同则更新
        const currentKey = this.encryptor.getPublicKey()
        if (!currentKey || currentKey !== publicKey) {
            this.encryptor.setPublicKey(publicKey)
        }

        // 将AES密钥转换为Base64格式并使用PSS填充方案加密
        const aesKeyBase64 = aesKey.toString(CryptoJS.enc.Base64)
        return this.encryptor.encrypt(aesKeyBase64)
    }

    // 生成请求签名
    generateSignature(path, method, encryptedData, aesKey, nonce, timestamp) {
        // 确保与后端签名生成逻辑一致
        // 规则: path + method + requestBodyString + aesKeyBase64 + nonce + timestamp
        // 注意：后端对请求体使用双引号包裹，需要保持一致
        let encryptedDataWithQuotes = encryptedData;
        if (method !== 'GET' && encryptedData) {
            encryptedDataWithQuotes = `"${encryptedData}"`;
        }
        const stringToSign = `${path}${method}${encryptedDataWithQuotes}${aesKey}${nonce}${timestamp}`;
        console.log('前端签名字符串:', stringToSign);
        return CryptoJS.SHA256(stringToSign).toString();
    }

    // 生成Nonce
    generateNonce() {
        return CryptoJS.SHA256(Date.now().toString() + Math.random().toString()).toString()
    }
}

// 不再导出单例，改为由auth.js管理实例
// export const cryptoService = new CryptoService()