import { Button } from "@mui/material";
import { RestApiClient } from "@shahadul-17/rest-api-client";
import { useState } from "react";
import { useHistory } from "react-router";
import styles from "./upload.module.css";

export const Upload = ({ match }) => {
  let fileInput = undefined;
  const history = useHistory();
  const folderId = match?.params?.folderId;
  const restApiClient = RestApiClient.getInstance();

  const [isLoading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [selectedFiles, setSelectedFiles] = useState("No file selected");

  /**
   * @param {Array<any>} fileInfoList
   * @param {Array<String>} keywordList 
   */
  const prepareIndex = (fileInfoList, keywordList) => {
    const index = [];

    for (const fileInfo of fileInfoList) {
      index.push({
        fileId: fileInfo.fileId,
        keywords: keywordList,
      });
    }

    return index;
  };

  /**
   * @param {FormData} data 
   */
  const uploadFilesAsync = async (data, keywordList) => {
    setLoading(true);

    let response = await restApiClient.sendSmartRequestAsync({
      routeName: "generateSecretKey",
      data: { folderId: folderId, },
    });

    if (response.status !== 200) { return; }

    // appends folder ID to form data...
    data.append('folderId', folderId);

    response = await restApiClient.sendSmartRequestAsync({
      routeName: "uploadFiles",
      data: data,
    });

    if (response.status !== 200) { return; }

    const fileInfoList = response.jsonData?.data?.fileInfoList;

    if (!Array.isArray(fileInfoList)) { return; }

    const index = prepareIndex(fileInfoList, keywordList);
    response = await restApiClient.sendSmartRequestAsync({
      routeName: "generateIndex",
      data: {
        folderId: folderId,
        index: index,
      },
    });
    
    setLoading(false);

    if (response.status !== 200) { return; }

    history.push('/list');
  };

  const onFormSubmittedAsync = async event => {
    event.preventDefault();

    if (isLoading || !keywords.length) { return; }

    const keywordList = keywords.toLowerCase().split(',').map(keyword => keyword.trim());
    const formData = new FormData(event.target);

    await uploadFilesAsync(formData, keywordList);
  };

  const onFileSelectionChanged = async event => {
    const filesSelected = event.target.files.length;

    !filesSelected && setSelectedFiles("No file selected");
    filesSelected && setSelectedFiles(`${filesSelected} file(s) selected`);
  };

  const onChooseFilesClickedAsync = async event => {
    fileInput.click();
  };

  return <div>
    <h2 style={{textAlign: 'left'}}>File upload</h2>

    <form autoComplete="off" onSubmit={onFormSubmittedAsync}>
      <input type="text" className={styles.keywords} name="keywords" placeholder="Enter keywords separated by comma." value={keywords} onChange={event => setKeywords(event.target.value)} />
      <input ref={ref => fileInput = ref} className="hidden" type="file" name="files" multiple onChange={onFileSelectionChanged} />
      <Button type="button" variant="contained" onClick={onChooseFilesClickedAsync}>Choose files</Button>
      <p style={{ marginTop: 10 }}>{selectedFiles}</p>

      <br />
      <br />
      <Button type="submit" variant={isLoading || !keywords.length ? "outlined" : "contained"}>Upload</Button>
    </form>
  </div>;
};
