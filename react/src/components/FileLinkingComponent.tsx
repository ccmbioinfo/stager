import React, { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Grid,
    List,
    makeStyles,
    Popover,
    TextField,
    Tooltip,
    Typography,
} from "@material-ui/core";
import { Description } from "@material-ui/icons";
import { Autocomplete, createFilterOptions } from "@material-ui/lab";
import { toOption } from "../AddDatasets/components/utils";
import { Note } from "../components";
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
        width: "400px",
        flexGrow: 1,
    },
}));

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
    const [inputValue, setInputValue] = useState("");

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

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
                                    <Grid
                                        key={value}
                                        container
                                        wrap="nowrap"
                                        spacing={1}
                                        alignItems="center"
                                    >
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
                            <Grid container direction="column">
                                <Autocomplete
                                    autoComplete
                                    className={classes.autocomplete}
                                    inputValue={inputValue}
                                    onInputChange={(_, value, reason) => {
                                        if (reason === "input") {
                                            setInputValue(value);
                                        }
                                    }}
                                    disableClearable={true}
                                    disableCloseOnSelect
                                    onChange={(_, selectedOptions, reason) => {
                                        if (
                                            selectedOptions &&
                                            ["select-option", "remove-option"].includes(reason)
                                        ) {
                                            props.onEdit(selectedOptions.map(o => o.title));
                                            setInputValue("");
                                        }
                                    }}
                                    renderTags={(tags, getTagProps) => (
                                        <>
                                            {tags.map((tag, i) => (
                                                <Chip
                                                    key={tag.title}
                                                    {...getTagProps({ index: i })}
                                                    label={<Note>{tag.title}</Note>}
                                                />
                                            ))}
                                        </>
                                    )}
                                    renderOption={option => (
                                        <span className={classes.fileName}>{option.title}</span>
                                    )}
                                    getOptionSelected={(option, value) =>
                                        option.title === value.title
                                    }
                                    options={props.options}
                                    filterOptions={createFilterOptions({
                                        limit: 25,
                                        stringify: o => o.title,
                                    })}
                                    filterSelectedOptions={true}
                                    getOptionLabel={option => option.title}
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            label="Search Unlinked Files"
                                            variant="outlined"
                                        />
                                    )}
                                    multiple
                                    value={props.values.map(v => toOption(v))}
                                />
                            </Grid>
                        )}
                    </div>
                </Box>
            </Popover>
        </>
    );
}
