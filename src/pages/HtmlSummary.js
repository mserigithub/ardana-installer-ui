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
      this.cp_topology = this.cloud_internal['cp-topology'];
      this.control_planes = this.cp_topology['control_planes'];
      this.servers = this.cloud_internal['servers'];

      for (const s of this.servers) {
        if (s['hostname']) {
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

  render_servers = (servers) => {
    if (servers.length == 0) {
      return (<td>&nbsp;</td>);
    }

    const hosts = servers.map(server => {
      const href = "Servers/" + this.server_by_hostname[server]['id'] + ".html";
      return (<div><a href={href}>{server}</a></div>);
    });
    return (<td>{hosts}</td>);
  }

  render_control_plane = (cp_name, cp_topology) => {
    let num_clusters = 0;
    let num_resources = 0;
    let num_load_balancers = 0;

    let service_list = new Set();
    let cp_zones = new Set();

    const clusters = cp_topology['clusters'] || {};
    const resources = cp_topology['resources'] || {};
    const load_balancers = cp_topology['load-balancers'] || {};

    // Can generalize this logic

    num_clusters = Object.keys(clusters).length;
    for (const [name, data] of Object.entries(clusters)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        service_list.add(service);
      }
    }

    num_resources = Object.keys(resources).length;
    for (const [name, data] of Object.entries(resources)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        service_list.add(service);
      }
    }

    num_load_balancers = Object.keys(load_balancers).length;
    for (const [name, data] of Object.entries(load_balancers)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        service_list.add(service);
      }
    }

    const zones = Array.from(cp_zones).sort().map(zone => {
      const cluster_servers = Object.values(clusters).map(cluster =>
        this.render_servers(cluster['failure_zones'][zone] || [])
      );

      const resource_servers = Object.values(resources).map(resource =>
        this.render_servers(resource['failure_zones'][zone] || [])
      );

      return (
        <tr key={zone}>
          <td>{zone}</td>
          {cluster_servers}
          {resource_servers}
        </tr>);
    });

    return (
      <div key={cp_name}>
        <a name={cp_name} />
        <h2>{cp_name}</h2>
        <table>
          <thead><tr>
            <th />
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
