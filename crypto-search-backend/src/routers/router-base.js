const { resolve: getAbsolutePath, } = require('path');
const express = require('express');

module.exports.RouterBase = class RouterBase {

  constructor() {
    this._router = express.Router();

    // binding methods...
    this.handleRequestAsync = this.handleRequestAsync.bind(this);
    this.all = this.all.bind(this);
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
    this.getRouter = this.getRouter.bind(this);
    this.bindToApplication = this.bind.bind(this);
  }

  async handleRequestAsync(method, path, ...handlers) {
    method = method.toLowerCase();

    const _handlers = handlers.slice(0, handlers.length - 1);

    return this._router[method](path, ..._handlers, async (request, response, next) => {
      try {
        const handler = handlers[handlers.length - 1];
        const responseData = await handler(request, response, next);
        const status = responseData.status ?? 200;

        if (responseData.type === 'file' &&
            typeof responseData.filePath === 'string' &&
            responseData.filePath.length) {
          return response.sendFile(getAbsolutePath(responseData.filePath));
        }

        return response.status(status).send({
          date: new Date().toUTCString(),
          status: status,
          ...responseData,
        });
      } catch (error) {
        next(error);
      }
    });
  }

  all(path, ...handlers) {
    return this.handleRequestAsync('all', path, ...handlers);
  }

  get(path, ...handlers) {
    return this.handleRequestAsync('get', path, ...handlers);
  }

  post(path, ...handlers) {
    return this.handleRequestAsync('post', path, ...handlers);
  }

  put(path, ...handlers) {
    return this.handleRequestAsync('put', path, ...handlers);
  }

  patch(path, ...handlers) {
    return this.handleRequestAsync('patch', path, ...handlers);
  }

  delete(path, ...handlers) {
    return this.handleRequestAsync('delete', path, ...handlers);
  }

  getRouter() { return this._router; }

  bind(application, path) {
    application.use(path, this._router);
  }
};
