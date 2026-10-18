// loads environment variables from the .env file (if present)...
require('dotenv').config();

/** Reads a required environment variable or throws a helpful error. */
const requireEnvironmentVariable = name => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`);
  }

  return value;
};

module.exports.configuration = {
  instanceId: '1',
  includeErrorStack: true,
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT) || 3001,
  logsDirectory: 'logs',
  mongoDbConfiguration: {
    host: process.env.MONGODB_HOST || 'localhost',
    port: Number(process.env.MONGODB_PORT) || 27017,
    username: process.env.MONGODB_USERNAME || '',
    password: process.env.MONGODB_PASSWORD || '',
    authenticationDatabase: 'admin',
    databaseName: process.env.MONGODB_DATABASE || 'CryptoSearchDevelopment',
    readPreference: 'primary',
    directConnection: true,
    useSsl: false,
  },
  uploads: {
    directoryPath: './uploads',
    tempDirectoryPath: './temporary-files',
    maxFileSize: 16777216,            // maximum file size is 16 MB...
    fileNameLength: 64,
  },
  downloadsDirectoryPath: './downloads',
  encryptedFilesDirectoryPath: './encrypted',
  jsonWebToken: {
    secretKey: requireEnvironmentVariable('JWT_SECRET_KEY'),
  },
  cryptography: {
    bcryptSaltGenerationRounds: 1,
    aesAlgorithm: 'aes-256-ctr',
    aesInitializationVector: [32, 27, 169, 241, 200, 189, 141, 73, 29, 56, 165, 241, 66, 53, 42, 108],
    rsa: {
      algorithm: 'rsa',
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: requireEnvironmentVariable('RSA_PRIVATE_KEY_PASSPHRASE'),
      },
    },
  },
  randomKeyLength: 64,
  secretKeyLength: 64,
  googleDrive: {
    scopes: [
      'https://www.googleapis.com/auth/drive'
    ],
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './google-api-credentials.json',
  },
  invertedIndexFileName: 'Secure_Search_Data_Inverted_Index.json',
  invertedIndexFileMimeType: 'application/json',
  mailService: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    isSecure: (process.env.SMTP_SECURE || 'true') === 'true',
    // when username is empty, a nodemailer test (Ethereal) account is used...
    username: process.env.SMTP_USERNAME || '',
    password: process.env.SMTP_PASSWORD || '',
  },
};
