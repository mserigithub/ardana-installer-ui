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
import { translate } from '../localization/localize.js';
import ServerRowItem from './ServerRowItem.js';

class ServerTable extends Component {
  constructor(props) {
    super(props);
  }

  renderServerRows() {
    let items =
      this.props.tableData.map((row, index) => {
        return (
          <ServerRowItem
            data={row}
            dataDef={this.props.tableConfig.columns}
            editAction={this.props.editAction}
            viewAction={this.props.viewAction}
            deleteAction={this.props.deleteAction}
            tableId={this.props.id}
            checkInputs={this.props.checkInputs}
            checkDupIds={this.props.checkDupIds}
            key={index}>
          </ServerRowItem>
        );
      });
    return items;
  }

  renderTableHeaders() {
    let keyCount = 0;
    let headers =
      this.props.tableConfig.columns.map((colDef, index) => {
        if(!colDef.hidden) {
          return (
            <th key={keyCount++}>{translate('server.item.' + colDef.name)}</th>
          );
        }
      });

    // push an empty header to hold show detail icon
    if (this.props.viewAction)
      headers.push(<th key={keyCount++}></th>);

    // push another empty header to hold edit icon
    if (this.props.editAction)
      headers.push(<th key={keyCount++}></th>);

    // push another empty header to hold delete icon
    if (this.props.deleteAction)
      headers.push(<th key={keyCount++}></th>);
    return (
      <tr>{headers}</tr>
    );
  }

  render() {
    return (
      <table className='table'>
        <thead>{!this.props.noHeader && this.renderTableHeaders()}</thead>
        <tbody>{this.renderServerRows()}</tbody>
      </table>
    );
  }
}

export default ServerTable;
