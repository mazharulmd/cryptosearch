import { Button } from "@mui/material";
import { RestApiClient } from "@shahadul-17/rest-api-client";
import { useState } from "react";
import { useHistory } from "react-router";

import styles from "./share.module.css";

export const Share = ({ match }) => {
  const history = useHistory();
  const folderId = match?.params?.folderId;
  const restApiClient = RestApiClient.getInstance();

  const [isLoading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const onFormSubmittedAsync = async event => {
    event.preventDefault();

    if (isLoading || !email.length) { return; }

    setLoading(true);

    const response = await restApiClient.sendSmartRequestAsync({
      routeName: 'shareFile',
      data: {
        email: email,
        fileId: folderId,
      },
    });

    setLoading(false);

    if (response.status !== 200) { return; }

    history.push("/list");
  };

  return <div>
    <h2 style={{textAlign: 'left'}}>Share folder</h2>

    <form autoComplete="off" onSubmit={onFormSubmittedAsync}>
      <input type="email" className={styles.email} name="email" placeholder="Enter the email address to share this folder" value={email} onChange={event => setEmail(event.target.value)} />
      <Button type="submit" variant={isLoading || !email.length ? "outlined" : "contained"}>Share</Button>
    </form>
  </div>;
};
