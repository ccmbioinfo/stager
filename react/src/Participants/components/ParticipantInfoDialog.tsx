import { useMemo } from "react";
import { Box, Dialog, DialogContent, Divider, makeStyles } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";

import { useSnackbar } from "notistack";

import { DetailSection, DialogHeader, InfoList } from "../../components";
import { formatDateString, formatSubmitValue, getAnalysisInfoList } from "../../functions";
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
        {
            title: "Family Codename",
            value: participant.family_codename,
            fieldName: "family_codename",
            editable: true,
            maxLength: 50,
        },
        {
            title: "Family Aliases",
            value: participant.family_aliases,
            fieldName: "family_aliases",
            editable: true,
            maxLength: 100,
        },
        {
            title: "Participant Type",
            value: participant.participant_type,
            fieldName: "participant_type",
            editable: true,
        },
        {
            title: "Participant Codename",
            value: participant.participant_codename,
            fieldName: "participant_codename",
            editable: true,
            maxLength: 50,
        },
        {
            title: "Participant Aliases",
            value: participant.participant_aliases,
            fieldName: "participant_aliases",
            editable: true,
            maxLength: 100,
        },
        {
            title: "Month of Birth",
            value: formatDateString(participant.month_of_birth, "month_of_birth"),
            fieldName: "month_of_birth",
            editable: true,
        },
        { title: "Sex", value: participant.sex, editable: true, fieldName: "sex" },
        {
            title: "Affected",
            value: participant.affected,
            type: "boolean",
            fieldName: "affected",
            editable: true,
        },
        {
            title: "Solved",
            value: participant.solved,
            type: "boolean",
            editable: true,
            fieldName: "solved",
        },
        {
            title: "Dataset Types",
            value: participant.dataset_types.join(", "),
            fieldName: "dataset_types",
            editable: false,
        },
        { title: "Notes", value: participant.notes, fieldName: "notes", editable: true },
        {
            title: "Time of Creation",
            value: participant.created,
            type: "timestamp",
            fieldName: "created",
            editable: false,
        },
        {
            title: "Created By",
            value: participant.created_by,
            fieldName: "created_by",
            editable: false,
        },
        {
            title: "Time of Update",
            value: participant.updated,
            type: "timestamp",
            fieldName: "updated",
            editable: false,
        },
        {
            title: "Updated By",
            value: participant.updated_by,
            fieldName: "updated_by",
            editable: false,
        },
        {
            title: "Institution",
            value: participant.institution,
            fieldName: "institution",
            editable: true,
        },
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
                if (field.fieldName && field.editable) {
                    return {
                        [field.fieldName]: formatSubmitValue(field),
                    };
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
