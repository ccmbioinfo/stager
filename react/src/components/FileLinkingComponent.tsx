import React, { useEffect, useState } from "react";
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
import { Note } from "../components";
import { LinkedFile, Option, PossiblyLinkedFile } from "../typings";

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
const FileLinkingComponent: React.FC<{
    values: LinkedFile[];
    options: Option[];
    onEdit: (newValue: PossiblyLinkedFile[]) => void;
    disabled?: boolean;
    disableTooltip?: boolean;
}> = ({ values, options: parentOptions, onEdit, disabled, disableTooltip }) => {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState<Omit<LinkedFile, "file_id">[]>([]);

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        //fix this as things solidify
        setOptions(parentOptions.map(o => ({ path: o.title, multiplexed: false })));
    }, [parentOptions]);


    return (
        <>
            <Tooltip
                placement="left"
                interactive
                disableFocusListener={disableTooltip}
                disableHoverListener={disableTooltip}
                disableTouchListener={disableTooltip}
                title={
                    values.length === 0 ? (
                        <Typography variant="body2">No files selected</Typography>
                    ) : (
                        <List>
                            {values.map(value => {
                                return (
                                    <Grid
                                        key={value.path}
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
                                                {value.path}
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
                        disabled={disabled}
                        disableRipple
                        disableElevation
                    >
                        {values.length} files
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
                        {options.length === 0 && values.length === 0 ? (
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
                                    onChange={(event, selectedOptions, reason) => {
                                        //prevent keypress events from propagating to parent listeners
                                        event.stopPropagation();
                                        if (
                                            selectedOptions &&
                                            ["select-option", "remove-option"].includes(reason)
                                        ) {
                                            onEdit(selectedOptions);
                                            setInputValue("");
                                        }
                                    }}
                                    renderTags={(tags, getTagProps) => (
                                        <>
                                            {tags.map((tag, i) => (
                                                <Chip
                                                    key={tag.path}
                                                    {...getTagProps({ index: i })}
                                                    label={<Note>{tag.path}</Note>}
                                                />
                                            ))}
                                        </>
                                    )}
                                    renderOption={option => (
                                        <span className={classes.fileName}>{option.path}</span>
                                    )}
                                    getOptionSelected={(option, value) =>
                                        option.path === value.path
                                    }
                                    options={options}
                                    filterOptions={createFilterOptions({
                                        limit: 25,
                                        stringify: o => o.path,
                                    })}
                                    filterSelectedOptions={true}
                                    getOptionLabel={option => option.path}
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            label="Search Unlinked Files"
                                            variant="outlined"
                                        />
                                    )}
                                    multiple
                                    value={values}
                                />
                            </Grid>
                        )}
                    </div>
                </Box>
            </Popover>
        </>
    );
};

export default FileLinkingComponent;
