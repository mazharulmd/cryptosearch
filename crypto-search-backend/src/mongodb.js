const { Db, MongoClient } = require('mongodb');
const { configuration, } = require('./configuration');

module.exports.MongoDb = class MongoDb {

  constructor() {
    console.log('Initializing MongoDB client...');

    this._mongoDbConnectionString = MongoDb._prepareMongoDbConnectionString(configuration.mongoDbConfiguration);
    this._mongoClient = new MongoClient(this._mongoDbConnectionString);
    this._database = undefined;

    console.log('MongoDB client initialization successful...');
  }

  /**
   * 
   * @returns {Promise<MongoDb>}
   */
  async connectAsync() {
    console.log('Connecting to MongoDB server...');

    await this._mongoClient.connect();

    console.log('Successfully connected to MongoDB server...');

    this._database = this._mongoClient.db(configuration.mongoDbConfiguration.databaseName);

    await this._createIndexesAsync();

    return this;
  }

  /**
   * This method creates indexes for all collections.
   * Modify this method to configure indexes.
   */
  async _createIndexesAsync() {
    const usersCollection = this._database.collection('User');

    await usersCollection.createIndex({ email: 1 }, { unique: true });

    const fileInfoCollection = this._database.collection('FileInfo');

    await fileInfoCollection.createIndex({ fileId: 1, }, { unique: true });
    await fileInfoCollection.createIndex({ fileId: 1, userId: 1 }, { unique: true });
  }

  /**
   * @returns {Db}
   */
  getDatabase() {
    return this._database;
  }

  static _instance = new MongoDb();

  /**
   * 
   * @param {Object} mongoDbConfiguration 
   * @returns {String} 
   */
  static _prepareMongoDbConnectionString(mongoDbConfiguration) {
    const { host, port, username, password } = mongoDbConfiguration;
    let { authenticationDatabase, directConnection, useSsl, readPreference } =
      mongoDbConfiguration;

    authenticationDatabase =
      typeof authenticationDatabase === 'string'
        ? authenticationDatabase
        : 'admin';
    directConnection =
      typeof directConnection === 'boolean' ? directConnection : true;
    useSsl = typeof useSsl === 'boolean' ? useSsl : false;
    readPreference =
      typeof readPreference === 'string' ? readPreference : 'primary';

    return `mongodb://${username ? username : ''}${password ? `:${password}@` : ''}${host}:${port}/?authSource=${authenticationDatabase}&readPreference=${readPreference}&directConnection=${directConnection}&ssl=${useSsl}`;
  }

  /**
   * @returns {MongoDb} 
   */
  static getInstance() {
    return this._instance;
  }
}
