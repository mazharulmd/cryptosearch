const { configuration } = require("../configuration");
const jsonWebToken = require('jsonwebtoken');
const ApiError = require("../common/api-error");
const { MongoDb } = require("../mongodb");

module.exports.authorize = async (request, _, next) => {
  try {
    const authorization = request.headers['authorization'];

    if (typeof authorization !== 'string' || !authorization.toLowerCase().startsWith('bearer ')) {
      throw new ApiError(401, 'You are not authorized to access the resource.');
    }

    const token = authorization.substring(7);

    if (!token) {
      throw new ApiError(401, 'You are not authorized to access the resource.');
    }

    const payload = jsonWebToken.verify(token, configuration.jsonWebToken.secretKey);
    const database = MongoDb.getInstance().getDatabase();
    const users = database.collection('User');
    const user = await users.findOne({ _id: payload.userId, });

    if (!user) {
      throw new ApiError(401, 'You are not authorized to access the resource.');
    }

    request.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
