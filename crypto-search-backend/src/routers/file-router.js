const { RouterBase, } = require('./router-base');
const { encryptAes, encryptRsa, decryptRsa, decryptAes, } = require('../common/cryptography');
const { MongoDb, } = require('../mongodb');
const { generateUidAsync, } = require('../common/uid-generator');
const { configuration } = require('../configuration');
const { authorize } = require('../middleware/authorization');
const { googleDriveAuthorize, } = require('../middleware/google-drive-authorization');
const { RandomGenerator } = require('@shahadul-17/random-generator');
const path = require('path');
const fs = require('fs');
const asyncFs = require('fs/promises');
const { GoogleDriveService } = require('../services/google-drive-service');
const { FileService } = require('../services/file-service');
const JsonSerializer = require('../common/json-serializer');
const ApiError = require('../common/api-error');
const { sendEmailAsync, } = require('../services/mail-service');

const fileRouter = new RouterBase();
const googleDriveService = GoogleDriveService.getInstance();
const fileService = FileService.getInstance();

fileRouter.get('/share/:email/:fileId', authorize, googleDriveAuthorize, async (request, response) => {
  const { email, fileId, } = request.params;
  const { role, } = request.query;

  // shares file with the person...
  await googleDriveService.shareAsync({
    googleDriveClient: request.googleDriveClient,
    email: email,
    fileId: fileId,
    role: role,
  });

  const database = MongoDb.getInstance().getDatabase();
  const users = database.collection('User');
  const user = await users.findOne({ email: email, });

  // if user is not registered into this system,
  // we'll send an email to the user...
  if (!user) {
    sendEmailAsync({
      sender: '',
      subject: 'Request to register on CryptoSearch.',
      message: `${request.user.email} has shared a folder with you. Please register on CryptoSearch to access the files. Registration link: http://127.0.0.1:3000/signup`,
      recipients: email,
    }).catch(error => {
      console.error(`An error occurred while sending email from ${request.user.email} to ${email}.`, error);
    });
  }

  return {
    message: 'File shared successfully.',
    data: {
      email: email,
      fileId: fileId,
    },
  };
});

fileRouter.put('/index', authorize, googleDriveAuthorize, async (request, response) => {
  const user = request.user;
  const { index, } = request.body;
  let { folderId, } = request.body;

  if (!folderId) { folderId = 'ROOT'; }

  const invertedIndexes = user.invertedIndexes ?? {};
  const invertedIndexFileId = invertedIndexes[folderId];
  const invertedIndexFilePath = path.join(configuration.uploads.tempDirectoryPath, configuration.invertedIndexFileName);
  let currentInvertedIndex = {};

  if (invertedIndexFileId) {
    try {
      // downloads previous inverted index file...
      await googleDriveService.downloadFileAsync({
        googleDriveClient: request.googleDriveClient,
        fileId: invertedIndexFileId,
        fileOutputPath: invertedIndexFilePath,
      });

      const invertedIndex = await asyncFs.readFile(invertedIndexFilePath, 'utf-8');
      currentInvertedIndex = JSON.parse(invertedIndex);
    } catch (error) {
      console.error('An error occurred while loading existing index file.', error);
    }
  }

  const secretKey = user.secretKeys[folderId];
  const newInvertedIndex = fileService.getInvertedIndex(index, secretKey);
  const invertedIndex = fileService.mergeInvertedIndexes(currentInvertedIndex, newInvertedIndex);

  const invertedIndexAsJson = JsonSerializer.serialize(invertedIndex, 2);

  await asyncFs.writeFile(invertedIndexFilePath, invertedIndexAsJson);

  let fileResponse;

  if (invertedIndexFileId) {
    // updates existing inverted index on google drive...
    fileResponse = await googleDriveService.updateFileAsync({
      googleDriveClient: request.googleDriveClient,
      folderId: folderId,
      fileInfo: {
        id: invertedIndexFileId,
        name: configuration.invertedIndexFileName,
        mimeType: configuration.invertedIndexFileMimeType,
        content: fs.createReadStream(invertedIndexFilePath),
      },
    });
  } else {
    // uploads inverted index to google drive...
    fileResponse = await googleDriveService.uploadFileAsync({
      googleDriveClient: request.googleDriveClient,
      folderId: folderId,
      fileInfo: {
        name: configuration.invertedIndexFileName,
        mimeType: configuration.invertedIndexFileMimeType,
        content: fs.createReadStream(invertedIndexFilePath),
      },
    });

    invertedIndexes[folderId] = fileResponse.data.id;

    user.invertedIndexes = invertedIndexes;

    const database = MongoDb.getInstance().getDatabase();
    const users = database.collection('User');

    await users.updateOne({ _id: user._id, }, {
      $set: { invertedIndexes: invertedIndexes, },
      $addToSet: { folders: folderId, },
    });
  }

  return {
    message: 'Inverted index generated successfully.',
    data: {
      invertedIndexId: fileResponse.data.id,
    },
  };
});

