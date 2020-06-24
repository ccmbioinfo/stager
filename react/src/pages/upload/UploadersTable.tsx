import React from 'react'
import MaterialTable from 'material-table'

function createFile(name: string, filesUnlinked: number, filesUploaded: number, lastActive: string) {
    return {name, filesUnlinked, filesUploaded, lastActive};
}

const rows = [
    createFile('CHEO', 1, 234, '2020-02-01'),
    createFile('ACH', 3, 11, '2020-02-01'),
    createFile('SK', 5, 903, '2020-02-01'),
    createFile('MTS', 1, 14, '2020-02-01'),
    createFile('BTS', 8, 0, '2020-02-01'),
];

export default function FilesTable() {

    return (
      <MaterialTable
      columns={[
        { title: 'Organization', field: 'name' },
        { title: 'Files unlinked', field: 'filesUnlinked', type: 'numeric' },
        { title: 'Files uploaded', field: 'filesUploaded', type: 'string' },
        { title: 'Last Active', field: 'lastActive', type: 'string' }
      ]}
      data={rows}
      title={"Uploaders"}
      options={{
        pageSize : 10,
        selection: true
      }}
    />
    )
  }