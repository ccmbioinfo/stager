import React from "react";
import {
    Checkbox,
    FormControl,
    Input,
    InputLabel,
    ListItemText,
    makeStyles,
    MenuItem,
    Select,
} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
    },
    formControl: {
        minWidth: 240,
        maxWidth: 300,
        margin: theme.spacing(1),
    },
}));

/**
 * A controlled multiselect component for selecting permission group codes from
 * a provided list of codes.
 */
export default function GroupDropdownSelect(props: {
    allGroupCodes: string[];
    selectedGroupCodes: string[];
    onChange: (selectedCodes: string[]) => void;
    disabled?: boolean;
}) {
    const classes = useStyles();
    function handleChange(event: React.ChangeEvent<{ value: unknown }>) {
        // material-ui docs do the typing this way for some reason
        props.onChange(event.target.value as string[]);
    }

    return (
        <div className={classes.root}>
            <FormControl disabled={props.disabled} className={classes.formControl}>
                <InputLabel id="permission-group-select-label">Permission Groups</InputLabel>
                <Select
                    labelId="permission-group-select-label"
                    id="permission-group-select"
                    fullWidth
                    multiple
                    value={props.selectedGroupCodes}
                    onChange={handleChange}
                    input={<Input />}
                    renderValue={selected =>
                        (selected as string[]).map(code => code.toUpperCase()).join(", ")
                    }
                >
                    {props.allGroupCodes.map(code => (
                        <MenuItem key={code} value={code}>
                            <Checkbox checked={props.selectedGroupCodes.indexOf(code) > -1} />
                            <ListItemText primary={code.toUpperCase()} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
}
