import React, { useEffect, useState } from "react";
import { Box, Container, Grid, makeStyles, Typography } from "@material-ui/core";
import GeneAutocomplete from "./Autocomplete";
import { Gene } from "../../typings";
import { useVariantsQuery } from "../../hooks/variants";
import { downloadCsvResponse } from "../../hooks/utils";

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

const SearchVariantsPage: React.FC<SearchVariantsPageProps> = () => {
    const [selectedGene, setSelectedGene] = useState<Gene>();
    const [error, setError] = useState(false);

    const { data: blob } = useVariantsQuery({ panel: selectedGene?.hgnc_gene_name }, "csv", {
        enabled: !!selectedGene,
        onError: e => {
            //I'm not sure how common this scenario will be
            if (e.status === 400) {
                setError(true);
            } else {
                throw e;
            }
        },
    });

    const clearError = () => {
        if (error) {
            setError(false);
        }
    };

    useEffect(() => {
        if (blob && selectedGene) {
            downloadCsvResponse(blob);
            setSelectedGene(undefined);
        }
    }, [selectedGene, blob]);

    useEffect(() => {
        document.title = `Search Variants | ${process.env.REACT_APP_NAME}`;
    }, []);

    const classes = useStyles();

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <Grid container justify="center">
                    <Grid item xs={12}>
                        <Typography align="center" variant="h3">
                            Search for Variants by Gene
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box padding={4}>
                            <GeneAutocomplete
                                fullWidth={true}
                                onSearch={clearError}
                                onSelect={gene => setSelectedGene(gene)}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        {error && (
                            <Typography align="center" color="error">
                                No variants found for {selectedGene?.hgnc_gene_name}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
};

export default SearchVariantsPage;
