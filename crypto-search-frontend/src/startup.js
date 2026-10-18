import { createStore } from "redux";
import { persistedReducers, setAccessToken, setGoogleDriveAuthorizationInfo, setUser } from "./redux";
import { persistStore } from "redux-persist";
import { RestApiClient, RestApiClientEvent, IRestApiClientEventArguments } from "@shahadul-17/rest-api-client";
import { toast } from "react-toastify";
import { configuration } from "./configuration";

import restApiClientConfiguration from "./rest-api-client.configuration.json";

export class Startup {

  constructor() {
    this.reduxStore = undefined;
    this.persistedStore = undefined;

    this.onBeforeRequestSent = this.onBeforeRequestSent.bind(this);
    this.onDataValidationError = this.onDataValidationError.bind(this);
    this.onConnectionError = this.onConnectionError.bind(this);
    this.onResponseReceived = this.onResponseReceived.bind(this);
    this.dispatchReduxAction = this.dispatchReduxAction.bind(this);
  }

  //#region Token Provider

  getAccessToken() {
    return this.reduxStore.getState().accessToken;
  }

  getRefreshToken() {
    return "";
  }

  isTokenExpired(response, restApiClient) {
    return false;
  }

  renewAccessTokenAsync(routeName, restApiClient) {
    return false;
  }

  //#endregion

  getUser() {
    return this.reduxStore.getState().user;
  }

  //#region Rest Api Client Events

  /**
   * 
   * @param {String} toastId 
   * @param {"info" | "warn" | "success" | "error"} toastType 
   * @param {String} message 
   * @param {Array<String>} requestTags 
   * @param {String} tagToIgnore 
   * @param {Boolean} autoClose Default value is true.
   */
  showToast(toastId, toastType, message, requestTags, tagToIgnore, autoClose = true, forceSpawn = false) {
    if (requestTags?.includes(tagToIgnore)) { return; }

    // checks if please wait toast is not ignored so that we can update that toast...
    const shallUpdate = !requestTags?.includes("IGNORE_PLEASE_WAIT_TOAST");

    // if 'shallUpdate' is false, it means we need to spawn new toast...
    if (forceSpawn || !shallUpdate) {
      toast[toastType](message, { toastId: toastId, autoClose: autoClose, });

      return;
    }

    // otherwise we'll update existing toast...
    toast.update(toastId, {
      render: message,
      type: toastType,
      autoClose: autoClose,
    });
  }

  /**
   * @param {IRestApiClientEventArguments} eventArgs 
   */
  onBeforeRequestSent(eventArgs) {
    const { additionalData, requestTags, } = eventArgs.restApiClientRequestOptions;

    this.showToast(additionalData.requestId, "info", "Please wait...",
      requestTags, "IGNORE_PLEASE_WAIT_TOAST", false, true);
  }

  /**
   * @param {IRestApiClientEventArguments} eventArgs 
   */
  onDataValidationError(eventArgs) {
    const { httpResponse, restApiClientRequestOptions, } = eventArgs;
    const { additionalData, requestTags, } = restApiClientRequestOptions;

    this.showToast(additionalData.requestId, "error",
      `Mandatory ${httpResponse?.jsonData?.location?.toLowerCase() ?? ""} parameter ${httpResponse?.jsonData?.parameter ?? ""} not found.`,
      requestTags, "IGNORE_DATA_VALIDATION_ERROR_TOAST", true, true);
  }

  /**
   * @param {IRestApiClientEventArguments} eventArgs 
   */
  onConnectionError(eventArgs) {
    const { additionalData, requestTags, } = eventArgs.restApiClientRequestOptions;

    this.showToast(additionalData.requestId, "error",
      `An error occurred while connecting to server (${eventArgs.httpResponse.status}).`,
      requestTags, "IGNORE_CONNECTION_ERROR_TOAST", true);
  }

