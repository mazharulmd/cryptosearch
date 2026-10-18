const ApiError = require("../common/api-error");
const { GoogleDriveService, } = require('../services/google-drive-service');

const googleDriveService = GoogleDriveService.getInstance();

module.exports.googleDriveAuthorize = async (request, _, next) => {
  try {
    const user = request.user;

    // if JWT token is not provided...
    if (!user) {
      throw new ApiError(401, 'You are not authorized to access the resource.');
    }

    const googleDriveClient = await googleDriveService.createGoogleDriveClientAsync(user);

    if (!googleDriveClient) {
      const googleDriveAuthorizationUrl = await googleDriveService.generateAuthorizationUrlAsync({
        userId: user._id,
      });

      // throws error and sends Google Drive authorization URL...
      throw new ApiError(401, 'You are not authorized to access the resource.', undefined, {
        googleDriveAuthorizationUrl: googleDriveAuthorizationUrl,
      });
    }

    // adds Google Drive client to current context...
    request.googleDriveClient = googleDriveClient;

    next();
  } catch (error) {
    next(error);
  }
};
