import React, { useEffect, useState } from "react";
import {
    Checkbox,
    TextField,
    Tooltip,
    Popover,
    FormControlLabel,
    Typography,
    Box,
    List,
    Grid,
    Button,
    makeStyles,
} from "@material-ui/core";
import { Description, DoneAll } from "@material-ui/icons";
import { Autocomplete, createFilterOptions } from "@material-ui/lab";
import { Option } from "../typings";

const useStyles = makeStyles(theme => ({
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
export default function FileLinkingComponent(props: {
    values: string[];
    options: Option[];
    onEdit: (newValue: string[]) => void;
    disabled?: boolean;
    disableTooltip?: boolean;
}) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [options, setOptions] = useState<Option[]>(
        [
            ...props.values.map(value => ({ title: value, inputValue: value, selected: true })),
            ...props.options.map(option => ({ ...option, selected: false })),
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
            options.reduce<string[]>((fileList, option) => {
                if (option.selected) fileList.push(option.title);
                return fileList;
            }, [])
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
                ...props.values.map(value => ({ title: value, inputValue: value, selected: true })),
                ...props.options.map(option => ({ ...option, selected: false })),
            ].sort(compareOption)
        );
    }, [props.options, props.values]);

    return (
        <>
            <Tooltip
                placement="left"
                interactive
                disableFocusListener={props.disableTooltip}
                disableHoverListener={props.disableTooltip}
                disableTouchListener={props.disableTooltip}
                title={
                    props.values.length === 0 ? (
                        <Typography variant="body2">No files selected</Typography>
                    ) : (
                        <List>
                            {props.values.map(value => {
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
                <span>
                    <Button
                        variant="contained"
                        color="default"
                        size="small"
                        onClick={handleClick}
                        disabled={props.disabled}
                        disableRipple
                        disableElevation
                    >
                        {props.values.length} files
                    </Button>
                </span>
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
                        {props.options.length === 0 && props.values.length === 0 ? (
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
                                            filtered.length === 0
                                                ? (filteredOptions = [])
                                                : (filteredOptions = [
                                                      {
                                                          title: "Select all",
                                                          inputValue: "Select all",
                                                      },
                                                      ...filtered,
                                                  ]);
                                            return filteredOptions;
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
                                        color="primary"
                                        checked={option.selected}
                                        onChange={() => {
                                            setOptions(
                                                options
                                                    .map(currOption =>
                                                        currOption.title === option.title
                                                            ? {
                                                                  ...currOption,
                                                                  selected: !currOption.selected,
                                                              }
                                                            : { ...currOption }
                                                    )
                                                    .sort(compareOption)
                                            );
                                        }}
                                    />
                                }
                                label={option.title}
                            />
                        </Box>
                    ))}
                </Box>
            </Popover>
        </>
    );
}
