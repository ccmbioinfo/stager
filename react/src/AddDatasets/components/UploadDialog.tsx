import React from "react";
import {
    Button,
    ButtonGroup,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    makeStyles,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import { useErrorSnackbar } from "../../hooks";
import { InputFileUpload } from "./UploadCSV";

interface UploadDialogProps {
    open: boolean;
    onClose: () => void;
    groups: string[];
}

const useStyles = makeStyles(theme => ({
    dialog: {
        paddingBottom: theme.spacing(2),
        paddingTop: theme.spacing(0),
        paddingLeft: theme.spacing(0),
        paddingRight: theme.spacing(0),
    },
    tabPanel: {
        padding: theme.spacing(1),
    },
    gridItem: {
        padding: theme.spacing(1),
    },
}));

export default function UploadDialog({ open, onClose, groups }: UploadDialogProps) {
    const classes = useStyles();
    const [file, setFile] = React.useState<File | null>(null);
    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

    // File reference gets set here
    function onFileAdd(files: FileList | null) {
        if (files && files[0]) {
            setFile(files[0]);
        } else {
            setFile(null);
        }
    }

    async function sendFile(file: File | null) {
        if (file !== null) {
            // Upload
            const groupsParam = new URLSearchParams({ groups: groups.join(",") });
            const response = await fetch("/api/_bulk?" + groupsParam.toString(), {
                method: "POST",
                body: file,
                headers: new Headers({
                    "Content-Type": "text/csv",
                }),
            });
            if (response.ok) {
                enqueueSnackbar(`File ${file.name} uploaded successfully`, {
                    variant: "success",
                });
            } else {
                console.error(
                    `POST /api/_bulk failed with ${response.status}: ${response.statusText}`
                );
                enqueueErrorSnackbar(response, `Failed to upload file ${file.name}.`);
            }
        }
    }

    return (
        <Dialog open={open} onClose={() => onClose()} fullWidth={true} maxWidth="md">
            <DialogTitle>Upload Metadata as CSV</DialogTitle>
            <DialogContent dividers className={classes.dialog}>
                <Grid container className={classes.tabPanel}>
                    <Grid item xs={12} className={classes.gridItem}>
                        <InputFileUpload onUpload={onFileAdd} />
                    </Grid>
                    <Grid item xs={10}></Grid>
                    <Grid item xs={2} className={classes.gridItem}>
                        <ButtonGroup variant="contained">
                            <Button onClick={onClose}>Cancel</Button>
                            <Button
                                onClick={() => {
                                    sendFile(file);
                                    onClose();
                                }}
                                color="primary"
                            >
                                Add
                            </Button>
                        </ButtonGroup>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}
