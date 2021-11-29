import React, { useMemo, useRef, useState } from "react";
import { Column } from "@material-table/core";
import { FileCopy, Refresh, Visibility } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import {
    BooleanDisplay,
    BooleanEditComponent,
    BooleanFilter,
    DateFilterComponent,
    DateTimeText,
    EditNotes,
    ExactMatchFilterToggle,
    MaterialTablePrimary,
    Note,
} from "../../components";
import {
    countArray,
    resetAllTableFilters,
    rowDiff,
    stringToBoolean,
    toKeyValue,
} from "../../functions";
import {
    GET_PARTICIPANTS_URL,
    useColumnOrderCache,
    useDownloadCsv,
    useEnumsQuery,
    useErrorSnackbar,
    useHiddenColumnCache,
    useMetadatasetTypesQuery,
    useParticipantsPage,
    useSortOrderCache,
} from "../../hooks";
import { apiFetch, transformMTQueryToCsvDownloadParams } from "../../hooks/utils";
import { Participant } from "../../typings";
import DatasetTypes from "./DatasetTypes";
import ParticipantInfoDialog from "./ParticipantInfoDialog";

export default function ParticipantTable() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [detail, setDetail] = useState(false);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(undefined);
    const enumsQuery = useEnumsQuery();
    const sexTypes = useMemo(
        () => enumsQuery.data && toKeyValue(enumsQuery.data.Sex),
        [enumsQuery.data]
    );
    const participantTypes = useMemo(
        () => enumsQuery.data && toKeyValue(enumsQuery.data.ParticipantType),
        [enumsQuery.data]
    );
    const { id: paramID } = useParams<{ id?: string }>();
    const metadatasetTypesQuery = useMetadatasetTypesQuery();
    const datasetTypes = useMemo(
        () =>
            metadatasetTypesQuery.data &&
            toKeyValue(Object.values(metadatasetTypesQuery.data).flat()),
        [metadatasetTypesQuery.data]
    );
    const tableRef = useRef<any>();

    const cacheDeps = [enumsQuery.isFetched, metadatasetTypesQuery.isFetched];

    const handleColumnDrag = useColumnOrderCache(
        tableRef,
        "participantTableColumnOrder",
        cacheDeps
    );
    const { handleOrderChange, setInitialSorting } = useSortOrderCache<Participant>(
        tableRef,
        "participantTableSortOrder"
    );

    const { handleChangeColumnHidden, setHiddenColumns } = useHiddenColumnCache<Participant>(
        "participantTableDefaultHidden"
    );

    const columns = useMemo(() => {
        const columns: Column<Participant>[] = [
            {
                title: "Family Codename",
                field: "family_codename",
                editable: "never",
                filterComponent: props => <ExactMatchFilterToggle MTRef={tableRef} {...props} />,
            },
            {
                title: "Participant Codename",
                field: "participant_codename",
                defaultFilter: paramID,
                filterComponent: props => <ExactMatchFilterToggle MTRef={tableRef} {...props} />,
            },
            {
                title: "Participant Type",
                field: "participant_type",
                lookup: participantTypes,
            },
            {
                title: "Affected",
                field: "affected",
                render: (rowData: Participant, type: "row" | "group") => (
                    <BooleanDisplay value={rowData} fieldName="affected" type={type} />
                ),
                editComponent: BooleanEditComponent,
                filterComponent: BooleanFilter,
            },
            {
                title: "Solved",
                field: "solved",
                render: (rowData: Participant, type: "row" | "group") => (
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
                render: (rowData: Participant) => <Note>{rowData.notes}</Note>,
                editComponent: EditNotes,
            },
            {
                title: "Updated",
                field: "updated",
                type: "string",
                editable: "never",
                render: rowData => <DateTimeText datetime={rowData.updated} />,
                filterComponent: DateFilterComponent,
                defaultSort: "desc",
            },
            {
                title: "Dataset Types",
                field: "dataset_types",
                editable: "never",
                lookup: datasetTypes,
                sorting: false,
                render: (rowData: Participant) => (
                    <DatasetTypes datasetTypes={countArray(rowData.dataset_types)} />
                ),
            },
        ];
        setInitialSorting(columns);
        setHiddenColumns(columns);
        return columns;
    }, [datasetTypes, sexTypes, participantTypes, paramID, setInitialSorting, setHiddenColumns]);

    const downloadCsv = useDownloadCsv(GET_PARTICIPANTS_URL);

    const dataFetch = useParticipantsPage();

    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

    async function copyToClipboard(event: React.MouseEvent, rowData: Participant | Participant[]) {
        if (!Array.isArray(rowData)) {
            const toCopy = rowData.participant_codename + "_" + rowData.family_codename;
            await navigator.clipboard.writeText(toCopy);
        }
    }

    const exportCsv = () => {
        downloadCsv(transformMTQueryToCsvDownloadParams(tableRef.current?.state.query || {}));
    };

    return (
        <div>
            {activeRow && (
                <ParticipantInfoDialog
                    open={detail}
                    participant_id={activeRow.participant_id}
                    family_id={activeRow.family_id}
                    onClose={() => {
                        setDetail(false);
                    }}
                />
            )}

            <MaterialTablePrimary
                tableRef={tableRef}
                columns={columns}
                data={dataFetch}
                title="Participants"
                options={{
                    selection: false,
                    exportAllData: true,
                    exportMenu: [
                        {
                            exportFunc: exportCsv,
                            label: "Export as CSV",
                        },
                    ],
                    filtering: true,
                    search: false,
                }}
                editable={{
                    onRowUpdate: async (newParticipant, oldParticipant) => {
                        const diffParticipant = rowDiff<Participant>(
                            newParticipant,
                            oldParticipant
                        );

                        const response = await apiFetch(
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
                            enqueueErrorSnackbar(
                                response,
                                `Failed to edit Participant ${oldParticipant?.participant_codename}`
                            );
                        }
                    },
                }}
                actions={[
                    {
                        tooltip: "Clear All Filters",
                        icon: Refresh,
                        position: "toolbar",
                        onClick: () => resetAllTableFilters(tableRef),
                    },
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
                onColumnDragged={handleColumnDrag}
                onChangeColumnHidden={handleChangeColumnHidden}
                onOrderChange={handleOrderChange}
            />
        </div>
    );
}
