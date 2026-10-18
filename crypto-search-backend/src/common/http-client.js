const { URL } = require('url');
const http = require('http');
const https = require('https');
const { IncomingMessage } = require('http');
const JsonSerializer = require('../common/json-serializer');

class HttpClient {
  /**
   * Checks if protocol is 'https'
   * @param {URL} url 
   * @returns {Boolean}
   */
  static isHttpsProtocol(url) {
    return url.protocol === 'https:';
  }

  /**
   * 
   * @param {IncomingMessage} response 
   * @returns {Boolean}
   */
  static isTextContent(response) {
    const contentType = response.headers['content-type'];

    if (!contentType) { return false; }

    return contentType.toLowerCase().includes('text');
  }

  /**
   * 
   * @param {IncomingMessage} response 
   * @returns {Boolean}
   */
  static isJsonContent(response) {
    const contentType = response.headers['content-type'];

    if (!contentType) { return false; }

    return contentType.toLowerCase().includes('json');
  }

  /**
   * 
   * @param {String} host 
   * @param {String} urlString 
   * @returns {String} 
   */
  static extractPath(host, urlString) {
    const indexOfHost = urlString.indexOf(host);

    if (indexOfHost === -1) { return ''; }

    const path = urlString.substring(indexOfHost + host.length);

    return path;
  }

  /**
   * 
   * @param {IncomingMessage} response 
   * @returns {Promise<String>}
   */
  static readTextContentAsync(incomingMessage) {
    return new Promise((resolve, reject) => {
      incomingMessage.setEncoding('utf-8');

      let content = '';

      incomingMessage.on('data', chunk => {
        content += chunk;
      });

      incomingMessage.on('end', () => {
        // const content = JsonSerializer.deserialize<IAnyObject>(_content);

        resolve(content);
      });

      // handles response error...
      incomingMessage.on('error', error => reject(error));
    });
  }

  /**
   * 
   * @param {IncomingMessage} incomingMessage 
   * @returns {Promise<ArrayBuffer>}
   */
  static readBinaryContentAsync(incomingMessage) {
    return new Promise((resolve, reject) => {
      incomingMessage.setEncoding('binary');

      const chunks = [];

      incomingMessage.on('data', chunk => {
        chunks.push(Buffer.from(chunk, 'binary'));
      });

      incomingMessage.on('end', () => {
        const content = Buffer.concat(chunks).buffer;

        resolve(content);
      });

      // handles response error...
      incomingMessage.on('error', error => reject(error));
    });
  }

  static sendRequestAsync(options) {
    return new Promise((resolve, reject) => {
      const {
        method, url, headers, body,
        keepAlive, timeout, redirect,
      } = options;
      // parses the URL...
      const _url = new URL(url);
      // selects appropriate http client based on URL...
      const httpClient = this.isHttpsProtocol(_url) ? https : http;
      // serializes body as JSON...
      const jsonBody = JsonSerializer.serialize(body);
      // creating agent and setting 'keepAlive'...
      const agent = new httpClient.Agent({ keepAlive: keepAlive, });
      // preparing request options...
      const requestOptions = {
        method: method,
        host: _url.host,
        protocol: _url.protocol,
        path: this.extractPath(_url.host, url),
        agent: agent,
        headers: headers,
      };
      // requests for content...
      const request = httpClient.request(requestOptions, async response => {
        const { statusCode, } = response;

        if (redirect && (statusCode === 301 || statusCode === 302)) {
          const { location } = response.headers;

          if (!location) {
            resolve({ incomingMessage: response, });

            return;
          }

          // NOTE: NEED TO ADD SUPPORT FOR RELATIVE PATH IN LOCATION HEADER...
          // follows redirects until 200 status code is received...
          this.sendRequestAsync({ ...options, url: location, })
            .then(_response => resolve(_response))
            .catch(error => reject(error));
        } else {
          const httpClientResponse = { incomingMessage: response, };

          try {
            if (this.isJsonContent(response)) {
              const content = await this.readTextContentAsync(response);

              if (content.charAt(0) === '[') {            // array...
                httpClientResponse.body = JsonSerializer.deserialize(content);
              } else if (content.charAt(0) === '{') {     // object...
                httpClientResponse.body = JsonSerializer.deserialize(content);
              } else {
                httpClientResponse.body = content;
              }
            } else if (this.isTextContent(response)) {
              const content = await this.readTextContentAsync(response);

              httpClientResponse.body = content;
            } else {
              const content = await this.readBinaryContentAsync(response);

              httpClientResponse.body = content;
            }
          } catch (error) {
            reject(error);

            return;
          }

          resolve(httpClientResponse);
        }
      });

      // handles error...
      request.on('error', error => { reject(error); });

      // if timeout is provided, we set request timeout...
      timeout && request.setTimeout(timeout, () => {
        // destroy the request object on timeout...
        request.destroy();
        // rejects a new error...
        reject(new Error(`Request timed out for URL ${url} after ${timeout / 1000.0} seconds.`));
      });

      request.write(jsonBody);
      request.end();
    });
  }
}

module.exports = HttpClient;
