import { ButtonGroup, Button } from "@mui/material";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

export const Links = () => {
  const history = useHistory();
  const user = useSelector(state => state.user);
  const googleDriveAuthorizationInfo = useSelector(state => state.googleDriveAuthorizationInfo);
  const [filledButton, setFilledButton] = useState("home");

  const onButtonClicked = event => {
    const buttonText = event.target.innerText.toLowerCase();

    setFilledButton(buttonText);

    switch (buttonText) {
      case "home":
        return history.push('/');
      case "login":
        return history.push('/login');
      case "sign up":
        return history.push('/signup');
      case "my files":
        return history.push('/list');
      case "sign out":
        return history.push('/logout');
      default:
        break;
    }
  };

  return <div>
    <ButtonGroup variant="outlined">
      <Button variant={filledButton === "home" || filledButton === "sign out" ? "contained" : undefined} color="warning" onClick={onButtonClicked}>Home</Button>
      {!user && <Button variant={filledButton === "login" ? "contained" : undefined} color="success" onClick={onButtonClicked}>Login</Button>}
      {!user && <Button variant={filledButton === "sign up" ? "contained" : undefined} color="primary" onClick={onButtonClicked}>Sign up</Button>}
      {user && googleDriveAuthorizationInfo?.isGoogleDriveAuthorized && <Button variant={filledButton === "my files" ? "contained" : undefined} color="success" onClick={onButtonClicked}>My Files</Button>}
      {user && <Button color="error" onClick={onButtonClicked}>Sign out</Button>}
    </ButtonGroup>
  </div>;
};
