const { configuration, } = require('../configuration');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const initializationVector = Buffer.from(configuration.cryptography.aesInitializationVector);

/**
 * 
 * @param {String} encodedData 
 * @returns {String}
 */
const removePadding = encodedData => {
  return encodedData.replace(/=/g, '');       // removes '='...
}

/**
 * 
 * @param {String} encodedData 
 * @returns {String}
 */
const makeUrlSafeBase64 = encodedData => {
  return removePadding(encodedData)   // removes padding by removing '='...
    .replace(/\+/g, '-')                      // replaces '+' with '-'...
    .replace(/\//g, '_')                      // replaces '/' with '_'...
}

/**
 * 
 * @param {String} text 
 * @param {'base64' | 'hex'} encoding 
 * @returns {String}
 */
const normalize = (text, encoding) => {
  // for url safe base64 encoding...
  if (encoding === 'base64') {
    text = makeUrlSafeBase64(text);
  }

  return text;
}

const generateBcryptAsync = async text => {
  const salt = await bcrypt.genSalt(configuration.cryptography.bcryptSaltGenerationRounds);
  const hash = await bcrypt.hash(text, salt);

  return hash;
};

const compareBcryptAsync = (text, preComputedBcrypt) => {
  return bcrypt.compare(text, preComputedBcrypt);
};

const generateKey = secret => {
  return Buffer.from(crypto.createHash('sha512').update(secret).digest('hex'), 'ascii').slice(0, 32);
};

/**
 * @param {Buffer} buffer 
 * @param {String} secret 
 * @param {String} encoding 
 * @returns {Buffer | String} 
 */
const encryptAes = (buffer, secret, encoding = undefined) => {
  const key = generateKey(secret);
  const cipher = crypto.createCipheriv(configuration.cryptography.aesAlgorithm, key, initializationVector);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  if (encoding) { return encrypted.toString(encoding); }

  return encrypted;
};

/**
 * @param {Buffer} encrypted encrypted data.
 * @param {String} secret 
 * @param {String} encoding 
 * @returns {Buffer | String}
 */
const decryptAes = (encrypted, secret, encoding = undefined) => {
  const key = generateKey(secret);
  const decipher = crypto.createDecipheriv(configuration.cryptography.aesAlgorithm, key, initializationVector);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  if (encoding) { return decrypted.toString(encoding); }

  return decrypted;
};

/**
 * @returns {Promise<{publicKey: String, privateKey: String}>} Returns RSA key-pair...
 */
const generateRsaKeyPairAsync = () => {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(configuration.cryptography.rsa.algorithm,
      configuration.cryptography.rsa, (error, publicKey, privateKey) => {
        if (error) { return reject(error); }

        resolve({
          publicKey: publicKey,
          privateKey: privateKey,
        });
      });
  });
};

/**
 * @param {Buffer} buffer 
 * @param {String} publicKey 
 * @param {String} encoding 
 * @returns {Buffer | String} 
 */
const encryptRsa = (buffer, publicKey, encoding = undefined) => {
  const encrypted = crypto.publicEncrypt(publicKey, buffer);

  if (encoding) { return encrypted.toString(encoding); }

  return encrypted;
};

/**
 * @param {Buffer} encrypted 
 * @param {String} privateKey 
 * @param {String} encoding 
 * @returns {Buffer | String} 
 */
const decryptRsa = (encrypted, privateKey, encoding = undefined) => {
  const decrypted = crypto.privateDecrypt({
    key: privateKey,
    /* padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256", */
    passphrase: configuration.cryptography.rsa.privateKeyEncoding.passphrase,
  }, encrypted);

  if (decrypted) { return decrypted.toString(encoding); }

  return decrypted;
};

module.exports.generateBcryptAsync = generateBcryptAsync;
module.exports.compareBcryptAsync = compareBcryptAsync;
module.exports.encryptAes = encryptAes;
module.exports.decryptAes = decryptAes;
module.exports.encryptRsa = encryptRsa;
module.exports.decryptRsa = decryptRsa;
module.exports.generateRsaKeyPairAsync = generateRsaKeyPairAsync;
