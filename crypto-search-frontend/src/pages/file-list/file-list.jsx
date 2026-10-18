import { Button } from "@mui/material";
import { RestApiClient } from "@shahadul-17/rest-api-client";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Links, Spinner, } from "../../components";
import { FileItem } from "../../components/file-item";

import styles from "./file-list.module.css";

export const FileList = () => {
  let containerRef = undefined;
  const history = useHistory();
  const restApiClient = RestApiClient.getInstance();
  const [folderId, setFolderId] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(undefined);

  const loadFilesAsync = async (folderId = undefined, pageToken = undefined, appendFiles = true) => {
    setLoading(true);

    const response = await restApiClient.sendSmartRequestAsync({
      routeName: "retrieveAllFiles",
      data: {
        limit: 50,
        folderId: folderId,
        pageToken: pageToken,
      },
    });

    if (response.status === 200) {
      const data = response.jsonData?.data;

      appendFiles && setFiles([...files, ...data.files]);
      !appendFiles && setFiles(data.files);
      setNextPageToken(data.nextPageToken);
    }

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

  const onContainerScrolledAsync = async event => {
    if (!nextPageToken || isLoading || containerRef.clientHeight + containerRef.scrollTop + 100 < containerRef.scrollHeight) { return; }

    await loadFilesAsync(folderId, nextPageToken);
  };

  const onBackToFirstPageClickedAsync = async () => {
    await loadFilesAsync(undefined, undefined, false);
  };

  const onFileClickedAsync = async ({ id, name, mimeType, event, }) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      setFolderId(id);
      setNextPageToken(undefined);
      setFiles([]);

      await loadFilesAsync(id, undefined, false);

      return;
    }

    // downloads file...
    await downloadFileAsync({ fileId: id, fileName: name, mimeType: mimeType });
  };

  const onSearchClickedAsync = async ({ id, name, mimeType, event, }) => {
    history.push(`/search/${id}`);
  };

  const onUploadClickedAsync = async ({ id, name, mimeType, event, }) => {
    history.push(`/upload/${id}`);
  };

  const onShareClickedAsync = async ({ id, name, mimeType, event, }) => {
    history.push(`/share/${id}`);
  };

  useEffect(() => {
    loadFilesAsync(undefined, undefined, false);
  }, []);

  return <div>
    <h2 style={{textAlign: 'left'}}>File list</h2>
    <div className={styles.container} ref={_ref => containerRef = _ref} onScroll={onContainerScrolledAsync}>
      {!isLoading && !files.length ? <p style={{ color: 'red' }}>No file found</p> : ''}
      {isLoading && !files.length ? <Spinner /> : ''}
      {files.length ? files.map(file => {
        return <FileItem key={file.id} {...file}
          onClick={onFileClickedAsync}
          onDownloadClick={onFileClickedAsync}
          onShareClick={onShareClickedAsync}
          onSearchClick={onSearchClickedAsync}
          onUploadClick={onUploadClickedAsync} />;
      }) : ''}
    </div>
    <Button variant="outlined" style={{ marginTop: 20 }} onClick={onBackToFirstPageClickedAsync}>Reset</Button>
  </div>;
};
