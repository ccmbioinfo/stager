import React, { useEffect, useState } from "react";
import {
    Button,
    Chip,
    CircularProgress,
    Container,
    Grid,
    makeStyles,
    Typography,
} from "@material-ui/core";
import { green } from "@material-ui/core/colors";
import { useSnackbar } from "notistack";
import { QueryKey } from "react-query";
import { useQueryClient } from "react-query";
import { useDownloadCsv } from "../../hooks";
import { GeneAlias } from "../../typings";
import GeneAutocomplete from "./Autocomplete";
import { CardButton } from "./CardButton";

interface SearchVariantsPageProps {}

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
    chip: {
        margin: theme.spacing(1),
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
    },
    wrapper: {
        margin: theme.spacing(1, 0.5, 1, 1),
        // minWidth: 166,
        justifyContent: "space-between",
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    buttonProgress: {
        color: green[500],
        position: "absolute",
        // marginLeft: 50,
        top: "50%",
        left: "50%",
        marginLeft: -12,
        marginTop: -12,
    },
}));

const GET_VARIANTS_SUMMARY_URL = "/api/summary/variants";

const GET_VARIANTS_BY_PARTICIPANTS_SUMMARY_URL = "/api/summary/participants";

const SearchVariantsPage: React.FC<SearchVariantsPageProps> = () => {
    const loadPanel = () => {
        const stored = localStorage.getItem("gene-panel");
        if (stored === null) return [];
        try {
            const panel = JSON.parse(stored);
            if (Array.isArray(panel)) {
                return panel;
            } else {
                console.warn("Invalid localStorage format for `gene-panel`.", stored);
                localStorage.removeItem("gene-panel");
                return [];
            }
        } catch (error) {
            console.warn("Invalid localStorage format for `gene-panel`.", stored);
            localStorage.removeItem("gene-panel");
            return [];
        }
    };

    const { enqueueSnackbar } = useSnackbar();

    const queryClient = useQueryClient();
    const queryCache = queryClient.getQueryCache();

    const [selectedGenes, setSelectedGenes] = useState<GeneAlias[]>(loadPanel());
    const [downloadType, setDownloadType] = useState<"variant" | "participant">("variant");
    const [loading, setLoading] = useState(false);

    const toggleGeneSelection = (gene: GeneAlias) => {
        const updated = !selectedGenes.includes(gene)
            ? selectedGenes.concat(gene)
            : selectedGenes.filter(g => g !== gene);
        setSelectedGenes(updated);
        localStorage.setItem("gene-panel", JSON.stringify(updated));
    };

    const onError = async (response: Response) => {
        setLoading(false);
        try {
            const payload = await response.json();
            enqueueSnackbar(`${response.status} ${response.statusText}: ${payload.error}`);
        } catch (error) {
            console.error(error, response);
            enqueueSnackbar(`${response.status} ${response.statusText}`);
        }
    };

    const onSuccess = () => {
        setLoading(false);
    };

    const downloadVariantwiseCsv = useDownloadCsv(GET_VARIANTS_SUMMARY_URL, {
        onError,
        onSuccess,
    });

    const downloadParticipantwiseCsv = useDownloadCsv(GET_VARIANTS_BY_PARTICIPANTS_SUMMARY_URL, {
        onError,
        onSuccess,
    });

    const downloadCsv = () => {
        const panel = selectedGenes.map(gene => `ENSG${gene.ensembl_id}`).join(",");

        /*
            In react-query, the onSuccess callback is not triggered when the query is returning data from cache. 
            QueryCache can be used to find whether a specific query key has already existed in cache and can be immediately returned.
            If so, the loading indicator is deactivated. 
        */

        const key: QueryKey = [
            {
                panel: panel,
            },
            `csv`,
            `/api/summary/${downloadType}s`,
        ];

        const data = queryCache.find(key);
        if (data === undefined && !loading) {
            setLoading(true);
        }
        if (downloadType === "participant") {
            return downloadParticipantwiseCsv({ panel, search_by: "gene" });
        }
        return downloadVariantwiseCsv({ panel, search_by: "gene" });
    };

    useEffect(() => {
        document.title = `Search Variants | ${process.env.REACT_APP_NAME}`;
    }, []);

    const classes = useStyles();

    const disableControls = !selectedGenes.length;

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <Grid spacing={3} direction="column" container alignItems="center">
                    <Grid item xs={12}>
                        <Typography align="center" variant="h3">
                            Search for Variants by Gene
                        </Typography>
                    </Grid>
                    <Grid
                        container
                        justify="center"
                        alignItems="center"
                        spacing={1}
                        item
                        xs={12}
                        md={6}
                        wrap="nowrap"
                    >
                        <Grid item xs={12}>
                            <GeneAutocomplete fullWidth={true} onSelect={toggleGeneSelection} />
                        </Grid>
                        <div className={classes.wrapper}>
                            <Button
                                disabled={disableControls || loading}
                                onClick={downloadCsv}
                                size="large"
                                variant="contained"
                                color="primary"
                            >
                                Download
                            </Button>
                            {loading && (
                                <CircularProgress size={24} className={classes.buttonProgress} />
                            )}
                        </div>
                    </Grid>
                    <Grid container item xs={12} md={6} spacing={1}>
                        <Grid container item xs={6}>
                            <CardButton
                                title="Variant-wise Report"
                                description="Each row is identified by a unique variant. If multiple participants have the same variant, column fields such as codename, depth, or zygosity are concatenated into a single list -- delimited by ';' -- for that variant's row."
                                selected={downloadType === "variant"}
                                onClick={() => setDownloadType("variant")}
                                disabled={disableControls}
                            />
                        </Grid>
                        <Grid container item xs={6}>
                            <CardButton
                                title="Participant-wise Report"
                                description="Each row is identified by a participant's variant. Every column field is a single value, and variants may occur more than once if more than one participant has that variant."
                                selected={downloadType === "participant"}
                                onClick={() => setDownloadType("participant")}
                                disabled={disableControls}
                            />
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} md={6} wrap="nowrap">
                        <Grid item>
                            {!!selectedGenes.length && <Typography>Selected Genes</Typography>}
                        </Grid>
                        <Grid item container xs={12}>
                            {selectedGenes.map(g => (
                                <Grid item key={g.name}>
                                    <Chip
                                        className={classes.chip}
                                        label={
                                            <>
                                                <b>{g.name}</b>
                                                <br />
                                                <small>
                                                    ENSG{`${g.ensembl_id}`.padStart(11, "0")}
                                                </small>
                                            </>
                                        }
                                        onDelete={() => toggleGeneSelection(g)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
};

export default SearchVariantsPage;
