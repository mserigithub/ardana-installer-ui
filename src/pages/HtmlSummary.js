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

/*
 * This class is a JavaScript implementation of the script
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/ControlPlanes.py
 * in the config processor
 */
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
        // console.log(error);
      });
  }

  render_servers = (servers) => {
    if (servers.length == 0) {
      return (<td>&nbsp;</td>);
    }

    // Example of creating a link to another page. Probably don't want to do this for real
    const hosts = servers.map(server => {
      return (<div><a href={'Servers/' + this.server_by_hostname[server]['id'] + '.html'}>{server}</a></div>);
    });
    return (<td>{hosts}</td>);
  }

  render_control_plane = (cp_name, cp_topology) => {

    let services = new Set();
    let cp_zones = new Set();

    const clusters = cp_topology['clusters'] || {};
    const resources = cp_topology['resources'] || {};
    const load_balancers = cp_topology['load-balancers'] || {};

    // Gather info about each cluster
    const num_clusters = Object.keys(clusters).length;
    let cluster_names = [];
    for (const [name, data] of Object.entries(clusters)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        services.add(service);
      }
      cluster_names.push(name);
    }
    cluster_names.sort();

    // Gather info about each resource
    const num_resources = Object.keys(resources).length;
    let resource_names = [];
    for (const [name, data] of Object.entries(resources)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        services.add(service);
      }
      resource_names.push(name);
    }
    resource_names.sort();

    // Gather info about each load balancer
    const num_load_balancers = Object.keys(load_balancers).length;
    let lb_names = [];
    for (const [name, data] of Object.entries(load_balancers)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        services.add(service);
      }
      lb_names.push(name);
    }
    lb_names.sort();

    // Generate the header with names
    const names = cluster_names.map(name => <th>{name}</th>).concat(
      resource_names.map(name => <th>{name}</th>)).concat(
      lb_names.map(name => <th>{name}</th>));

    // Create a sorted list of those items in the services set, with the items in
    // list_separately placed at the end of the list
    const list_separately = ['foundation', 'clients', 'ardana'];
    for (const item of list_separately) {
      services.delete(item);
    }
    const service_list = Array.from(new Set([...services])).concat(list_separately);

    // Generate the rows containing service names
    let service_rows = [];
    for (const service of service_list) {
      const cells = [<td />]
        .concat(cluster_names.map(name => clusters[name]['services'][service] ? <td>{service}</td> : <td/>))
        .concat(resource_names.map(name => resources[name]['services'][service] ? <td>{service}</td> : <td/>))
        .concat(lb_names.map(name => load_balancers[name]['services'][service] ? <td>{service}</td> : <td/>));

      service_rows.push(<tr>{cells}</tr>);
    }

    // Generate the rows containing load balancer name/saddresses
    let cells = [<td />]
      .concat(cluster_names.map(name => <td/>))
      .concat(resource_names.map(name => <td/>))
      .concat(lb_names.map(name => load_balancers[name]['external-name'] ?
        <td>{load_balancers[name]['external-name']}</td> : <td/>));
    const lb_name_row = (<tr>{cells}</tr>);

    cells = [<td />]
      .concat(cluster_names.map(name => <td/>))
      .concat(resource_names.map(name => <td/>))
      .concat(lb_names.map(name => load_balancers[name]['address'] ?
        <td><a href={'Networks.html#'+load_balancers[name]['network']}>{load_balancers[name]['address']}</a></td> :
        <td/>));
    const lb_address_row = (<tr>{cells}</tr>);


    // Generate the zone rows
    const zone_rows = Array.from(cp_zones).sort().map(zone => {
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
            <tr><td>&nbsp;</td>{names}</tr>
            {service_rows}
            {lb_name_row}
            {lb_address_row}
            {zone_rows}
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
    } else {
      control_planes = 'Loading...';
    }

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading('Control Planes')}
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
