import { TextField, Button } from "@mui/material";
import { RestApiClient } from "@shahadul-17/rest-api-client";
import { useState } from "react";
import { Spinner } from "../../components";
import { FileItem } from "../../components/file-item";

import styles from "./search.module.css";

export const Search = ({ match }) => {
  const folderId = match?.params?.folderId;
  const restApiClient = RestApiClient.getInstance();
  
  const [isLoading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [files, setFiles] = useState([]);

  const searchFilesAsync = async keyword => {
    setLoading(true);

    const response = await restApiClient.sendSmartRequestAsync({
      routeName: "searchFiles",
      data: {
        folderId: folderId,
        keyword: keyword,
        includeFileInfo: true,
      },
    });

    const files = response.status === 200 ? response.jsonData?.data?.fileInfos : [];

    setFiles(files);
    setLoading(false);
  };

  const downloadFileAsync = async ({ fileId, fileName, mimeType, }) => {
    // we could've generated RSA key pair locally but we are doing
    // this to reduce the complexity of the implementation...
    let response = await restApiClient.sendSmartRequestAsync({
      routeName: "generateRsaKeyPair",
      requestTags: [
        "IGNORE_PLEASE_WAIT_TOAST",
        "IGNORE_SUCCESS_TOAST",
      ],
    });

    if (response.status !== 200) { return; }

    // contains private key and encrypted decryption key...
    const { publicKey, privateKey, } = response.jsonData.data;

    response = await restApiClient.sendSmartRequestAsync({
      routeName: "getFileDecryptionKey",
      data: {
        fileId: fileId,
        publicKey: publicKey,
      },
      requestTags: [
        "IGNORE_PLEASE_WAIT_TOAST",
        "IGNORE_SUCCESS_TOAST",
      ],
    });

    if (response.status !== 200) { return; }

    const { encryptedDecryptionKey, } = response.jsonData.data;

    response = await restApiClient.sendSmartRequestAsync({
      routeName: "downloadFile",
      data: {
        fileId: fileId,
        privateKey: privateKey,
        encryptedDecryptionKey: encryptedDecryptionKey,
      },
    });

    if (response.status !== 200) { return; }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([response.rawData]));
    a.download = fileName;
    a.click();
  };

  const onFileClickedAsync = async ({ id, name, event, }) => {
    // downloads file...
    await downloadFileAsync({ fileId: id, fileName: name, });
  };

  const onFormSubmittedAsync = async event => {
    event.preventDefault();

    await searchFilesAsync(keyword);
  };

  return <div>
    <h2 style={{textAlign: 'left'}}>Search by keyword</h2>

    <form style={{  padding: 10, borderRadius: 5 }} autoComplete="off" onSubmit={onFormSubmittedAsync}>
      <input className={styles.keyword} type="text" value={keyword} onChange={event => setKeyword(event.target.value)} />
      <Button type="submit" variant="contained">Search</Button>
    </form>

    <div className={styles.container}>
      {isLoading && <Spinner />}
      {!isLoading && !files.length ? <p style={{ color: 'red' }}>No file found</p> : ''}
      {!isLoading && files.length ? files.map(file => {
        return <FileItem key={file.id} {...file} onClick={onFileClickedAsync} onDownloadClick={onFileClickedAsync} />;
      }) : ''}
    </div>
  </div>;
};
