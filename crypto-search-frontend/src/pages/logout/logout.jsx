import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Redirect } from "react-router";
import { setAccessToken, setGoogleDriveAuthorizationInfo, setUser } from "../../redux";

export const Logout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // updates redux store...
    dispatch(setAccessToken(""));
    dispatch(setUser(null));
    dispatch(setGoogleDriveAuthorizationInfo(null));
  }, []);

  return <Redirect to={"/"} />;
};
