import React, { useEffect, useState } from "react";
import {
    Button,
    Chip,
    CircularProgress,
    Container,
    Grid,
    makeStyles,
    Paper,
    Typography,
} from "@material-ui/core";
import { green } from "@material-ui/core/colors";
import { Edit } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { QueryKey } from "react-query";
import { useQueryClient } from "react-query";
import { useDownloadCsv, useModalState } from "../../hooks";
import { GeneAlias } from "../../typings";
import GeneAutocomplete, { SearchCategory } from "./Autocomplete";
import { CardButton } from "./CardButton";
import { ReportColumnModal } from "./ReportColumnModal";

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
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
    },
}));

const GET_VARIANTS_SUMMARY_URL = "/api/summary/variants";

const GET_VARIANTS_BY_PARTICIPANTS_SUMMARY_URL = "/api/summary/participants";

// TODO: Get this list from the backend instead
const temporaryListOfReportColumns = [
    "aa_position",
    "alt_allele",
    "alt_depths",
    "burden",
    "cadd_score",
    "chromosome",
    "clinvar",
    "conserved_in_20_mammals",
    "coverage",
    "dataset_id",
    "depth",
    "ensembl_id",
    "ensembl_transcript_id",
    "exac_pli_score",
    "exac_pnull_score",
    "exac_prec_score",
    "exon",
    "family_codename",
    "gene",
    "genotype",
    "gerp_score",
    "gnomad_ac",
    "gnomad_af",
    "gnomad_af_popmax",
    "gnomad_hom",
    "gnomad_link",
    "gnomad_oe_lof_score",
    "gnomad_oe_mis_score",
    "imprinting_expressed_allele",
    "imprinting_status",
    "info",
    "number_of_callers",
    "old_multiallelic",
    "participant_codename",
    "polyphen_score",
    "position",
    "protein_domains",
    "pseudoautosomal",
    "quality",
    "reference_allele",
    "refseq_change",
    "report_ensembl_gene_id",
    "revel_score",
    "rsids",
    "sift_score",
    "spliceai_impact",
    "spliceai_score",
    "uce_100bp",
    "uce_200bp",
    "ucsc_link",
    "variation",
    "vest3_score",
    "zygosity",
];

const SearchVariantsPage: React.FC<SearchVariantsPageProps> = () => {
    const loadSavedArray = (key: string) => {
        const stored = localStorage.getItem(key);
        if (stored === null) return null;
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            } else {
                console.warn(`Invalid localStorage format for '${key}'.`, stored);
                localStorage.removeItem(key);
                return null;
            }
        } catch (error) {
            console.warn(`Invalid localStorage format for '${key}'.`, stored);
            localStorage.removeItem(key);
            return null;
        }
    };

    const { enqueueSnackbar } = useSnackbar();

    const queryClient = useQueryClient();
    const queryCache = queryClient.getQueryCache();

    const [loading, setLoading] = useState(false);
    const [selectedGenes, setSelectedGenes] = useState<GeneAlias[]>(
        loadSavedArray("gene-panel") || []
    );
    const [searchCategory, setSearchCategory] = useState<SearchCategory>("gene");
    const [downloadType, setDownloadType] = useState<"variant" | "participant">("variant");
    const [columns, setColumns] = useState<string[]>(() => {
        const array = loadSavedArray("report-columns");
        if (array) {
            return (array as string[]).filter(col => temporaryListOfReportColumns.includes(col));
        }
        return temporaryListOfReportColumns;
    });
    const columnModal = useModalState(false);

    const updateColumns = (action: React.SetStateAction<string[]>) => {
        if (typeof action === "function") {
            let newColumns: string[] = [];
            const newAction = (prev: string[]) => {
                const columns = action(prev);
                newColumns = columns;
                return columns;
            };
            setColumns(newAction);
            localStorage.setItem("report-columns", JSON.stringify(newColumns));
        } else {
            setColumns(action);
            localStorage.setItem("report-columns", JSON.stringify(action));
        }
    };

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
            return downloadParticipantwiseCsv({ panel });
        }
        return downloadVariantwiseCsv({ panel });
    };

    useEffect(() => {
        document.title = `Search Variants | ${process.env.REACT_APP_NAME}`;
    }, []);

    const classes = useStyles();

    const disableControls = !selectedGenes.length;
    const columnText = `${columns.length} of ${temporaryListOfReportColumns.length} Report Columns selected`;

    return (
        <>
            <main className={classes.content}>
                <div className={classes.appBarSpacer} />
                <Container className={classes.container} maxWidth={false}>
                    <Grid spacing={3} direction="column" container alignItems="center">
                        <Grid item xs={12}>
                            <Typography align="center" variant="h3">
                                Search for Variants
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
                                <GeneAutocomplete
                                    fullWidth={true}
                                    onSelect={toggleGeneSelection}
                                    searchCategory={searchCategory}
                                    onCategoryChange={setSearchCategory}
                                />
                            </Grid>
                            <Grid item>
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
                                        <CircularProgress
                                            size={24}
                                            className={classes.buttonProgress}
                                        />
                                    )}
                                </div>
                            </Grid>
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
                            {process.env.NODE_ENV === "development" && (
                                // TODO: Remove dev-only rendering when endpoint is updated to accept report columns
                                <Grid item xs={12}>
                                    <Paper variant="outlined" className={classes.paper}>
                                        <Typography variant="h6">{columnText}</Typography>
                                        <Button
                                            variant="outlined"
                                            onClick={columnModal.onOpen}
                                            endIcon={<Edit />}
                                        >
                                            Add / Remove Columns
                                        </Button>
                                    </Paper>
                                </Grid>
                            )}
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
            <ReportColumnModal
                open={columnModal.open}
                onClose={columnModal.onClose}
                selectedColumns={columns}
                allColumns={temporaryListOfReportColumns}
                setSelected={updateColumns}
            />
        </>
    );
};

export default SearchVariantsPage;
