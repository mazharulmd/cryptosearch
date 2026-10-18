import { RestApiClient } from "@shahadul-17/rest-api-client";
import React, { lazy, Suspense, } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import { Spinner } from "./components";
import { Startup } from "./startup";

// application root where contents will be
// dynamically rendered by react dom...
const root = document.getElementById("root");
// lazily importing app page...
const App = lazy(() => import("./pages").then(module => ({ default: module.App })));
// lazily importing error page...
const Error = lazy(() => import("./pages").then(module => ({ default: module.Error })));

const onBeforeRenderAsync = async () => {
  const startup = new Startup();
  const result = await startup.configureAsync();

  return {
    status: 200,
    message: "Initial configuration completed successfully.",
    ...result,
  };
};

onBeforeRenderAsync().then(result => {
  // removes the spinner from root...
  document.getElementById("container-d422aee5").remove();

  const { status, message, reduxStore, persistedStore, user, } = result;

  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <Suspense fallback={<Spinner />}>
          {status === 200 && <Provider store={reduxStore}>
            <PersistGate loading={<Spinner />} persistor={persistedStore}>
              <App user={user} />
            </PersistGate>
          </Provider>}
          {status !== 200 && <Error statusCode={status} message={message} />}
        </Suspense>
      </BrowserRouter>
    </React.StrictMode>, root
  );
});
