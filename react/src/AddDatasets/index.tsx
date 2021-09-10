import { useEffect, useState } from "react";
import { Button, Container, makeStyles, Tooltip } from "@material-ui/core";
import { CloudUpload } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { useHistory } from "react-router";
import { ConfirmModal } from "../components";
import { useUserContext } from "../contexts";
import { getKeys, snakeCaseToTitle, strIsEmpty } from "../functions";
import { useBulkCreateMutation, useErrorSnackbar } from "../hooks";
import {
    DataEntryColumnConfig,
    DataEntryField,
    DataEntryRow,
    DataEntryRowBase,
    DataEntryRowDNAOptional,
    DataEntryRowRNA,
} from "../typings";
import DataEntryTable from "./components/DataEntryTable";
import { participantColumns } from "./components/utils";

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1),
    },
    buttonContainer: {
        padding: theme.spacing(1),
        display: "flex",
    },
    submitButton: {
        flexGrow: 1,
    },
}));

/*
    create an object with all possible data entry fields
    column filters will determine which rows are displayable
    `hidden` attribute on column config object determines whether col appears in table or in hidden list
*/
export const createEmptyRow = (): DataEntryRow => ({
    fields: {
        ...new DataEntryRowBase(),
        ...new DataEntryRowDNAOptional(),
        ...new DataEntryRowRNA(),
    },
    meta: {},
});

/*
    get array of all data entry fields
*/
const getDataEntryFieldList = () => getKeys(createEmptyRow().fields);

/* fields that cannot be hidden and are required for submission for both DNA and RNA seq */
const ALWAYS_VISIBLE_BASE_FIELDS: readonly DataEntryField[] = [
    "family_codename",
    "participant_codename",
    "participant_type",
    "tissue_sample_type",
    "dataset_type",
    "condition",
    "sequencing_date",
];

/* RNA-only fields that are required */
const ALWAYS_VISIBLE_RNA_FIELDS: readonly DataEntryField[] = [
    ...ALWAYS_VISIBLE_BASE_FIELDS,
    "candidate_genes",
];

/* optional fields that can be hidden */
export const OPTIONAL_FIELDS: readonly DataEntryField[] = getKeys(new DataEntryRowDNAOptional());

const formatFieldToTitle = (field: string) => {
    if (field === "sequencing_date") {
        return "Report Date";
    }
    return snakeCaseToTitle(field) // convert to title case
        .replace(/ Id /g, " ID "); // capitalize any occurrance of " Id "
};

/* create fresh set of DNA column configs */
export const makeFreshColumns = (fallbackColumns: DataEntryField[]): DataEntryColumnConfig[] => {
    let defaultVisible: DataEntryField[];

    const storedDefaults = window.localStorage.getItem("data-entry-default-columns");

    if (storedDefaults !== null) {
        // User already has stored preferences
        defaultVisible = JSON.parse(storedDefaults);
    } else {
        window.localStorage.setItem("data-entry-default-columns", JSON.stringify(fallbackColumns));
        defaultVisible = fallbackColumns;
    }

    return (
        getDataEntryFieldList()
            //show dna only by default
            .filter(f => !getKeys(new DataEntryRowRNA()).includes(f as any))
            .map(field => ({
                field: field,
                hidden:
                    !defaultVisible.includes(field) && !ALWAYS_VISIBLE_BASE_FIELDS.includes(field),
                required: ALWAYS_VISIBLE_BASE_FIELDS.includes(field),
                title: formatFieldToTitle(field),
            }))
    );
};

/* get a list of required fields for the row */
const getRequiredFields = (row: DataEntryRow) =>
    row.fields.dataset_type === "RRS" ? ALWAYS_VISIBLE_RNA_FIELDS : ALWAYS_VISIBLE_BASE_FIELDS;

/* add columns to the current list after a specified field */
const insertColumnsAfter = (
    field: DataEntryField,
    columns: DataEntryColumnConfig[],
    columnsToAdd: DataEntryColumnConfig[]
) => columns.flatMap(col => (col.field === field ? [col, ...columnsToAdd] : col));

