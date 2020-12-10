import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TextField } from "@material-ui/core";
import { FileCopy, Visibility } from "@material-ui/icons";
import MaterialTable from "material-table";
import { useSnackbar } from "notistack";
import { countArray, exportCSV, toKeyValue } from "../utils/functions";
import { KeyValue, Participant } from "../utils/typings";
import DatasetTypes from "./DatasetTypes";
import ParticipantInfoDialog from "./ParticipantInfoDialog";
import Note from "../utils/components/Note";

export default function ParticipantTable() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [detail, setDetail] = useState(false);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(undefined);
    const [sexTypes, setSexTypes] = useState<KeyValue>({});
    const [datasetTypes, setDatasetTypes] = useState<KeyValue>({});
    const [participantTypes, setParticipantTypes] = useState<KeyValue>({});
    const { enqueueSnackbar } = useSnackbar();

    const { id: paramID } = useParams<{ id?: string }>();

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
                <ParticipantInfoDialog
                    open={detail}
                    participant={activeRow}
                    onUpdate={(participant_id: string, newParticipant: { [key: string]: any }) => {
                        setParticipants(
                            participants.map(participant => {
                                if (participant.participant_id === participant_id) {
                                    const updatedParticipant = {
                                        ...participant,
                                        ...newParticipant,
                                    };
                                    setActiveRow(updatedParticipant);
                                    return updatedParticipant;
                                } else {
                                    return participant;
                                }
                            })
                        );
                    }}
                    onClose={() => {
                        setDetail(false);
                    }}
                />
            )}
            <MaterialTable
                columns={[
                    {
                        title: "Participant Codename",
                        field: "participant_codename",
                        defaultFilter: paramID,
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
                        render: rowData => <Note>{rowData.notes}</Note>,
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
                    exportAllData: true,
                    exportButton: { csv: true, pdf: false },
                    exportCsv: (columns, data) => exportCSV(columns, data, "Participants"),
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
                                `Participant ${newParticipant.participant_codename} updated successfully`,
                                { variant: "success" }
                            );
                        } else {
                            console.error(
                                `PATCH /api/participants/${newParticipant.participant_id} failed with ${response.status}: ${response.statusText}`
                            );
                            enqueueSnackbar(
                                `Failed to edit Participant ${oldParticipant?.participant_codename} - ${response.status} ${response.statusText}`,
                                { variant: "error" }
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
