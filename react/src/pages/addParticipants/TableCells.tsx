import React, { ReactNode } from "react";
import {
    Checkbox,
    IconButton,
    makeStyles,
    TableCell,
    TableCellProps,
    TextField,
    Tooltip,
} from "@material-ui/core";
import { Autocomplete, createFilterOptions } from "@material-ui/lab";
import { DataEntryHeader, DataEntryRow } from "../utils/typings";
import { Option, toOption, booleanColumns, dateColumns, enumerableColumns } from "./utils";

const useDateCellStyles = makeStyles(theme => ({
    textField: {
        width: "125px",
    },
}));

const filter = createFilterOptions<Option>({
    limit: 25,
});

/**
 * A 'general' data entry cell that returns a table cell with a user control
 * appropriate for the type of value required.
 */
export function DataEntryCell(props: {
    row: DataEntryRow;
    rowIndex: number;
    col: DataEntryHeader;
    getOptions: (rowIndex: number, col: DataEntryHeader) => Option[];
    onEdit: (newValue: string | boolean) => void;
    disabled?: boolean;
    required?: boolean;
}) {
    if (booleanColumns.includes(props.col.field)) {
        return (
            <CheckboxCell
                value={!!props.row[props.col.field]}
                onEdit={props.onEdit}
                disabled={props.disabled}
            />
        );
    } else if (dateColumns.includes(props.col.field)) {
        return (
            <DateCell
                value={props.row[props.col.field]?.toString()}
                onEdit={props.onEdit}
                disabled={props.disabled}
            />
        );
    }
    return (
        <AutocompleteCell
            value={toOption(props.row[props.col.field])}
            options={props.getOptions(props.rowIndex, props.col)}
            onEdit={props.onEdit}
            disabled={props.disabled}
            column={props.col}
            aria-label={`enter ${props.col.title} row ${props.rowIndex}`}
            required={props.required}
        />
    );
}

/**
 * A cell in the DataEntryTable that the user can type into.
 */
export function AutocompleteCell(
    props: {
        value: Option;
        options: Option[];
        onEdit: (newValue: string, autocomplete?: boolean) => void;
        disabled?: boolean;
        column: DataEntryHeader;
        required?: boolean;
    } & TableCellProps
) {
    const onEdit = (newValue: Option, autopopulate?: boolean) => {
        props.onEdit(newValue.inputValue, autopopulate);
    };

    // Remove 'this' input value from the list of options
    const options = props.options.filter(
        (val, index, arr) =>
            arr.findIndex((opt, i) => opt.inputValue === val.inputValue) === index &&
            val.inputValue !== props.value.inputValue
    );

    const isError = props.required && props.value.inputValue.trim() === "";

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
                        console.log(newValue.origin)
                        onEdit(toOption(newValue), (props.column.field === "participant_codename" || props.column.field === "family_codename"));
                    } else {
                        onEdit(toOption(""), props.column.field === "participant_codename" || props.column.field === "family_codename");
                    }
                }}
                options={options}
                value={props.value}
                renderInput={params => (
                    <TextField
                        {...params}
                        variant="standard"
                        error={isError}
                        helperText={isError && "Field is required."}
                    />
                )}
                groupBy={option => (option.origin ? option.origin : "Unknown")}
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    // Adds user-entered value as option
                    // We prefer to show pre-existing options than the "create new" option
                    if (
                        !enumerableColumns.includes(props.column.field) &&
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

/* A data entry cell for columns which require a boolean value. */
export function CheckboxCell(props: {
    value: boolean;
    onEdit: (newValue: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <TableCell padding="checkbox">
            <Checkbox
                checked={props.value}
                onChange={event => props.onEdit(event.target.checked)}
                disabled={props.disabled}
            />
        </TableCell>
    );
}

/* A data entry cell for columns which require a date value. */
export function DateCell(props: {
    value: string | undefined;
    onEdit: (newValue: string) => void;
    disabled?: boolean;
}) {
    const classes = useDateCellStyles();
    return (
        <TableCell>
            <TextField
                className={classes.textField}
                id="date"
                size="small"
                type="date"
                value={props.value}
                disabled={props.disabled}
                onChange={e => props.onEdit(e.target.value)}
            />
        </TableCell>
    );
}

/**
 * A cell in the DataEntryTable positioned before all the entry rows, which
 * provides an action button that the user can click.
 */
export function DataEntryActionCell(props: {
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
