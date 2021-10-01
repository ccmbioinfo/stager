import { useCallback, useEffect, useState } from "react";
import { Button, Container, Grid, makeStyles, Tooltip, Typography } from "@material-ui/core";
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
    DataEntryFields,
    DataEntryRow,
    DataEntryRowDNAOptional,
    DataEntryRowDNARequired,
    DataEntryRowRNAOptional,
    DataEntryRowRNARequired,
    DataEntryRowSharedOptional,
    DataEntryRowSharedRequired,
    Family,
    Participant,
    UnlinkedFile,
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
    submitButton: {
        width: "250px",
    },
}));

/*
    create an object with all possible data entry fields
    column filters will determine which rows are displayable
    `hidden` attribute on column config will determine whether col appears in table or in hidden list
*/
export const createEmptyRow = (): DataEntryRow => ({
    fields: {
        ...new DataEntryRowSharedRequired(),
        ...new DataEntryRowSharedOptional(),
        ...new DataEntryRowRNARequired(),
        ...new DataEntryRowRNAOptional(),
        ...new DataEntryRowDNARequired(),
        ...new DataEntryRowDNAOptional(),
    },
    meta: {},
});

// widen types so we can check for presence of fields from various classes in the same array w/o typescript complaining
const REQUIRED_DNA_FIELDS: readonly DataEntryField[] = getKeys(new DataEntryRowDNARequired());
const REQUIRED_RNA_FIELDS: readonly DataEntryField[] = getKeys(new DataEntryRowRNARequired());
const REQUIRED_SHARED_FIELDS: readonly DataEntryField[] = getKeys(new DataEntryRowSharedRequired());
const OPTIONAL_DNA_FIELDS: readonly DataEntryField[] = getKeys(new DataEntryRowDNAOptional());
const OPTIONAL_RNA_FIELDS: readonly DataEntryField[] = getKeys(new DataEntryRowRNAOptional());
const OPTIONAL_SHARED_FIELDS: readonly DataEntryField[] = getKeys(new DataEntryRowSharedOptional());

export const DNA_ONLY_FIELDS: readonly DataEntryField[] = [
    ...REQUIRED_DNA_FIELDS,
    ...OPTIONAL_DNA_FIELDS,
];

export const RNA_ONLY_FIELDS: readonly DataEntryField[] = [
    ...REQUIRED_RNA_FIELDS,
    ...OPTIONAL_RNA_FIELDS,
];

const ALL_DNA_FIELDS: readonly DataEntryField[] = [
    ...DNA_ONLY_FIELDS,
    ...REQUIRED_SHARED_FIELDS,
    ...OPTIONAL_SHARED_FIELDS,
];

const ALL_RNA_FIELDS: readonly DataEntryField[] = [
    ...RNA_ONLY_FIELDS,
    ...REQUIRED_SHARED_FIELDS,
    ...OPTIONAL_SHARED_FIELDS,
];

export const ALL_OPTIONAL_FIELDS: readonly DataEntryField[] = [
    ...OPTIONAL_DNA_FIELDS,
    ...OPTIONAL_RNA_FIELDS,
    ...OPTIONAL_SHARED_FIELDS,
];

/*
    get array of all data entry fields
*/
const getDataEntryFieldList = () => getKeys(createEmptyRow().fields);

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
            .filter(field => !RNA_ONLY_FIELDS.includes(field))
            .map(field => ({
                field,
                hidden:
                    !defaultVisible.includes(field) &&
                    ![...REQUIRED_DNA_FIELDS, ...REQUIRED_SHARED_FIELDS].includes(field),
                required: [...REQUIRED_DNA_FIELDS, ...REQUIRED_SHARED_FIELDS].includes(field),
                title: formatFieldToTitle(field),
            }))
    );
};

/* get a list of required fields for the row */
const getRequiredFields = (row: DataEntryRow) => [
    ...REQUIRED_SHARED_FIELDS,
    ...(row.fields.dataset_type === "RRS" ? REQUIRED_RNA_FIELDS : REQUIRED_DNA_FIELDS),
];

/* add columns to the current list after a specified field */
const insertColumnsAfter = (
    field: DataEntryField,
    columns: DataEntryColumnConfig[],
    columnsToAdd: DataEntryColumnConfig[]
) => {
    if (!columns.find(c => c.field === field)) {
        throw new Error(`${field} does not exist!`);
    }
    return columns.flatMap(col => (col.field === field ? [col, ...columnsToAdd] : col));
};

/* possible combinations of columns */
type LayoutType = "RNA" | "DNA" | "MIXED";

