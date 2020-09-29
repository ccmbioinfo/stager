export interface Participant {
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
    participantCodename: string,
    familyCodename: string,
    participantType: string,
    affected: boolean,
    solved: boolean,
    sex: string,
    note: string,
    datasetTypes: string[],
    ) {
    return { participantCodename, familyCodename, participantType, affected, solved, sex, note, datasetTypes
    };
}

export const note1 = 'Lorem ipsum dolor sit ame';
export const note2 = 'ritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequu'
export const note3 = 'quis nostrum exercitationem'
export const note4 = 'et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure '
export const note5 = 'consequuntur magni '

export const rows: Participant[] = [
    createParticipant('AA0001', 'FA0001', 'Proband', true, false, 'F', note1, ['CES','RLM'], ),
    createParticipant('AA0002', 'FA0002', 'Mother', true, false, 'F',note2, ['CES','RGS']),
    createParticipant('AA0003', 'FA3001', 'Father', false, true, 'M',note1, ['RLM']),
    createParticipant('BB0001', 'FA2001', 'Proband', false, false,'F', note3, ['CES','RTA']),
    createParticipant('BB0002', 'FA2002', 'Proband', true, false, 'M', note2, ['CGS','RGS']),
    createParticipant('CC0003', 'FA2003', 'Proband', true, false, 'F',note3, ['CGS']),
    createParticipant('CC0004', 'FA2003', 'Father', false, true, 'M', note1, ['RGS']),
    createParticipant('AA0005', 'FA3012', 'Proband', false, false, 'M', note3, ['CES','CGS']),
    createParticipant('AA0047', 'F3001', 'Proband', false, false, 'M',note4, ['RLM']),
    createParticipant('AA0049', 'FA3001', 'Sibling', true, true, 'F', note5, ['RTA']),
    createParticipant('AA0048', 'FA3001', 'Father', true, true, 'M', note2, ['RGS']),
];