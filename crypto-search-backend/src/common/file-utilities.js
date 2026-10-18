const { RandomGenerator } = require('@shahadul-17/random-generator');
const fs = require('fs');
const asyncFs = require('fs/promises');
const path = require('path');

class FileUtilities {
  /**
   * 
   * @param {String} filePath 
   * @returns {Promise<boolean>} 
   */
  static deleteFileAsync(filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, error => {
        if (error) {
          resolve(false);

          return;
        }

        resolve(true);
      });
    });
  }

  static exists(path) {
    return fs.existsSync(path);
  }

  static async createDirectoryAsync(directoryPath) {
    if (FileUtilities.exists(directoryPath)) { return; }

    await asyncFs.mkdir(directoryPath, { recursive: true, });
  }

  /**
   * 
   * @param {String} filePath 
   * @param {String} fileName 
   * @param {Number} length 
   * @returns {String}
   */
  static generateFileName(filePath, fileName, length = 64) {
    const fileExtension = path.extname(fileName);
    let _fileName;
    let fileExists;

    do {
      _fileName = RandomGenerator.generateString(length - fileExtension.length);
      _fileName = `${_fileName}${fileExtension}`;
      fileExists = FileUtilities.exists(`${filePath}/${_fileName}`);
    } while (fileExists);

    return _fileName;
  }

  /**
   * 
   * @param {String} filePath 
   * @param {*} file 
   * @returns {Boolean}
   */
  static moveFileAsync(filePath, file) {
    return new Promise((resolve, reject) => {
      file.mv(filePath, error => {
        if (error) {
          console.error(error);

          resolve(false);

          return;
        }

        resolve(true);
      });
    });
  };
};

module.exports = FileUtilities;
