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
import { countArray, resetAllTableFilters, rowDiff, toKeyValue } from "../../functions";
import {
    GET_PARTICIPANTS_URL,
    useColumnOrderCache,
    useDownloadCsv,
    useErrorSnackbar,
    useFamilyUpdateMutation,
    useHiddenColumnCache,
    useParticipantsPage,
    useParticipantUpdateMutation,
    useSortOrderCache,
} from "../../hooks";
import { transformMTQueryToCsvDownloadParams } from "../../hooks/utils";
import { Family, Participant } from "../../typings";
import DatasetTypes from "./DatasetTypes";
import ParticipantInfoDialog from "./ParticipantInfoDialog";
import { useAPIInfoContext } from "../../contexts";

export default function ParticipantTable() {
    const [detail, setDetail] = useState(false);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(undefined);
    const { id: paramID } = useParams<{ id?: string }>();
    const tableRef = useRef<any>();

    const apiInfo = useAPIInfoContext() ?? undefined; // map null to undefined for material-table lookup field
    const sexTypes = useMemo(() => apiInfo && toKeyValue(apiInfo.enums.Sex), [apiInfo]);
    const participantTypes = useMemo(
        () => apiInfo && toKeyValue(apiInfo.enums.ParticipantType),
        [apiInfo]
    );
    const datasetTypes = useMemo(
        () => apiInfo && toKeyValue(Object.keys(apiInfo.dataset_types)),
        [apiInfo]
    );

    const handleColumnDrag = useColumnOrderCache(tableRef, "participantTableColumnOrder", [
        !!apiInfo,
    ]);
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

    const { mutate: familyUpdateMutate } = useFamilyUpdateMutation();

    const { mutate: participantUpdateMutate } = useParticipantUpdateMutation();

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

    const participantUpdate = (
        diffParticipant: Partial<Participant>,
        oldParticipant: Participant,
        newParticipant: Participant
    ) => {
        participantUpdateMutate(
            {
                ...diffParticipant,
                participant_id: oldParticipant.participant_id,
            },
            {
                onSuccess: receiveParticipant => {
                    enqueueSnackbar(
                        `Participant ${oldParticipant.participant_codename} updated successfully`,
                        { variant: "success" }
                    );
                    tableRef.current.onQueryChange();
                },
                onError: response => {
                    console.error(
                        `PATCH /api/participants/${newParticipant.participant_id} failed with ${response.status}: ${response.statusText}`
                    );
                    enqueueErrorSnackbar(
                        response,
                        `Failed to edit Participant ${oldParticipant?.participant_codename}`
                    );
                },
            }
        );
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
                        const family_id = newParticipant.family_id;
                        const newFamilyData = {
                            family_codename: newParticipant.family_codename,
                        } as Partial<Family>;
                        if (
                            oldParticipant &&
                            newParticipant.family_codename !== oldParticipant.family_codename
                        ) {
                            familyUpdateMutate(
                                {
                                    ...newFamilyData,
                                    family_id,
                                },
                                {
                                    onSuccess: response => {
                                        participantUpdate(
                                            diffParticipant,
                                            oldParticipant,
                                            newParticipant
                                        );
                                    },
                                    onError: response => {
                                        console.error(
                                            `PATCH /api/families/${family_id} failed with ${response.status}: ${response.statusText}`
                                        );
                                        enqueueErrorSnackbar(
                                            response,
                                            `Failed to edit Participant ${oldParticipant?.participant_codename}`
                                        );
                                    },
                                }
                            );
                        } else if (oldParticipant) {
                            participantUpdate(diffParticipant, oldParticipant, newParticipant);
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
