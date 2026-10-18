const ApiError = require('../common/api-error');
const { RouterBase, } = require('./router-base');
const { generateBcryptAsync, compareBcryptAsync, } = require('../common/cryptography');
const { MongoDb, } = require('../mongodb');
const { MongoServerError } = require('mongodb');
const { generateUidAsync, } = require('../common/uid-generator');
const jsonWebToken = require('jsonwebtoken');
const { authorize } = require('../middleware/authorization');
const { googleDriveAuthorize, } = require('../middleware/google-drive-authorization');
const { GoogleDriveService } = require('../services/google-drive-service');
const { configuration } = require('../configuration');

const cloudServiceProvider = "GOOGLE_DRIVE";
const userRouter = new RouterBase();
const googleDriveService = GoogleDriveService.getInstance();

const generateToken = user => {
  return jsonWebToken.sign(user, configuration.jsonWebToken.secretKey);
};

userRouter.post('/login', async (request, response) => {
  const { email, password, } = request.body;

  const database = MongoDb.getInstance().getDatabase();
  const users = database.collection('User');
  const user = await users.findOne({ email: email, });

  if (!user) { throw new ApiError(404, 'No account associated with the provided email address.'); }

  const isPasswordMatched = await compareBcryptAsync(password, user.hashedPassword);

  if (!isPasswordMatched) { throw new ApiError(400, 'Incorrect password provided.'); }

  const _user = {
    userId: user._id,
    email: user.email,
    cloudServiceProvider: user.cloudServiceProvider,
  };

  const accessToken = generateToken(_user);
  const googleDriveClient = await googleDriveService.createGoogleDriveClientAsync(user);
  const isGoogleDriveAuthorized = !!googleDriveClient;
  const googleDriveAuthorizationUrl = isGoogleDriveAuthorized ? undefined : await googleDriveService.generateAuthorizationUrlAsync({
    userId: user._id,
  });

  return {
    message: 'Successfully logged in.',
    data: {
      user: _user,
      accessToken: `bearer ${accessToken}`,
      isGoogleDriveAuthorized: isGoogleDriveAuthorized,
      googleDriveAuthorizationUrl: googleDriveAuthorizationUrl,
    },
  };
});

userRouter.post('/register', async (request, response) => {
  const { email, password, } = request.body;
  // generates hash of the provided password using Bcrypt algorithm...
  const hashedPassword = await generateBcryptAsync(password);
  const database = MongoDb.getInstance().getDatabase();
  const users = database.collection('User');
  const uid = await generateUidAsync();
  const user = {
    _id: uid,
    email: email,
    hashedPassword: hashedPassword,
    cloudServiceProvider: cloudServiceProvider,
  };

  try {
    await users.insertOne(user);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000 && error.keyPattern['email'] === 1) {
      throw new ApiError(400, 'Requested email already exists.', error.stack);
    }

    throw error;
  }

  const _user = {
    userId: user._id,
    email: user.email,
    cloudServiceProvider: user.cloudServiceProvider,
  };

  const accessToken = generateToken(_user);
  const googleDriveClient = await googleDriveService.createGoogleDriveClientAsync(user);
  const isGoogleDriveAuthorized = !!googleDriveClient;
  const googleDriveAuthorizationUrl = isGoogleDriveAuthorized ? undefined : await googleDriveService.generateAuthorizationUrlAsync({
    userId: user._id,
  });

  return {
    message: 'Account registration successful.',
    data: {
      user: _user,
      accessToken: `bearer ${accessToken}`,
      isGoogleDriveAuthorized: isGoogleDriveAuthorized,
      googleDriveAuthorizationUrl: googleDriveAuthorizationUrl,
    },
  }
});

userRouter.get('/validate-google-drive-authorization', authorize,
  googleDriveAuthorize, async (request, response) => {
    return {
      message: 'You are authorized to use Google Drive.',
    };
  });

userRouter.get('/google-drive-authorize', async (request, response) => {
  const { code: authorizationCode, state, } = request.query;

  // if authorization code is not provided...
  if (!authorizationCode) {
    throw new ApiError(400, 'Authorization code must be provided.');
  }

  const additionalData = JSON.parse(decodeURIComponent(state));

  try {
    await googleDriveService.authorizeAsync(additionalData.userId, authorizationCode);
  } catch (error) {
    console.error('An error occurred during Google Drive authorization process.', error);

    throw new ApiError(400, 'Invalid authorization code provided.', error.stack);
  }

  return {
    message: 'Google Drive authorization successful.',
  };
});

// revokes access to Google Drive...
userRouter.delete('/google-drive-authorize', authorize,
    googleDriveAuthorize, async (request, response) => {
  const user = request.user;
  const database = MongoDb.getInstance().getDatabase();
  const users = database.collection('User');

  await users.updateOne({ _id: user._id, }, { $unset: { credentials: 1 }, });

  return {
    message: 'Google Drive authorization revoked successfully.',
  };
});

module.exports.userRouter = userRouter;
