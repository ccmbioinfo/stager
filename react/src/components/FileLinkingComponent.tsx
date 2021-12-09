import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Checkbox,
    Chip,
    FormControlLabel,
    Grid,
    List,
    makeStyles,
    Popover,
    Tooltip,
    Typography,
} from "@material-ui/core";
import { Description } from "@material-ui/icons";
import { AutocompleteMultiselect, Note } from "../components";
import { useDebounce, useUnlinkedFilesQuery } from "../hooks";
import { LinkedFile, UnlinkedFile } from "../typings";

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
    fileName: {
        wordBreak: "break-all",
        padding: 0,
    },
}));

/* eslint-disable mui-unused-classes/unused-classes */
const useAutocompleteStyles = makeStyles(() => ({
    root: {
        width: "400px",
        flexGrow: 1,
    },
}));

/* A cell for linking files to a dataset. */
const FileLinkingComponent: React.FC<{
    values: LinkedFile[];
    onEdit: (newValue: UnlinkedFile[]) => void;
    setFiles?: React.Dispatch<React.SetStateAction<UnlinkedFile[]>>;
    disabled?: boolean;
    disableTooltip?: boolean;
    inputValue?: string;
    onInputChange?: (newInputvalue: string) => void;
}> = ({ values, onEdit, disabled, disableTooltip, inputValue, onInputChange }) => {
    const debouncedSearchQuery = useDebounce(inputValue || "None", 600);

    console.log("debounced search query", debouncedSearchQuery);

    const files = useUnlinkedFilesQuery({ path: debouncedSearchQuery });
    const [options, setOptions] = useState<UnlinkedFile[]>([]);

    const autocompleteClasses = useAutocompleteStyles();
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        if (files.isSuccess) {
            setOptions(files.data);
        }
    }, [files]);

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
                    {/* prevent mui warnings about tooltip wrapping disabled button */}
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
                        <Grid container direction="column">
                            <AutocompleteMultiselect
                                classes={autocompleteClasses}
                                inputLabel="Search Unlinked Files"
                                onInputChange={onInputChange}
                                limit={25}
                                onSelect={onEdit}
                                options={options}
                                renderTags={(tags, getTagProps) => (
                                    <>
                                        {tags.map((tag, i) => {
                                            const onChange = () => {
                                                onEdit(
                                                    tags.map(t => ({
                                                        ...t,
                                                        multiplexed:
                                                            t.path === tag.path
                                                                ? !t.multiplexed
                                                                : t.multiplexed,
                                                    }))
                                                );
                                            };
                                            const Detail = (
                                                <Box margin={1}>
                                                    <FormControlLabel
                                                        label="Multiplexed?"
                                                        control={
                                                            <Checkbox
                                                                checked={tag.multiplexed}
                                                                onChange={onChange}
                                                            />
                                                        }
                                                    />
                                                </Box>
                                            );
                                            return (
                                                <Chip
                                                    key={tag.path}
                                                    {...getTagProps({ index: i })}
                                                    label={
                                                        <Note detailElement={Detail}>
                                                            {tag.path}
                                                        </Note>
                                                    }
                                                />
                                            );
                                        })}
                                    </>
                                )}
                                selectedValues={values}
                                uniqueLabelPath="path"
                            />
                        </Grid>
                    </div>
                </Box>
            </Popover>
        </>
    );
};

export default FileLinkingComponent;
