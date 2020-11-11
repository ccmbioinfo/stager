import React, { ReactNode, useEffect, useState } from "react";
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
    TableCellProps,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
    Button,
} from "@material-ui/core";
import { Autocomplete, createFilterOptions } from "@material-ui/lab";
import { CloudUpload, Delete, LibraryAdd, ViewColumn, Add } from "@material-ui/icons";
import { DataEntryHeader, DataEntryRow } from "../typings";
import { Option, toOption, getOptions as _getOptions, getColumns } from "./UploadUtils";
import UploadDialog from "./UploadDialog";

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
        width: "100%"
    }
}));

const defaultOptionals = ["notes", "sex"];

export default function DataEntryTable(props: DataEntryTableProps) {
    const classes = useTableStyles();

    const columns = getColumns("required");
    const RNASeqCols = getColumns("RNASeq");
    

    const [optionals, setOptionals] = useState<DataEntryHeader[]>(
        getColumns("optional").map(header => {
            return { ...header, hidden: !defaultOptionals.includes(header.field) };
        })
    );
    const [rows, setRows] = useState<DataEntryRow[]>(props.data ? props.data : createEmptyRows(3));
    const [families, setFamilies] = useState<Array<any>>([]);
    const [enums, setEnums] = useState<any>();

    const [showRNA, setShowRNA] = useState<boolean>(false);

    useEffect(() => {
        fetch("/api/families")
            .then(response => response.json())
            .then(data => {
                setFamilies(data);
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
    }, []);

    function onEdit(newValue: string, rowIndex: number, col: DataEntryHeader) {
        if (col.field === "dataset_type" && newValue === "RRS") {
            setShowRNA(true);
        }
        setRows(
            rows.map((value, index) => {
                if (index === rowIndex) {
                    const newRow: DataEntryRow = { ...value };
                    (newRow[col.field] as string) = newValue;
                    return newRow;
                } else {
                    return value;
                }
            })
        );
    }

    // Return the options for a given cell based on row, column
    function getOptions(rowIndex: number, col: DataEntryHeader): Option[] {
        return _getOptions(rows, col, rowIndex, families, enums);
    }

    function toggleHideColumn(colField: keyof DataEntryRow) {
        setOptionals(
            optionals.map(value => {
                if (value.field === colField) return { ...value, hidden: !value.hidden };
                return value;
            })
        );
    }

    return (
        <Paper>
            <DataEntryToolbar
                columns={optionals}
                handleColumnAction={toggleHideColumn}
            />
            <TableContainer>
                <Table>
                    <caption>{"* - Required | ** - Required only if Dataset Type is RRS"}</caption>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" aria-hidden={true} />
                            <TableCell padding="checkbox" aria-hidden={true} />
                            {columns.map((cell, index) => (
                                <TableCell className={classes.requiredCell}>
                                    {cell.title + "*"}
                                </TableCell>
                            ))}

                            {optionals.map((cell, index) => (
                                <>
                                    {!cell.hidden && (
                                        <TableCell className={classes.optionalCell}>
                                            {cell.title}
                                        </TableCell>
                                    )}
                                </>
                            ))}

                            {showRNA &&
                                RNASeqCols.map(cell => (
                                    <>
                                        <TableCell className={classes.optionalCell}>
                                            {cell.title + "**"}
                                        </TableCell>
                                    </>
                                ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, rowIndex) => (
                            <TableRow>
                                <DataEntryActionCell
                                    tooltipTitle="Delete row"
                                    icon={<Delete />}
                                    onClick={e => {
                                        setRows(rows.filter((value, index) => index !== rowIndex));
                                    }}
                                    disabled={rows.length === 1}
                                />
                                <DataEntryActionCell
                                    tooltipTitle="Duplicate row"
                                    icon={<LibraryAdd />}
                                    onClick={e => {
                                        setRows(
                                            rows.flatMap((value, index) =>
                                                index === rowIndex
                                                    ? [value, { ...value } as DataEntryRow]
                                                    : value
                                            )
                                        );
                                    }}
                                />

                                {columns.map(col => (
                                    <DataEntryCell
                                        value={toOption(row[col.field])}
                                        options={getOptions(rowIndex, col)}
                                        onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                        aria-label={`enter ${col.title} row ${rowIndex}`}
                                    />
                                ))}
                                {optionals.map(col => (
                                    <>
                                        {!col.hidden && (
                                            <DataEntryCell
                                                value={toOption(row[col.field])}
                                                options={getOptions(rowIndex, col)}
                                                onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                                aria-label={`enter ${col.title} row ${rowIndex} optional`}
                                            />
                                        )}
                                    </>
                                ))}

                                {showRNA &&
                                    RNASeqCols.map(col => (
                                        <>
                                            {
                                                <DataEntryCell
                                                    value={toOption(row[col.field])}
                                                    options={getOptions(rowIndex, col)}
                                                    onEdit={newValue =>
                                                        onEdit(newValue, rowIndex, col)
                                                    }
                                                    aria-label={`enter ${col.title} row ${rowIndex}`}
                                                    disabled={row.dataset_type !== "RRS"}
                                                />
                                            }
                                        </>
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

const filter = createFilterOptions<Option>({
    limit: 25,
});

/**
 * A cell in the DataEntryTable that the user can type into.
 */
function DataEntryCell(
    props: {
        value: Option;
        options: Option[];
        onEdit: (newValue: string) => void;
        disabled?: boolean;
    } & TableCellProps
) {
    const onEdit = (newValue: Option) => {
        props.onEdit(newValue.inputValue);
    };

    // Remove 'this' input value from the list of options
    const options = props.options.filter(
        (val, index, arr) =>
            arr.findIndex((opt, i) => opt.inputValue === val.inputValue) === index &&
            val.inputValue !== props.value.inputValue
    );

    return (
        <TableCell>
            <Autocomplete
                disabled={props.disabled}
                aria-label={props["aria-label"]}
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                autoHighlight
                onChange={(event, newValue) => {
                    if (newValue) {
                        onEdit(toOption(newValue));
                    } else {
                        onEdit(toOption(""));
                    }
                }}
                options={options}
                value={props.value}
                renderInput={params => <TextField {...params} variant="standard" />}
                groupBy={option => (option.origin ? option.origin : "Unknown")}
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    // Adds user-entered value as option
                    // We prefer to show pre-existing options than the "create new" option
                    // TODO: Prevent user from creating new values for columns like dataset_type
                    //       with pre-defined lists of values
                    if (
                        params.inputValue !== "" &&
                        !filtered.find(option => option.inputValue === params.inputValue)
                    ) {
                        filtered.push({
                            title: `Add "${params.inputValue}"`,
                            inputValue: params.inputValue,
                            origin: "Add new...",
                        });
                    }

                    return filtered;
                }}
                getOptionDisabled={option => !!option.disabled}
                getOptionLabel={option => option.inputValue}
                renderOption={option => option.title}
            />
        </TableCell>
    );
}

/**
 * A cell in the DataEntryTable positioned before all the entry rows, which
 * provides an action button that the user can click.
 */
function DataEntryActionCell(props: {
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    icon: ReactNode;
    tooltipTitle: string;
    disabled?: boolean;
}) {
    return (
        <TableCell padding="checkbox">
            <Tooltip title={props.tooltipTitle}>
                <IconButton
                    onClick={props.onClick}
                    disabled={props.disabled}
                    aria-label={props.tooltipTitle}
                >
                    {props.icon}
                </IconButton>
            </Tooltip>
        </TableCell>
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
                    <MenuItem onClick={() => props.onClick(column.field)}>
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
