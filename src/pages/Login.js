// (c) Copyright 2018 SUSE LLC
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
import { translate } from '../localization/localize.js';
import { fetchJson, postJson } from '../utils/RestUtils.js';
import { setAuthToken, clearAuthToken } from '../utils/Auth.js';
import { navigateTo, navigateBack, wasRedirectedToLogin } from '../utils/RouteUtils.js';
import { ErrorMessage } from '../components/Messages.js';

class LoginPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      errorMsg: '',
      showMask: true
    };
  }

  handleUsernameChange = (e, valid, props) => {
    let value = e.target.value;
    this.setState({username: value});
  }

  handlePasswordChange = (e, valid, props) => {
    let value = e.target.value;
    this.setState({password: value});
  }

  handleLogin = (e, valid, props) => {
    e.preventDefault();

    clearAuthToken();
    const payload = {
      'username': this.state.username,
      'password': this.state.password
    };

    postJson('/api/v1/clm/login', payload, undefined, false)
      .then(response => {

        // Capture the returned token and use it for subsequent calls. If it
        // turns out to have insufficient privileges, it will be removed
        const expires = new Date(response.expires);
        setAuthToken(response.token, expires);

        // Attempt a typical operation to validate the token against the policy
        return fetchJson('/api/v1/clm/user', undefined, false);
      })
      .then(response => {
        this.setState({show: false, errorMsg: ''});

        if (wasRedirectedToLogin()) {
          navigateBack();
        } else {
          navigateTo('/');
        }
      })
      .catch((error) => {
        // Invalidate the token if it was saved above
        clearAuthToken();

        if (error.status == 401) {
          this.setState({errorMsg: translate('login.invalid')});
        } else if (error.status == 403) {
          this.setState({errorMsg: translate('login.unprivileged')});
        } else {
          this.setState({errorMsg: translate('login.error', error)});
        }
      });
  }

  toggleShowHidePassword = (e) => {
    let passwordField = e.target.previousSibling;
    passwordField.type = this.state.showMask ? 'text' : 'password';
    this.setState((prevState) => {return {showMask: !prevState.showMask};});
  }

  renderErrorMessage() {
    if (this.state.errorMsg) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({errorMsg: ''})}
            message={this.state.errorMsg}>
          </ErrorMessage>
        </div>
      );
    }
  }

  render() {
    return (
      <div className='login-page'>
        {this.renderErrorMessage()}
        <div className='col-md-7'/>
        <div className='col-md-5 input-section'>
          <div className='header'>{translate('login.header')}</div>
          <form onSubmit={this.handleLogin}>
            <input type='text' className='rounded-corner' required='true'
              autoComplete='username' value={this.state.username}
              placeholder={translate('login.placeholder.username')} onChange={this.handleUsernameChange}/>
            <div>
              <input type='password' className='rounded-corner' required='true'
                autoComplete='current-password' value={this.state.password}
                placeholder={translate('login.placeholder.password')} onChange={this.handlePasswordChange}/>
              <span className='material-icons password-icon'
                onClick={this.toggleShowHidePassword}>{ this.state.showMask ? 'visibility' : 'visibility_off' }</span>
            </div>
            <button className="rounded-corner" type="submit" onClick={this.handleLogin}>{translate('login')}</button>
          </form>
        </div>
      </div>
    );
  }

}

export default LoginPage;
