import React, { useMemo } from "react";
import { Box, Dialog, DialogContent, Divider, makeStyles } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";

import dayjs from "dayjs";
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
    useFamilyUpdateMutation,
    useParticipantQuery,
    useParticipantUpdateMutation,
} from "../../hooks";
import { Analysis, Family, Field, Participant } from "../../typings";
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
        createFieldObj(
            "Family Codename",
            participant.family_codename,
            "family_codename",
            false,
            50
        ),
        createFieldObj("Family Aliases", participant.family_aliases, "family_aliases", false, 100),
        createFieldObj("Participant Type", participant.participant_type, "participant_type"),
        createFieldObj(
            "Participant Codename",
            participant.participant_codename,
            "participant_codename",
            false,
            50
        ),
        createFieldObj(
            "Participant Aliases",
            participant.participant_aliases,
            "participant_aliases",
            false,
            100
        ),
        createFieldObj(
            "Month of Birth",
            formatDateString(participant.month_of_birth),
            "month_of_birth"
        ),
        createFieldObj("Sex", participant.sex, "sex"),
        createFieldObj("Affected", stringToBoolean(participant.affected), "affected", true),
        createFieldObj("Solved", stringToBoolean(participant.solved), "solved"),
        createFieldObj(
            "Dataset Types",
            participant.dataset_types.join(", "),
            "dataset_types",
            true
        ),
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
    family_id: string;
    onClose: () => void;
}

export default function ParticipantInfoDialog({
    participant_id,
    family_id,
    onClose,
    open,
}: DialogProp) {
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
    const familyUpdateMutation = useFamilyUpdateMutation();
    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

    const labeledBy = "participant-info-dialog-slide-title";
    const { data: enums } = useEnumsQuery();

    const updateParticipant = async (fields: Field[]) => {
        const newFamilyData = fields
            .map(field => {
                if (
                    field.fieldName &&
                    (field.fieldName === "family_codename" || field.fieldName === "family_aliases")
                ) {
                    return { [field.fieldName]: field.value };
                } else return false;
            })
            .filter(Boolean)
            .reduce((acc, curr) => ({ ...acc, ...curr }), {} as Family);

        const newParticipantData = fields
            .map(field => {
                if (field.fieldName && !field.disableEdit) {
                    if (
                        field.fieldName === "month_of_birth" &&
                        field.value &&
                        typeof field.value === "string" &&
                        /^0[1-9]|1[012]-\d{4}$/.test(field.value)
                    ) {
                        field.value = dayjs(field.value, "MM-YYYY").format("YYYY-MM-1");
                    }
                    return { [field.fieldName]: field.value };
                } else return false;
            })
            .filter(Boolean)
            .reduce((acc, curr) => ({ ...acc, ...curr }), {} as Participant);

        familyUpdateMutation.mutate(
            {
                ...newFamilyData,
                family_id,
            },
            {
                onError: response => {
                    console.error(
                        `PATCH /api/families/${family_id} failed with ${response.status}: ${response.statusText}`
                    );
                    enqueueErrorSnackbar(response, `Failed to edit Family ID ${family_id}`);
                },
            }
        );

        participantUpdateMutation.mutate(
            {
                ...newParticipantData,
                participant_id,
            },
            {
                onSuccess: receiveDataset => {
                    enqueueSnackbar(`Participant ID ${participant_id} updated successfully`, {
                        variant: "success",
                    });
                },
                onError: response => {
                    console.error(
                        `PATCH /api/participants/${participant_id} failed with ${response.status}: ${response.statusText}`
                    );
                    enqueueErrorSnackbar(
                        response,
                        `Failed to edit Participant ID ${participant_id}`
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
