// imports configuration file...
const { configuration, } = require('../configuration');

// imports winston...
const winston = require('winston');
const JsonSerializer = require('./json-serializer');
const { splat, combine, timestamp, printf } = winston.format;

class Logger {

  constructor() {
    const customFormat = printf(({
      timestamp,
      level,
      message,
      label = '',
      ...meta
    }) => `[${level.toUpperCase()}] [${timestamp}]${label} ${message} ${JsonSerializer.serialize(meta, 2, false)}`);

    const logsDirectory = configuration.logsDirectory;
    const instanceId = configuration.instanceId;

    this.logger = winston.createLogger({
      level: 'info',
      format: combine(
        timestamp({ format: 'MMM D, YYYY hh:mm:ss A', }),
        splat(),
        customFormat,
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: `${logsDirectory}/error${instanceId ? `-${instanceId}` : ''}.log`, level: 'error' }),
        new winston.transports.File({ filename: `${logsDirectory}/combined${instanceId ? `-${instanceId}` : ''}.log` }),
      ],
    });
  }

  /* formatMeta(meta) {
    const splat = meta[Symbol.for('splat')];

    if (splat && splat.length) {
      return splat.length === 1 ? JSON.stringify(splat[0], undefined, 2)
        : ;
    }

    return JSON.stringify(splat, undefined, 2);
  }; */

  static instance = new Logger();

  /**
   * 
   * @returns {winston.Logger}
   */
  static get() {
    return this.instance.logger;
  }
}

module.exports = Logger;
