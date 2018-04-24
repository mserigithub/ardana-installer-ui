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

class CloudModelSummary extends BaseWizardPage {
  constructor(props) {
    super(props);

    this.state = {
      model: undefined
    };

    this.cloud_internal = undefined;
    this.control_planes = undefined;
    this.servers = undefined;
    this.server_by_hostname = {};
  }

  init = () => {
    if (this.state.model) {
      this.cloud_internal = this.state.model['internal'];
      this.control_planes = this.cloud_internal['control-planes'];
      this.servers = this.cloud_internal['servers'];

      for (const s in this.servers) {
        if (this.servers['hostname']) {
          this.server_by_hostname[s['hostname']] = s;
        }
      }
    }
  }

  componentWillMount() {
    this.setState({loading: true});

    // Load overview for all templates
    fetchJson('/api/v1/clm/model/cp_output/CloudModel.yml')
      .then((yml) => {

        // Force a re-render
        this.setState({
          model: yml});
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render_control_plane = (cp_name, cp_topology) => {
    let num_clusters = 0;
    let num_resources = 0;
    let num_load_balancers = 0;

    let service_list = new Set();
    let cp_zones = new Set();

    // Can generalize this logic
    if ('clusters' in cp_topology) {
      const clusters = cp_topology['clusters'];
      num_clusters = Object.keys(clusters).length;

      for (const [name, data] of Object.entries(clusters)) {
        for (const zone in data['failure_zones'] || {}) {
          cp_zones.add(zone);
        }
        for (const service in data['services'] || {}) {
          service_list.add(service);
        }
      }
    }

    if ('resources' in cp_topology) {
      const resources = cp_topology['resources'];
      num_resources = Object.keys(resources).length;

      for (const [name, data] of Object.entries(resources)) {
        for (const zone in data['failure_zones'] || {}) {
          cp_zones.add(zone);
        }
        for (const service in data['services'] || {}) {
          service_list.add(service);
        }
      }
    }

    if ('load-balancers' in cp_topology) {
      const load_balancers = cp_topology['load-balancers'];
      num_load_balancers = Object.keys(load_balancers).length;

      for (const [name, data] of Object.entries(load_balancers)) {
        for (const zone in data['failure_zones'] || {}) {
          cp_zones.add(zone);
        }
        for (const service in data['services'] || {}) {
          service_list.add(service);
        }
      }
    }

    const zones = Array.from(cp_zones).sort().map(zone =>
      <tr key={zone}><td>{zone}</td></tr>);

    return (
      <div key={cp_name}>
        <a name={cp_name} />
        <h2>{cp_name}</h2>
        <table>
          <thead><tr>
            <th colSpan={num_clusters}>Clusters</th>
            <th colSpan={num_resources}>Resources</th>
            <th colSpan={num_load_balancers}>Load Balancers</th>
          </tr></thead>
          <tbody>
            {zones}
          </tbody>
        </table>
      </div>
    );
  }

  render () {

    let control_planes;
    if (this.state.model) {
      this.init();
      control_planes = Object.keys(this.control_planes).sort().map(name =>
        this.render_control_plane(name, this.control_planes[name]));
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
