import React, { useMemo } from "react";
import { Box, Dialog, DialogContent, Divider, makeStyles } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { useSnackbar } from "notistack";

import { DetailSection, DialogHeader, InfoList } from "../../components";
import {
    createFieldObj,
    formatDateString,
    getAnalysisInfoList,
    stringToBoolean,
} from "../../functions";
import {
    useDatasetQueries,
    useEnumsQuery,
    useErrorSnackbar,
    useParticipantQuery,
    useParticipantUpdateMutation,
} from "../../hooks";
import SampleTable from "./SampleTable";
import { Analysis, Field, Participant } from "../../typings";

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
    participant_id: string;
    onClose: () => void;
}

export default function ParticipantInfoDialog({ participant_id, onClose, open }: DialogProp) {
    const classes = useStyles();
    const { data: participant } = useParticipantQuery(participant_id);
    const datasets = useMemo(
        () => (participant ? participant.tissue_samples.flatMap(sample => sample.datasets) : []),
        [participant]
    );
    const dataset_ids: string[] = datasets.map(d => d.dataset_id);
    const datasetResults = useDatasetQueries(dataset_ids);
    const analyses = useMemo(
        () =>
            datasetResults.reduce<Analysis[]>(
                (prev, curr) => (curr.isSuccess ? prev.concat(curr.data.analyses) : prev),
                []
            ),
        [datasetResults]
    );

    const participantUpdateMutation = useParticipantUpdateMutation();
    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

    const labeledBy = "participant-info-dialog-slide-title";
    const { data: enums } = useEnumsQuery();

    const updateParticipant = async (fields: Field[]) => {
        const newData = fields
            .map(field => {
                if (field.fieldName && !field.disableEdit) {
                    return { [field.fieldName]: field.value };
                } else return false;
            })
            .filter(Boolean)
            .reduce((acc, curr) => ({ ...acc, ...curr }), {} as Participant);

        participantUpdateMutation.mutate(
            {
                ...newData,
                participant_id,
            },
            {
                onSuccess: receiveDataset => {
                    enqueueSnackbar(
                        `Participant ID ${newData.participant_id} updated successfully`,
                        {
                            variant: "success",
                        }
                    );
                },
                onError: response => {
                    console.error(
                        `PATCH /api/participants/${newData.participant_id} failed with ${response.status}: ${response.statusText}`
                    );
                    enqueueErrorSnackbar(
                        response,
                        `Failed to edit Participant ID ${newData?.participant_id}`
                    );
                },
            }
        );
    };

    return (
        <Dialog
            onClose={onClose}
            aria-labelledby={labeledBy}
            open={open}
            maxWidth="lg"
            fullWidth={true}
        >
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Participant {participant?.participant_codename}
            </DialogHeader>
            <DialogContent className={classes.dialogContent} dividers>
                <div className={classes.infoSection}>
                    {participant && (
                        <DetailSection
                            fields={getParticipantFields(participant)}
                            enums={enums}
                            columnWidth={3}
                            editable={true}
                            update={updateParticipant}
                        />
                    )}
                </div>
                {participant && participant.tissue_samples.length > 0 && (
                    <>
                        <Divider />
                        <div>
                            <SampleTable samples={participant.tissue_samples} enums={enums} />
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
