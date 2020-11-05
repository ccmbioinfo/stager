import React, { useState, useEffect } from "react";
import { makeStyles, Chip, IconButton, TextField } from "@material-ui/core";
import { Cancel, FileCopy, Visibility } from "@material-ui/icons";
import MaterialTable, { MTableToolbar } from "material-table";
import { useSnackbar } from "notistack";
import { countArray, toKeyValue } from "../utils/functions";
import { KeyValue, Participant, Sample, Dataset } from "../utils/typings";
import DatasetTypes from "./DatasetTypes";
import ParticipantInfoDialog from "./ParticipantInfoDialog";

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
                participants.forEach((participant: Participant) => {
                    const samples = participant.tissue_samples;
                    samples.forEach((sample: Sample) => {
                        const datasets = sample.datasets;
                        datasets.forEach((dataset: Dataset) => {
                            participant["dataset_types"]
                                ? participant["dataset_types"].push(dataset.dataset_type)
                                : (participant["dataset_types"] = [dataset.dataset_type]);
                        });
                    });
                });
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
                <ParticipantInfoDialog
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
                    },
                    {
                        title: "Family Codename",
                        field: "family_codename",
                        editable: "never",
                    },
                    {
                        title: "Participant Type",
                        field: "participant_type",
                        lookup: participantTypes,
                        defaultFilter: filter,
                    },
                    { title: "Affected", field: "affected", type: "boolean" },
                    { title: "Solved", field: "solved", type: "boolean" },
                    {
                        title: "Sex",
                        field: "sex",
                        type: "string",
                        lookup: sexTypes,
                    },
                    {
                        title: "Notes",
                        field: "notes",
                        grouping: false,
                        editComponent: props => (
                            <TextField
                                multiline
                                value={props.value}
                                onChange={event => props.onChange(event.target.value)}
                                rows={4}
                                fullWidth
                            />
                        ),
                    },
                    {
                        title: "Dataset Types",
                        field: "dataset_types",
                        editable: "never",
                        lookup: datasetTypes,
                        grouping: false,
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
                    grouping: true,
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
                        tooltip: "View participant details",
                        icon: Visibility,
                        position: "row",
                        onClick: (event, rowData) => {
                            setActiveRow(rowData as Participant);
                            setDetail(true);
                        },
                    },
                    {
                        tooltip: "Copy combined codename",
                        icon: FileCopy,
                        onClick: CopyToClipboard,
                    },
                ]}
                localization={{
                    header: {
                        actions: "", //remove action buttons' header
                    },
                }}
            />
        </div>
    );
}
