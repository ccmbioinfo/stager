import { useEffect, useState } from "react";
import {
    Button,
    makeStyles,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@material-ui/core";
import { Add } from "@material-ui/icons";
import dayjs from "dayjs";
import { createEmptyRow, makeFreshColumns, OPTIONAL_FIELDS } from "..";
import { useEnumsQuery, useInstitutionsQuery, useUnlinkedFilesQuery } from "../../hooks";
import {
    DataEntryColumnConfig,
    DataEntryField,
    DataEntryRow,
    Family,
    Participant,
    UnlinkedFile,
} from "../../typings";
import DataEntryTableRow from "./DataEntryTableRow";
import DataEntryToolbar from "./DataEntryToolbar";
import { HeaderCell } from "./TableCells";
import { getOptions as _getOptions, objArrayToCSV, participantColumns } from "./utils";

const useTableStyles = makeStyles(() => ({
    buttonCell: {
        padding: 0,
    },
    newRowButton: {
        width: "100%",
    },
}));

function findParticipant(newValue: string, column: string, row: DataEntryRow, families: Family[]) {
    let participantCodename: string;
    let familyCodename: string;
    const { fields } = row;
    if (column === "participant_codename" && fields.family_codename !== "") {
        familyCodename = fields.family_codename;
        participantCodename = newValue;
    } else if (column === "family_codename" && fields.participant_codename !== "") {
        familyCodename = newValue;
        participantCodename = fields.participant_codename;
    }
    const family = families.find(fam => fam.family_codename === familyCodename);
    return family
        ? family.participants.find(
              currParticipant => currParticipant.participant_codename === participantCodename
          )
        : undefined;
}

const getVisibleColumnFieldList = (columns: DataEntryColumnConfig[]) =>
    columns.filter(col => !col.hidden).map(col => col.field);

export interface DataEntryTableProps {
    allGroups: string[]; // this user's permission groups
    columns: DataEntryColumnConfig[];
    data: DataEntryRow[];
    groups: string[]; // selected groups to submit as
    onChange: (data: DataEntryRow[]) => void;
    setColumns: (columns: DataEntryColumnConfig[]) => void;
    setGroups: (selectedGroups: string[]) => void;
}

export default function DataEntryTable(props: DataEntryTableProps) {
    const classes = useTableStyles();

    const [files, setFiles] = useState<UnlinkedFile[]>([]);

    const filesQuery = useUnlinkedFilesQuery();
    const { data: institutions } = useInstitutionsQuery();
    const { data: enums } = useEnumsQuery();

    useEffect(() => {
        if (filesQuery.isSuccess) setFiles(filesQuery.data);
    }, [filesQuery]);

    function onEdit(
        newValue: string | boolean | UnlinkedFile[],
        rowIndex: number,
        col: DataEntryColumnConfig,
        families: Family[],
        autopopulate?: boolean
    ) {
        const newRows = props.data.map((row, index) => {
            if (autopopulate && index === rowIndex && typeof newValue === "string") {
                // autopopulate row
                // pre-existing rows are disabled, even if the values are wrong
                const participant = findParticipant(newValue, col.field, row, families);
                if (participant) {
                    const newFields = {
                        ...participantColumns.reduce(
                            (row, currCol) => ({
                                ...row,
                                [currCol]: participant[currCol as keyof Participant],
                            }),
                            { ...row.fields }
                        ),
                        [col.field]: newValue,
                    };
                    return {
                        fields: newFields,
                        meta: { participantColumnsDisabled: true },
                    };
                } else {
                    return {
                        fields: {
                            ...row.fields,
                            [col.field]: newValue,
                        },
                        meta: { participantColumnsDisabled: false },
                    };
                }
            } else if (index === rowIndex) {
                return { fields: { ...row.fields, [col.field]: newValue }, meta: row.meta };
            } else {
                return row;
            }
        });
        props.onChange(newRows);
    }

    // Return the options for a given cell based on row, column
    function getOptions(rowIndex: number, col: DataEntryColumnConfig, families: Family[]) {
        return _getOptions(props.data, col, rowIndex, families, enums, files, institutions || []);
    }

    function toggleHideColumn(field: DataEntryField) {
        const newColumns = props.columns.map(col =>
            col.field === field ? { ...col, hidden: !col.hidden } : col
        );
        props.setColumns(newColumns);
        window.localStorage.setItem(
            "data-entry-default-columns",
            JSON.stringify(getVisibleColumnFieldList(newColumns))
        );
    }

    function downloadTemplateCSV() {
        const csv = objArrayToCSV(props.data, getVisibleColumnFieldList(props.columns), true);
        let hiddenElement = document.createElement("a");
        hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
        hiddenElement.target = "_blank";
        const now = dayjs().format("YYYY-MM-DDThh-mm-ssA");
        hiddenElement.download = `AddDatasets-${now}.csv`;
        hiddenElement.click();
        hiddenElement.remove();
    }

    return (
        <Paper>
            <DataEntryToolbar
                columns={props.columns.filter(col => OPTIONAL_FIELDS.includes(col.field))}
                handleColumnAction={toggleHideColumn}
                handleResetAction={() => {
                    window.localStorage.removeItem("data-entry-default-columns");
                    props.setColumns(makeFreshColumns(["notes", "sex", "linked_files"]));
                }}
                handleCSVTemplateAction={downloadTemplateCSV}
                allGroups={props.allGroups}
                groups={props.groups}
                setGroups={props.setGroups}
            />
            <TableContainer>
                <Table>
                    <caption>*Required</caption>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" aria-hidden={true} />
                            <TableCell padding="checkbox" aria-hidden={true} />
                            {props.columns
                                .filter(col => !col.hidden)
                                .map(cell => (
                                    <HeaderCell key={cell.field} header={cell.title + "*"} />
                                ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {props.data.map((row, rowIndex) => (
                            <DataEntryTableRow
                                row={row}
                                rowIndex={rowIndex}
                                key={rowIndex}
                                columns={props.columns}
                                getOptions={getOptions}
                                onChange={onEdit}
                                onDuplicate={() =>
                                    props.onChange(
                                        props.data.flatMap((row, index) =>
                                            index === rowIndex
                                                ? [
                                                      row,
                                                      {
                                                          ...row,
                                                          linked_files: [],
                                                      },
                                                  ]
                                                : row
                                        )
                                    )
                                }
                                onDelete={() =>
                                    props.onChange(
                                        props.data.filter((_, index) => index !== rowIndex)
                                    )
                                }
                            />
                        ))}
                        <TableRow>
                            <TableCell className={classes.buttonCell} colSpan={100}>
                                <Button
                                    className={classes.newRowButton}
                                    variant="contained"
                                    color="default"
                                    disableElevation
                                    disableRipple
                                    startIcon={<Add />}
                                    onClick={() =>
                                        props.onChange(props.data.concat(createEmptyRow()))
                                    }
                                >
                                    Add new row
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