fileRouter.get('/search/:folderId', authorize, googleDriveAuthorize, async (request, response) => {
  // const user = request.user;
  const { folderId, } = request.params;
  const { keyword, } = request.query;
  let { includeFileInfo, } = request.query;
  includeFileInfo = includeFileInfo === 'true';

  const database = MongoDb.getInstance().getDatabase();
  const users = database.collection('User');
  const folderOwner = await users.findOne({
    folders: { $all: [folderId,], },
  });

  if (!folderOwner) { throw new ApiError(404, 'Requested folder was not found.'); }

  const secretKey = folderOwner.secretKeys[folderId];
  const encryptedKeyword = encryptAes(keyword, secretKey, 'hex');

  const invertedIndexFileId = folderOwner.invertedIndexes[folderId];
  const invertedIndexFilePath = path.join(configuration.uploads.tempDirectoryPath, `${RandomGenerator.generateString(16)}.json`);

  // downloads previous inverted index file...
  await googleDriveService.downloadFileAsync({
    googleDriveClient: request.googleDriveClient,
    fileId: invertedIndexFileId,
    fileOutputPath: invertedIndexFilePath,
  });

  let invertedIndex = await asyncFs.readFile(invertedIndexFilePath, 'utf-8');
  invertedIndex = JSON.parse(invertedIndex);

  const fileIds = invertedIndex[encryptedKeyword];

  if (!Array.isArray(fileIds)) { throw new ApiError(404, 'No file found for the specified keyword.'); }

  let fileInfos = undefined;

  if (includeFileInfo) {
    const database = MongoDb.getInstance().getDatabase();
    const fileInfoCollection = database.collection('FileInfo');

    fileInfos = [];

    for (const fileId of fileIds) {
      const fileInfo = await fileInfoCollection.findOne({ fileId: fileId, });
      fileInfos.push({
        id: fileInfo.fileId,
        name: fileInfo.name,
      });
    }
  }

  return {
    message: 'File ID(s) found for the keyword.',
    data: {
      fileIds: fileIds,
      fileInfos: fileInfos,
    },
  };
});

fileRouter.post('/key/:fileId', authorize, googleDriveAuthorize, async (request, response) => {
  const { fileId, } = request.params;
  const { publicKey, } = request.body;
  const database = MongoDb.getInstance().getDatabase();
  const fileInfoCollection = database.collection('FileInfo');
  const fileInfo = await fileInfoCollection.findOne({ fileId: fileId, });

  if (!fileInfo) { throw new ApiError(404, 'No file associated with the specified ID.'); }

  const userCollection = database.collection('User');
  const fileOwner = await userCollection.findOne({ _id: fileInfo.userId, });

  if (!fileOwner) { throw new ApiError(404, 'File owner was not found.'); }

  // this is the key that can be used to decrypt the requested file...
  const decryptionKey = fileOwner.randomKeys[fileInfo.randomKeyId];
  // decryption key is encrypted using RSA (public key)...
  const encryptedDecryptionKey = encryptRsa(Buffer.from(decryptionKey, 'utf-8'), publicKey, 'hex');

  return {
    message: 'File decryption key retrieved successfully.',
    data: {
      encryptedDecryptionKey: encryptedDecryptionKey,
    },
  };
});

