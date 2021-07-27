import React, { useMemo, useState } from "react";
import {
    Button,
    CircularProgress,
    Divider,
    InputAdornment,
    makeStyles,
    Menu,
    MenuItem,
    OutlinedInput,
    Theme,
    useTheme,
} from "@material-ui/core";
import { ArrowDropDown, Check, Search } from "@material-ui/icons";
import { Autocomplete } from "@material-ui/lab";
import { snakeCaseToTitle } from "../../functions";
import { useGenesQuery } from "../../hooks/genes";
import { GeneAlias } from "../../typings";

export type SearchCategory = "genes" | "regions" | "positions" | "rsids";
const searchCategoryMap: Map<SearchCategory, string> = new Map([
    ["genes", "Gene"],
    ["regions", "Region"],
    ["positions", "Variant Position"],
    ["rsids", "refSNP ID"],
]);

interface GeneAutocompleteProps {
    searchCategory: SearchCategory;
    fullWidth?: boolean;
    onSearch?: () => void;
    onSelect: (result: GeneAlias | string) => void;
    onCategoryChange: (newCategory: SearchCategory) => void;
    selected: (GeneAlias | string)[];
}

interface SearchCategorySelectProps {
    value: SearchCategory;
    onSelect: (value: SearchCategory) => void;
}

const useSelectStyles = makeStyles(theme => ({
    check: {
        marginLeft: theme.spacing(2),
    },
    divider: {
        margin: theme.spacing(0, 1),
    },
}));

function SearchCategorySelect(props: SearchCategorySelectProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const classes = useSelectStyles();

    return (
        <>
            <Button onClick={event => setAnchorEl(event.currentTarget)}>
                {snakeCaseToTitle(props.value)}
                <ArrowDropDown />
            </Button>
            <Divider className={classes.divider} orientation="vertical" flexItem />
            <Menu
                anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
                transformOrigin={{ horizontal: "left", vertical: "top" }}
                anchorEl={anchorEl}
                keepMounted
                open={!!anchorEl}
                onClose={() => setAnchorEl(null)}
                variant="menu"
                getContentAnchorEl={null}
            >
                {Array.from(searchCategoryMap, ([category, title]) => (
                    <MenuItem
                        key={category}
                        onClick={() => props.onSelect(category)}
                        selected={props.value === category}
                    >
                        {title}
                        <div style={{ flex: 1 }} />
                        <Check
                            className={classes.check}
                            style={{ visibility: props.value === category ? "inherit" : "hidden" }}
                        />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}

interface GeneAutocompleteOption {
    label: string;
    value: string | GeneAlias;
}

const useStyles = makeStyles<Theme, GeneAutocompleteProps>(theme => ({
    adornment: {
        margin: theme.spacing(0, 1),
    },
    // popper: {
    //     display: props => (props.searchCategory !== "gene" ? "" : "none"),
    // },
}));

// Return whether the provided search string is valid for the given category
// except for genes
function validateSearch(
    searchCategory: SearchCategory,
    search: string,
    selected: (GeneAlias | string)[]
) {
    let validFormat = false;
    switch (searchCategory) {
        case "regions":
            validFormat = /^chr[\da-zA-Z]+:[\d]+-[\d]+$/g.test(search);
            break;
        case "positions":
            validFormat = /^chr[\da-zA-Z]+:[\d]+$/g.test(search);
            break;
        case "rsids":
            validFormat = /^rs[\d]+$/g.test(search);
            break;
        default:
            return false;
    }
    return validFormat && !selected.includes(search);
}

const GeneAutocomplete: React.FC<GeneAutocompleteProps> = (props: GeneAutocompleteProps) => {
    const [search, setSearch] = useState<string>("");
    const [selectedValue, setSelectedValue] = useState<GeneAutocompleteOption>();
    const classes = useStyles(props);

    const placeholderText = useMemo(() => {
        switch (props.searchCategory) {
            case "genes":
                return "Search by Gene Name (eg. APOE, VEGFA)";
            case "regions":
                return "Search by Region (eg. chr1:11111-22222, chrX:333333-444444)";
            case "positions":
                return "Search by Position (eg. chr1:11111, chrX:3333333)";
            case "rsids":
                return "Search by refSNP ID (eg. rs55555555)";
            default:
                console.error("Unexpected search category");
                return "";
        }
    }, [props.searchCategory]);

    const { data: results, isFetching } = useGenesQuery(
        {
            search,
        },
        search.length > 2 && props.searchCategory === "genes"
    );

    const theme = useTheme();

    const options: GeneAutocompleteOption[] =
        props.searchCategory === "genes"
            ? results?.data.filter(d => d.name).map(d => ({ label: d.name, value: d })) || []
            : validateSearch(props.searchCategory, search, props.selected)
            ? [{ label: search, value: search }]
            : [];

    const noResultsText =
        props.searchCategory === "genes"
            ? "No Results"
            : props.selected.includes(search)
            ? `${search} already selected`
            : "Invalid Format";

    return (
        <Autocomplete
            disableClearable
            forcePopupIcon={false}
            autoComplete
            clearOnEscape
            fullWidth={props.fullWidth}
            getOptionSelected={(option, value) => option.value === value.value}
            getOptionLabel={option => option.label || ""}
            includeInputInList={true}
            inputValue={search}
            loading={isFetching}
            noOptionsText={noResultsText}
            options={options}
            onInputChange={(event, newInputValue, reason) => {
                if (reason === "reset" || reason === "clear") {
                    setSearch("");
                } else if (reason === "input") {
                    setSearch(newInputValue);
                    if (props.onSearch) {
                        props.onSearch();
                    }
                }
            }}
            onChange={(event, selectedValue, reason) => {
                if (search && reason !== "clear" && selectedValue) {
                    if (typeof selectedValue === "string") {
                        props.onSelect(selectedValue);
                    } else {
                        props.onSelect(selectedValue.value);
                    }
                    //persisting selected value will lead to option mismatch warnings
                    setSelectedValue(undefined);
                }
            }}
            renderInput={params => {
                const { InputLabelProps, InputProps, ...rest } = params;
                return (
                    <OutlinedInput
                        placeholder={placeholderText}
                        {...rest}
                        {...InputProps}
                        startAdornment={
                            <SearchCategorySelect
                                value={props.searchCategory}
                                onSelect={props.onCategoryChange}
                            />
                        }
                        endAdornment={
                            <InputAdornment position="end">
                                <CircularProgress
                                    className={classes.adornment}
                                    size={16}
                                    style={{ visibility: isFetching ? "inherit" : "hidden" }}
                                />
                                <Search
                                    className={classes.adornment}
                                    fontSize="small"
                                    htmlColor={theme.palette.grey[600]}
                                />
                            </InputAdornment>
                        }
                    />
                );
            }}
            //we have to control component in order to *prevent* selection persistence
            value={selectedValue || undefined}
        />
    );
};

export default GeneAutocomplete;
