import React from 'react';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Title from '../Title';

interface Participant {
    id: number;
    participantID: string;
    project: string;
    numSamples: number;
    sex: string;
    created: string;
}
// generate fake sample data
function createParticipant(
    id: number,
    participantID: string,
    project: string,
    numSamples: number,
    sex: string,
    created: string): Participant {
    return { id, participantID, project, numSamples, sex, created };
}

const participants = [
    createParticipant(0, 'AA0001', '3001', 2, 'F', '2020-02-01'),
    createParticipant(1, 'AA0002', '3002', 1, 'M', '2020-02-01'),
    createParticipant(2, 'AA0003', '3003', 1, 'F', '2020-02-01'),
    createParticipant(3, 'BB0001', '2001', 1, 'F', '2020-03-11'),
    createParticipant(4, 'BB0002', '2002', 1, 'M', '2020-03-11'),
    createParticipant(5, 'BB0003', '2003', 1, 'F', '2020-03-11'),
    createParticipant(6, 'AA0004', '3012', 2, 'M', '2020-05-23'),
    createParticipant(7, 'AA0005', '3013', 2, 'M', '2020-05-23'),
]

function preventDefault(event: React.MouseEvent) {
    event.preventDefault();
}

const useStyles = makeStyles(theme => ({
    seeMore: {
        marginTop: theme.spacing(3),
    },
}));

export default function ParticipantTable() {
    const classes = useStyles();
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Title>Participants</Title>
                <Paper variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Participant</TableCell>
                                <TableCell>Project</TableCell>
                                <TableCell>Num. Samples</TableCell>
                                <TableCell>Sex</TableCell>
                                <TableCell>Created</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {participants.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.participantID}</TableCell>
                                    <TableCell>{row.project}</TableCell>
                                    <TableCell>{row.numSamples}</TableCell>
                                    <TableCell>{row.sex}</TableCell>
                                    <TableCell>{row.created}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
                <div className={classes.seeMore}>
                    <Link color="primary" href="#" onClick={preventDefault}>
                        Load more ...
                    </Link>
                </div>
            </Grid>
        </Grid>
    );
}
