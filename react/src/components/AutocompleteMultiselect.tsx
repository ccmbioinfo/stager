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
                }
                if (onInputChange) {
                    //if options are filtered dynamically
                    onInputChange(value);
                }
            }}
            disableClearable={true}
            disableCloseOnSelect
            onChange={(event, selectedOptions, reason) => {
                //prevent keypress events from propagating to parent listeners
                event.stopPropagation();
                if (selectedOptions && ["select-option", "remove-option"].includes(reason)) {
                    onSelect(selectedOptions);
                    setInputValue("");
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
        />
    );
}
