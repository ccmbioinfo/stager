import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    ButtonGroup,
    Grid,
    makeStyles,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import { InputFileUpload } from "./UploadCSV";

interface UploadDialogProps {
    open: boolean;
    onClose: () => void;
}

const useStyles = makeStyles(theme => ({
    root: {},
    dialog: {
        paddingBottom: theme.spacing(2),
        paddingTop: theme.spacing(0),
        paddingLeft: theme.spacing(0),
        paddingRight: theme.spacing(0),
    },
    margin: {
        margin: theme.spacing(1),
    },
    padding: {
        paddingTop: theme.spacing(4),
    },
    tabs: {
        paddingTop: theme.spacing(0),
    },
    tabPanel: {
        padding: theme.spacing(1),
    },
    gridItem: {
        padding: theme.spacing(1),
    },
    buttonGroup: {
        paddingRight: theme.spacing(1),
    },
}));

export default function UploadDialog({ open, onClose }: UploadDialogProps) {
    const classes = useStyles();
    const [file, setFile] = React.useState<File | null>(null);
    const { enqueueSnackbar } = useSnackbar();

    // File reference gets set here
    function onFileAdd(files: FileList | null) {
        if (files && files[0]) {
            setFile(files[0]);
            console.log(files[0].name);
        } else {
            setFile(null);
        }
    }

    function sendFile(file: File | null) {
        if (file !== null) {
            // Upload
            fetch("/api/_bulk", {
                method: "POST",
                body: file,
                headers: new Headers({
                    "Content-Type": "text/csv",
                }),
            })
                .then(response => response.json())
                .then(data => {
                    enqueueSnackbar(`File ${file.name} uploaded successfully`, {
                        variant: "success",
                    });
                })
                .catch(error => {
                    console.error(error);
                    enqueueSnackbar(`Failed to upload file ${file.name}`, { variant: "error" });
                });
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
