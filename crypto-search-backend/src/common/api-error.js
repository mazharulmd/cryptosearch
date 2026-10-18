const ApiResponse = require("./api-response");

class ApiError extends Error {

  /**
   * 
   * @param {Number} status 
   * @param {String} message 
   * @param {String} stackTrace 
   * @param {Object} data 
   */
  constructor(status, message, stackTrace, data) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.status = status;
    this.data = data;

    if (stackTrace) {
      this.stack = stackTrace;
    }
  }

  /**
   * 
   * @param {Boolean} includeStackTrace 
   * @returns {ApiResponse} 
   */
  toResponse(includeStackTrace) {
    let data = this.data;

    if (includeStackTrace && this.stack) {
      if (!data) { data = {}; }

      data.stackTrace = this.stack;
    }

    return {
      date: new Date().toUTCString(),
      status: this.status,
      message: this.message,
      data: data,
    };
  }

  /**
   * 
   * @param {Error} error 
   * @param {Number} status 
   * @returns {ApiError} 
   */
  static fromError(error, status = 500) {
    // if 'error' object is already an instance of ApiError, we return the same object...
    if (error instanceof ApiError) { return error; }

    // otherwise, we create new 'ApiError'...
    return new ApiError(status, error.message, error.stack);
  }
}

module.exports = ApiError;
