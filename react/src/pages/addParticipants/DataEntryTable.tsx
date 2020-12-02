import React, { useEffect, useState } from "react";
import {
    Box,
    IconButton,
    makeStyles,
    Menu,
    MenuItem,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Toolbar,
    Tooltip,
    Typography,
    Button,
} from "@material-ui/core";
import { CloudUpload, Delete, LibraryAdd, ViewColumn, Add, Restore } from "@material-ui/icons";
import { DataEntryHeader, DataEntryRow, DataEntryRowOptional, Family } from "../utils/typings";
import { Option, getOptions as _getOptions, getColumns } from "./utils";
import { DataEntryActionCell, DataEntryCell } from "./TableCells";
import UploadDialog from "./UploadDialog";
import { getDataEntryHeaders, setProp } from "../utils/functions";

export interface DataEntryTableProps {
    data?: DataEntryRow[];
}

function createEmptyRows(amount?: number): DataEntryRow[] {
    if (!amount || amount < 1) amount = 1;

    var arr = [];
    for (let i = 0; i < amount; i++) {
        arr.push({
            family_codename: "",
            participant_codename: "",
            participant_type: "",
            tissue_sample_type: "",
            dataset_type: "",
        });
    }
    return arr;
}

const useTableStyles = makeStyles(theme => ({
    requiredCell: {
        minWidth: "16em",
    },
    optionalCell: {
        minWidth: "8em",
    },
    buttonCell: {
        padding: 0,
    },
    newRowButton: {
        width: "100%",
    },
}));

const fallbackColumns = ["notes", "sex", "input_hpf_path"];

function getEnvColumns(): Array<keyof DataEntryRowOptional> {
    if (process.env.NODE_ENV === "development") {
        const envCols = process.env.REACT_APP_DEFAULT_OPTIONAL_COLUMNS;
        if (envCols !== undefined) {
            const validFields = getDataEntryHeaders().optional;
            const envFields = envCols.split(",");
            const usableFields = envFields.filter(
                field => !!validFields.find(valid => valid === field)
            );
            return usableFields as Array<keyof DataEntryRowOptional>;
        } else {
            return [];
        }
    }
    return [];
}

function getDefaultColumns(fallbackColumns: string[]) {
    const storedDefaults = window.localStorage.getItem("data-entry-default-columns");
    let tempCols = fallbackColumns;
    const envCols = getEnvColumns();

    if (storedDefaults !== null) {
        // User already has stored preferences
        tempCols = JSON.parse(storedDefaults);
    } else if (envCols.length > 0) {
        // No preferences, use .env
        tempCols = envCols;
    } else {
        // No .env, use fallback columns
        window.localStorage.setItem("data-entry-default-columns", JSON.stringify(tempCols));
    }
    return tempCols;
}

