import { lazy } from "react";

// lazily importing login page...
const Home = lazy(() => import("./pages").then(module => ({ default: module.Home })));
const FileList = lazy(() => import("./pages").then(module => ({ default: module.FileList })));
const Share = lazy(() => import("./pages").then(module => ({ default: module.Share })));
const Search = lazy(() => import("./pages").then(module => ({ default: module.Search })));
const Upload = lazy(() => import("./pages").then(module => ({ default: module.Upload })));
const Login = lazy(() => import("./pages").then(module => ({ default: module.Login })));
const Signup = lazy(() => import("./pages").then(module => ({ default: module.Signup })));
const Logout = lazy(() => import("./pages").then(module => ({ default: module.Logout })));

// lazily importing error page...
const Error = lazy(() => import("./pages").then(module => ({ default: module.Error })));

export const routes = [
  {
    path: "/",
    component: Home,
    exact: true
  },
  {
    path: "/list",
    component: FileList,
    exact: true,
    isProtected: true,
  },
  {
    path: "/share/:folderId",
    component: Share,
    exact: true,
    isProtected: true,
  },
  {
    path: "/search/:folderId",
    component: Search,
    exact: true,
    isProtected: true,
  },
  {
    path: "/upload/:folderId",
    component: Upload,
    exact: true,
    isProtected: true,
  },
  {
    path: "/login",
    component: Login,
    exact: true
  },
  {
    path: "/signup",
    component: Signup,
    exact: true
  },
  {
    path: "/logout",
    component: Logout,
    exact: true
  },
  {
    path: '/error',
    component: Error,
    exact: true,
  },
  {
    path: '/',
    component: Error,
    props: {
      statusCode: 404,
      message: 'The requested URL was not found on this server.',
    },
  },
];
