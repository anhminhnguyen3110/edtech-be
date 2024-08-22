import { EYear } from '@app/common/constants/table.constant';

export interface IAssignmentDetails {
    id: number;
    name: string;
    year: EYear;
    criteria: ICriteria[];
}

export interface ICriteria {
    id: number;
    description: string;
}

export interface IAssessmentDetails {
    id: number;
    extractedText: string;
    feedback: string;
    criteria: IAssessmentCriteria[];
}

export interface IAssessmentCriteria {
    criteriaDescription: string;
    levelName: string;
    score: number;
}

export interface IFetchAssessmentDetailsResult {
    assignment: IAssignmentDetails;
    classId: number;
    classAssignmentId: number;
    assessments: IAssessmentDetails[];
    totalAssessment: number;
    accountId: number;
}

export interface IIssueModelResponse {
    assessmentId: number;
    name: string;
    description: string;
}

export interface ISupportData {
    totalAssessment: number;
    classAssignmentId: number;
    accountId: number;
}
