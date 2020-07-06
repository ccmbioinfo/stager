import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

function createData(name: string, dataset: string, inputFiles: string, fileSize: string, dateUploaded: string) {
  return { name, dataset, inputFiles, fileSize, dateUploaded };
}

const rows = [
  createData('3000_AA920', "CES", "AF983D_3000_AA920.bam", "102400", "2020-10-01"),
  createData('3000_AA921', "RES", "AF983D_3000_AA921_R1.fq.gz, AF983D_3000_AA921_R2.fq.gz,", "102400 + 102400", "2020-10-01"),
  createData('3000_AA922', "RES", "AF983D_3000_AA922_R1.fq.gz, AF983D_3000_AA922_R2.fq.gz,", "102400 + 102400", "2020-10-01"),
];

export default function DatasetTable() {
  const classes = useStyles();

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>SampleID</TableCell>
            <TableCell align="right">Dataset Type</TableCell>
            <TableCell align="right">Input files</TableCell>
            <TableCell align="right">File size (mb)</TableCell>
            <TableCell align="right">Date uploaded</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.dataset}</TableCell>
              <TableCell align="right">{row.inputFiles}</TableCell>
              <TableCell align="right">{row.fileSize}</TableCell>
              <TableCell align="right">{row.dateUploaded}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}