export class UrlUtilities {

  /**
   * @param {String} name 
   */
  static getQueryParameter(name, defaultValue = "") {
    if (!window.location.search) { return defaultValue; }

    const urlSearchParams = new URLSearchParams(window.location.search);
    const parameter = urlSearchParams.get(name);

    return parameter ?? defaultValue;
  }

  static getAllQueryParameters() {
    const queryParameters = {};

    if (!window.location.search) { return queryParameters; }

    const urlSearchParams = new URLSearchParams(window.location.search);
    const urlSearchParamEntries = urlSearchParams.entries();
    

    for (const [key, value] of urlSearchParamEntries) {
      queryParameters[key] = value;
    }

    return queryParameters;
  }

  static toQueryString(queryParameters = {}) {
    const entries = Object.entries(queryParameters);
    let queryString = "";

    for (const [key, value] of entries) {
      if (queryString.length === 0) {
        queryString += "?";
      } else {
        queryString += "&";
      }

      queryString += `${key}=${value ?? ""}`;
    }

    return queryString;
  }
}
