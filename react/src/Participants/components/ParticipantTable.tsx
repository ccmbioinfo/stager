import React, { useMemo, useState } from "react";
import { TextField } from "@material-ui/core";
import { FileCopy, Visibility } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import {
    BooleanDisplay,
    BooleanEditComponent,
    BooleanFilter,
    MaterialTablePrimary,
    Note,
} from "../../components";
import { countArray, exportCSV, rowDiff, stringToBoolean, toKeyValue } from "../../functions";
import { useEnumsQuery, useMetadatasetTypesQuery, useParticipantsPage } from "../../hooks";
import { Participant } from "../../typings";
import DatasetTypes from "./DatasetTypes";
import ParticipantInfoDialog from "./ParticipantInfoDialog";

export default function ParticipantTable() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [detail, setDetail] = useState(false);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(undefined);

    const { data: enums } = useEnumsQuery();
    const { data: metadatasetTypes } = useMetadatasetTypesQuery();
    const datasetTypes = useMemo(
        () => metadatasetTypes && toKeyValue(Object.values(metadatasetTypes).flat()),
        [metadatasetTypes]
    );
    const sexTypes = useMemo(() => enums && toKeyValue(enums.Sex), [enums]);
    const participantTypes = useMemo(() => enums && toKeyValue(enums.ParticipantType), [enums]);

    const dataFetch = useParticipantsPage();

    const { enqueueSnackbar } = useSnackbar();

    const { id: paramID } = useParams<{ id?: string }>();

    async function copyToClipboard(event: React.MouseEvent, rowData: Participant | Participant[]) {
        if (!Array.isArray(rowData)) {
            const toCopy = rowData.participant_codename + "_" + rowData.family_codename;
            await navigator.clipboard.writeText(toCopy);
        }
    }

    return (
        <div>
            {activeRow && (
                <ParticipantInfoDialog
                    open={detail}
                    participant={activeRow}
                    onUpdate={(participant_id: string, newParticipant: { [key: string]: any }) => {
                        newParticipant.solved += "";
                        newParticipant.affected += "";
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
            <MaterialTablePrimary
                columns={[
                    {
                        title: "Family",
                        field: "family_codename",
                        editable: "never",
                    },
                    {
                        title: "Participant",
                        field: "participant_codename",
                        defaultFilter: paramID,
                    },
                    {
                        title: "Type",
                        field: "participant_type",
                        lookup: participantTypes,
                    },
                    {
                        title: "Affected",
                        field: "affected",
                        render: (rowData, type) => (
                            <BooleanDisplay value={rowData} fieldName="affected" type={type} />
                        ),
                        editComponent: BooleanEditComponent,
                        filterComponent: BooleanFilter,
                    },
                    {
                        title: "Solved",
                        field: "solved",
                        render: (rowData, type) => (
                            <BooleanDisplay value={rowData} fieldName="solved" type={type} />
                        ),
                        editComponent: BooleanEditComponent,
                        filterComponent: BooleanFilter,
                    },
                    {
                        title: "Sex",
                        field: "sex",
                        type: "string",
                        lookup: sexTypes,
                    },
                    {
                        title: "Notes",
                        field: "notes",
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
                        filtering: false,
                        render: rowData => (
                            <DatasetTypes datasetTypes={countArray(rowData.dataset_types)} />
                        ),
                    },
                ]}
                data={dataFetch}
                title="Participants"
                options={{
                    selection: false,
                    exportMenu: [
                        {
                            exportFunc: (columns, data) => exportCSV(columns, data, "Participants"),
                            label: "Export as CSV",
                        },
                    ],
                }}
                editable={{
                    onRowUpdate: async (newParticipant, oldParticipant) => {
                        const diffParticipant = rowDiff<Participant>(
                            newParticipant,
                            oldParticipant
                        );

                        const response = await fetch(
                            `/api/participants/${newParticipant.participant_id}`,
                            {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    ...diffParticipant,
                                    affected: stringToBoolean(newParticipant.affected),
                                    solved: stringToBoolean(newParticipant.solved),
                                }),
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
                        onClick: copyToClipboard,
                    },
                ]}
            />
        </div>
    );
}
