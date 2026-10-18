import React from "react";
import icon from "../../resources/icons/error.png";
import styles from "./error.module.css";

export const Error = ({ title, statusCode, message }) => {
  let _title = title;
  let _statusCode = statusCode;
  let _message = message;

  if (window.location.search) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    _title = urlSearchParams.get('title') ?? _title;
    _statusCode = urlSearchParams.get('statusCode') ?? _statusCode;
    _message = urlSearchParams.get('message') ?? _message;
  }

  return (
    <div className={styles.container}>
      <img className={styles.icon} src={icon} alt="error" />

      <h1 className={styles.heading}>{_title ?? 'Oops!'}</h1>
      <h3 className={styles.statusCode}>Status code: {_statusCode ?? 500}</h3>
      <p className={styles.message}>{_message ?? "An unexpected error occurred."}</p>
    </div>
  );
};
