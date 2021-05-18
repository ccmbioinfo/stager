import React, { useMemo } from "react";
import { Box, Dialog, DialogContent, Divider, makeStyles } from "@material-ui/core";
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
        createFieldObj("Family Codename", participant.family_codename, "family_codename"),
        createFieldObj("Family Aliases", participant.family_aliases, "family_aliases"),
        createFieldObj("Participant Type", participant.participant_type, "participant_type"),
        createFieldObj(
            "Participant Aliases",
            participant.participant_aliases,
            "participant_aliases"
        ),
        createFieldObj("Sex", participant.sex, "sex"),
        createFieldObj("Affected", stringToBoolean(participant.affected), "affected", true),
        createFieldObj("Solved", stringToBoolean(participant.solved), "solved"),
        createFieldObj("Dataset Types", participant.dataset_types, "dataset_types", true),
        createFieldObj("Notes", participant.notes, "notes"),
        createFieldObj("Time of Creation", formatDateString(participant.created), "created", true),
        createFieldObj("Created By", participant.created_by, "created_by", true),
        createFieldObj("Time of Update", formatDateString(participant.updated), "updated", true),
        createFieldObj("Updated By", participant.updated_by, "updated_by", true),
        createFieldObj("Institution", participant.institution, "institution", true),
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
                        columnWidth={3}
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
                        {analyses.length > 0 && (
                            <InfoList
                                infoList={getAnalysisInfoList(analyses)}
                                title="Analyses"
                                enums={enums}
                                icon={<ShowChart />}
                                linkPath="/analysis"
                            />
                        )}
                    </Box>
                </>
            </DialogContent>
        </Dialog>
    );
}
