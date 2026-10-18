const { RouterBase, } = require('./router-base');
const { MongoDb, } = require('../mongodb');
const { configuration } = require('../configuration');
const { authorize } = require('../middleware/authorization');
const { RandomGenerator } = require('@shahadul-17/random-generator');
const { generateRsaKeyPairAsync } = require('../common/cryptography');

const keyRouter = new RouterBase();

keyRouter.get('/generate-secret/:folderId', authorize, async (request, response) => {
  const user = request.user;
  const folderId = request.params.folderId ? request.params.folderId : 'ROOT';
  const forceRegenerate = request.query.forceRegenerate === "true";

  // if secretKeys is undefined, we'll initialize it...
  if (!user.secretKeys) { user.secretKeys = {}; }

  // if secret key is already generated for the folder and
  // forceRegenerate is false, we'll do nothing...
  if (typeof user.secretKeys[folderId] === 'string' && !forceRegenerate) {
    return {
      message: 'Secret key generated successfully.',
      data: { folderId: folderId, },
    };
  }

  // generates secret key...
  const secretKey = RandomGenerator.generateString(configuration.secretKeyLength);
  user.secretKeys[folderId] = secretKey;

  const database = MongoDb.getInstance().getDatabase();
  const users = database.collection('User');

  await users.updateOne({ _id: user._id, }, { $set: { secretKeys: user.secretKeys, }, });

  return {
    message: 'Secret key generated successfully.',
    data: { folderId: folderId, },
  };
});

keyRouter.get('/generate-rsa', authorize, async (request, response) => {
  const rsaKeyPair = await generateRsaKeyPairAsync();

  return {
    message: 'RSA key pair generated successfully.',
    data: rsaKeyPair,
  };
});

module.exports.keyRouter = keyRouter;
