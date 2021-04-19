import React, { useEffect, useState } from "react";
import {
    Box,
    IconButton,
    makeStyles,
    Menu,
    MenuItem,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Toolbar,
    Tooltip,
    Typography,
    Button,
    Link,
} from "@material-ui/core";
import {
    CloudUpload,
    Delete,
    LibraryAdd,
    ViewColumn,
    Add,
    Restore,
    OpenInNew,
    CloudDownload,
} from "@material-ui/icons";
import { DataEntryHeader, DataEntryRow, DataEntryRowOptional, Family, Option } from "../../typings";
import { getOptions as _getOptions, getColumns, participantColumns, objArrayToCSV } from "./utils";
import { DataEntryActionCell, DataEntryCell, HeaderCell } from "./TableCells";
import UploadDialog from "./UploadDialog";
import { getDataEntryHeaders, createEmptyRows, setProp } from "../../functions";
import { GroupDropdownSelect } from "../../components";
import {
    useEnumsQuery,
    useFamiliesQuery,
    useInstitutionsQuery,
    useUnlinkedFilesQuery,
} from "../../hooks";
import dayjs from "dayjs";

export interface DataEntryTableProps {
    data: DataEntryRow[];
    onChange: (data: DataEntryRow[]) => void;
    allGroups: string[]; // this user's permission groups
    groups: string[]; // selected groups to submit as
    setGroups: (selectedGroups: string[]) => void;
}

const useTableStyles = makeStyles(theme => ({
    buttonCell: {
        padding: 0,
    },
    newRowButton: {
        width: "100%",
    },
}));

const fallbackColumns = ["notes", "sex", "linked_files", "sequencing_date"];

function getEnvColumns(): Array<keyof DataEntryRowOptional> {
    const envCols = process.env.REACT_APP_DEFAULT_OPTIONAL_COLUMNS;
    if (envCols !== undefined) {
        const validFields = getDataEntryHeaders().optional;
        const envFields = envCols.split(",");
        const usableFields =
            process.env.NODE_ENV === "development"
                ? envFields.filter(field => !!validFields.find(valid => valid === field))
                : envFields;
        return usableFields as Array<keyof DataEntryRowOptional>;
    } else {
        return [];
    }
}

function getDefaultColumns(fallbackColumns: string[]) {
    const storedDefaults = window.localStorage.getItem("data-entry-default-columns");
    let tempCols = fallbackColumns;
    const envCols = getEnvColumns();

    if (storedDefaults !== null) {
        // User already has stored preferences
        tempCols = JSON.parse(storedDefaults);
    } else if (envCols.length > 0) {
        // No preferences, use .env
        tempCols = envCols;
    } else {
        // No .env, use fallback columns
        window.localStorage.setItem("data-entry-default-columns", JSON.stringify(tempCols));
    }
    return tempCols;
}

function findParticipant(newValue: string, column: string, row: DataEntryRow, families: Family[]) {
    let participantCodename: string;
    let familyCodename: string;
    if (column === "participant_codename" && row.family_codename !== "") {
        familyCodename = row.family_codename;
        participantCodename = newValue;
    } else if (column === "family_codename" && row.participant_codename !== "") {
        familyCodename = newValue;
        participantCodename = row.participant_codename;
    }
    const family = families.find(fam => fam.family_codename === familyCodename);
    return family
        ? family.participants.find(
              currParticipant => currParticipant.participant_codename === participantCodename
          )
        : undefined;
}

