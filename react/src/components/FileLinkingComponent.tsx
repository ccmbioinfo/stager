import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Checkbox,
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
    const [inputValue, setInputValue] = useState("");

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const options = useMemo(
        () =>
            props.options
                .map(o => ({
                    ...o,
                    selected: props.values.includes(o.title),
                }))
                .sort(compareOption),
        [props.options, props.values]
    );

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
                                <div className={classes.autocomplete}>
                                    <Autocomplete
                                        inputValue={inputValue}
                                        onInputChange={(_, value, reason) => {
                                            if (reason === "reset") {
                                                setInputValue("");
                                            } else {
                                                setInputValue(value);
                                            }
                                        }}
                                        style={{ width: "400px" }}
                                        disableCloseOnSelect
                                        onChange={(_, selectedOption, reason) => {
                                            if (selectedOption && reason === "select-option") {
                                                if (selectedOption.selected) {
                                                    props.onEdit(
                                                        props.values.filter(
                                                            v => v !== selectedOption.title
                                                        )
                                                    );
                                                } else {
                                                    props.onEdit(
                                                        props.values.concat(selectedOption.title)
                                                    );
                                                }
                                            }
                                        }}
                                        // this is technically an uncontrolled component b/c we are not providing a value prop
                                        // we have multiple values but aren't using tags and are instead showing selected files within the dropdown itself by sorting them to the top
                                        // we always return true here to avoid console warnings about the value prop being invalid
                                        getOptionSelected={() => true}
                                        renderOption={option => (
                                            <Box>
                                                <Grid container alignItems="center">
                                                    <Checkbox checked={option.selected} />
                                                    <Typography
                                                        variant="body1"
                                                        className={classes.breakAll}
                                                    >
                                                        {option.title}
                                                    </Typography>
                                                </Grid>
                                            </Box>
                                        )}
                                        options={options}
                                        filterOptions={createFilterOptions({
                                            limit: 25,
                                            stringify: o => o.title,
                                        })}
                                        getOptionLabel={option => option.title}
                                        renderInput={params => (
                                            <TextField
                                                {...params}
                                                label="Search Unlinked Files"
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                </div>
                            </Grid>
                        )}
                    </div>
                </Box>
            </Popover>
        </>
    );
}
