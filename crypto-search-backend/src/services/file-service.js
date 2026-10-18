const { encryptAes } = require("../common/cryptography");

class FileService {

  constructor() {
    this.getAllKeywords = this.getAllKeywords.bind(this);
    this.getInvertedIndex = this.getInvertedIndex.bind(this);
  }

  getAllKeywords(index) {
    const allKeywords = new Set();

    for (const { keywords, } of index) {
      for (const keyword of keywords) {
        allKeywords.add(keyword);
      }
    }

    return Array.from(allKeywords);
  }

  getInvertedIndex(index, secretKey) {
    const allKeywords = this.getAllKeywords(index);
    const invertedIndex = {};

    for (const keyword of allKeywords) {
      const encryptedKeyword = encryptAes(keyword, secretKey, 'hex');
      invertedIndex[encryptedKeyword] = [];

      for (let i = 0; i < index.length; i++) {
        const { fileId, keywords, } = index[i];

        if (!keywords.includes(keyword)) { continue; }

        invertedIndex[encryptedKeyword].push(fileId);

        continue;
      }
    }

    return invertedIndex;
  }

  /**
   * @param {Object} currentIndex 
   * @param {Object} newIndex 
   * @returns {Object} 
   */
  mergeInvertedIndexes(currentIndex, newIndex) {
    const index = { ...currentIndex };

    for (const key in newIndex) {
      const currentValue = currentIndex[key];
      const newValue = newIndex[key];

      // if value is not an array, it means this key
      // doesn't exist in current inverted index...
      if (!Array.isArray(currentValue)) {
        // so we need to add new entry to our index...
        index[key] = newValue;

        continue;
      }

      // if value is an array, it means we shall merge new array with our current one...
      const mergedValue = [...currentValue, ...newValue];

      // add merged value to the index...
      index[key] = mergedValue;
    }

    return index;
  }

  static _instance = new FileService();

  static getInstance() { return this._instance; }
};

module.exports.FileService = FileService;
