import React from 'react';
import DatasetType from './DatasetType';

interface DatasetTypesProps {
    datasetTypes: {[key: string]: number},
}

export default function DatasetTypes({ datasetTypes }: DatasetTypesProps) {
    return (
        <div>
            {Object.keys(datasetTypes).map(type => <DatasetType type={type} number={datasetTypes[type]} />)}
        </div>
    )
}
