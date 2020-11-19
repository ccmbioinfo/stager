import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { formatDateString, getAnalysisInfoList, createFieldObj } from "../utils/functions";
import { Participant, Analysis, Field } from "../utils/typings";
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

function getParticipantFields(participant: Participant): Field[] {
    return [
        createFieldObj("Family Codename", participant.family_codename, "family_codename"),
        createFieldObj("Participant Type", participant.participant_type, "participant_type"),
        createFieldObj("Sex", participant.sex, "sex"),
        createFieldObj("Affected", participant.affected, "affected"),
        createFieldObj("Solved", participant.solved, "solved"),
        createFieldObj("Dataset Types", participant.dataset_types, "dataset_types", true),
        createFieldObj("Notes", participant.notes, "notes"),
        createFieldObj("Time of Creation", formatDateString(participant.created), "created", true),
        createFieldObj("Created By", participant.created_by, "created_by", true),
        createFieldObj("Time of Update", formatDateString(participant.updated), "updated", true),
        createFieldObj("Updated By", participant.updated_by, "updated_by", true),
    ];
}

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
                    analysisList = analysisList.concat(data.analyses as Analysis[]);
                } else {
                    throw new Error(
                        `GET /api/datasets/${dataset.dataset_id} failed. Reason: ${response.status} - ${response.statusText}`
                    );
                }
            }
            return analysisList;
        })()
            .then(analysisList => {
                setAnalyses(analysisList);
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
                        fields={getParticipantFields(participant)}
                        editable
                        dataType="participant"
                        dataID={participant.participant_id}
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
