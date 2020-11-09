import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Chip from "@material-ui/core/Chip";
import MaterialTable, { MTableToolbar } from "material-table";
import HidableTextButton from "./HidableTextButton";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Card from "../Card";

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: "10px",
        colorPrimary: theme.palette.primary,
    },
    button: {
        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
        border: 0,
        borderRadius: 3,
        boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
        color: "white",
        height: 48,
        padding: "0 30px",
    },
    paper: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
    },
}));

function createFile(
    name: string,
    filesUnlinked: number,
    filesUploaded: number,
    lastActive: string,
    secretKey: string,
    accessKey: string
) {
    return { name, filesUnlinked, filesUploaded, lastActive, secretKey, accessKey };
}

const rows = [
    createFile("CHEO", 1, 234, "2020-02-01", "g23ugioshga3089qygh", "abdefghz1234"),
    createFile("ACH", 3, 11, "2020-02-01", "g23ugioshga3089qygh", "abdefghz1234"),
    createFile("SK", 5, 903, "2020-02-01", "g23ugioshga3089qygh", "abdefghz1234"),
    createFile("MTS", 1, 14, "2020-02-01", "g23ugioshga3089qygh", "abdefghz1234"),
    createFile("BTS", 8, 0, "2020-02-01", "g23ugioshga3089qygh", "abdefghz1234"),
];

export default function ManagedUploaders() {
    const classes = useStyles();

    return (
        <Grid container spacing={2}>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <Card
                        title="Uploaders"
                        value="5"
                        textSecondary="Avg 12 files per week"
                        linkText=""
                    />
                </Paper>
            </Grid>
            <Grid item xs={12}>
                <MaterialTable
                    columns={[
                        { title: "Organization", field: "name" },
                        { title: "Files unlinked", field: "filesUnlinked", type: "numeric" },
                        { title: "Files uploaded", field: "filesUploaded", type: "string" },
                        { title: "Last Active", field: "lastActive", type: "string" },
                        {
                            title: "Secret Key",
                            field: "secretKey",
                            type: "string",
                            render: rowData => <HidableTextButton secretText={rowData.secretKey} />,
                        },
                        {
                            title: "Access Key",
                            field: "accessKey",
                            type: "string",
                            render: rowData => <HidableTextButton secretText={rowData.accessKey} />,
                        },
                    ]}
                    data={rows}
                    title="Uploaders"
                    options={{
                        pageSize: 5,
                        selection: true,
                    }}
                    components={{
                        Toolbar: props => (
                            <div>
                                <MTableToolbar {...props} />
                                <div style={{ marginLeft: "24px" }}>
                                    <Chip label="CHEO" clickable className={classes.chip} />
                                    <Chip label="SK" clickable className={classes.chip} />
                                    <Chip label="ACH" clickable className={classes.chip} />
                                    <Chip label="BCL" clickable className={classes.chip} />
                                    <Chip label="Misc." clickable className={classes.chip} />
                                </div>
                            </div>
                        ),
                    }}
                />
            </Grid>
        </Grid>
    );
}
