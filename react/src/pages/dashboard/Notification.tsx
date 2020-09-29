import React from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import Button from '@material-ui/core/Button';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { PipelineStatus, AnalysisRun } from '../analysis/Analysis';

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
    analysis: AnalysisRun,
}

enum Severity {
    PENDING = "warning",
    RUNNING = "info",
    COMPLETED = "success",
    ERROR = "error",
}

export interface NotificationObj {
    analysisID: string;
    msg: string;
    severity: Severity
}

function createNotification(
    analysisID: string,
    msg: string,
    severity: Severity): NotificationObj {
    return { analysisID, msg, severity };
}

const getNotificationInfo = (analysis: AnalysisRun) => {
    const msg = `The status of ${analysis.analysisID} has changed to `;
    switch (analysis.status) {
        case PipelineStatus.PENDING:
            return createNotification(analysis.analysisID, `${msg}PENDING`, Severity.PENDING)
        case PipelineStatus.RUNNING:
            return createNotification(analysis.analysisID, `${msg}RUNNING`, Severity.RUNNING)
        case PipelineStatus.COMPLETED:
            return createNotification(analysis.analysisID, `${msg}COMPLETED`, Severity.COMPLETED)
        case PipelineStatus.ERROR:
            return createNotification(analysis.analysisID, `${msg}ERROR`, Severity.ERROR)
    }
}

export default function Notification({ analysis } : NotificationProps) {
    const classes = useStyles();
    const {analysisID, msg, severity} = getNotificationInfo(analysis)

    return (
    <Alert className={classes.msgBox} severity={severity}>
        <span>{msg}</span>
        <Button component={Link} to={`/analysis/${analysisID}`} className={classes.msgButton} variant="contained" color="default" endIcon={<OpenInNewIcon color="primary"/>} disableElevation>
            See Detail
        </Button>
    </Alert>   
    );
}
