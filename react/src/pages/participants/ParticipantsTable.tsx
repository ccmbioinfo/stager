import React from 'react'
import MaterialTable from 'material-table'

export enum DisplayType {
  PARTICIPANT = "Participants",
  DATASET = "Datasets",
  FAMILY = "Families",
}

interface ParticipantsTableProps {
  display: DisplayType;
}

function createParticipant(participantID: string, project: string, numSamples: number, sex: string, created: string) {
  return {participantID, project, numSamples, sex, created};
}

const rows = [
  createParticipant('AA0001', '3001', 2, 'F', '2020-02-01'),
  createParticipant('AA0002', '3002', 1, 'M', '2020-02-01'),
  createParticipant('AA0003', '3003', 1, 'F', '2020-02-01'),
  createParticipant('BB0001', '2001', 1, 'F', '2020-03-11'),
  createParticipant('BB0002', '2002', 1, 'M', '2020-03-11'),
  createParticipant('BB0003', '2003', 1, 'F', '2020-03-11'),
  createParticipant('AA0004', '3012', 2, 'M', '2020-05-23'),
  createParticipant('AA0005', '3013', 2, 'M', '2020-05-23'),
];

export default function ParticipantsTable({display}: ParticipantsTableProps) {

  return (
    <MaterialTable
    columns={[
      { title: 'Participant', field: 'participantID' },
      { title: 'Project', field: 'project' },
      { title: 'Num. Samples', field: 'numSamples', type: 'numeric' },
      { title: 'Sex', field: 'sex', type: 'string' },
      { title: 'Created', field: 'created', type: 'string' }
    ]}
    data={rows}
    title={display}
    options={{
      pageSize : 10,
      selection: true
    }}
    editable={{
      onRowAdd: newData =>
      new Promise((resolve, reject) => {
          setTimeout(() => {
              /* setData([...data, newData]); */

              resolve();
          }, 1000);
      }),
  onRowUpdate: (newData, oldData) =>
      new Promise((resolve, reject) => {
          setTimeout(() => {
              // const dataUpdate = [...data];
              // const index = oldData.tableData.id;
              // dataUpdate[index] = newData;
              // setData([...dataUpdate]);

              resolve();
          }, 1000);
      }),
  onRowDelete: oldData =>
      new Promise((resolve, reject) => {
          setTimeout(() => {
              // const dataDelete = [...data];
              // const index = oldData.tableData.id;
              // dataDelete.splice(index, 1);
              // setData([...dataDelete]);
              
              resolve();
          }, 1000);
      })
    }}
  />
  )
}