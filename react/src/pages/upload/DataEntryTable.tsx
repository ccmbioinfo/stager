import React, { ReactNode, useEffect, useState } from "react";
import {
    IconButton,
    Paper,
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
import { AddBox, AddBoxOutlined, Delete } from "@material-ui/icons";
import { DataEntryHeader, DataEntryRow, getProp, setProp } from "../utils";

const defaultColumns: DataEntryHeader[] = [
    { title: "Family", field: "family_codename" },
    { title: "Participant", field: "participant_codename" },
    { title: "Participant Type", field: "participant_type" },
    { title: "Tissue Type", field: "tissue_sample_type" },
    { title: "Dataset Type", field: "dataset_type" },
];

interface Option {
    title: string;
    inputValue: string;
    origin?: string;
}

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

function toOption(str: string | Option, origin?: string) {
    if (typeof str === "string") return { title: str, inputValue: str, origin: origin } as Option;
    return { ...str, origin: origin };
}

export default function DataEntryTable(props: DataEntryTableProps) {
    const [columns, setColumns] = useState<DataEntryHeader[]>(defaultColumns);
    const [rows, setRows] = useState<DataEntryRow[]>(props.data ? props.data : createEmptyRows(3));
    const [families, setFamilies] = useState<Array<any>>([]);

    useEffect(() => {
        fetch("/api/families")
            .then(response => response.json())
            .then(data => {
                setFamilies(data);
            })
            .catch(error => {
                console.error(error);
            });
    }, [columns]);

    function onEdit(newValue: string, rowIndex: number, colIndex: number) {
        setRows(
            rows.map((value, index) => {
                if (index === rowIndex) {
                    return { ...setProp(value, columns[colIndex].field, newValue) };
                } else {
                    return value;
                }
            })
        );
    }

    // Return the options for a given cell based on row, column
    function getOptions(rowIndex: number, colIndex: number): Option[] {
        const row = rows[rowIndex];
        const col = columns[colIndex];
        const rowOptions = rows
            .filter((val, index) => index !== rowIndex) // not this row
            .map(val => toOption("" + getProp(val, col.field), "Previous rows"));

        switch (col.field) {
            case "family_codename":
                const familyOptions = families.map(value =>
                    toOption(value.family_codename, "Existing families")
                );
                return familyOptions.concat(rowOptions);
            default:
                return rowOptions;
        }
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
                            <TableCell padding="none" />
                            <TableCell padding="none" />
                            {columns.map((cell, index) => (
                                <TableCell>{cell.title}</TableCell>
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
                                    icon={<AddBox />}
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
                                {columns.map((col, colIndex) => (
                                    <DataEntryCell
                                        value={toOption("" + getProp(row, col.field))}
                                        options={getOptions(rowIndex, colIndex)}
                                        onEdit={newValue => onEdit(newValue, rowIndex, colIndex)}
                                    />
                                ))}
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

interface DataEntryCellProps {
    value: Option;
    options: Option[];
    freeSolo?: boolean;
    onEdit: (newValue: string) => void;
    row?: DataEntryRow;
    col?: DataEntryHeader;
    disabled?: boolean;
}

function DataEntryCell(props: DataEntryCellProps) {
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
                onChange={(event, newValue, reason) => {
                    // 'value' refers to what the user selects
                    // 'inputValue' refers to what the user types
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

                    if (params.inputValue !== "") {
                        filtered.push({
                            title: `Add "${params.inputValue}"`,
                            inputValue: params.inputValue,
                            origin: "Add new family...",
                        });
                    }

                    return filtered;
                }}
                onFocus={e => {
                    console.log(options);
                }}
                getOptionLabel={option => option.inputValue}
                renderOption={option => option.title}
            />
        </TableCell>
    );
}

function DataEntryActionCell(props: {
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    icon: ReactNode;
    tooltipTitle: string;
    disabled?: boolean;
}) {
    return (
        <TableCell padding="none">
            <Tooltip title={props.tooltipTitle}>
                <IconButton onClick={props.onClick} disabled={props.disabled}>
                    {props.icon}
                </IconButton>
            </Tooltip>
        </TableCell>
    );
}

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