export default function DataEntryTable(props: DataEntryTableProps) {
    const classes = useTableStyles();

    const columns = getColumns("required");
    const RNASeqCols = getColumns("RNASeq");

    function getOptionalHeaders() {
        const defaults = getDefaultColumns(fallbackColumns);
        return getColumns("optional").map(header => ({
            ...header,
            hidden: !defaults.includes(header.field),
        }));
    }

    const [optionals, setOptionals] = useState<DataEntryHeader[]>(getOptionalHeaders());
    const [rows, setRows] = useState<DataEntryRow[]>(props.data ? props.data : createEmptyRows(3));
    const [families, setFamilies] = useState<Family[]>([]);
    const [enums, setEnums] = useState<any>();
    const [files, setFiles] = useState<string[]>([]);

    const [showRNA, setShowRNA] = useState<boolean>(false);

    useEffect(() => {
        fetch("/api/families")
            .then(response => response.json())
            .then(data => {
                setFamilies(data as Family[]);
            })
            .catch(error => {
                console.error(error);
            });

        fetch("/api/enums")
            .then(response => response.json())
            .then(data => {
                setEnums(data);
            })
            .catch(error => {
                console.error(error);
            });

        fetch("/api/unlinked")
            .then(response => response.json())
            .then(files => setFiles(files.sort()))
            .catch(console.error);
    }, []);

    function onEdit(newValue: string | boolean, rowIndex: number, col: DataEntryHeader) {
        if (col.field === "dataset_type" && newValue === "RRS") {
            setShowRNA(true);
        } else if (col.field === "input_hpf_path") {
            // Remove the new value from the list of unlinked files to prevent reuse
            // Readd the previous value if there was one since it is available again
            const oldValue = rows[rowIndex].input_hpf_path;
            const removeNewValue = files.filter(file => file !== newValue);
            setFiles(oldValue ? [oldValue, ...removeNewValue].sort() : removeNewValue);
        }
        setRows(
            rows.map((value, index) => {
                if (index === rowIndex) {
                    return setProp({ ...value }, col.field, newValue);
                } else {
                    return value;
                }
            })
        );
    }

    // Return the options for a given cell based on row, column
    function getOptions(rowIndex: number, col: DataEntryHeader): Option[] {
        return _getOptions(rows, col, rowIndex, families, enums, files);
    }

    function toggleHideColumn(colField: keyof DataEntryRow) {
        const newOptionals = optionals.map(value => {
            if (value.field === colField) return { ...value, hidden: !value.hidden };
            return value;
        });
        setOptionals(newOptionals);
        window.localStorage.setItem(
            "data-entry-default-columns",
            JSON.stringify(newOptionals.filter(value => !value.hidden).map(value => value.field))
        );
    }

    return (
        <Paper>
            <DataEntryToolbar
                columns={optionals}
                handleColumnAction={toggleHideColumn}
                handleResetAction={() => {
                    window.localStorage.removeItem("data-entry-default-columns");
                    setOptionals(getOptionalHeaders());
                }}
            />
            <TableContainer>
                <Table>
                    <caption>* - Required | ** - Required only if Dataset Type is RRS</caption>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" aria-hidden={true} />
                            <TableCell padding="checkbox" aria-hidden={true} />
                            {columns.map(cell => (
                                <TableCell className={classes.requiredCell} key={cell.field}>
                                    {cell.title + "*"}
                                </TableCell>
                            ))}

                            {optionals.map(
                                cell =>
                                    !cell.hidden && (
                                        <TableCell
                                            className={classes.optionalCell}
                                            key={cell.field}
                                        >
                                            {cell.title}
                                        </TableCell>
                                    )
                            )}

                            {showRNA &&
                                RNASeqCols.map(cell => (
                                    <TableCell className={classes.optionalCell} key={cell.field}>
                                        {cell.title + "**"}
                                    </TableCell>
                                ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                <DataEntryActionCell
                                    tooltipTitle="Delete row"
                                    icon={<Delete />}
                                    onClick={() =>
                                        setRows(rows.filter((value, index) => index !== rowIndex))
                                    }
                                    disabled={rows.length === 1}
                                />
                                <DataEntryActionCell
                                    tooltipTitle="Duplicate row"
                                    icon={<LibraryAdd />}
                                    onClick={() =>
                                        setRows(
                                            rows.flatMap((value, index) =>
                                                index === rowIndex
                                                    ? [value, { ...value } as DataEntryRow]
                                                    : value
                                            )
                                        )
                                    }
                                />

                                {columns.map(col => (
                                    <DataEntryCell
                                        row={row}
                                        rowIndex={rowIndex}
                                        col={col}
                                        getOptions={getOptions}
                                        onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                        key={col.field}
                                    />
                                ))}
                                {optionals.map(
                                    col =>
                                        !col.hidden && (
                                            <DataEntryCell
                                                row={row}
                                                rowIndex={rowIndex}
                                                col={col}
                                                getOptions={getOptions}
                                                onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                                key={col.field}
                                            />
                                        )
                                )}

                                {showRNA &&
                                    RNASeqCols.map(col => (
                                        <DataEntryCell
                                            row={row}
                                            rowIndex={rowIndex}
                                            col={col}
                                            getOptions={getOptions}
                                            onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                            disabled={row.dataset_type !== "RRS"}
                                            key={col.field}
                                        />
                                    ))}
                            </TableRow>
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
                                    onClick={() => setRows(rows.concat(createEmptyRows(1)))}
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

const useToolbarStyles = makeStyles(theme => ({
    toolbar: {
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(2),
    },
}));

/**
 * The toolbar for the DataEntryTable, which displays the title and other action
 * buttons that do not depend on specific rows.
 */
function DataEntryToolbar(props: {
    handleColumnAction: (field: keyof DataEntryRow) => void;
    handleResetAction: () => void;
    columns: DataEntryHeader[];
}) {
    const classes = useToolbarStyles();
    const [openUpload, setOpenUpload] = useState(false);

    return (
        <>
            <Toolbar className={classes.toolbar}>
                <Box display="flex" flexGrow={1}>
                    <Typography variant="h6">Enter Metadata</Typography>
                </Box>
                <Tooltip title="Upload CSV">
                    <IconButton onClick={() => setOpenUpload(true)}>
                        <CloudUpload />
                    </IconButton>
                </Tooltip>
                <DataEntryColumnMenuAction
                    columns={props.columns}
                    onClick={props.handleColumnAction}
                />
                <Tooltip title="Reset column defaults">
                    <IconButton onClick={props.handleResetAction}>
                        <Restore />
                    </IconButton>
                </Tooltip>
            </Toolbar>
            <UploadDialog open={openUpload} onClose={() => setOpenUpload(false)} />
        </>
    );
}

/**
 * A special action button which opens a menu for showing / hiding
 * optional columns.
 */
function DataEntryColumnMenuAction(props: {
    columns: DataEntryHeader[];
    onClick: (field: keyof DataEntryRow) => void;
}) {
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);

    return (
        <>
            <Tooltip title="Show/Hide columns">
                <IconButton
                    onClick={event => {
                        setAnchor(event.currentTarget);
                    }}
                >
                    <ViewColumn />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                keepMounted
                onClose={() => setAnchor(null)}
            >
                {props.columns.map(column => (
                    <MenuItem onClick={() => props.onClick(column.field)} key={column.title}>
                        <Box display="flex" flexGrow={1}>
                            {column.title}
                        </Box>
                        <Switch edge="end" checked={!column.hidden} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
