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

export const note1 = 'Lorem ipsum dolor sit ame';
export const note2 = 'ritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia';
export const note3 = '';
export const note5 = 'consequuntur';

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