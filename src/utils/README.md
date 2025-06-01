# 加密服务模块

本目录包含使用纯JavaScript实现的加密模块，提供安全的加密功能。

## 功能

- AES-256-CBC 加密/解密
- RSA 公钥加密
- SHA-256 哈希计算
- 随机数生成
- 请求签名生成

## 依赖库

- [CryptoJS](https://github.com/brix/crypto-js) - 提供AES加密和哈希功能
- [JSEncrypt](https://github.com/travist/jsencrypt) - 提供RSA加密功能

## 使用方法

加密服务提供了一套简洁的API：

```javascript
import { CryptoService } from '@/utils/crypto';

const cryptoService = new CryptoService();

// 示例用法
async function example() {
  // 生成AES密钥
  const aesKey = await cryptoService.generateAESKey();
  
  // 加密数据
  const data = { message: "Hello, World!" };
  const encrypted = await cryptoService.encryptAES(data);
  
  // 解密数据
  const decrypted = await cryptoService.decryptAES(
    encrypted.encryptedData, 
    aesKey, 
    encrypted.iv
  );
  
  console.log(decrypted); // { message: "Hello, World!" }
}
```

## 实现细节

- `crypto.js` - 包含所有加密功能的实现

## 安全注意事项

1. 所有加密操作都在客户端执行，因此不应用于存储高度敏感的信息
2. 该模块主要用于API通信加密和客户端临时数据保护
3. 对于真正的安全存储，应该使用服务器端加密 