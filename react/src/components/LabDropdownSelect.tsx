import { useEffect, useState } from "react";
import {
    FormControl,
    InputLabel,
    ListItemText,
    makeStyles,
    MenuItem,
    Select,
} from "@material-ui/core";
import { LabSelection } from "../typings";

const useStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
        justifySelf: "center",
    },
    header: {
        fontSize: 16,
    },
    formControl: {
        minWidth: 240,
        maxWidth: 300,
        margin: theme.spacing(1),
    },
}));

async function getLabs(): Promise<LabSelection[]> {
    // TODO: update this when API call is ready
    const DUMMY_LAB_OPTIONS: LabSelection[] = [
        { name: "Lab 1", endpoint: "lab1.stager.ca" },
        { name: "Lab 2", endpoint: "lab2.stager.ca" },
        { name: "Lab 3", endpoint: "lab3.stager.ca" },
        { name: "Lab 4", endpoint: "lab4.stager.ca" },
    ];

    return DUMMY_LAB_OPTIONS;
}

export default function LabDropdownSelect(props: {
    onSelect: (selectedItem: LabSelection) => void;
}) {
    const classes = useStyles();
    const [selected, setSelected] = useState<string>("");
    const [optionsList, setOptionsList] = useState<LabSelection[]>([]);

    useEffect(() => {
        getLabs()
            .then((labOptions: LabSelection[]) => {
                setOptionsList(labOptions);
                if (labOptions.length > 0) {
                    setSelected(labOptions[0].name);
                    props.onSelect(labOptions[0]);
                }
            })
            .catch(err => console.error(err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return optionsList.length > 0 ? (
        <div className={classes.root}>
            <FormControl fullWidth className={classes.formControl}>
                <InputLabel className={classes.header} id="login-lab-select-label">
                    Select Lab
                </InputLabel>
                <Select
                    labelId="login-lab-select-label"
                    id="login-lab-select"
                    value={selected}
                    label="Lab"
                    onChange={ev => {
                        optionsList.forEach(v => {
                            if (v.name === ev.target.value) {
                                setSelected(v.name);
                                props.onSelect(v);
                            }
                        });
                    }}
                >
                    {optionsList.map((v, i) => (
                        <MenuItem value={v.name} key={i}>
                            <ListItemText primary={v.name} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    ) : null;
}
