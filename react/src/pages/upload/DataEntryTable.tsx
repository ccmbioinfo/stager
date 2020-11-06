import React, { ReactNode, useEffect, useState } from "react";
import {
    Box,
    IconButton,
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
    TextField,
    Toolbar,
    Tooltip,
    Typography,
} from "@material-ui/core";
import { Autocomplete, createFilterOptions } from "@material-ui/lab";
import { AddBoxOutlined, Delete, LibraryAdd, ViewColumn } from "@material-ui/icons";
import { DataEntryHeader, DataEntryRow, getProp, setProp } from "../utils";
import { Option, toOption, getOptions as _getOptions, getColumns } from "./UploadUtils";

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

export default function DataEntryTable(props: DataEntryTableProps) {
    const [columns, setColumns] = useState<DataEntryHeader[]>(getColumns("required"));
    const [optionals, setOptionals] = useState<DataEntryHeader[]>(getColumns("optional"));
    const [RNASeqCols, setRNASeqCols] = useState<DataEntryHeader[]>(getColumns("RNASeq"));

    const [rows, setRows] = useState<DataEntryRow[]>(props.data ? props.data : createEmptyRows(3));
    const [families, setFamilies] = useState<Array<any>>([]);
    const [enums, setEnums] = useState<any>();

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
        setRows(
            rows.map((value, index) => {
                if (index === rowIndex) {
                    return { ...setProp(value, col.field, newValue) };
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
                onClick={event => {
                    setRows(rows.concat(createEmptyRows(1)));
                }}
            />
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell padding="checkbox" />
                            {columns.map((cell, index) => (
                                <TableCell>{cell.title + "*"}</TableCell>
                            ))}

                            {optionals.map((cell, index) => (
                                <>{!cell.hidden && <TableCell>{cell.title}</TableCell>}</>
                            ))}

                            <DataEntryColumnMenuAction
                                columns={optionals}
                                onClick={toggleHideColumn}
                            />
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
                                        value={toOption("" + getProp(row, col.field))}
                                        options={getOptions(rowIndex, col)}
                                        onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                    />
                                ))}

                                {optionals.map(col => (
                                    <>
                                        {!col.hidden && (
                                            <DataEntryCell
                                                value={toOption("" + getProp(row, col.field))}
                                                options={getOptions(rowIndex, col)}
                                                onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                            />
                                        )}
                                    </>
                                ))}

                                <TableCell padding="checkbox" />
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

const filter = createFilterOptions<Option>({
    limit: 10,
});

/**
 * A cell in the DataEntryTable that the user can type into.
 */
function DataEntryCell(props: {
    value: Option;
    options: Option[];
    freeSolo?: boolean;
    onEdit: (newValue: string) => void;
    disabled?: boolean;
}) {
    const onEdit = (newValue: Option) => {
        props.onEdit(newValue.inputValue);
    };

    const options = props.options.filter(
        (val, index, arr) =>
            arr.findIndex((opt, i) => opt.inputValue === val.inputValue) === index &&
            val.inputValue !== props.value.inputValue
    );

    return (
        <TableCell>
            <Autocomplete<Option, undefined, undefined, boolean | undefined>
                freeSolo={props.freeSolo}
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
                renderInput={params => (
                    <TextField
                        {...params}
                        variant="standard"
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: undefined,
                        }}
                    />
                )}
                groupBy={option => (option.origin ? option.origin : "Unknown")}
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    // Prefer to choose a pre-existing option than make a new one
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
                <IconButton onClick={props.onClick} disabled={props.disabled}>
                    {props.icon}
                </IconButton>
            </Tooltip>
        </TableCell>
    );
}

/**
 * The toolbar for the DataEntryTable, which displays the title and other action
 * buttons that do not depend on specific rows.
 */
function DataEntryToolbar(props: {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}) {
    return (
        <Toolbar>
            <Typography variant="h6" style={{ flexGrow: 1 }}>
                Enter Metadata
            </Typography>
            <Tooltip title="Add empty row">
                <IconButton onClick={props.onClick} edge="end">
                    <AddBoxOutlined />
                </IconButton>
            </Tooltip>
        </Toolbar>
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
        <TableCell padding="checkbox">
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
        </TableCell>
    );
}
