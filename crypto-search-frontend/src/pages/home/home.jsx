/*
import { RestApiClient } from "@shahadul-17/rest-api-client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setGoogleDriveAuthorizationInfo } from "../../redux";

export const Home = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const googleDriveAuthorizationInfo = useSelector(state => state.googleDriveAuthorizationInfo);

  const retrieveGoogleDriveAuthorizationInfoAsync = async () => {
    // if user is not logged in, we won't validate Google Drive authorization...
    if (!user) { return null; }

    const googleDriveAuthorizationInfo = {
      isGoogleDriveAuthorized: false,
      googleDriveAuthorizationUrl: null,
    };
    const response = await RestApiClient.getInstance().sendSmartRequestAsync({
      routeName: "validateGoogleDriveAuthorization",
      requestTags: [
        "IGNORE_PLEASE_WAIT_TOAST",
        "IGNORE_SUCCESS_TOAST",
        "IGNORE_ERROR_TOAST",
      ],
    });

    // status 200 indicates that user is authorized to use google drive...
    googleDriveAuthorizationInfo.isGoogleDriveAuthorized = response.status === 200;
    googleDriveAuthorizationInfo.googleDriveAuthorizationUrl = response.status === 401 &&
      response.jsonData?.data?.googleDriveAuthorizationUrl
      ? response.jsonData.data.googleDriveAuthorizationUrl : null;
    
    return googleDriveAuthorizationInfo;
  };

  useEffect(() => {
    retrieveGoogleDriveAuthorizationInfoAsync()
      .then(googleDriveAuthorizationInfo => {
        dispatch(setGoogleDriveAuthorizationInfo(googleDriveAuthorizationInfo));
      });
  }, []);

  return <div>
    <img style={{ marginTop: 150, fontSize: 32 }} src={`${process.env.PUBLIC_URL}/resources/icons/logo.svg`} width={128} height={128} alt="Logo" />
    <p>CryptoSearch</p>
    {user && googleDriveAuthorizationInfo?.isGoogleDriveAuthorized && <p style={{ marginTop: 20, color: 'green', fontWeight: 'bold'}}>Now you can access Google Drive securely.</p>}
    {user && !googleDriveAuthorizationInfo?.isGoogleDriveAuthorized && <p style={{ marginTop: 20, }}>
      Click <a target="_blank" rel="noreferrer" href={googleDriveAuthorizationInfo?.googleDriveAuthorizationUrl}>here</a> to allow access to Google Drive.
    </p>}
  </div>;
};
*/
/*
import { RestApiClient } from "@shahadul-17/rest-api-client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setGoogleDriveAuthorizationInfo } from "../../redux";

export const Home = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const googleDriveAuthorizationInfo = useSelector(
    (state) => state.googleDriveAuthorizationInfo
  );

  const retrieveGoogleDriveAuthorizationInfoAsync = async () => {
    if (!user) return null;

    const googleDriveAuthorizationInfo = {
      isGoogleDriveAuthorized: false,
      googleDriveAuthorizationUrl: null,
    };

    const response = await RestApiClient.getInstance().sendSmartRequestAsync({
      routeName: "validateGoogleDriveAuthorization",
      requestTags: [
        "IGNORE_PLEASE_WAIT_TOAST",
        "IGNORE_SUCCESS_TOAST",
        "IGNORE_ERROR_TOAST",
      ],
    });

    googleDriveAuthorizationInfo.isGoogleDriveAuthorized = response.status === 200;
    googleDriveAuthorizationInfo.googleDriveAuthorizationUrl =
      response.status === 401 && response.jsonData?.data?.googleDriveAuthorizationUrl
        ? response.jsonData.data.googleDriveAuthorizationUrl
        : null;

    return googleDriveAuthorizationInfo;
  };

  useEffect(() => {
    retrieveGoogleDriveAuthorizationInfoAsync().then((googleDriveAuthorizationInfo) => {
      dispatch(setGoogleDriveAuthorizationInfo(googleDriveAuthorizationInfo));
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "1rem",
        textAlign: "center",
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/resources/icons/logo.svg`}
        width={128}
        height={128}
        alt="Logo"
      />
      <p style={{ fontSize: 20, fontWeight: "bold", marginTop: 10 }}>CryptoSearch</p>

      {user && googleDriveAuthorizationInfo?.isGoogleDriveAuthorized && (
        <p
          style={{
            marginTop: 20,
            color: "green",
            fontWeight: "bold",
          }}
        >
          Now you can access Google Drive securely.
        </p>
      )}

      {user && !googleDriveAuthorizationInfo?.isGoogleDriveAuthorized && (
        <p style={{ marginTop: 20 }}>
          Click{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href={googleDriveAuthorizationInfo?.googleDriveAuthorizationUrl}
          >
            here
          </a>{" "}
          to allow access to Google Drive.
        </p>
      )}
    </div>
  );
};
*/

import { RestApiClient } from "@shahadul-17/rest-api-client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setGoogleDriveAuthorizationInfo } from "../../redux";

export const Home = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const googleDriveAuthorizationInfo = useSelector(
    (state) => state.googleDriveAuthorizationInfo
  );

  const retrieveGoogleDriveAuthorizationInfoAsync = async () => {
    if (!user) return null;

    const googleDriveAuthorizationInfo = {
      isGoogleDriveAuthorized: false,
      googleDriveAuthorizationUrl: null,
    };

    const response = await RestApiClient.getInstance().sendSmartRequestAsync({
      routeName: "validateGoogleDriveAuthorization",
      requestTags: [
        "IGNORE_PLEASE_WAIT_TOAST",
        "IGNORE_SUCCESS_TOAST",
        "IGNORE_ERROR_TOAST",
      ],
    });

    googleDriveAuthorizationInfo.isGoogleDriveAuthorized = response.status === 200;
    googleDriveAuthorizationInfo.googleDriveAuthorizationUrl =
      response.status === 401 && response.jsonData?.data?.googleDriveAuthorizationUrl
        ? response.jsonData.data.googleDriveAuthorizationUrl
        : null;

    return googleDriveAuthorizationInfo;
  };

  useEffect(() => {
    retrieveGoogleDriveAuthorizationInfoAsync().then((googleDriveAuthorizationInfo) => {
      dispatch(setGoogleDriveAuthorizationInfo(googleDriveAuthorizationInfo));
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "60vh",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "1rem",
        textAlign: "center",
        color: "#000",
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/resources/icons/cloud-search.png`}
        width={128}
        height={128}
        alt="Logo"
      />
      <p style={{ fontSize: 20, fontWeight: "bold", marginTop: 10 }}>CryptoCloud</p>

      {user && googleDriveAuthorizationInfo?.isGoogleDriveAuthorized && (
        <p
          style={{
            marginTop: 20,
            color: "green",
            fontWeight: "bold",
          }}
        >
          Now you can access Google Drive securely.
        </p>
      )}

      {user && !googleDriveAuthorizationInfo?.isGoogleDriveAuthorized && (
        <p style={{ marginTop: 20 }}>
          Click{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href={googleDriveAuthorizationInfo?.googleDriveAuthorizationUrl}
          >
            here
          </a>{" "}
          to allow access to Google Drive.
        </p>
      )}
    </div>
  );
};