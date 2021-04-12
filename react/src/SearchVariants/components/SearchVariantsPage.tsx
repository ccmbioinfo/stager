import React, { useEffect, useState } from "react";
import { Box, Container, Grid, makeStyles, Typography } from "@material-ui/core";
import GeneAutocomplete from "./Autocomplete";
import { Gene } from "../../typings";
import { useVariantsQuery } from "../../hooks/variants";

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

    const { data: variants } = useVariantsQuery({ search: selectedGene }, "csv", !!selectedGene);

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
                                onSelect={gene => setSelectedGene(gene)}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
};

export default SearchVariantsPage;