export default function AddDatasets() {
    const classes = useStyles();
    const history = useHistory();
    const { user: currentUser } = useUserContext();
    const datasetsMutation = useBulkCreateMutation();
    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

    const [asGroups, setAsGroups] = useState<string[]>([]); // "submitting as these groups"
    const [columns, setColumns] = useState<DataEntryColumnConfig[]>();
    const [data, setData] = useState<DataEntryRow[]>();
    const [errorMessage, setErrorMessage] = useState("");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        document.title = `Add Datasets | ${process.env.REACT_APP_NAME}`;
    }, []);

    useEffect(() => {
        if (!data) {
            const savedProgress = sessionStorage.getItem("add-datasets-progress");

            if (savedProgress) {
                const savedData = JSON.parse(savedProgress) as DataEntryRow[];
                setData(savedData);
            } else {
                setData([createEmptyRow()]);
            }
        }
        if (!columns) {
            setColumns(makeFreshColumns(["notes", "sex", "linked_files"]));
        }
    }, [columns, data, setColumns]);

    useEffect(() => {
        /* toggle column display based on dataset type  */
        if (data && columns) {
            const rnaFields = getKeys(new DataEntryRowRNA());
            sessionStorage.setItem("add-datasets-progress", JSON.stringify(data));
            //toggle rna seq column visibility
            if (
                data.some(row => row.fields.dataset_type === "RRS") &&
                !columns.find(c => c.field === rnaFields[0])
            ) {
                setColumns(
                    insertColumnsAfter(
                        "sequencing_date",
                        columns,
                        rnaFields.map(field => ({
                            field,
                            hidden: false,
                            required: true,
                            title: snakeCaseToTitle(field),
                        }))
                    )
                );
            } else if (
                columns.find(c => c.field === rnaFields[0]) &&
                !data.find(row => row.fields.dataset_type === "RRS")
            ) {
                setColumns(
                    columns.filter(c => !getKeys(new DataEntryRowRNA()).includes(c.field as any))
                );
            }
        }
    }, [data, columns]);

    useEffect(() => {
        if (currentUser.groups.length === 1) {
            setAsGroups(currentUser.groups);
        }
    }, [currentUser]);

    function onChangeGroups(newGroups: string[]) {
        setAsGroups(newGroups);
    }

    // Check for error state
    useEffect(() => {
        // Check all permission groups
        if (data) {
            if (currentUser.groups.length === 0) {
                setErrorMessage("Cannot submit. You are not part of any permission groups.");
                return;
            }

            // Check selected permission groups
            if (asGroups.length === 0) {
                setErrorMessage("Cannot submit. You must select a permission group.");
                return;
            }

            let problemRows = new Map<number, Array<DataEntryField>>();

            for (let i = 0; i < data.length; i++) {
                let row = data[i];
                const requiredFields = getRequiredFields(row);
                for (const field of requiredFields) {
                    if (row.meta.participantColumnsDisabled && participantColumns.includes(field))
                        continue;
                    const val = row.fields[field];
                    if (typeof val === "string" && strIsEmpty(val)) {
                        if (problemRows.get(i))
                            problemRows.set(i, problemRows.get(i)!.concat(field));
                        else problemRows.set(i, [field]);
                    }
                }
            }

            if (problemRows.size > 0) {
                let message = "Cannot submit. Required fields missing for rows:";
                problemRows.forEach((fields, key) => {
                    const fieldStr = fields.join(", ");
                    message += `\n${key + 1}: (${fieldStr})`;
                });
                setErrorMessage(message);
                return;
            }

            // Checked everything, no problems
            setErrorMessage("");
        }
    }, [data, asGroups, currentUser]);

    function handleSubmit() {
        if (data) {
            datasetsMutation.mutate(
                { data: data.map(d => d.fields), asGroups: asGroups },
                {
                    onSuccess: datasets => {
                        const length = datasets.length;
                        enqueueSnackbar(
                            `${length} ${
                                length !== 1 ? "datasets" : "dataset"
                            } successfully added.`,
                            {
                                variant: "success",
                            }
                        );
                        setData([createEmptyRow()]);
                        history.push("/datasets");
                    },
                    onError: (response: Response) => enqueueErrorSnackbar(response),
                }
            );
        }
    }

    function handleDataChange(newData: DataEntryRow[]) {
        setData(newData);
    }

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <DataEntryTable
                    allGroups={currentUser.groups}
                    columns={columns || []}
                    data={data || []}
                    groups={asGroups}
                    onChange={handleDataChange}
                    setColumns={setColumns}
                    setGroups={onChangeGroups}
                />
            </Container>
            <Tooltip title={errorMessage} interactive>
                <Container className={classes.buttonContainer} maxWidth="sm">
                    <Button
                        disabled={!!errorMessage}
                        className={classes.submitButton}
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<CloudUpload />}
                        onClick={() => setOpen(true)}
                    >
                        Submit
                    </Button>
                </Container>
            </Tooltip>

            <ConfirmModal
                id="confirm-submit-modal"
                open={open}
                title="Confirm metadata submission"
                onClose={() => setOpen(false)}
                onConfirm={() => {
                    setOpen(false);
                    handleSubmit();
                }}
            >
                Are you sure that you would like to submit?
            </ConfirmModal>
        </main>
    );
}
