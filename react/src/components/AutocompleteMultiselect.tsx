import { useState } from "react";
import { TextField } from "@material-ui/core";
import {
    Autocomplete,
    AutocompleteClassKey,
    AutocompleteProps,
    createFilterOptions,
} from "@material-ui/lab";
import { StyledComponentProps } from "@material-ui/styles";

interface AutocompleteMultiselectProps<T> {
    inputLabel: string;
    limit: number;
    onInputChange?: (input: string) => void;
    onSelect: (newValue: T[]) => void;
    options: T[];
    renderTags: AutocompleteProps<T, true, any, any>["renderTags"];
    selectedValues: T[];
    classes?: StyledComponentProps<AutocompleteClassKey>["classes"];
    uniqueLabelPath: string;
    noOptionsText?: string;
}

export default function AutocompleteMultiselect<T extends Record<string, any>>({
    classes = {},
    inputLabel,
    limit,
    onInputChange,
    onSelect,
    options,
    renderTags,
    selectedValues,
    uniqueLabelPath,
    noOptionsText,
}: AutocompleteMultiselectProps<T>) {
    const [inputValue, setInputValue] = useState("");

    return (
        <Autocomplete
            autoComplete
            classes={classes}
            inputValue={inputValue}
            onInputChange={(_, value, reason) => {
                if (reason === "input") {
                    setInputValue(value);
                    if (onInputChange) {
                        //if options are filtered dynamically
                        onInputChange(value);
                    }
                }
            }}
            disableClearable={true}
            disableCloseOnSelect
            onChange={(event, selectedOptions, reason, details) => {
                //prevent keypress events from propagating to parent listeners
                event.stopPropagation();
                if (selectedOptions && ["select-option", "remove-option"].includes(reason)) {
                    const latestOption = selectedOptions[selectedOptions.length - 1];
                    // If the option chosen is a folder, change the input value instead of selecting it as an option.
                    if (latestOption.path?.endsWith("/")) {
                        setInputValue(latestOption.path);
                        if (onInputChange) {
                            onInputChange(latestOption.path);
                        }
                    } else {
                        onSelect(selectedOptions);
                        setInputValue("");
                    }
                }
            }}
            renderOption={option => <span>{option[uniqueLabelPath]}</span>}
            renderTags={renderTags}
            getOptionSelected={(option, value) =>
                option[uniqueLabelPath] === value[uniqueLabelPath]
            }
            options={options}
            filterOptions={createFilterOptions({
                limit,
                stringify: o => o[uniqueLabelPath],
            })}
            filterSelectedOptions={true}
            getOptionLabel={option => option[uniqueLabelPath]}
            renderInput={params => <TextField {...params} label={inputLabel} variant="outlined" />}
            multiple
            value={selectedValues}
            noOptionsText={noOptionsText || "No options found. Please enter another search phrase."}
        />
    );
}
