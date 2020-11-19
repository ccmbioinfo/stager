import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { formatDateString, getAnalysisFields, createFieldObj } from "../utils/functions";
import { Participant, Analysis, Info, Field } from "../utils/typings";
import { DialogHeader } from "../utils/components/components";
import SampleTable from "./SampleTable";
import DetailSection from "../utils/components/DetailSection";
import InfoList from "../utils/components/InfoList";

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
function getAnalysisInfoList(analyses: Analysis[]): Info[] {
    return analyses.map(analysis => {
        return {
            primaryListTitle: `Analysis ID ${analysis.analysis_id}`,
            secondaryListTitle: `Current State: ${analysis.analysis_state} - Click for more details`,
            fields: getAnalysisFields(analysis),
        };
    });
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

    useEffect(() => {
        // TODO: get real data
        fetch("/api/datasets/1")
            .then(response => response.json())
            .then(data => {
                setAnalyses(data.analyses as Analysis[]);
            })
            .catch(error => {
                console.error(error);
            });
    }, [participant]);

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
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
