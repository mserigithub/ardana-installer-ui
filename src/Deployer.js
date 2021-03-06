// (c) Copyright 2017-2018 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
import React, { Component } from 'react';
import './Deployer.css';
import InstallWizard from './InstallWizard';
import { pages } from './utils/WizardDefaults.js';
import { HashRouter as Router, Switch, Redirect } from 'react-router-dom';
import Route from 'react-router-dom/Route';
import { translate } from './localization/localize.js';
import LoginPage from './pages/Login.js';
import { fetchJson } from './utils/RestUtils.js';
import { getAuthToken } from './utils/Auth.js';

class Deployer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSecured: undefined
    };
  }

  componentDidMount = () => {
    fetchJson('/api/v1/clm/is_secured')
      .then(response => {
        this.setState({isSecured: response['isSecured']});
      });
  }

  render() {

    // Decide which path that / should route to depending on whether
    //    the ardana service is running in secured mode and whether
    //    we have a valid auth token

    let defaultPath;
    if (this.state.isSecured === undefined) {
      // If the REST call has not yet completed, then show a loading page (briefly)
      defaultPath = (
        <div className="loading-message">{translate('wizard.loading.pleasewait')}</div>
      );
    } else if (this.state.isSecured) {
      if (! getAuthToken()) {
        // If a login is required, Redirect to the login page
        defaultPath = <Redirect to='/login'/> ;
      } else {

        // In a secured (post-install) mode with a valid auth token.
        // TODO - display post-install UI
        defaultPath = (<div>Post-install UI goes here</div>);
      }
    } else {

      // Initial, unsecured mode.  Display the InstallWizard
      defaultPath = <InstallWizard pages={pages}/>;
    }

    return (
      <Router>
        <Switch>
          <Route path='/login' render={() => {
            return(
              <LoginPage />
            );}
          } />

          <Route path='/about' render={() => {
            return(
              <div>{translate('openstack.cloud.deployer.title.version')}</div>
            );}
          } />

          <Route path='/' render={() => defaultPath} />

        </Switch>
      </Router>
    );
  }
}

export default Deployer;
