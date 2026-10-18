import { useEffect, useState } from "react";
import { RestApiClient } from "@shahadul-17/rest-api-client";
import { Spinner } from "../../components";
import { useSelector } from "react-redux";
import { useHistory } from "react-router";
import { UrlUtilities } from "../../utilities";

import styles from "./signup.module.css";
import { Button } from "@mui/material";

export const Signup = () => {
  const history = useHistory();
  const user = useSelector(state => state.user);

  const [isLoading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // if user is not logged in, we won't redirect to dashboard...
    if (!user) { return; }

    const redirectedFrom = UrlUtilities.getQueryParameter("redirectedFrom", "/");

    history.push(redirectedFrom);
  }, [user]);

  const onFormSubmittedAsync = async event => {
    setLoading(true);
    event.preventDefault();

    const formData = new FormData(event.target);
    const restApiClient = RestApiClient.getInstance();
    const response = await restApiClient.sendSmartRequestAsync({
      routeName: "register",
      data: formData,
      requestTags: [
        "AUTHORIZATION",
        "IGNORE_PLEASE_WAIT_TOAST",
        "IGNORE_SUCCESS_TOAST",
        "IGNORE_ERROR_TOAST",
      ],
    });

    // checks if successfully logged in...
    if (response.status === 200) { return; }

    setLoading(false);
    setMessage(response.jsonData?.message ?? "An error occurred while signing up.");
  };

  return <div>
    <br />
    <h2>SIGN UP</h2>
    <br />
    {isLoading && <Spinner />}
    {!isLoading && <form autoComplete="off" onSubmit={onFormSubmittedAsync}>
      <span style={{ color: 'red' }}>{message}</span>
      <br />
      <br />
      <input className={styles.inputField} type="email" value={email} name="email"
        placeholder="e.g. abc@hmail.com"
        onChange={event => setEmail(event.target.value)}
        required />
      <br />
      <br />
      <input className={styles.inputField} type="password" value={password} name="password"
        placeholder="********"
        onChange={event => setPassword(event.target.value)}
        required />

      <br />
      <br />
      <Button type="submit" variant="contained">Sign up</Button>
    </form>}
  </div>;
};
