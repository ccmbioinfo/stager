import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { formatDateString, getAnalysisTitles, getAnalysisValues } from "../utils/functions";
import { Participant, Analysis, Info } from "../utils/typings";
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
function getAnalysisInfoList(analyses: Analysis[]): Info[] {
    return analyses.map(analysis => {
        return {
            primaryListTitle: `Analysis ID ${analysis.analysis_id}`,
            secondaryListTitle: `Current State: ${analysis.analysis_state} - Click for more details`,
            titles: getAnalysisTitles(),
            values: getAnalysisValues(analysis),
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
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
