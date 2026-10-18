// imports configuration file...
const { configuration, } = require('./configuration');

// imports logger...
const logger = require('./common/logger').get();
// overrides console methods with winston logger methods...
global.console.log = logger.info.bind(logger);
global.console.info = logger.info.bind(logger);
global.console.warn = logger.warn.bind(logger);
global.console.error = logger.error.bind(logger);
global.console.debug = logger.debug.bind(logger);

const mongodb = require('./mongodb').MongoDb.getInstance();
const http = require('http');
const express = require('express');
const expressFileUpload = require('express-fileupload');
const cors = require('cors');
const FileUtilities = require('./common/file-utilities');
const { requestLogger, } = require('./middleware/request-logger');
const { errorHandler, } = require('./middleware/error-handler');
const { userRouter, } = require('./routers/user-router');
const { fileRouter, } = require('./routers/file-router');
const { keyRouter, } = require('./routers/key-router');

const application = express();
const httpServer = new http.Server(application);

function configureApplication() {
  application.use(requestLogger);
  // adding CORS middleware...
  application.use(cors());
  // adding JSON middleware...
  application.use(express.json());
  // adding file upload middleware...
  application.use(expressFileUpload({
    useTempFiles: true,
    tempFileDir: configuration.uploads.tempDirectoryPath,
    fileSize: configuration.uploads.maxFileSize,
  }));

  // binding routers...
  userRouter.bind(application, '/api/users');
  fileRouter.bind(application, '/api/files');
  keyRouter.bind(application, '/api/keys');

  application.use(errorHandler);
}

mongodb.connectAsync()
  .then(async mongodb => {
    // creates uploads directory...
    await FileUtilities.createDirectoryAsync(configuration.uploads.directoryPath);
    await FileUtilities.createDirectoryAsync(configuration.downloadsDirectoryPath);
    await FileUtilities.createDirectoryAsync(configuration.encryptedFilesDirectoryPath);

    configureApplication();

    httpServer.listen(configuration.port, configuration.host, async () => {
      console.info(`Server is listening at http://${configuration.host}:${configuration.port}/api`);
    });
  })
  .catch(error => {
    console.error('An unexpected error occurred.', error);
  });
