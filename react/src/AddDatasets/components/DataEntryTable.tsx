import { useCallback, useEffect, useState } from "react";
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
import { ALL_OPTIONAL_FIELDS, createEmptyRow, makeFreshColumns } from "..";
import { useEnumsQuery, useInstitutionsQuery, useUnlinkedFilesQuery } from "../../hooks";
import {
    DataEntryColumnConfig,
    DataEntryField,
    DataEntryRow,
    Family,
    UnlinkedFile,
} from "../../typings";
import DataEntryTableRow from "./DataEntryTableRow";
import DataEntryToolbar from "./DataEntryToolbar";
import { HeaderCell } from "./TableCells";
import { getOptions as _getOptions, objArrayToCSV } from "./utils";

const useTableStyles = makeStyles(() => ({
    buttonCell: {
        padding: 0,
    },
    newRowButton: {
        width: "100%",
    },
}));

const getVisibleColumnFieldList = (columns: DataEntryColumnConfig[]) =>
    columns.filter(col => !col.hidden).map(col => col.field);

export interface DataEntryTableProps {
    allGroups: string[]; // this user's permission groups
    columns: DataEntryColumnConfig[];
    data: DataEntryRow[];
    groups: string[]; // selected groups to submit as
    onChange: (
        newValue: string | boolean | UnlinkedFile[],
        rowIndex: number,
        col: DataEntryColumnConfig,
        families: Family[]
    ) => void;
    setColumns: (columns: DataEntryColumnConfig[]) => void;
    setData: (data: DataEntryRow[]) => void;
    setGroups: (selectedGroups: string[]) => void;
}

export default function DataEntryTable({
    allGroups,
    columns,
    data,
    groups,
    onChange,
    setColumns,
    setData,
    setGroups,
}: DataEntryTableProps) {
    const classes = useTableStyles();

    const [files, setFiles] = useState<UnlinkedFile[]>([]);

    const filesQuery = useUnlinkedFilesQuery();
    const { data: institutions } = useInstitutionsQuery();
    const { data: enums } = useEnumsQuery();

    const onAddNewRow = useCallback(() => setData(data.concat(createEmptyRow())), [setData, data]);
    const onDelete = useCallback(
        (rowIndex: number) => setData(data.filter((_, index) => index !== rowIndex)),
        [data, setData]
    );

    const onDuplicate = (rowIndex: number) =>
        setData(
            data.flatMap((row, index) =>
                index === rowIndex
                    ? [
                          row,
                          {
                              meta: row.meta,
                              fields: {
                                  ...row.fields,
                                  linked_files: [],
                              },
                          },
                      ]
                    : row
            )
        );

    useEffect(() => {
        if (filesQuery.isSuccess) setFiles(filesQuery.data);
    }, [filesQuery]);

    // Return the options for a given cell based on row, column
    function getOptions(rowIndex: number, col: DataEntryColumnConfig, families: Family[]) {
        return _getOptions(data, col, rowIndex, families, enums, files, institutions || []);
    }

    function toggleHideColumn(field: DataEntryField) {
        const newColumns = columns.map(col =>
            col.field === field ? { ...col, hidden: !col.hidden } : col
        );
        setColumns(newColumns);
        window.localStorage.setItem(
            "data-entry-default-columns",
            JSON.stringify(getVisibleColumnFieldList(newColumns))
        );
    }

    function downloadTemplateCSV() {
        const csv = objArrayToCSV(data, getVisibleColumnFieldList(columns), true);
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
                columns={columns.filter(col => ALL_OPTIONAL_FIELDS.includes(col.field))}
                handleColumnAction={toggleHideColumn}
                handleResetAction={() => {
                    window.localStorage.removeItem("data-entry-default-columns");
                    setColumns(makeFreshColumns(["notes", "sex", "linked_files"]));
                }}
                handleCSVTemplateAction={downloadTemplateCSV}
                allGroups={allGroups}
                groups={groups}
                setGroups={setGroups}
            />
            <TableContainer>
                <Table>
                    <caption>*Required</caption>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" aria-hidden={true} />
                            <TableCell padding="checkbox" aria-hidden={true} />
                            {columns
                                .filter(col => !col.hidden)
                                .map(column => (
                                    <HeaderCell
                                        key={column.field}
                                        header={`${column.title}${column.required ? "*" : ""}`}
                                    />
                                ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, rowIndex) => (
                            <DataEntryTableRow
                                row={row}
                                rowIndex={rowIndex}
                                key={rowIndex}
                                columns={columns}
                                getOptions={getOptions}
                                onChange={onChange}
                                onDuplicate={onDuplicate.bind(null, rowIndex)}
                                onDelete={onDelete.bind(null, rowIndex)}
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
                                    onClick={() => onAddNewRow()}
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
