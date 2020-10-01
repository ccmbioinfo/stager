import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton } from '@material-ui/core';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Cancel } from '@material-ui/icons';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import { Participant, rows } from './MockData';
import DatasetType from './DatasetType';

const useStyles = makeStyles(theme => ({
    noteContainer: {
        // display: 'flex',

    },
    note: {
        // display: 'block'
    }

}));

interface DatasetTypesProps{
    datasetTypes: {[key: string]: number},
    participantID: string,
    openedRows: string[],
}

export default function DatasetTypes({ datasetTypes, participantID, openedRows }: DatasetTypesProps) {
    
   
    const classes = useStyles();
    // rowData.datasetTypes = ;
    let typesToDisplay: string[]= Object.keys(datasetTypes);
 
    let more = <div></div>;
    // rowData.datasetTypes.map((type: string) => {
    //     const newType: string = type + ", "
    //     return newType
    // });
    // if(openedRows.includes(participantID)){
    //     typesToDisplay 
    // }else{
    //     typesToDisplay = Object.keys(datasetTypes).slice(0,1)
    //     if(Object.keys(datasetTypes).length > 1){more = <DatasetType type={"..."} number={0}/>}
    // }
    // console.log(rowData)
    // console.log(typesToDisplay)
    return (
        <div className={classes.noteContainer}>
            {typesToDisplay.map(type => <DatasetType type={type} number={datasetTypes[type]}/>)}
            {more}
        </div>
    )
}
