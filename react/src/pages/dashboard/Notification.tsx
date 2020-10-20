import React from 'react';
import { Link } from 'react-router-dom';
import { makeStyles, Button } from '@material-ui/core';
import { OpenInNew } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { PipelineStatus, Analysis } from '../utils';

const useStyles = makeStyles(theme => ({
    msgBox: {
        display: 'flex',
        alignItems: 'center',
        paddingTop: theme.spacing(.5),
        paddingBottom: theme.spacing(.5),
    },
    msgButton: {
        marginLeft: theme.spacing(1),
    },
}));

export interface NotificationProps {
    analysis: Analysis,
}

enum Severity {
    PENDING = "warning",
    RUNNING = "info",
    COMPLETED = "success",
    ERROR = "error",
}

export interface NotificationObj {
    analysis_id: string;
    msg: string;
    severity: Severity
}

function createNotification(
    analysis_id: string,
    msg: string,
    severity: Severity): NotificationObj {
    return { analysis_id, msg, severity };
}

const getNotificationInfo = (analysis: Analysis) => {
    const msg = `The status of ${analysis.analysis_id} has changed to `;
    switch (analysis.state) {
        case PipelineStatus.PENDING:
            return createNotification(analysis.analysis_id, `${msg}PENDING`, Severity.PENDING)
        case PipelineStatus.RUNNING:
            return createNotification(analysis.analysis_id, `${msg}RUNNING`, Severity.RUNNING)
        case PipelineStatus.COMPLETED:
            return createNotification(analysis.analysis_id, `${msg}COMPLETED`, Severity.COMPLETED)
        case PipelineStatus.ERROR:
            return createNotification(analysis.analysis_id, `${msg}ERROR`, Severity.ERROR)
    }
}

export default function Notification({ analysis } : NotificationProps) {
    const classes = useStyles();
    const {analysis_id, msg, severity} = getNotificationInfo(analysis)!;

    return (
    <Alert className={classes.msgBox} severity={severity}>
        <span>{msg}</span>
        <Button component={Link} to={`/analysis/${analysis_id}`} className={classes.msgButton} variant="contained" color="default" endIcon={<OpenInNew color="primary"/>} disableElevation>
            See Detail
        </Button>
    </Alert>   
    );
}
