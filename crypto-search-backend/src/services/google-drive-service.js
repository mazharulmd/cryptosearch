const fs = require('fs');
const asyncFs = require('fs/promises');
const { google, } = require('googleapis');
const ApiError = require('../common/api-error');
const { configuration, } = require('../configuration');
const { MongoDb } = require('../mongodb');

class GoogleDriveService {

  constructor() {
    this.authorizeAsync = this.authorizeAsync.bind(this);
  }

  /** Returns true if user has Google Drive credentials. Otherwise returns false. */
  isAuthorized(user) { return !!user.credentials; }

  /** Creates new OAuth2Client. */
  async createOAuth2ClientAsync() {
    const credentialsAsJson = await asyncFs.readFile(configuration.googleDrive.credentialsPath, 'utf-8');
    const credentials = JSON.parse(credentialsAsJson);
    const { client_secret, client_id, redirect_uris, } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    return oAuth2Client;
  }

  /** Generates authorization URL. */
  async generateAuthorizationUrlAsync(additionalData = undefined) {
    const state = additionalData ?
      encodeURIComponent(JSON.stringify(additionalData))
      : undefined;
    const oAuth2Client = await this.createOAuth2ClientAsync();
    const authorizationUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: configuration.googleDrive.scopes,
      state: state,
    });

    return authorizationUrl;
  }

  /** Creates a new Google Drive client. */
  async createGoogleDriveClientAsync(user) {
    // if user is not authorized, we will return undefined...
    if (!this.isAuthorized(user)) { return undefined; }

    try {
      const oAuth2Client = await this.createOAuth2ClientAsync();
      const credentials = {
        ...user.credentials,
        // if credentials does not contain refresh token but user does, we'll set user's previous refresh token...
        refresh_token: user.credentials?.refresh_token ?? user.googleDriveRefreshToken,
      };

      oAuth2Client.setCredentials(credentials);

      // creates google drive client...
      const drive = google.drive({ version: 'v3', auth: oAuth2Client, });

      return drive;
    } catch (error) {
      console.error('An error occurred while creating Google Drive client.', error);

      return undefined;
    }
  }

  /** Generates credentials for the authorization code. */
  async generateCredentialsAsync(authorizationCode) {
    const oAuth2Client = await this.createOAuth2ClientAsync();
    const { tokens, } = await oAuth2Client.getToken(authorizationCode);

    return tokens;
  }

  async authorizeAsync(userId, authorizationCode) {
    const credentials = await this.generateCredentialsAsync(authorizationCode);
    const database = MongoDb.getInstance().getDatabase();
    const users = database.collection('User');
    const user = await users.findOne({ _id: userId, });

    if (user === null) { throw new ApiError(404, 'No account associated with the specified ID.'); }
    // if user does not contain refresh token but credentials contain refresh token, we'll set refresh token from credentials for future use...
    if (!user.googleDriveRefreshToken && credentials.refresh_token) { user.googleDriveRefreshToken = credentials.refresh_token; }
    // if credentials does not contain refresh token but user does, we'll set user's previous refresh token...
    if (user.googleDriveRefreshToken && !credentials.refresh_token) { credentials.refresh_token = user.googleDriveRefreshToken; }

    // updates user record on database...
    await users.updateOne({ _id: userId, }, {
      $set: {
        credentials: credentials,
        googleDriveRefreshToken: user.googleDriveRefreshToken,
      }
    });
  }

  async listFilesAsync({ googleDriveClient, limit, pageToken, folderId, }) {
    const response = await googleDriveClient.files.list({
      q: folderId ? `'${folderId}' in parents` : undefined,
      pageSize: limit,
      // fields: 'nextPageToken, files(id, name)',
      pageToken: pageToken,
    });

    return response.data;
  }

  async uploadFileAsync({ googleDriveClient, fileInfo, folderId, }) {
    const file = await googleDriveClient.files.create({
      media: {
        mimeType: fileInfo.mimeType,
        body: fileInfo.content,
      },
      fields: 'id',
      requestBody: {
        name: fileInfo.name,
        parents: !folderId || folderId === 'ROOT' ? undefined : [folderId],
      },
    });

    return file;
  }

  async updateFileAsync({ googleDriveClient, fileInfo, folderId, }) {
    const file = await googleDriveClient.files.update({
      fileId: fileInfo.id,
      media: {
        mimeType: fileInfo.mimeType,
        body: fileInfo.content,
      },
      fields: 'id',
      requestBody: {
        name: fileInfo.name,
      },
    });

    return file;
  }

  downloadFileAsync({ googleDriveClient, fileOutputPath, fileId, }) {
    return new Promise(async (resolve, reject) => {
      try {
        const outputStream = fs.createWriteStream(fileOutputPath);
        const file = await googleDriveClient.files.get({
          fileId: fileId,
          alt: 'media',
        }, {
          responseType: 'stream',
        });

        file.data
          .on('end', () => {
            console.log(`Download completed successfully [${fileId}]...`);

            resolve(file);
          })
          .on('error', error => {
            console.error(`An error occurred while downloading the file [${fileId}]...`, error);

            reject(error);
          })
          .pipe(outputStream);
      } catch (error) {
        console.error(`An error occurred while downloading the file [${fileId}]...`, error);

        reject(error);
      }
    });
  }

  async shareAsync({ googleDriveClient, fileId, email, role, }) {
    const permission = await googleDriveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        type: 'user',
        role: role ?? 'reader',
        emailAddress: email,
      },
      fields: 'id',
    });

    return permission;
  }

  static _instance = new GoogleDriveService();

  static getInstance() { return this._instance; }
};

module.exports.GoogleDriveService = GoogleDriveService;
