import styles from "./file-item.module.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolder, faFile, /* faShare, faDownload, faUpload, faSearch, */ } from '@fortawesome/free-solid-svg-icons';
import { Button, } from "@mui/material";

export const FileItem = ({ id, name, mimeType, onClick, onShareClick, onDownloadClick, onSearchClick, onUploadClick }) => {

  const onFileItemClickedAsync = async event => {
    onClick && await onClick({ id, name, mimeType, event, });
  };

  const onFileItemShareClickedAsync = async event => {
    onShareClick && await onShareClick({ id, name, mimeType, event, });
  };

  const onFileItemDownloadClickedAsync = async event => {
    onDownloadClick && await onDownloadClick({ id, name, mimeType, event, });
  };

  const onSearchClickedAsync = async event => {
    onSearchClick && await onSearchClick({ id, name, mimeType, event, });
  };

  const onUploadClickedAsync = async event => {
    onUploadClick && await onUploadClick({ id, name, mimeType, event, });
  };

  return <div className={styles.container}>
    <div style={{ display: 'inline' }} onClick={onFileItemClickedAsync}>
      {mimeType === 'application/vnd.google-apps.folder' && <FontAwesomeIcon icon={faFolder} />}
      {mimeType !== 'application/vnd.google-apps.folder' && <FontAwesomeIcon icon={faFile} />}
      <p className={styles.fileName}>{name}</p>
    </div>
    {mimeType === 'application/vnd.google-apps.folder' && <Button style={{fontSize: 9}} variant="contained" color="primary" onClick={onFileItemShareClickedAsync}>Share</Button>}
    {mimeType === 'application/vnd.google-apps.folder' && <Button style={{marginLeft: 5, fontSize: 9}} variant="contained" color="success" onClick={onSearchClickedAsync}>Search</Button>}
    {mimeType === 'application/vnd.google-apps.folder' && <Button style={{marginLeft: 5, fontSize: 9}} variant="contained" color="error" onClick={onUploadClickedAsync}>Upload</Button>}
    {mimeType !== 'application/vnd.google-apps.folder' && <Button style={{fontSize: 9}} variant="contained" color="warning" onClick={onFileItemDownloadClickedAsync}>Download</Button>}
    <p className={styles.fileId}>{id}</p>
  </div>;
};
