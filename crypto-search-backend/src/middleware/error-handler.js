const ApiError = require("../common/api-error");
const { configuration } = require("../configuration");

module.exports.errorHandler = async (error, request, response, next) => {
  try {
    const apiError = ApiError.fromError(error);
    const apiResponse = apiError.toResponse(configuration.includeErrorStack);
  
    console.error(`An error occurred while processing '${request.method}' request for http://${configuration.host}:${configuration.port}${request.originalUrl} from ${request.ipAddress}.`, error);
  
    response.status(apiResponse.status).send(apiResponse);
  } catch (error) {
    next(error);
  }
};
