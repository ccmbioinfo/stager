import React, { useMemo, useRef, useState } from "react";
import { cloneDeep } from "lodash";
import { Button } from "@material-ui/core";
import { FileCopy, Visibility } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import {
    BooleanDisplay,
    BooleanEditComponent,
    BooleanFilter,
    EditNotes,
    MaterialTablePrimary,
    Note,
} from "../../components";
import { countArray, rowDiff, stringToBoolean, toKeyValue } from "../../functions";
import {
    GET_PARTICPANTS_URL,
    useDownloadCsv,
    useEnumsQuery,
    useMetadatasetTypesQuery,
    useParticipantsPage,
} from "../../hooks";
import { transformMTQueryToCsvDownloadParams } from "../../hooks/utils";
import { Participant } from "../../typings";
import DatasetTypes from "./DatasetTypes";
import ParticipantInfoDialog from "./ParticipantInfoDialog";

const renderDatasetTypes = (rowData: Participant) => (
    <DatasetTypes datasetTypes={countArray(rowData.dataset_types)} />
);

const renderNotes = (rowData: Participant) => <Note>{rowData.notes}</Note>;

const SolvedBoolean = (rowData: Participant, type: "row" | "group") => (
    <BooleanDisplay value={rowData} fieldName="solved" type={type} />
);

const AffectedBoolean = (rowData: Participant, type: "row" | "group") => (
    <BooleanDisplay value={rowData} fieldName="affected" type={type} />
);

export default function ParticipantTable() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [detail, setDetail] = useState(false);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(undefined);

    const tableRef = useRef<any>();

    const downloadCsv = useDownloadCsv(GET_PARTICPANTS_URL);

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

    async function CopyToClipboard(event: React.MouseEvent, rowData: Participant | Participant[]) {
        if (!Array.isArray(rowData)) {
            const toCopy = rowData.participant_codename + "_" + rowData.family_codename;
            await navigator.clipboard.writeText(toCopy);
        }
    }

    const exportCsv = () => {
        const stashed = stashFilters();
        downloadCsv(transformMTQueryToCsvDownloadParams(tableRef.current?.state.query || {}));
        restoreFilters(stashed);
    };

    const options = {
        selection: false,
        exportCsv,
    };

    const stashFilters = () => cloneDeep(tableRef.current.dataManager);

    const restoreFilters = (stashed: any) => (tableRef.current.dataManager = stashed);

    return (
        <div>
            <Button
                onClick={() =>
                    downloadCsv(
                        transformMTQueryToCsvDownloadParams(tableRef.current?.state.query || {})
                    )
                }
            >
                DOWnLOAD
            </Button>
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
                tableRef={tableRef}
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
                    {
                        title: "Affected",
                        field: "affected",
                        render: AffectedBoolean,
                        editComponent: BooleanEditComponent,
                        filterComponent: BooleanFilter,
                    },
                    {
                        title: "Solved",
                        field: "solved",
                        render: SolvedBoolean,
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
                        render: renderNotes,
                        editComponent: EditNotes,
                    },
                    {
                        title: "Dataset Types",
                        field: "dataset_types",
                        editable: "never",
                        lookup: datasetTypes,
                        filtering: false,
                        render: renderDatasetTypes,
                    },
                ]}
                data={dataFetch}
                title="Participants"
                options={options}
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
                        onClick: CopyToClipboard,
                    },
                ]}
            />
        </div>
    );
}
