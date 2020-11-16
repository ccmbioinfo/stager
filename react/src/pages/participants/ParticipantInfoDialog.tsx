import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { formatDateString, getAnalysisInfoList } from "../utils/functions";
import { Participant, Analysis } from "../utils/typings";
import { DialogHeader } from "../utils/components/components";
import SampleTable from "./SampleTable";
import DetailSection from "../utils/components/DetailSection";
import InfoList from "../utils/components/InfoList";
import { useSnackbar } from "notistack";

const useStyles = makeStyles(theme => ({
    dialogContent: {
        margin: theme.spacing(0),
        padding: theme.spacing(0),
    },
    infoSection: {
        margin: theme.spacing(3),
    },
}));

const getParticipantTitles = () => {
    return [
        "Participant ID",
        "Family ID",
        "Family Codename",
        "Sex",
        "Affected",
        "Solved",
        "Notes",
        "Time of Creation",
        "Created By",
        "Time of Update",
        "Updated By",
    ];
};
const getParticipantValues = (participant: Participant) => {
    return [
        participant.participant_id,
        participant.family_id,
        participant.family_codename,
        participant.sex,
        participant.affected,
        participant.solved,
        participant.notes,
        formatDateString(participant.created),
        participant.created_by,
        formatDateString(participant.updated),
        participant.updated_by,
    ];
};

interface DialogProp {
    open: boolean;
    participant: Participant;
    onClose: () => void;
}

export default function ParticipantInfoDialog({ participant, open, onClose }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "participant-info-dialog-slide-title";
    const [analyses, setAnalyses] = useState<Analysis[]>([]);

    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        (async () => {
            const datasets = participant.tissue_samples.flatMap(sample => sample.datasets);
            let analysisList: Analysis[] = [];
            for (const dataset of datasets) {
                const response = await fetch("/api/datasets/" + dataset.dataset_id);
                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
                    analysisList = analysisList.concat(data.analyses as Analysis[]);
                } else {
                    throw new Error(`GET /api/datasets/${dataset.dataset_id} failed. Reason: ${response.status} - ${response.statusText}`);
                }
            }
            return analysisList;
        })()
        .then(analysisList => {
            setAnalyses(analysisList)
        })
        .catch(error => {
            console.error(error);
            enqueueSnackbar(error.message, { variant: "error" });
        });
    }, [participant, enqueueSnackbar]);

    return (
        <Dialog
            onClose={onClose}
            aria-labelledby={labeledBy}
            open={open}
            maxWidth="lg"
            fullWidth={true}
        >
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Participant {participant.participant_codename}
            </DialogHeader>
            <DialogContent className={classes.dialogContent} dividers>
                <div className={classes.infoSection}>
                    <DetailSection
                        titles={getParticipantTitles()}
                        values={getParticipantValues(participant)}
                    />
                </div>
                <Divider />
                <div>
                    <SampleTable samples={participant.tissue_samples} />
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    <InfoList
                        infoList={getAnalysisInfoList(analyses)}
                        title="Analyses"
                        icon={<ShowChart />}
                        linkPath="/analysis"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
