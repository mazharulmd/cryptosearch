import { ActionType } from "./action-type";

export const setAccessToken = accessToken => {
  return {
    type: ActionType.AccessToken,
    payload: accessToken,
  };
};

export const setUser = user => {
  return {
    type: ActionType.User,
    payload: user,
  };
};

export const setGoogleDriveAuthorizationInfo = authorizationInfo => {
  return {
    type: ActionType.GoogleDriveAuthorizationInfo,
    payload: authorizationInfo,
  };
};
