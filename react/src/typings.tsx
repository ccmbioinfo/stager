/*****   TYPES   *****/
export type Counts = { [key: string]: number };
export type KeyValue = { [key: string]: string };
export type FieldDisplayValueType = string[] | string | number | boolean | null | undefined;

/*****   ENUMS   *****/
export enum PipelineStatus {
    PENDING = "Requested",
    RUNNING = "Running",
    COMPLETED = "Done",
    ERROR = "Error",
    CANCELLED = "Cancelled",
}

/*****   INTERFACES   *****/
export interface Family {
    family_id: string;
    family_codename: string;
    created: string;
    created_by: number;
    updated: string;
    updated_by: number;
    participants: Participant[];
}

export interface Participant {
    participant_id: string;
    participant_codename: string;
    family_id: string;
    family_codename: string;
    participant_type: string;
    affected: PseudoBoolean;
    solved: PseudoBoolean;
    sex: string;
    notes: string;
    dataset_types: string[];
    created: string;
    created_by: number;
    updated: string;
    updated_by: number;
    tissue_samples: Sample[];
}
export interface Sample {
    tissue_sample_id: string;
    extraction_date: string;
    tissue_sample_type: string;
    tissue_processing: string;
    datasets: Dataset[];
    notes: string;
    created: string;
    created_by: number;
    updated: string;
    updated_by: number;
}
export interface Dataset {
    dataset_id: string;
    participant_codename: string;
    family_codename: string;
    tissue_sample_type: string;
    tissue_sample_id: string;
    dataset_type: string;
    input_hpf_path: string;
    notes: string;
    condition: string;
    extraction_protocol: string;
    capture_kit: string;
    library_prep_method: string;
    library_prep_date: string;
    read_length: number;
    read_type: string;
    sequencing_id: string;
    sequencing_centre: string;
    batch_id: string;
    created: string;
    created_by: number;
    updated: string;
    updated_by: number;
    discriminator: string;
}
export interface Analysis {
    analysis_id: string;
    pipeline_id: string;
    result_path: string;
    assignee: string;
    requester: string;
    analysis_state: PipelineStatus;
    updated: string;
    notes: string;
    dataset_id: string;
    qsubID: string;
    requested: string;
    started: string;
    finished: string;
    updated_by: number;
    pipeline: Pipeline;
}
export interface Pipeline {
    pipeline_id: number;
    pipeline_name: string;
    pipeline_version: string;
    supported_types: string[];
}
export interface Info {
    primaryListTitle: string;
    secondaryListTitle?: string;
    fields: Field[];
    collapsibleFields?: Field[];
    identifier?: string;
}

// Define these as classes so that we can create an array of keys later
export class DataEntryRowBase {
    family_codename!: string;
    participant_codename!: string;
    participant_type!: string;
    tissue_sample_type!: string;
    dataset_type!: string;
    condition!: string;
}

export class DataEntryRowOptional {
    sex?: string;
    affected?: boolean;
    solved?: boolean;
    input_hpf_path?: string[];
    notes?: string;
    extraction_protocol?: string;
    capture_kit?: string;
    library_prep_method?: string;
    read_length?: number;
    read_type?: string;
    sequencing_id?: string;
    sequencing_date?: string;
    sequencing_centre?: string;
    batch_id?: string;
}

// Cannot enforce "RNASeq => these values are set" with types
export class DataEntryRowRNASeq {
    RIN?: string;
    DV200?: string;
    concentration?: string;
    sequencer?: string;
    spike_in?: string;
}

export interface DataEntryRow extends DataEntryRowBase, DataEntryRowOptional, DataEntryRowRNASeq {
    participantColDisabled?: boolean;
}

export interface DataEntryHeader {
    title: string;
    field: keyof DataEntryRow;
    hidden?: boolean;
}

export interface NewUser {
    username: string;
    email: string;
    isAdmin: boolean;
    password: string;
    confirmPassword: string;
}

export interface User {
    username: string;
    email: string;
    is_admin: boolean;
    last_login: string;
    deactivated: boolean;
    groups: string[];
    password?: string;
    confirmPassword?: string;
}

export interface Field {
    title: string;
    value: FieldDisplayValueType;
    fieldName?: string;
    disableEdit?: boolean;
}

export type PseudoBoolean = "true" | "false" | "null";
export const PseudoBooleanReadableMap: Record<PseudoBoolean, string> = {
    true: "Yes",
    false: "No",
    null: "Unknown",
};
export interface ConfirmPasswordState {
    password: string;
    confirmPassword: string;
}

export interface ConfirmPasswordAction {
    type: "password" | "confirm";
    payload: string;
}
