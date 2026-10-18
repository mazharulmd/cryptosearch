import React from "react";
import { Error } from "../error";

export const ExtendedError = ({ title, statusCode, message }) => {
  return <Error title={title} statusCode={statusCode} message={message} />;
};
