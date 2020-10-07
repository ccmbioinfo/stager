export interface Participant {
    participantID: string,
    participantCodename: string,
    familyCodename: string,
    participantType: string,
    affected: boolean,
    solved: boolean,
    sex: string,
    note: string,
    datasetTypes: string[],
}
export function createParticipant(
    participantID: string,
    participantCodename: string,
    familyCodename: string,
    participantType: string,
    affected: boolean,
    solved: boolean,
    sex: string,
    note: string,
    datasetTypes: string[],
    ) {
    return { participantID, participantCodename, familyCodename, participantType, affected, solved, sex, note, datasetTypes
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
    createParticipant('ID1', 'AA0001', 'FA0001', 'Proband', true, false, 'F', note1, ['CES','RLM','CES','RLM','RGS']),
    createParticipant('ID2', 'AA0002', 'FA0002', 'Mother', true, false, 'F', note2, ['CES']),
    createParticipant('ID3', 'AA0003', 'FA3001', 'Father', false, true, 'M', note1, ['RLM']),
    createParticipant('ID4', 'BB0001', 'FA2001', 'Proband', false, false, 'F', note3, ['CES','RTA']),
    createParticipant('ID5', 'BB0002', 'FA2002', 'Proband', true, false, 'M', note2, ['CGS','RGS','RGS']),
    createParticipant('ID6', 'CC0003', 'FA2003', 'Proband', true, false, 'F', note3, ['CGS']),
    createParticipant('ID7', 'CC0004', 'FA2003', 'Father', false, true, 'M', note1, ['RGS']),
    createParticipant('ID8', 'AA0005', 'FA3012', 'Proband', false, false, 'M', note3, ['CES','CGS']),
    createParticipant('ID9', 'AA0047', 'F3001', 'Proband', false, false, 'M', note3, ['RLM']),
    createParticipant('ID10', 'AA0049', 'FA3001', 'Sibling', true, true, 'F', note5, ['RTA']),
    createParticipant('ID11', 'AA0048', 'FA3001', 'Father', true, true, 'M', note2, ['RGS']),
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

export interface participantInfo{
    samples: Sample[],
    datasets: Dataset[],
    analyses: Analysis[],
}
export function createParticipantInfo(
    samples: Sample[],
    datasets: Dataset[],
    analyses: Analysis[],
){
    return {samples, datasets, analyses}
}
const participantInfo = createParticipantInfo(samples, datasets, analyses);

//mocking reuqest behaviour
export function getParticipantInfo(participantID: string){
    if(participantID === 'ID1') {
        return participantInfo;
    }else{
        return createParticipantInfo([], [], [])
    }
}