# CryptoSearch

A web application to **search over encrypted data stored in the cloud**.

CryptoSearch lets users encrypt files before they leave the server, store them in their own **Google Drive**, and later find them by keyword. The cloud provider never sees the plaintext files or the plaintext keywords. Search uses an **encrypted inverted index**, a form of searchable symmetric encryption.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Set up MongoDB](#2-set-up-mongodb)
  - [3. Set up Google Drive API credentials](#3-set-up-google-drive-api-credentials)
  - [4. Configure and run the backend](#4-configure-and-run-the-backend)
  - [5. Configure and run the frontend](#5-configure-and-run-the-frontend)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Author](#author)
- [License](#license)

---

## Features

- **User accounts**: registration and login, with passwords hashed by bcrypt and sessions handled by JWT.
- **Google Drive integration**: each user authorizes their own Drive through OAuth 2.0 and files are stored there.
- **Client-side keyword tagging**: you give keywords for each file when you upload it.
- **AES-256 file encryption**: files are encrypted before upload, each with its own random key.
- **Encrypted inverted index**: keywords are encrypted with a per-folder secret key, so searches match encrypted tokens and plaintext never reaches the cloud.
- **Secure key exchange**: each file's decryption key is wrapped with a per-session **RSA-4096** public key before it is sent to the client.
- **File sharing**: share a file with another user through Google Drive, with an email notification sent by SMTP.

## How It Works

```
 ┌──────────┐      keywords + files      ┌─────────────┐   encrypted files + index   ┌──────────────┐
 │  React   │ ─────────────────────────▶ │   Express   │ ──────────────────────────▶ │ Google Drive │
 │ frontend │ ◀───────────────────────── │   backend   │ ◀────────────────────────── │   (cloud)    │
 └──────────┘   search results / files   └──────┬──────┘                             └──────────────┘
                                                │ users, keys, file metadata
                                                ▼
                                           ┌─────────┐
                                           │ MongoDB │
                                           └─────────┘
```

1. **Upload**: the user picks a Drive folder, selects files, and enters comma-separated keywords. The backend encrypts each file with AES-256-CTR under a random key and uploads the ciphertext to Google Drive.
2. **Indexing**: every keyword is encrypted with the folder's secret key, which gives a mapping `encrypted keyword → [fileIds]`. That inverted index is merged with any existing index and stored in the same Drive folder as `Secure_Search_Data_Inverted_Index.json`.
3. **Search**: the search keyword is encrypted with the same secret key and looked up in the encrypted index. Matching happens entirely on ciphertext.
4. **Download**: the client generates an RSA key pair and requests the file's decryption key. The backend returns that key encrypted with the RSA public key. The client sends it back with its private key, and the backend decrypts the file and streams it to the user.

## Tech Stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React 17, React Router 5, Redux and redux-persist, Material UI 5, Font Awesome, React Toastify |
| Backend  | Node.js, Express 4, express-fileupload, Winston (logging), Nodemailer |
| Database | MongoDB 4+ |
| Cloud    | Google Drive API v3 (`googleapis`) |
| Crypto   | Node `crypto` (AES-256-CTR, RSA-4096), `crypto-js`, `bcryptjs`, `jsonwebtoken` |

## Project Structure

```
cryptosearch/
├── crypto-search-backend/            # Express REST API
│   ├── src/
│   │   ├── application.js            # Entry point (server bootstrap)
│   │   ├── configuration.js          # App configuration (reads from .env)
│   │   ├── mongodb.js                # MongoDB connection + indexes
│   │   ├── common/                   # Cryptography, logging, file utilities, ...
│   │   ├── middleware/               # JWT auth, Google Drive auth, error handling
│   │   ├── routers/                  # /api/users, /api/files, /api/keys
│   │   └── services/                 # Google Drive, inverted index, mail
│   ├── .env.example                  # Environment variable template
│   ├── google-api-credentials.example.json
│   ├── nodemon.json
│   └── package.json
├── crypto-search-frontend/           # React single-page app
│   ├── public/
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Login, Signup, FileList, Upload, Search, Share, ...
│   │   ├── redux/                    # Store, actions, reducers
│   │   ├── configuration.js          # Backend API host
│   │   ├── rest-api-client.configuration.json  # REST route map
│   │   └── routes.js
│   └── package.json
├── LICENSE
└── README.md
```

## Prerequisites

Install the following before you begin:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 16 or newer (LTS recommended) | https://nodejs.org |
| npm | comes with Node.js | — |
| MongoDB Community Server | 4.4 or newer | https://www.mongodb.com/try/download/community |
| Git | any recent version | https://git-scm.com |
| Google account | — | For the Google Cloud Console and Drive |

Check that the tools are installed:

```bash
node --version
```

```bash
npm --version
```

```bash
mongod --version
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/mazharulmd/cryptosearch.git
```

```bash
cd cryptosearch
```

### 2. Set up MongoDB

Start a local MongoDB server on the default port `27017`.

- **Windows**: MongoDB usually installs as a service and starts automatically. Otherwise, run `mongod`.
- **macOS (Homebrew)**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`
- **Docker** (any OS):

  ```bash
  docker run -d --name cryptosearch-mongo -p 27017:27017 mongo:6
  ```

The backend creates the database (`CryptoSearchDevelopment`) and its indexes automatically the first time it starts.

### 3. Set up Google Drive API credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create a new project, or select an existing one.
2. Go to **APIs & Services → Library**, search for **Google Drive API**, and click **Enable**.
3. Go to **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - Fill in the app name and support email.
   - Add the scope `https://www.googleapis.com/auth/drive`.
   - Under **Test users**, add the Google accounts you will log in with.
4. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `http://localhost:3000` and `http://127.0.0.1:3000`
   - **Authorized redirect URIs**: `http://127.0.0.1:3001/api/users/google-drive-authorize`
5. Click **Download JSON**, rename the file to `google-api-credentials.json`, and place it in `crypto-search-backend/`.
   The file must have a top-level `"web"` key. See `google-api-credentials.example.json` for the expected shape.

> The redirect URI must match the backend `HOST` and `PORT` exactly.

### 4. Configure and run the backend

```bash
cd crypto-search-backend
```

Install dependencies:

```bash
npm install
```

Create your environment file from the template:

```bash
cp .env.example .env
```

(On Windows PowerShell, run `Copy-Item .env.example .env` instead.)

Open `.env` and set at least these values:

- `JWT_SECRET_KEY`: a long random string
- `RSA_PRIVATE_KEY_PASSPHRASE`: a long random string
- `SMTP_USERNAME` / `SMTP_PASSWORD`: optional, needed only for real share-notification emails

To generate a random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the backend in development mode, which auto-reloads with nodemon:

```bash
npm run dev
```

Or start it in production mode:

```bash
npm start
```

When you see the following line, the backend is running:

```
Server is listening at http://127.0.0.1:3001/api
```

The `uploads/`, `downloads/`, `encrypted/`, `temporary-files/` and `logs/` directories are created automatically.

### 5. Configure and run the frontend

Open a **new terminal** from the repository root:

```bash
cd crypto-search-frontend
```

```bash
npm install
```

If the backend runs on a host or port other than `http://127.0.0.1:3001`, update both of these files:

- `src/configuration.js` → `restApiClient.host`
- `src/rest-api-client.configuration.json` → `host`

Start the development server:

```bash
npm start
```

The app opens at **http://localhost:3000**.

To create an optimized production build in `build/`:

```bash
npm run build
```

## Usage

1. **Sign up** at `/signup` with an email and password, then **log in**.
2. When asked, **authorize Google Drive**. You are redirected to Google's consent screen and then back to the app.
3. **File list** (`/list`): browse your Drive folders and files.
4. **Upload** (`/upload/:folderId`): choose files and enter keywords separated by commas, for example `patient, prescription, 2022`. Files are encrypted and uploaded, and the encrypted index is updated.
5. **Search** (`/search/:folderId`): enter a keyword to find matching encrypted files, then download and decrypt them.
6. **Share** (`/share/:folderId`): share a file with another user's email address.
7. **Log out** from `/logout`.

## Environment Variables

Backend variables live in `crypto-search-backend/.env`:

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `HOST` | | `127.0.0.1` | Host the API server binds to |
| `PORT` | | `3001` | Port the API server listens on |
| `MONGODB_HOST` | | `localhost` | MongoDB host |
| `MONGODB_PORT` | | `27017` | MongoDB port |
| `MONGODB_USERNAME` | | _(empty)_ | MongoDB username, if auth is enabled |
| `MONGODB_PASSWORD` | | _(empty)_ | MongoDB password, if auth is enabled |
| `MONGODB_DATABASE` | | `CryptoSearchDevelopment` | Database name |
| `JWT_SECRET_KEY` | ✅ | — | Secret used to sign JWT auth tokens |
| `RSA_PRIVATE_KEY_PASSPHRASE` | ✅ | — | Passphrase that protects generated RSA private keys |
| `GOOGLE_CREDENTIALS_PATH` | | `./google-api-credentials.json` | Path to the Google OAuth client JSON |
| `SMTP_HOST` | | `smtp.gmail.com` | SMTP server |
| `SMTP_PORT` | | `465` | SMTP port |
| `SMTP_SECURE` | | `true` | Use TLS |
| `SMTP_USERNAME` | | _(empty)_ | SMTP user. If empty, a temporary [Ethereal](https://ethereal.email) test account is used |
| `SMTP_PASSWORD` | | _(empty)_ | SMTP password. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) |

## API Reference

All routes are prefixed with `/api`. Routes marked 🔒 need an `Authorization: Bearer <JWT>` header.

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/users/register` | Register a new user (`email`, `password`) |
| `POST` | `/users/login` | Log in and receive a JWT |
| `GET` | `/users/validate-google-drive-authorization` 🔒 | Check whether the user has authorized Google Drive |
| `GET` | `/users/google-drive-authorize` | OAuth 2.0 redirect callback from Google |
| `DELETE` | `/users/google-drive-authorize` 🔒 | Revoke Google Drive authorization |
| `GET` | `/keys/generate-secret/:folderId` 🔒 | Generate or get the folder's secret search key |
| `GET` | `/keys/generate-rsa` 🔒 | Generate an RSA key pair |
| `GET` | `/files` 🔒 | List files (`limit`, `pageToken`, `folderId`) |
| `POST` | `/files` 🔒 | Upload and encrypt files (multipart `files[]`, `folderId`) |
| `PUT` | `/files/index` 🔒 | Build or merge the encrypted inverted index (`folderId`, `index`) |
| `GET` | `/files/search/:folderId` 🔒 | Search by keyword (`keyword`, `includeFileInfo`) |
| `POST` | `/files/key/:fileId` 🔒 | Get a file's decryption key, wrapped with `publicKey` |
| `POST` | `/files/download/:fileId` 🔒 | Download and decrypt a file (`privateKey`, `encryptedDecryptionKey`) |
| `GET` | `/files/share/:email/:fileId` 🔒 | Share a file with another user |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Missing required environment variable "JWT_SECRET_KEY"` | Create `crypto-search-backend/.env` from `.env.example` and fill in the required values. |
| `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017` | MongoDB is not running. Start it (see [step 2](#2-set-up-mongodb)). |
| `ENOENT ... google-api-credentials.json` | Put your OAuth client JSON in `crypto-search-backend/` (see [step 3](#3-set-up-google-drive-api-credentials)). |
| Google says `redirect_uri_mismatch` | The redirect URI in Google Cloud Console must be exactly `http://127.0.0.1:3001/api/users/google-drive-authorize`. |
| Google says `access_denied` / app not verified | Add your Google account under **Test users** on the OAuth consent screen. |
| Frontend shows network errors | Make sure the backend is running and the host in `src/configuration.js` matches it. |
| `npm start` (frontend) fails with an OpenSSL error on newer Node versions | Run with `NODE_OPTIONS=--openssl-legacy-provider`, or use Node 16/18 LTS. |
| Share emails are not delivered | Set `SMTP_USERNAME` and `SMTP_PASSWORD`. Gmail requires an App Password with 2FA turned on. |

## Security Notes

- **Never commit** `crypto-search-backend/.env` or `google-api-credentials.json`. Both are already in `.gitignore`.
- Use strong, unique values for `JWT_SECRET_KEY` and `RSA_PRIVATE_KEY_PASSPHRASE` in every environment.
- This project is an academic and research prototype of searchable encryption. Review it carefully before you use it in production. For example, the AES initialization vector in `configuration.js` is fixed, and keyword encryption is deterministic.

## Author

**Mazharul Islam** ([@mazharulmd](https://github.com/mazharulmd))

Based on original work by Md. Shahadul Alam Patwary.

## License

This project is licensed under the [MIT License](LICENSE).
