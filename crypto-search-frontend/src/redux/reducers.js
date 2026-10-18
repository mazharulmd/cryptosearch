import { combineReducers, } from "redux";
import { ActionType } from "./action-type";
import localStorage from "redux-persist/lib/storage";
// import storageSession from "redux-persist/lib/storage/session";
import { persistReducer } from "redux-persist";

const accessToken = (state = "", action) => {
  switch (action.type) {
    case ActionType.AccessToken:
      return action.payload ?? state;
    default:
      return state;
  }
};

const user = (state = null, action) => {
  switch (action.type) {
    case ActionType.User:
      return action.payload ?? null;
    default:
      return state;
  }
};

const googleDriveAuthorizationInfo = (state = null, action) => {
  switch (action.type) {
    case ActionType.GoogleDriveAuthorizationInfo:
      return action.payload ?? null;
    default:
      return state;
  }
};

export const combinedReducer = combineReducers({
  accessToken, user, googleDriveAuthorizationInfo,
});

export const persistedReducers = persistReducer({
  key: "root",
  storage: localStorage,
  /* blacklist: [], */
}, combinedReducer);
