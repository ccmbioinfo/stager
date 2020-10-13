export interface Participant {
<<<<<<< HEAD
    participant_id: string,
    participant_codename: string,
    family_id: string,
    family_codename: string,
    participant_type: string,
=======
    participantID: string,
    participantCodename: string,
    familyID: string,
    familyCodename: string, //not in participant schema, need to request separately
    participantType: string,
>>>>>>> master
    affected: boolean,
    solved: boolean,
    sex: string,
    notes: string,
<<<<<<< HEAD
    dataset_types: string[],
    created: string,
    created_by: number,
    updated: string,
    updated_by: number,
}
export function createParticipant(
    participant_id: string,
    participant_codename: string,
    family_id: string,
    family_codename: string,
    participant_type: string,
=======
    datasetTypes: string[],
    created: string,
    createdBy: number,
    updated: string,
    updatedBy: number,
}
export function createParticipant(
    participantID: string,
    participantCodename: string,
    familyID: string,
    familyCodename: string,
    participantType: string,
>>>>>>> master
    affected: boolean,
    solved: boolean,
    sex: string,
    notes: string,
<<<<<<< HEAD
    dataset_types: string[],
    created: string,
    created_by: number,
    updated: string,
    updated_by: number,
    ) {
    return { participant_id, participant_codename, family_id, family_codename, participant_type, affected, solved, sex, notes, 
        dataset_types, created, created_by, updated, updated_by
=======
    datasetTypes: string[],
    created: string,
    createdBy: number,
    updated: string,
    updatedBy: number,
    ) {
    return { participantID, participantCodename, familyID, familyCodename, participantType, affected, solved, sex, notes, 
        datasetTypes, created, createdBy, updated, updatedBy
>>>>>>> master
    };
}

export interface Sample {
    sampleID: string,
    extractionDate: string,
    sampleType: string,
    tissueProcessing: string,
    notes: string,
    created: string,
    createBy: number,
    updated: string,
    updatedBy: number,
}
export function createSample(
    sampleID: string,
    extractionDate: string,
    sampleType: string,
    tissueProcessing: string,
    notes: string,
    created: string,
    createBy: number,
    updated: string,
    updatedBy: number,
<<<<<<< HEAD
    ) {
    return { sampleID, extractionDate, sampleType, tissueProcessing, notes, created, createBy, updated, updatedBy,
    };
}

export interface Dataset {
    datasetID: string,
    sampleID: string,
    datasetType: string,
    inputHpfPath: string,
    notes: string,
    condition: string,
    extractionProtocol: string,
    captureKit: string,
    libraryPrepMethod: string,
    libraryPrepDate: string	,
    readLength: number,
    readType: string,
    sequencingID: string,
    sequencingCentre: string,
    batchID: string,
    created: string,
    createdBy: number,
    updated: string,
    updatedBy: number,
    discriminator: string,
}
export function createDataset(
    sampleID: string,
    datasetID: string,
    datasetType: string,
    inputHpfPath: string,
    notes: string,
    condition: string,
    extractionProtocol: string,
    captureKit: string,
    libraryPrepMethod: string,
    libraryPrepDate: string	,
    readLength: number,
    readType: string,
    sequencingID: string,
    sequencingCentre: string,
    batchID: string,
    created: string,
    createdBy: number,
    updated: string,
    updatedBy: number,
    discriminator: string,
    ) {
    return { sampleID, datasetID, datasetType, inputHpfPath, notes, condition, extractionProtocol, captureKit, libraryPrepMethod, libraryPrepDate,
 readLength, readType, sequencingID, sequencingCentre, batchID, created, createdBy, updated, updatedBy, discriminator,
    };
}

=======
    ) {
    return { sampleID, extractionDate, sampleType, tissueProcessing, notes, created, createBy, updated, updatedBy,
    };
}

export interface Dataset {
    datasetID: string,
    sampleID: string,
    datasetType: string,
    inputHpfPath: string,
    notes: string,
    condition: string,
    extractionProtocol: string,
    captureKit: string,
    libraryPrepMethod: string,
    libraryPrepDate: string	,
    readLength: number,
    readType: string,
    sequencingID: string,
    sequencingCentre: string,
    batchID: string,
    created: string,
    createdBy: number,
    updated: string,
    updatedBy: number,
    discriminator: string,
}
export function createDataset(
    sampleID: string,
    datasetID: string,
    datasetType: string,
    inputHpfPath: string,
    notes: string,
    condition: string,
    extractionProtocol: string,
    captureKit: string,
    libraryPrepMethod: string,
    libraryPrepDate: string	,
    readLength: number,
    readType: string,
    sequencingID: string,
    sequencingCentre: string,
    batchID: string,
    created: string,
    createdBy: number,
    updated: string,
    updatedBy: number,
    discriminator: string,
    ) {
    return { sampleID, datasetID, datasetType, inputHpfPath, notes, condition, extractionProtocol, captureKit, libraryPrepMethod, libraryPrepDate,
 readLength, readType, sequencingID, sequencingCentre, batchID, created, createdBy, updated, updatedBy, discriminator,
    };
}

