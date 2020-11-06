import React, { useState, useEffect } from "react";
import { makeStyles, Chip, IconButton } from "@material-ui/core";
import { Cancel, FileCopy } from "@material-ui/icons";
import MaterialTable, { MTableToolbar } from "material-table";
import { useSnackbar } from "notistack";
import { countArray, toKeyValue, KeyValue, Participant, Sample, Dataset } from "../utils";
import DatasetTypes from "./DatasetTypes";
import ParticipantDetailDialog from "./ParticipantDetailDialog";

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: "10px",
        colorPrimary: theme.palette.primary,
    },
    copyIcon: {
        marginLeft: theme.spacing(1),
    },
}));

export default function ParticipantTable() {
    const classes = useStyles();
    const [filter, setFilter] = useState<string[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [detail, setDetail] = useState(false);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(undefined);
    const [sexTypes, setSexTypes] = useState<KeyValue>({});
    const [datasetTypes, setDatasetTypes] = useState<KeyValue>({});
    const [participantTypes, setParticipantTypes] = useState<KeyValue>({});
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    async function CopyToClipboard(event: React.MouseEvent, rowData: Participant | Participant[]) {
        if (!Array.isArray(rowData)) {
            const toCopy = rowData.participant_codename + "_" + rowData.family_codename;
            await navigator.clipboard.writeText(toCopy);
        }
    }

    useEffect(() => {
        fetch("/api/enums").then(async response => {
            if (response.ok) {
                const enums = await response.json();
                setSexTypes(toKeyValue(enums.Sex));
                setDatasetTypes(toKeyValue(enums.DatasetType));
                setParticipantTypes(toKeyValue(enums.ParticipantType));
            } else {
                console.error(
                    `GET /api/enums failed with ${response.status}: ${response.statusText}`
                );
            }
        });

        fetch("/api/participants").then(async response => {
            if (response.ok) {
                const participants = await response.json();
                // Collect all dataset type labels from all tissue samples
                // for each participant in the dataset_types array
                participants.forEach(
                    (participant: Participant) =>
                        (participant.dataset_types = participant.tissue_samples
                            .map(({ datasets }) => datasets.map(dataset => dataset.dataset_type))
                            .flat())
                );
                setParticipants(participants as Participant[]);
            } else {
                console.error(
                    `GET /api/participants failed with ${response.status}: ${response.statusText}`
                );
            }
        });
    }, []);

    return (
        <div>
            {activeRow && (
                <ParticipantDetailDialog
                    open={detail}
                    participant={activeRow}
                    onClose={() => setDetail(false)}
                />
            )}
            <MaterialTable
                columns={[
                    {
                        title: "Participant Codename",
                        field: "participant_codename",
                        align: "center",
                    },
                    {
                        title: "Family Codename",
                        field: "family_codename",
                        align: "center",
                        editable: "never",
                    },
                    {
                        title: "Participant Type",
                        field: "participant_type",
                        align: "center",
                        lookup: participantTypes,
                        defaultFilter: filter,
                    },
                    { title: "Affected", field: "affected", type: "boolean", align: "center" },
                    { title: "Solved", field: "solved", type: "boolean", align: "center" },
                    {
                        title: "Sex",
                        field: "sex",
                        type: "string",
                        align: "center",
                        lookup: sexTypes,
                    },
                    { title: "Notes", field: "notes", width: "50%" },
                    {
                        title: "Dataset Types",
                        field: "dataset_types",
                        align: "center",
                        editable: "never",
                        lookup: datasetTypes,
                        render: rowData => (
                            <DatasetTypes datasetTypes={countArray(rowData.dataset_types)} />
                        ),
                    },
                ]}
                data={participants}
                title="Participants"
                options={{
                    pageSize: 10,
                    selection: false,
                    filtering: true,
                    search: false,
                    padding: "dense",
                }}
                components={{
                    Toolbar: props => (
                        <div>
                            <MTableToolbar {...props} />
                            <div style={{ marginLeft: "24px" }}>
                                <Chip
                                    label="Proband"
                                    clickable
                                    className={classes.chip}
                                    onClick={() => setFilter(["Proband"])}
                                />
                                <Chip
                                    label="Parent"
                                    clickable
                                    className={classes.chip}
                                    onClick={() => setFilter(["Parent"])}
                                />
                                <Chip
                                    label="Sibling"
                                    clickable
                                    className={classes.chip}
                                    onClick={() => setFilter(["Sibling"])}
                                />
                                <IconButton className={classes.chip} onClick={() => setFilter([])}>
                                    {" "}
                                    <Cancel />{" "}
                                </IconButton>
                            </div>
                        </div>
                    ),
                }}
                editable={{
                    onRowUpdate: async (newParticipant, oldParticipant) => {
                        const response = await fetch(
                            `/api/participants/${newParticipant.participant_id}`,
                            {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(newParticipant),
                            }
                        );
                        if (response.ok) {
                            const updatedParticipant = await response.json();
                            setParticipants(
                                participants.map(participant =>
                                    participant.participant_id === newParticipant.participant_id
                                        ? { ...participant, ...updatedParticipant }
                                        : participant
                                )
                            );
                            enqueueSnackbar(
                                `Participant ${newParticipant.participant_codename} updated successfully`
                            );
                        } else {
                            console.error(
                                `PATCH /api/participants/${newParticipant.participant_id} failed with ${response.status}: ${response.statusText}`
                            );
                        }
                    },
                }}
                actions={[
                    {
                        icon: () => <FileCopy className={classes.copyIcon} />,
                        tooltip: "Copy combined codename",
                        onClick: CopyToClipboard,
                    },
                ]}
                localization={{
                    header: {
                        //remove action buttons' header
                        actions: "",
                    },
                }}
                onRowClick={(event, rowData) => {
                    setActiveRow(rowData as Participant);
                    setDetail(true);
                }}
            />
        </div>
    );
}
