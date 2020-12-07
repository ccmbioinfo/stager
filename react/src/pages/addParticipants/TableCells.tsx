import React, { ReactNode, useEffect, useState } from "react";
import {
    Checkbox,
    IconButton,
    makeStyles,
    TableCell,
    TableCellProps,
    TextField,
    Tooltip,
    Popover,
    Badge,
    FormControlLabel,
    Typography,
    Box,
    List,
    Grid,
} from "@material-ui/core";
import { Link, Description, DoneAll } from "@material-ui/icons";
import { Autocomplete, createFilterOptions } from "@material-ui/lab";
import { DataEntryHeader, DataEntryRow } from "../utils/typings";
import { Option, toOption, booleanColumns, dateColumns, enumerableColumns } from "./utils";

const useCellStyles = makeStyles(theme => ({
    textField: {
        width: "125px",
    },
    popoverBox: {
        padding: theme.spacing(2),
        maxWidth: "60vw",
        maxHeight: "50vh",
    },
    popoverBoxHeader: {
        display: "flex",
        alignItems: "center",
        width: "100%",
    },
    popoverTitle: {
        width: "150px",
    },
    fileName: {
        wordBreak: "break-all",
        padding: 0,
    },
    autocomplete: {
        flexGrow: 1,
    },
    selectAllIcon: {
        marginRight: theme.spacing(1),
    },
    selectAllOption: {
        wordBreak: "break-all",
        fontWeight: "bold",
    },
    breakAll: {
        wordBreak: "break-all",
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
    onEdit: (newValue: string | boolean | string[]) => void;
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
    } else if (props.col.field === "input_hpf_path") {
        return (
            <FileLinkingCell
                value={props.row[props.col.field]}
                options={props.getOptions(props.rowIndex, props.col)}
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
        onEdit: (newValue: string) => void;
        disabled?: boolean;
        column: DataEntryHeader;
        required?: boolean;
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
    const classes = useCellStyles();
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

const compareOption = (a: Option, b: Option) => {
    if (a.selected && b.selected) {
        return 0;
    } else if (a.selected) {
        return -1;
    } else if (b.selected) {
        return 1;
    } else {
        return 0;
    }
};
/* A cell for linking files to a dataset. */
export function FileLinkingCell(props: {
    value: string[] | undefined;
    options: Option[];
    onEdit: (newValue: string[]) => void;
    disabled?: boolean;
}) {
    const classes = useCellStyles();
    const values: string[] = props.value ? props.value : [];

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [options, setOptions] = React.useState<Option[]>(
        [
            ...values.map(value => ({ title: value, inputValue: value, selected: true } as Option)),
            ...props.options.map(option => ({ ...option, selected: false } as Option)),
        ].sort(compareOption)
    );
    let filteredOptions: Option[] = [];
    const filter = createFilterOptions<Option>();
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
        props.onEdit(
            options.reduce((fileList, option) => {
                if (option.selected) fileList.push(option.title);
                return fileList;
            }, [] as string[])
        );
    };
    const getUnselectedOptions = () => {
        const result: Option[] = [];
        options.reduce<Option[]>((optionList, option) => {
            if (!option.selected) optionList.push(option);
            return optionList;
        }, result);
        return result;
    };

    useEffect(() => {
        setOptions(
            [
                ...values.map(
                    value => ({ title: value, inputValue: value, selected: true } as Option)
                ),
                ...props.options.map(option => ({ ...option, selected: false } as Option)),
            ].sort(compareOption)
        );
    }, [props.options]);

    return (
        <TableCell padding="none" align="center">
            <Tooltip
                placement="left"
                interactive
                title={
                    values.length === 0 ? (
                        <Typography variant="body2">No files selected</Typography>
                    ) : (
                        <List>
                            {values.map(value => {
                                return (
                                    <Grid container wrap="nowrap" spacing={1} alignItems="center">
                                        <Grid item>
                                            <Description />
                                        </Grid>
                                        <Grid item xs>
                                            <Typography
                                                variant="body2"
                                                className={classes.fileName}
                                            >
                                                {value}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                );
                            })}
                        </List>
                    )
                }
            >
                <IconButton
                    aria-label="delete"
                    color="default"
                    onClick={handleClick}
                    disabled={props.disabled}
                >
                    <Badge badgeContent={props.value ? props.value.length : 0} color="primary">
                        <Link fontSize="large" />
                    </Badge>
                </IconButton>
            </Tooltip>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
            >
                <Box className={classes.popoverBox}>
                    <div className={classes.popoverBoxHeader}>
                        {props.options.length === 0 && values.length === 0 ? (
                            <Typography variant="h6" className={classes.popoverTitle}>
                                No files available
                            </Typography>
                        ) : (
                            <>
                                <Typography variant="h6" className={classes.popoverTitle}>
                                    Available files:
                                </Typography>
                                <div className={classes.autocomplete}>
                                    <Autocomplete
                                        disableCloseOnSelect
                                        onChange={(e, newValue) => {
                                            if (newValue?.title === "Select all") {
                                                const filteredOptionTitles = filteredOptions.map(
                                                    filteredOption => filteredOption.title
                                                );
                                                setOptions(
                                                    options
                                                        .map(option => {
                                                            if (
                                                                filteredOptionTitles.find(
                                                                    o => o === option.title
                                                                )
                                                            ) {
                                                                return {
                                                                    ...option,
                                                                    selected: true,
                                                                };
                                                            } else {
                                                                return { ...option };
                                                            }
                                                        })
                                                        .sort(compareOption)
                                                );
                                            } else if (newValue) {
                                                const result = [...options];
                                                result[
                                                    result.findIndex(
                                                        option => option.title === newValue.title
                                                    )
                                                ].selected = true;
                                                setOptions(result.sort(compareOption));
                                            }
                                        }}
                                        filterOptions={(options, params): Option[] => {
                                            const filtered = filter(options, params);
                                            if (filtered.length === 0) {
                                                filteredOptions = [];
                                                return [];
                                            }
                                            const result = [
                                                { title: "Select all", inputValue: "Select all" },
                                                ...filtered,
                                            ];
                                            filteredOptions = result;
                                            return result;
                                        }}
                                        renderOption={option =>
                                            option.title === "Select all" ? (
                                                <>
                                                    <DoneAll
                                                        className={classes.selectAllIcon}
                                                        color="primary"
                                                    />
                                                    <Typography
                                                        variant="body1"
                                                        color="primary"
                                                        className={classes.selectAllOption}
                                                    >
                                                        SELECT ALL
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography
                                                    variant="body1"
                                                    className={classes.breakAll}
                                                >
                                                    {option.title}
                                                </Typography>
                                            )
                                        }
                                        options={getUnselectedOptions()}
                                        getOptionLabel={option => option.title}
                                        renderInput={params => (
                                            <TextField
                                                {...params}
                                                label="Search"
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    {options.map((option, index) => (
                        <Box key={index}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={option.selected}
                                        onChange={() => {
                                            setOptions(
                                                options
                                                    .map(currOption => {
                                                        if (currOption.title === option.title) {
                                                            return {
                                                                ...currOption,
                                                                selected: !currOption.selected,
                                                            };
                                                        } else {
                                                            return { ...currOption };
                                                        }
                                                    })
                                                    .sort(compareOption)
                                            );
                                        }}
                                        color="primary"
                                    />
                                }
                                label={option.title}
                            />
                        </Box>
                    ))}
                </Box>
            </Popover>
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