>>>>>>> master
export interface Analysis {
    analysisID: string,
    datasetID: string,
    analysisState: string,
    pipelineID: string,
    qsubID: string,
    resultHpfPath: string,
    assignee: number,
    requester: number,
    requested: string,
    started: string,
    finished: string,
    notes: string,
    updated: string,
    updatedBy: number,
}
export function createAnalysis(
    analysisID: string,
    datasetID: string,
    analysisState: string,
    pipelineID: string,
    qsubID: string,
    resultHpfPath: string,
    assignee: number,
    requester: number,
    requested: string,
    started: string,
    finished: string,
    notes: string,
    updated: string,
	updatedBy: number,
    ) {
    return { analysisID, datasetID, analysisState, pipelineID, qsubID, resultHpfPath, assignee, requester, requested, started, finished, notes, updated, updatedBy, 
    };
}
export const note1 = 'Lorem ipsum dolor sit ame';
export const note2 = 'ritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia';
export const note3 = '';
export const note5 = 'consequuntur';
const datetime = '2020-06-19 4:32 AM';

export const rows: Participant[] = [
    createParticipant('ID1', 'AA0001', 'FAID01', 'FA0001', 'Proband', true, false, 'F', note1, ['CES','RLM','CES','RLM','RGS'], 'created', 1, 'updated', 1),
    createParticipant('ID2', 'AA0002', 'FAID02', 'FA0002', 'Mother', true, false, 'F', note2, ['CES'], 'created', 1, 'updated', 1),
    createParticipant('ID3', 'AA0003', 'FAID03', 'FA3001', 'Father', false, true, 'M', note1, ['RLM'], 'created', 1, 'updated', 1),
    createParticipant('ID4', 'BB0001', 'FAID04', 'FA2001', 'Proband', false, false, 'F', note3, ['CES','RTA'], 'created', 1, 'updated', 1),
    createParticipant('ID5', 'BB0002', 'FAID05', 'FA2002', 'Proband', true, false, 'M', note2, ['CGS','RGS','RGS'], 'created', 1, 'updated', 1),
    createParticipant('ID6', 'CC0003', 'FAID06', 'FA2003', 'Proband', true, false, 'F', note3, ['CGS'], 'created', 1, 'updated', 1),
    createParticipant('ID7', 'CC0004', 'FAID07', 'FA2003', 'Father', false, true, 'M', note1, ['RGS'], 'created', 1, 'updated', 1),
    createParticipant('ID8', 'AA0005', 'FAID08', 'FA3012', 'Proband', false, false, 'M', note3, ['CES','CGS'], 'created', 1, 'updated', 1),
    createParticipant('ID9', 'AA0047', 'FAID09', 'F3001', 'Proband', false, false, 'M', note3, ['RLM'], 'created', 1, 'updated', 1),
    createParticipant('ID10', 'AA0049', 'FAID10', 'FA3001', 'Sibling', true, true, 'F', note5, ['RTA'], 'created', 1, 'updated', 1),
    createParticipant('ID11', 'AA0048', 'FAID11', 'FA3001', 'Father', true, true, 'M', note2, ['RGS'], 'created', 1, 'updated', 1),
];

//samples for participant ID1
const samples: Sample[] = [
    createSample("sample1", datetime, 'CES', 'FF', 'lorem ipsum', datetime, 1, datetime, 1),
    createSample("sample2", datetime, 'RLM', 'FF', 'lorem ipsum', datetime, 1, datetime, 1),
]
const datasets: Dataset[] = [
    createDataset('sample1', 'dataset1', 'CES', './lorem/ipsum', 'notes', 'condition', 'extractionProtocol', 'captureKit', 'libraryPrepMethod', 'libraryPrepDate',
    1, 'readType', 'sequencingID', 'sequencinCentre', 'batchID', 'created', 1, 'updated', 1, 'discriminator'),
    createDataset('sample1', 'dataset2', 'CES', './lorem/ipsum', 'notes', 'condition', 'extractionProtocol', 'captureKit', 'libraryPrepMethod', 'libraryPrepDate',
    1, 'readType', 'sequencingID', 'sequencinCentre', 'batchID', 'created', 1, 'updated', 1, 'discriminator'),
]
const analyses: Analysis[] = [
    createAnalysis('analysis1', 'dataset1', 'pending', 'pipeline1', 'qsubID', 'resultHpfPath', 1, 1, 'requested', 'started', 'finished', 'notes', 'updated', 1),
    createAnalysis('analysis2', 'dataset1', 'pending', 'pipeline1', 'qsubID', 'resultHpfPath', 1, 1, 'requested', 'started', 'finished', 'notes', 'updated', 1),
]

//mocking reuqest behaviour
export function getAnalyses(participantID: string){
    if(participantID === 'ID1') {
        return analyses;
    }else{
        return [];
    }
}
export function getSamplesAndDatasets(participantID: string){
    if(participantID === 'ID1') {
        return {
            samples: samples,
            datasets: datasets,
        };
    }else{
        return {
            samples: [],
            datasets: [],
        }
    }
}