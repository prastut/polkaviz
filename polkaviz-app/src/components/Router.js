import React from "react";
import { Route, Switch, HashRouter } from "react-router-dom";
import KusamaApp from "./kusama/KusamaApp";

class Router extends React.Component {
  componentWillUnmount() {
    this.ismounted = false;
    clearInterval(this.interval);
  }

  render() {
    let pathArray = window.location.href.split("/");
    console.log(pathArray);
    return (
      <React.Fragment>
        <HashRouter>
          <div id="main">
            <Switch>
              <Route exact path="/" render={(props) => <KusamaApp />} />
              <Route path="/alexander" render={(props) => <KusamaApp />} />
              <Route exact path="/kusama" render={(props) => <KusamaApp />} />
            </Switch>
          </div>
        </HashRouter>
      </React.Fragment>
    );
  }
}
export default Router;
