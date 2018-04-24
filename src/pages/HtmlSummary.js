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
import React from 'react';
import '../Deployer.css';
import { fetchJson } from '../utils/RestUtils.js';
import BaseWizardPage from './BaseWizardPage.js';
import { translate } from '../localization/localize.js';

class CloudModelSummary extends BaseWizardPage {
  constructor(props) {
    super(props);

    this.state = {
      controlPlane: undefined
    };

  }

  componentWillMount() {
    this.setState({loading: true});

    // Load overview for all templates
    fetchJson('/api/v1/clm/model/cp_output/control_plane_topology.yml')
      .then((yml) => {
        this.setState({
          controlPlane: yml});
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render_control_plane = (name, contents) => {
  }

  render () {

    let control_planes = undefined;

    if (this.state.controlPlane) {
      control_planes = Object.keys(this.state.controlPlane['control_planes']).sort().map((name) =>
        <div><h2>{name}</h2></div>
      );
    }

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading('Control Plane')}
        </div>
        <div className='wizard-content'>
          {control_planes}
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CloudModelSummary;