  /**
   * @param {IRestApiClientEventArguments} eventArgs 
   */
  handleAuthorization(eventArgs) {
    const {
      httpResponse,
      restApiClientRequestOptions: {
        requestTags,
      },
    } = eventArgs;

    if (!requestTags?.includes("AUTHORIZATION")) { return; }

    const data = httpResponse?.jsonData?.data;

    // we'll save user info so that we can use it when needed...
    this.reduxStore.dispatch(setAccessToken(data.accessToken));
    this.reduxStore.dispatch(setUser(data.user));
    /* this.reduxStore.dispatch(setGoogleDriveAuthorizationInfo({
      isGoogleDriveAuthorized: data.isGoogleDriveAuthorized,
      googleDriveAuthorizationUrl: data.googleDriveAuthorizationUrl,
    })); */
  }

  /**
   * @param {IRestApiClientEventArguments} eventArgs 
   */
  onResponseReceived(eventArgs) {
    const { additionalData, requestTags, } = eventArgs.restApiClientRequestOptions;

    switch (eventArgs.httpResponse?.status) {
      case 200:
        this.showToast(additionalData.requestId, "success",
          eventArgs.httpResponse.jsonData?.message ?? "Operation completed successfully.",
          requestTags, "IGNORE_SUCCESS_TOAST", true);

        break;
      case 500:
        this.showToast(additionalData.requestId, "error",
          `An internal server error occurred (${eventArgs.httpResponse.status}).`,
          requestTags, "IGNORE_SERVER_ERROR_TOAST", true);

        break;
      default:
        let message = eventArgs.httpResponse.jsonData?.message;

        if (typeof message === "object") {
          const messageKeys = Object.keys(message);
          const parameterName = messageKeys[0];
          const parameterValue = message[parameterName];    // actual message is stored in parameter value...

          // we'll form message if parameter value is available...
          parameterValue && (message = `${parameterName} ${parameterValue}`);
        }

        message = typeof message === "undefined" ? `An error occurred while processing your request (${eventArgs.httpResponse.status}).` : message;

        this.showToast(additionalData.requestId, "error", message,
          requestTags, "IGNORE_ERROR_TOAST", true);

        break;
    }

    this.handleAuthorization(eventArgs);
  }

  //#endregion

  /**
   * Dispatches redux action.
   * @param {Function} action Action to dispatch.
   */
  dispatchReduxAction(action) {
    if (!this.reduxStore || typeof action !== "function") { return; }

    this.reduxStore.dispatch(action);
  }

  configureReduxStore() {
    const reduxStore = createStore(persistedReducers,
      // used by Redux DevTools extension...
      window.__REDUX_DEVTOOLS_EXTENSION__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__());
    const persistedStore = persistStore(reduxStore);

    return { reduxStore, persistedStore };
  }

  async configureRestApiClientAsync() {
    const restApiClient = await RestApiClient.createInstanceAsync({
      ...restApiClientConfiguration,
      ...configuration.restApiClient,
    });
    restApiClient.setTokenProvider(this);
    restApiClient.addEventListener(RestApiClientEvent.BeforeRequestSend, this.onBeforeRequestSent);
    restApiClient.addEventListener(RestApiClientEvent.DataValidationError, this.onDataValidationError);
    restApiClient.addEventListener(RestApiClientEvent.ConnectionError, this.onConnectionError);
    restApiClient.addEventListener(RestApiClientEvent.ResponseReceive, this.onResponseReceived);

    return restApiClient;
  }

  async configureAsync() {
    const { reduxStore, persistedStore } = this.configureReduxStore();

    this.reduxStore = reduxStore;
    this.persistedStore = persistedStore;

    // just in-case we need to dispatch a redux action...
    window.dispatchReduxAction = this.dispatchReduxAction;

    const restApiClient = await this.configureRestApiClientAsync();

    return {
      reduxStore: this.reduxStore,
      persistedStore: this.persistedStore,
      restApiClient: restApiClient,
      accessToken: this.getAccessToken(),
      user: this.getUser(),
    };
  }
}