export default function DataEntryTable(props: DataEntryTableProps) {
    const classes = useTableStyles();

    const columns = getColumns("required");
    const RNASeqCols = getColumns("RNASeq");

    function getOptionalHeaders() {
        const defaults = getDefaultColumns(fallbackColumns);
        return getColumns("optional").map(header => ({
            ...header,
            hidden: !defaults.includes(header.field),
        }));
    }

    const [optionals, setOptionals] = useState<DataEntryHeader[]>(getOptionalHeaders());

    const filesQuery = useUnlinkedFilesQuery();
    const [files, setFiles] = useState<string[]>([]);
    const familyResult = useFamiliesQuery();
    const families = familyResult.data || [];
    const institutionResult = useInstitutionsQuery();
    const institutions = institutionResult.data || [];
    const { data: enums } = useEnumsQuery();
    const [showRNA, setShowRNA] = useState<boolean>(false);

    useEffect(() => {
        if (filesQuery.isSuccess) setFiles(filesQuery.data);
    }, [filesQuery]);

    function onEdit(
        newValue: string | boolean | string[],
        rowIndex: number,
        col: DataEntryHeader,
        autopopulate?: boolean
    ) {
        if (col.field === "dataset_type" && newValue === "RRS") {
            setShowRNA(true);
        } else if (col.field === "linked_files") {
            // Remove the new values from the list of unlinked files to prevent reuse
            // Readd the previous values that are not selected if there was one since it is available again
            const notReselectedOldValue = props.data[rowIndex].linked_files?.filter(
                oldValue => (newValue as string[]).find(value => oldValue === value) === undefined
            );
            const removeNewValue = files.filter(
                file => (newValue as string[]).find(value => file === value) === undefined
            );
            setFiles(
                notReselectedOldValue
                    ? [...notReselectedOldValue, ...removeNewValue].sort()
                    : removeNewValue
            );
        }
        const newRows = props.data.map((value, index) => {
            if (autopopulate && index === rowIndex) {
                // autopopulate row
                // pre-existing rows are disabled, even if the values are wrong
                const participant = findParticipant(newValue as string, col.field, value, families);
                if (participant) {
                    // pre-existing participant
                    return setProp(
                        participantColumns.reduce(
                            (row, currCol) => setProp(row, currCol, participant[currCol]), // reducer
                            setProp({ ...value }, "participantColDisabled", true) // init
                        ),
                        col.field,
                        newValue
                    );
                } else {
                    // No participant found
                    return setProp(
                        setProp({ ...value }, "participantColDisabled", false),
                        col.field,
                        newValue
                    );
                }
            } else if (index === rowIndex) {
                return setProp({ ...value }, col.field, newValue);
            } else {
                return value;
            }
        });
        props.onChange(newRows);
    }

    // Return the options for a given cell based on row, column
    function getOptions(rowIndex: number, col: DataEntryHeader): Option[] {
        return _getOptions(props.data, col, rowIndex, families, enums, files, institutions);
    }

    function toggleHideColumn(colField: keyof DataEntryRow) {
        const newOptionals = optionals.map(value => {
            if (value.field === colField) return { ...value, hidden: !value.hidden };
            return value;
        });
        setOptionals(newOptionals);
        window.localStorage.setItem(
            "data-entry-default-columns",
            JSON.stringify(newOptionals.filter(value => !value.hidden).map(value => value.field))
        );
    }

    function downloadTemplateCSV() {
        const requiredHeaders = columns.map(c => c.field);
        const optionalHeaders = optionals.filter(c => !c.hidden).map(c => c.field);
        const rnaseqHeaders = showRNA ? RNASeqCols.map(c => c.field) : [];
        const headers = requiredHeaders.concat(optionalHeaders).concat(rnaseqHeaders);

        const csv = objArrayToCSV(props.data, headers);
        let hiddenElement = document.createElement("a");
        hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
        hiddenElement.target = "_blank";
        const now = dayjs().format("YYYY-MM-DDThh-mm-ssA");
        hiddenElement.download = `AddDatasets-${now}.csv`;
        hiddenElement.click();
        hiddenElement.remove();
    }

    return (
        <Paper>
            <DataEntryToolbar
                columns={optionals}
                handleColumnAction={toggleHideColumn}
                handleResetAction={() => {
                    window.localStorage.removeItem("data-entry-default-columns");
                    setOptionals(getOptionalHeaders());
                }}
                handleCSVTemplateAction={downloadTemplateCSV}
                allGroups={props.allGroups}
                groups={props.groups}
                setGroups={props.setGroups}
            />
            <TableContainer>
                <Table>
                    <caption>* - Required | ** - Required only if Dataset Type is RRS</caption>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" aria-hidden={true} />
                            <TableCell padding="checkbox" aria-hidden={true} />
                            {columns.map(cell => (
                                <HeaderCell key={cell.field} header={cell.title + "*"} />
                            ))}

                            {optionals.map(
                                cell =>
                                    !cell.hidden && (
                                        <HeaderCell key={cell.field} header={cell.title} />
                                    )
                            )}

                            {showRNA &&
                                RNASeqCols.map(cell => (
                                    <HeaderCell key={cell.field} header={cell.title + "**"} />
                                ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {props.data.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                <DataEntryActionCell
                                    tooltipTitle="Delete row"
                                    icon={<Delete />}
                                    onClick={() =>
                                        props.onChange(
                                            props.data.filter((value, index) => index !== rowIndex)
                                        )
                                    }
                                    disabled={props.data.length === 1}
                                />
                                <DataEntryActionCell
                                    tooltipTitle="Duplicate row"
                                    icon={<LibraryAdd />}
                                    onClick={() =>
                                        props.onChange(
                                            props.data.flatMap((value, index) =>
                                                index === rowIndex
                                                    ? [
                                                          value,
                                                          {
                                                              ...value,
                                                              linked_files: undefined,
                                                          },
                                                      ]
                                                    : value
                                            )
                                        )
                                    }
                                />

                                {columns.map(col => (
                                    <DataEntryCell
                                        row={row}
                                        rowIndex={rowIndex}
                                        col={col}
                                        getOptions={getOptions}
                                        onEdit={(newValue, autocomplete?: boolean) =>
                                            onEdit(newValue, rowIndex, col, autocomplete)
                                        }
                                        key={col.field}
                                        required={!row.participantColDisabled} // not required if pre-filled
                                        disabled={
                                            row.participantColDisabled &&
                                            (participantColumns as string[]).includes(col.field)
                                        }
                                    />
                                ))}
                                {optionals.map(
                                    col =>
                                        !col.hidden && (
                                            <DataEntryCell
                                                row={row}
                                                rowIndex={rowIndex}
                                                col={col}
                                                getOptions={getOptions}
                                                onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                                key={col.field}
                                                disabled={
                                                    row.participantColDisabled &&
                                                    !!participantColumns.find(
                                                        currCol => currCol === col.field
                                                    )
                                                }
                                            />
                                        )
                                )}

                                {showRNA &&
                                    RNASeqCols.map(col => (
                                        <DataEntryCell
                                            row={row}
                                            rowIndex={rowIndex}
                                            col={col}
                                            getOptions={getOptions}
                                            onEdit={newValue => onEdit(newValue, rowIndex, col)}
                                            disabled={row.dataset_type !== "RRS"}
                                            key={col.field}
                                        />
                                    ))}
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell className={classes.buttonCell} colSpan={100}>
                                <Button
                                    className={classes.newRowButton}
                                    variant="contained"
                                    color="default"
                                    disableElevation
                                    disableRipple
                                    startIcon={<Add />}
                                    onClick={() =>
                                        props.onChange(props.data.concat(createEmptyRows(1)))
                                    }
                                >
                                    Add new row
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

const useToolbarStyles = makeStyles(theme => ({
    toolbar: {
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(2),
    },
}));

/**
 * The toolbar for the DataEntryTable, which displays the title and other action
 * buttons that do not depend on specific rows.
 */
function DataEntryToolbar(props: {
    handleColumnAction: (field: keyof DataEntryRow) => void;
    handleResetAction: () => void;
    handleCSVTemplateAction: () => void;
    columns: DataEntryHeader[];
    allGroups: string[]; // this user's groups
    groups: string[]; // selected groups
    setGroups: (selectedGroups: string[]) => void;
}) {
    const classes = useToolbarStyles();
    const [openUpload, setOpenUpload] = useState(false);

    return (
        <>
            <Toolbar className={classes.toolbar}>
                <Box display="flex" flexGrow={1}>
                    <Typography variant="h6">Enter Metadata</Typography>
                </Box>
                <GroupDropdownSelect
                    selectedGroupCodes={props.groups}
                    allGroupCodes={props.allGroups}
                    onChange={props.setGroups}
                    disabled={props.allGroups.length <= 1}
                />
                <Tooltip title="Download Template CSV">
                    <IconButton onClick={props.handleCSVTemplateAction}>
                        <CloudDownload />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Upload CSV">
                    <IconButton onClick={() => setOpenUpload(true)}>
                        <CloudUpload />
                    </IconButton>
                </Tooltip>
                <DataEntryColumnMenuAction
                    columns={props.columns}
                    onClick={props.handleColumnAction}
                />
                <Tooltip title="Reset column defaults">
                    <IconButton onClick={props.handleResetAction}>
                        <Restore />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Go to MinIO">
                    <Link href={process.env.REACT_APP_MINIO_URL} target="_blank">
                        <IconButton>
                            <OpenInNew />
                        </IconButton>
                    </Link>
                </Tooltip>
            </Toolbar>
            <UploadDialog
                open={openUpload}
                onClose={() => setOpenUpload(false)}
                groups={props.groups}
            />
        </>
    );
}

/**
 * A special action button which opens a menu for showing / hiding
 * optional columns.
 */
function DataEntryColumnMenuAction(props: {
    columns: DataEntryHeader[];
    onClick: (field: keyof DataEntryRow) => void;
}) {
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);

    return (
        <>
            <Tooltip title="Show/Hide columns">
                <IconButton
                    onClick={event => {
                        setAnchor(event.currentTarget);
                    }}
                >
                    <ViewColumn />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                keepMounted
                onClose={() => setAnchor(null)}
            >
                {props.columns.map(column => (
                    <MenuItem onClick={() => props.onClick(column.field)} key={column.title}>
                        <Box display="flex" flexGrow={1}>
                            {column.title}
                        </Box>
                        <Switch edge="end" checked={!column.hidden} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
