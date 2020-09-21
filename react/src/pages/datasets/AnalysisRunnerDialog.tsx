import React, { useState, ChangeEvent } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { Dataset } from './DatasetTable';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Typography from '@material-ui/core/Typography';
import Checkbox, { CheckboxProps } from '@material-ui/core/Checkbox';
import DatasetTable from '../analysis/DatasetTable';
import { annotations } from '../analysis/AnalysisInfoDialog';
import ChipStrip from '../analysis/ChipStrip';

interface AnalysisRunnerDialogProp {
    participants: Dataset[],
    open: boolean,
    onClose: (() => void)
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement<any, any> },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function AnalysisRunnerDialog({ participants, open, onClose }: AnalysisRunnerDialogProp) {

    const [state, setState] = useState({
        checkedSNP: true,
        checkedINDEL: true,
        checkedDenovo: true,
        checkedTranscripts: false,
        checkedSynonynmous: true,
        checkedSV: false,
    });
    const { checkedSNP, checkedINDEL, checkedDenovo, checkedTranscripts, checkedSynonynmous, checkedSV } = state;
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, [event.target.name]: event.target.checked });
    };

    const labeledBy = "analysis-runner-alert-dialog-slide-title"
    const describedBy = "analysis-runner-alert-dialog-slide-description"

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={onClose}
            aria-labelledby={labeledBy}
            aria-describedby={describedBy}
            maxWidth='md'
            fullWidth={true}
        >
            <DialogTitle id={labeledBy}>
                Run analysis
            </DialogTitle>
            <DialogContent>
                <Typography id={describedBy} variant="body1">
                    Run a pipeline using the selected datasets on the cluster. A full analysis can take a day to several days depending on the number of samples and the pipeline used.
                </Typography>
                <br />
                <Typography variant="subtitle1">
                    Datasets:
                </Typography>
                <DatasetTable />
                <br />
                <FormControl component="fieldset">
                    <FormLabel component="legend">
                        Pipelines:
                    </FormLabel>
                    <RadioGroup row aria-label="pipelines" name="pipelines" defaultValue="top">
                        <FormControlLabel value="cre" control={<Radio color="primary" checked={true} />} label="CRE v1.0.1" />
                        <FormControlLabel value="crg" control={<Radio disabled color="primary" />} label="CRG v2" />
                        <FormControlLabel value="crt" control={<Radio disabled color="primary" />} label="CRT v0.5.1" />
                        <FormControlLabel value="genpipes" control={<Radio color="primary" />} label="Genpipes v1" />
                    </RadioGroup>
                </FormControl>
                <br />
                <FormLabel component="legend">
                    Annotations:
                </FormLabel>
                <ChipStrip labels={annotations} color="primary" />
                <br />
                <FormControl component="fieldset">
                    <FormLabel component="legend">
                        Variants:
                    </FormLabel>
                    <RadioGroup row aria-label="position" name="position" defaultValue="top">
                        <FormControlLabel control={<Checkbox checked={checkedSNP} onChange={handleChange} name="checkedSNP" color="primary" />} label="SNPs" />
                        <FormControlLabel control={<Checkbox checked={checkedINDEL} onChange={handleChange} name="checkedINDEL" color="primary" />} label="INDELs" />
                        <FormControlLabel control={<Checkbox disabled checked={checkedTranscripts} onChange={handleChange} name="checkedTranscripts" color="primary" />} label="Transcripts" />
                        <FormControlLabel control={<Checkbox disabled checked={checkedSV} onChange={handleChange} name="checkedSV" color="primary" />} label="SVs" />
                    </RadioGroup>
                </FormControl>
                <br />
                <FormControl component="fieldset">
                    <FormLabel component="legend">
                        Parameters:
                    </FormLabel>
                    <RadioGroup row aria-label="position" name="position" defaultValue="top">
                        <FormControlLabel control={<Checkbox checked={true} onChange={handleChange} name="checkedGnomAD" color="primary" />} label="gnomAD_AF <= 0.01" />
                        <FormControlLabel control={<Checkbox checked={true} onChange={handleChange} name="checkedImpactSeverity" color="primary" />} label="IMPACT_SEVERITY=HIGH" />
                        <FormControlLabel control={<Checkbox checked={false} onChange={handleChange} name="checkedProteinCodingGenes" color="primary" />} label="Restrict to protein coding genes" />
                        <FormControlLabel control={<Checkbox checked={checkedDenovo} onChange={handleChange} name="checkedDenovo" color="primary" />} label="Denovo" />
                        <FormControlLabel control={<Checkbox checked={checkedSynonynmous} onChange={handleChange} name="checkedSynonynmous" color="primary" />} label="Synonymous" />
                    </RadioGroup>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button variant="contained" onClick={onClose} color="primary">
                    Run analysis
                </Button>
            </DialogActions>
        </Dialog>
    );
}
