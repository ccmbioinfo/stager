import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles, Tooltip, Button } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { PipelineStatus, Analysis } from './utils';

const useStyles = makeStyles(theme => ({
    msgBox: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(1),
        paddingRight: theme.spacing(2),
        border: "1px solid white",
    },
    msgBoxOnHover: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(1),
        paddingRight: theme.spacing(2),
    },
    button: {
        padding: theme.spacing(0),
        display: "block",
        width: "100%",
        textTransform: "none",
    }
}));

export interface NotificationProps {
    analysis: Analysis,
    onClick: () => void
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

function getNotificationInfo(analysis: Analysis) {
    const msg = `The status of ${analysis.analysis_id} has changed to `;
    switch (analysis.state) {
        case PipelineStatus.PENDING:
            return createNotification(analysis.analysis_id, `${msg}PENDING`, Severity.PENDING);
        case PipelineStatus.RUNNING:
            return createNotification(analysis.analysis_id, `${msg}RUNNING`, Severity.RUNNING);
        case PipelineStatus.COMPLETED:
            return createNotification(analysis.analysis_id, `${msg}COMPLETED`, Severity.COMPLETED);
        case PipelineStatus.ERROR:
            return createNotification(analysis.analysis_id, `${msg}ERROR`, Severity.ERROR);
        case PipelineStatus.CANCELLED:
            return createNotification(analysis.analysis_id, `${msg}CANCELLED`, Severity.ERROR);
    }
}

export default function Notification({ analysis, onClick } : NotificationProps) {
    const classes = useStyles();
    const [hover, setHover] = useState(false);
    const {analysis_id, msg, severity} = getNotificationInfo(analysis)!;

    return (
        <Button className={classes.button} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>

            <Tooltip title="Click to see detail">
                {
                    hover
                    ? <Alert variant="filled" className={classes.msgBoxOnHover} severity={severity}>{ msg }</Alert>
                    : <Alert className={classes.msgBox} severity={severity}>{ msg }</Alert>
                }
            </Tooltip>
        </Button>

    );
}
