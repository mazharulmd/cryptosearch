/* import { ToastContainer } from "react-toastify";
import { ExtendedSwitch, Links } from "../../components";

import { routes } from "../../routes";

import styles from "./app.module.css";

import "react-toastify/dist/ReactToastify.css";

export const App = ({ user, }) => {
  return <>
    <Links />
    <ExtendedSwitch routes={routes} />
    <ToastContainer bodyClassName={styles.toast}
      progressClassName={styles.toastProgressBar}
      autoClose={6000} />
  </>;
};
*/

import { ToastContainer } from "react-toastify";
import { ExtendedSwitch, Links } from "../../components";

import { routes } from "../../routes";

import styles from "./app.module.css";
import "react-toastify/dist/ReactToastify.css";

export const App = ({ user }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-2xl px-4">
        <Links />
        <ExtendedSwitch routes={routes} />
      </div>

      <ToastContainer
        bodyClassName={styles.toast}
        progressClassName={styles.toastProgressBar}
        autoClose={6000}
      />
    </div>
  );
};
