import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Container,
    FormControlLabel,
    Grid,
    makeStyles,
    Radio,
    RadioGroup,
    Typography,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import { useDownloadCsv } from "../../hooks";
import { GeneAlias } from "../../typings";
import GeneAutocomplete from "./Autocomplete";

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

    const [selectedGenes, setSelectedGenes] = useState<GeneAlias[]>(loadPanel());
    const [downloadType, setDownloadType] = useState<"variant" | "participant">("variant");

    const toggleGeneSelection = (gene: GeneAlias) => {
        const updated = !selectedGenes.includes(gene)
            ? selectedGenes.concat(gene)
            : selectedGenes.filter(g => g !== gene);
        setSelectedGenes(updated);
        localStorage.setItem("gene-panel", JSON.stringify(updated));
    };

    const onError = async (response: Response) => {
        try {
            const payload = await response.json();
            enqueueSnackbar(`${response.status} ${response.statusText}: ${payload.error}`);
        } catch (error) {
            console.error(error, response);
            enqueueSnackbar(`${response.status} ${response.statusText}`);
        }
    };

    const downloadVariantwiseCsv = useDownloadCsv(GET_VARIANTS_SUMMARY_URL, {
        onError,
    });

    const downloadParticipantwiseCsv = useDownloadCsv(GET_VARIANTS_BY_PARTICIPANTS_SUMMARY_URL, {
        onError,
    });

    const downloadCsv = () => {
        const panel = selectedGenes.map(gene => `ENSG${gene.ensembl_id}`).join(",");
        if (downloadType === "participant") {
            return downloadParticipantwiseCsv({ panel });
        }
        return downloadVariantwiseCsv({ panel });
    };

    useEffect(() => {
        document.title = `Search Variants | ${process.env.REACT_APP_NAME}`;
    }, []);

    const classes = useStyles();

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
                        <Grid item>
                            <Button
                                disabled={!selectedGenes.length}
                                onClick={downloadCsv}
                                size="large"
                                variant="contained"
                            >
                                Download
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} md={6}>
                        <RadioGroup
                            row
                            aria-label="Pipelines"
                            name="pipelines"
                            value={downloadType}
                            onChange={event =>
                                setDownloadType(event.target.value as "variant" | "participant")
                            }
                        >
                            <FormControlLabel
                                label="variant-wise"
                                value="variant"
                                control={<Radio color="primary" />}
                            />
                            <FormControlLabel
                                label="participant-wise"
                                value="participant"
                                control={<Radio color="primary" />}
                            />
                        </RadioGroup>
                    </Grid>
                    <Grid container item xs={12} md={6} wrap="nowrap">
                        <Grid item>
                            {!!selectedGenes.length && (
                                <Box padding={1} margin={1}>
                                    <Typography>Selected Genes</Typography>
                                </Box>
                            )}
                        </Grid>
                        <Grid item container xs={12}>
                            {selectedGenes.map(g => (
                                <Grid item key={g.ensembl_id}>
                                    <Box key={g.ensembl_id} padding={1} margin={1}>
                                        <Chip
                                            label={g.name}
                                            onDelete={() => toggleGeneSelection(g)}
                                        />
                                    </Box>
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
