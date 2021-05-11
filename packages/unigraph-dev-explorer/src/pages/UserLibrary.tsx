import Typography from "@material-ui/core/Typography";
import React from "react"
import { UserLibraryAll } from "../components/UserLibrary";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  useRouteMatch
} from "react-router-dom";
import DetailedObjectView from "../components/UserLibrary/UserLibraryObject";

const UserLibrary = () => {
  let { path, url } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path}><UserLibraryAll/></Route>
      <Route path={`${path}/object/:objectId`}>
        <DetailedObjectView/>
      </Route>
    </Switch>
  );
}

export default UserLibrary;