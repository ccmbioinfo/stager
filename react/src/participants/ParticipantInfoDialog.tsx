import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import {
    formatDateString,
    getAnalysisInfoList,
    createFieldObj,
    stringToBoolean,
} from "../functions";
import { Participant, Analysis, Field } from "../typings";
import { DialogHeader } from "../components/components";
import SampleTable from "./SampleTable";
import DetailSection from "../components/DetailSection";
import InfoList from "../components/InfoList";

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
        createFieldObj("Family Codename", participant.family_codename, "family_codename", true),
        createFieldObj("Participant Type", participant.participant_type, "participant_type"),
        createFieldObj("Sex", participant.sex, "sex"),
        createFieldObj("Affected", stringToBoolean(participant.affected), "affected"),
        createFieldObj("Solved", stringToBoolean(participant.solved), "solved"),
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
    onUpdate: (participant_id: string, newParticipant: { [key: string]: any }) => void;
}

export default function ParticipantInfoDialog(props: DialogProp) {
    const classes = useStyles();
    const labeledBy = "participant-info-dialog-slide-title";
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const { enqueueSnackbar } = useSnackbar();
    const [enums, setEnums] = useState<any>();

    useEffect(() => {
        fetch("/api/enums").then(async response => {
            if (response.ok) {
                const enums = await response.json();
                setEnums(enums);
            } else {
                console.error(
                    `GET /api/enums failed with ${response.status}: ${response.statusText}`
                );
            }
        });
    }, []);

    useEffect(() => {
        (async () => {
            const datasets = props.participant.tissue_samples.flatMap(sample => sample.datasets);
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
    }, [props.participant, enqueueSnackbar]);

    return (
        <Dialog
            onClose={props.onClose}
            aria-labelledby={labeledBy}
            open={props.open}
            maxWidth="lg"
            fullWidth={true}
        >
            <DialogHeader id={labeledBy} onClose={props.onClose}>
                Details of Participant {props.participant.participant_codename}
            </DialogHeader>
            <DialogContent className={classes.dialogContent} dividers>
                <div className={classes.infoSection}>
                    <DetailSection
                        fields={getParticipantFields(props.participant)}
                        enums={enums}
                        dataInfo={{
                            type: "participant",
                            ID: props.participant.participant_id,
                            identifier: props.participant.participant_codename,
                            onUpdate: props.onUpdate,
                        }}
                    />
                </div>
                {props.participant.tissue_samples.length > 0 && (
                    <>
                        <Divider />
                        <div>
                            <SampleTable samples={props.participant.tissue_samples} enums={enums} />
                        </div>
                    </>
                )}
                {analyses.length > 0 && (
                    <>
                        <Divider />
                        <div className={classes.infoSection}>
                            <InfoList
                                infoList={getAnalysisInfoList(analyses)}
                                title="Analyses"
                                enums={enums}
                                icon={<ShowChart />}
                                linkPath="/analysis"
                            />
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