fileRouter.get('/', authorize, googleDriveAuthorize, async (request, response) => {
  const { limit, pageToken, folderId, } = request.query;
  const fileListResponse = await googleDriveService.listFilesAsync({
    googleDriveClient: request.googleDriveClient,
    limit: limit,
    pageToken: pageToken,
    folderId: folderId,
  });

  return {
    message: 'Files retrieved successfully.',
    data: {
      files: Array.isArray(fileListResponse.files) && fileListResponse.files.length ? fileListResponse.files : [],
      nextPageToken: fileListResponse.nextPageToken,
    },
  };
});

fileRouter.post('/download/:fileId', authorize, googleDriveAuthorize, async (request, response) => {
  const { fileId, } = request.params;
  const { privateKey, encryptedDecryptionKey, } = request.body;
  // encrypted decryption key is decrypted using RSA (private key)...
  const decryptionKey = decryptRsa(Buffer.from(encryptedDecryptionKey, 'hex'), privateKey, 'utf-8');

  const database = MongoDb.getInstance().getDatabase();
  const fileInfoCollection = database.collection('FileInfo');
  const fileInfo = await fileInfoCollection.findOne({ fileId: fileId, });

  if (!fileInfo) { throw new ApiError(404, 'No file associated with the specified ID.'); }

  const encryptedFilePath = path.join(configuration.downloadsDirectoryPath, fileInfo.name);

  // downloads encrypted file...
  await googleDriveService.downloadFileAsync({
    googleDriveClient: request.googleDriveClient,
    fileId: fileId,
    fileOutputPath: encryptedFilePath,
  });

  // decrypts the file...
  const encryptedFileContent = await asyncFs.readFile(encryptedFilePath);
  // decrypted content of the downloaded file...
  const fileContent = decryptAes(encryptedFileContent, decryptionKey);
  const filePath = path.join(configuration.uploads.tempDirectoryPath, fileInfo.name);

  // writes decrypted file to a temporary directory...
  await asyncFs.writeFile(filePath, fileContent);

  // sends the file...
  return {
    type: 'file',
    filePath: filePath,
  };
});

fileRouter.post('/', authorize, googleDriveAuthorize, async (request, response) => {
  const user = request.user;
  let { folderId, } = request.body;

  if (!folderId) { folderId = 'ROOT'; }

  let files = request.files.files;

  if (!Array.isArray(files)) { files = [files]; }

  const randomKeys = user.randomKeys ?? {};
  const fileInfoList = [];
  const database = MongoDb.getInstance().getDatabase();

  // iterates through files...
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploadPath = path.join(configuration.uploads.directoryPath, file.name);

    await file.mv(uploadPath);

    const fileBuffer = await asyncFs.readFile(uploadPath);

    // generates random key and a unique ID...
    const randomKeyId = await generateUidAsync();
    const randomKey = RandomGenerator.generateString(configuration.randomKeyLength);

    // sets random key...
    randomKeys[randomKeyId] = randomKey;

    const encrypted = encryptAes(fileBuffer, randomKey);
    const encryptedFilePath = path.join(configuration.encryptedFilesDirectoryPath, file.name);

    await asyncFs.writeFile(encryptedFilePath, encrypted);

    // uploads files to google drive...
    const fileResponse = await googleDriveService.uploadFileAsync({
      googleDriveClient: request.googleDriveClient,
      folderId: folderId,
      fileInfo: {
        name: file.name,
        mimeType: file.mimetype,
        content: fs.createReadStream(encryptedFilePath),
      },
    });

    const fileInfoId = await generateUidAsync();
    const fileInfo = {
      _id: fileInfoId,
      randomKeyId: randomKeyId,            // ID of the random key...
      filePath: encryptedFilePath,    // encrypted file path...
      folderId: folderId,
      fileId: fileResponse.data.id,
      name: file.name,
      userId: user._id,
    };

    fileInfoList.push(fileInfo);

    // saves to database...
    const fileInfoCollection = database.collection('FileInfo');

    await fileInfoCollection.insertOne(fileInfo);
  }

  user.randomKeys = randomKeys;

  const users = database.collection('User');

  // adds random key to user's collection of random keys...
  await users.updateOne({ _id: user._id, }, { $set: user, });

  return {
    message: 'Files uploaded successfully.',
    data: {
      fileInfoList: fileInfoList,
    },
  };
});

module.exports.fileRouter = fileRouter;
