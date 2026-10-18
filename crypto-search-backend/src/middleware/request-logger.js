const { configuration } = require("../configuration");

function getClientIpAddress(request) {
  // actual IP address of the client...
  const ipAddress = request.headers['x-forwarded-for']
    ?? request.socket.remoteAddress;

  return ipAddress;
}

module.exports.requestLogger = async (request, _, next) => {
  try {
    request.ipAddress = getClientIpAddress(request);

    console.info(`'${request.method}' request received from ${request.ipAddress} for http://${configuration.host}:${configuration.port}${request.originalUrl}`);

    next();
  } catch (error) {
    next(error);
  }
};
