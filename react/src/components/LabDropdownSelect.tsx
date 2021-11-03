import { useEffect, useState } from "react";
import {
    FormControl,
    InputLabel,
    ListItemText,
    makeStyles,
    MenuItem,
    Select,
    Typography,
} from "@material-ui/core";
import { LabSelection } from "../typings";

const useStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
        justifySelf: "center",
    },
    formControl: {
        minWidth: 240,
        maxWidth: 300,
        margin: theme.spacing(1),
    },
}));

async function getLabs(): Promise<LabSelection[]> {
    // TODO: replace this
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

    const setDefaultLab = (options: LabSelection[]) => {
        const lastSelection: string | null = localStorage.getItem("lab");
        let selectionIndex = 0;
        if (lastSelection) {
            selectionIndex = options.findIndex(selection => selection.name === lastSelection);
        }

        setSelected(options[selectionIndex].name);
        props.onSelect(options[selectionIndex]);
    };

    useEffect(() => {
        getLabs()
            .then((labOptions: LabSelection[]) => {
                labOptions = [{ name: "Select a lab", endpoint: null }, ...labOptions]; // add default value
                setOptionsList(labOptions);
                setDefaultLab(labOptions);
            })
            .catch(err => console.error(err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return optionsList.length > 0 ? (
        <div className={classes.root}>
            <FormControl fullWidth className={classes.formControl}>
                <Typography variant="h3">
                    <InputLabel id="login-lab-select-label">Select Lab</InputLabel>
                </Typography>
                <Select
                    labelId="login-lab-select-label"
                    id="login-lab-select"
                    value={selected}
                    label="Lab"
                    onChange={ev => {
                        optionsList.forEach(v => {
                            if (v.name === ev.target.value) {
                                setSelected(v.name);
                                localStorage.setItem("lab", v.name);
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
