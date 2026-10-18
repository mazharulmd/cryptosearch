import { Switch } from "react-router";
import { ExtendedRoute } from "../extended-route";

export const ExtendedSwitch = ({ routes, }) => {
  return <Switch>
    {routes.map((route, index) => {
      return <ExtendedRoute key={index} {...route} />;
    })}
  </Switch>;
};