/* return the current column layout type */
const getColumnLayoutType = (columns: DataEntryColumnConfig[]): LayoutType => {
    if (columns.filter(c => ALL_RNA_FIELDS.includes(c.field)).length === columns.length) {
        return "RNA";
    } else if (columns.filter(c => ALL_DNA_FIELDS.includes(c.field)).length === columns.length) {
        return "DNA";
    } else return "MIXED";
};

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
    const [fieldsMissing, setFieldsMissing] = useState(false);
    const [validationErrorMessage, setValidationErrorMessage] = useState("");
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
            setColumns(makeFreshColumns(["notes", "sex", "linked_files", "vcf_available"]));
        }
    }, [columns, data, setColumns]);

    /* update which columns the user is allowed to see */
    const updateColumns = useCallback(() => {
        const dataType = getDataType(data);
        if (columns) {
            const columnLayoutType = getColumnLayoutType(columns);
            if (columnLayoutType !== dataType) {
                switch (`${columnLayoutType}->${dataType}`) {
                    case "DNA->RNA":
                        setColumns(removeDNACols(addRNACols(columns)));
                        break;
                    case "RNA->DNA":
                        setColumns(removeRNACols(addDNACols(columns)));
                        break;
                    case "RNA->MIXED":
                        setColumns(addDNACols(columns));
                        break;
                    case "MIXED->RNA":
                        setColumns(removeDNACols(columns));
                        break;
                    case "DNA->MIXED":
                        setColumns(addRNACols(columns));
                        break;
                    case "MIXED->DNA":
                        setColumns(removeRNACols(columns));
                        break;
                }
            }
        }
    }, [data, columns]);

    const validateData = useCallback(() => {
        if (data) {
            if (currentUser && currentUser.groups.length === 0) {
                setValidationErrorMessage(
                    "Cannot submit. You are not part of any permission groups."
                );
                return;
            }

            // Check selected permission groups
            if (asGroups.length === 0) {
                setValidationErrorMessage("Cannot submit. You must select a permission group.");
                return;
            }

            /* edge-case where a file was flagged as multiplex, added to several rows, then the flag was removed */
            const duplicateFiles = data
                .flatMap(d => d.fields.linked_files)
                .filter(Boolean)
                .filter(
                    (uf, i, orig) =>
                        !uf.multiplexed && orig.findIndex(iuf => iuf.path === uf.path) !== i
                )
                .map(uf => uf.path)
                .join(",");

            if (duplicateFiles) {
                return setValidationErrorMessage(
                    `The following files are included in more than one row but are not marked as multiplex: ${duplicateFiles}`
                );
            }

            // Checked everything, no problems
            setValidationErrorMessage("");

            const rowsWithMissingFields = new Map<number, Array<DataEntryField>>();

            for (let i = 0; i < data.length; i++) {
                let row = data[i];
                const requiredFields = getRequiredFields(row);
                for (const field of requiredFields) {
                    if (row.meta.participantColumnsDisabled && participantColumns.includes(field))
                        continue;
                    const val = row.fields[field];
                    if ((typeof val === "string" && strIsEmpty(val)) || !val) {
                        if (rowsWithMissingFields.get(i))
                            rowsWithMissingFields.set(
                                i,
                                rowsWithMissingFields.get(i)!.concat(field)
                            );
                        else rowsWithMissingFields.set(i, [field]);
                    }
                }
            }

            if (rowsWithMissingFields.size > 0) {
                return setFieldsMissing(true);
            } else {
                if (fieldsMissing) {
                    setFieldsMissing(false);
                }
            }
        }
    }, [data, fieldsMissing, asGroups.length, currentUser]);

    useEffect(() => {
        sessionStorage.setItem("add-datasets-progress", JSON.stringify(data));
        updateColumns();
        validateData();
    }, [data, updateColumns, validateData]);

    useEffect(() => {
        if (currentUser.groups.length === 1) {
            setAsGroups(currentUser.groups);
        }
    }, [currentUser]);

    /* return the current configuration of column the user is allowed to see */
    const getDataType = (newData: DataEntryRow[] | undefined) => {
        if (newData) {
            if (newData.every(row => row.fields.dataset_type !== "RRS")) {
                return "DNA";
            } else if (newData.every(row => row.fields.dataset_type === "RRS")) {
                return "RNA";
            } else return "MIXED";
        } else return "DNA";
    };

    const removeRNACols = (currCols: DataEntryColumnConfig[]) =>
        currCols.filter(c => ALL_DNA_FIELDS.includes(c.field));

    const removeDNACols = (currCols: DataEntryColumnConfig[]) =>
        currCols.filter(c => ALL_RNA_FIELDS.includes(c.field));

    function onChangeGroups(newGroups: string[]) {
        setAsGroups(newGroups);
    }

    const addDNACols = (currCols: DataEntryColumnConfig[]) =>
        insertColumnsAfter(
            "linked_files",
            currCols,
            DNA_ONLY_FIELDS.map(field => ({
                field,
                hidden: OPTIONAL_DNA_FIELDS.includes(field),
                required: REQUIRED_DNA_FIELDS.includes(field),
                title: snakeCaseToTitle(field),
            }))
        );

    const addRNACols = (currCols: DataEntryColumnConfig[]) =>
        insertColumnsAfter(
            "sequencing_date",
            currCols,
            RNA_ONLY_FIELDS.map(field => ({
                field,
                hidden: OPTIONAL_RNA_FIELDS.includes(field) && field !== "vcf_available",
                required: REQUIRED_RNA_FIELDS.includes(field),
                title: snakeCaseToTitle(field),
            }))
        );

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

    const findParticipant = (
        newValue: string,
        column: string,
        row: DataEntryRow,
        families: Family[]
    ) => {
        let participantCodename: string;
        let familyCodename: string;
        const { fields } = row;
        if (column === "participant_codename" && fields.family_codename !== "") {
            familyCodename = fields.family_codename;
            participantCodename = newValue;
        } else if (column === "family_codename" && fields.participant_codename !== "") {
            familyCodename = newValue;
            participantCodename = fields.participant_codename;
        }
        const family = families.find(fam => fam.family_codename === familyCodename);
        return family
            ? family.participants.find(
                  currParticipant => currParticipant.participant_codename === participantCodename
              )
            : undefined;
    };

    /* add a new value to the form data */
    const updateData = (
        row: DataEntryRow,
        newValue: string | boolean | UnlinkedFile[],
        col: DataEntryColumnConfig,
        families: Family[]
    ) => {
        let newRow: DataEntryRow;
        if (
            ["participant_codename", "family_codename"].includes(col.field) &&
            typeof newValue === "string"
        ) {
            // autopopulate row
            // pre-existing rows are disabled, even if the values are wrong
            const participant = findParticipant(newValue, col.field, row, families);
            if (participant) {
                const newFields = {
                    ...participantColumns.reduce(
                        (row, currCol) => ({
                            ...row,
                            [currCol]: participant[currCol as keyof Participant],
                        }),
                        { ...row.fields }
                    ),
                    [col.field]: newValue,
                };
                newRow = {
                    fields: newFields,
                    meta: { participantColumnsDisabled: true },
                };
            } else {
                newRow = {
                    fields: {
                        ...row.fields,
                        [col.field]: newValue,
                    },
                    meta: { participantColumnsDisabled: false },
                };
            }
        } else {
            newRow = { fields: { ...row.fields, [col.field]: newValue }, meta: row.meta };
        }

        if (
            col.field === "dataset_type" &&
            newValue !== row.fields[col.field] &&
            typeof newValue === "string"
        ) {
            newRow.fields = removeInapplicableFields(newValue, newRow.fields);
        }

        return newRow;
    };

    /* if user has changed the dataset type of a row, null out fields that no longer apply */
    const removeInapplicableFields = (type: string, data: DataEntryFields) => {
        if (type === "RRS") {
            return nullifyFields(data, DNA_ONLY_FIELDS);
        } else {
            return nullifyFields(data, RNA_ONLY_FIELDS);
        }
    };

    const nullifyFields = (data: DataEntryFields, fields: readonly DataEntryField[]) =>
        Object.entries(data)
            .map(([k, v]) => ({ [k]: fields.includes(k as DataEntryField) ? null : v }))
            .reduce((acc, curr) => ({ ...acc, ...curr }), {}) as DataEntryFields;

    /* main handler for updating form data */
    const handleDataChange = (
        newValue: string | boolean | UnlinkedFile[],
        rowIndex: number,
        col: DataEntryColumnConfig,
        families: Family[]
    ) => {
        const newData = data?.map((d, i) =>
            i === rowIndex ? updateData(d, newValue, col, families) : d
        );
        setData(newData);
    };

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
                    setData={setData}
                    setGroups={onChangeGroups}
                />
            </Container>
            <Tooltip title={setValidationErrorMessage} interactive>
                <Grid container alignItems="center" direction="column">
                    <Button
                        disabled={!!validationErrorMessage || fieldsMissing}
                        className={classes.submitButton}
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<CloudUpload />}
                        onClick={() => setOpen(true)}
                    >
                        Submit
                    </Button>
                    {validationErrorMessage && (
                        <Typography color="error">{validationErrorMessage}</Typography>
                    )}
                </Grid>
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
