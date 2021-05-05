import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Collapse,
    Dialog,
    DialogContent,
    Divider,
    makeStyles,
    Typography,
} from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { DetailSection, DialogHeader, InfoList } from "../../components";
import {
    createFieldObj,
    formatDateString,
    getAnalysisInfoList,
    stringToBoolean,
} from "../../functions";
import { useDatasetQueries, useEnumsQuery } from "../../hooks";
import { Analysis, Field, Participant } from "../../typings";
import SampleTable from "./SampleTable";

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
        createFieldObj(
            "Participant Type",
            participant.participant_type,
            "participant_type",
            false,
            true
        ),
        createFieldObj("Sex", participant.sex, "sex", false, true),
        createFieldObj("Affected", stringToBoolean(participant.affected), "affected", false, true),
        createFieldObj("Solved", stringToBoolean(participant.solved), "solved", false, true),
        createFieldObj("Dataset Types", participant.dataset_types, "dataset_types", true, true),
        createFieldObj("Notes", participant.notes, "notes", false, true),
        createFieldObj(
            "Time of Creation",
            formatDateString(participant.created),
            "created",
            true,
            true
        ),
        createFieldObj("Created By", participant.created_by, "created_by", true, true),
        createFieldObj(
            "Time of Update",
            formatDateString(participant.updated),
            "updated",
            true,
            true
        ),
        createFieldObj("Updated By", participant.updated_by, "updated_by", true, true),
        createFieldObj("Institution", participant.institution, "institution", true, true),
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
    const [analysisInfoListOpen, setAnalysisInfoListOpen] = useState(false);
    const datasets = useMemo(
        () => props.participant.tissue_samples.flatMap(sample => sample.datasets),
        [props.participant]
    );
    const datasetResults = useDatasetQueries(datasets.map(d => d.dataset_id));
    const analyses = useMemo(
        () =>
            datasetResults.reduce<Analysis[]>(
                (prev, curr) => (curr.isSuccess ? prev.concat(curr.data.analyses) : prev),
                []
            ),
        [datasetResults]
    );
    const labeledBy = "participant-info-dialog-slide-title";
    const { data: enums } = useEnumsQuery();

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
                        mainColumnWidth={3}
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

                <>
                    <Divider />
                    <Box margin={3}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => setAnalysisInfoListOpen(!analysisInfoListOpen)}
                        >
                            {`${analysisInfoListOpen ? "Hide" : "Show"} Analyses`}
                        </Button>
                        <Collapse in={analysisInfoListOpen}>
                            {analyses && analyses.length ? (
                                <InfoList
                                    infoList={getAnalysisInfoList(analyses)}
                                    enums={enums}
                                    icon={<ShowChart />}
                                    linkPath="/analysis"
                                />
                            ) : (
                                <Typography>There are no analyses for this participant</Typography>
                            )}
                        </Collapse>
                    </Box>
                </>
            </DialogContent>
        </Dialog>
    );
}
