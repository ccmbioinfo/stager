import { useState } from "react";
import {
    Box,
    IconButton,
    Link,
    makeStyles,
    Menu,
    MenuItem,
    Switch,
    Toolbar,
    Tooltip,
    Typography,
} from "@material-ui/core";
import { CloudDownload, CloudUpload, OpenInNew, Restore, ViewColumn } from "@material-ui/icons";
import { GroupDropdownSelect } from "../../components";
import { DataEntryColumnConfig, DataEntryField } from "../../typings";
import UploadDialog from "./UploadDialog";

/**
 * A special action button which opens a menu for showing / hiding
 * optional columns.
 */
function DataEntryColumnMenuAction(props: {
    columns: DataEntryColumnConfig[];
    onClick: (field: DataEntryField) => void;
}) {
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);

    return (
        <>
            <Tooltip title="Show/Hide columns">
                <IconButton onClick={event => setAnchor(event.currentTarget)}>
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
export default function DataEntryToolbar(props: {
    handleColumnAction: (field: DataEntryField) => void;
    handleResetAction: () => void;
    handleCSVTemplateAction: () => void;
    columns: DataEntryColumnConfig[];
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
                    <Link href={process.env.REACT_APP_MINIO_URL} target="_blank" rel="noreferrer">
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
