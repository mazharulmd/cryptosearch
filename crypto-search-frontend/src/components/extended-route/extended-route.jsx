import React, { Suspense, } from "react";
import { useSelector } from "react-redux";
import { Route } from "react-router";
import { Redirect } from "react-router-dom";
import { Spinner } from "../spinner";

const authorizeUser = (props, user) => {
  // if user is super admin, we won"t perform any validation...
  if (user) { return ""; }

  const { path, location, isProtected, } = props;

  const _path = location?.pathname ?? path;
  const encodedPath = encodeURIComponent(_path);

  // if user is not logged in or,
  // user is not an admin or,
  // user doesn"t have sufficient permissions,
  // we will redirect the user to login...
  if (isProtected && !user) {
    return `/login?redirectedFrom=${encodedPath}`;
  }

  return "";
}

export const ExtendedRoute = props => {
  // we don't really need 'isLoggedIn' from redux store. but, without using it,
  // extended route won't re-render on login state change...
  const user = useSelector(state => state.user) ?? {};
  const navigateTo = authorizeUser(props, user);

  if (navigateTo) {
    return <Redirect to={navigateTo} />;
  }

  const {
    path, routes, exact, props: properties,
    component: Component,
  } = props;

  return <Route
    path={path}
    render={_props => {
      return <Suspense fallback={<Spinner />}>
        <Component {..._props} {...properties} routes={routes} />
      </Suspense>;
    }}
    exact={exact}
  />;
}
