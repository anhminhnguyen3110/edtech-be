import { AssignmentEntity } from './assignment/models/assignment.entity';
import { ClassAssignmentEntity } from './assignment/models/class-assignment.entity';
import { CriteriaLevelEntity } from './assignment/models/criteria-level.entity';
import { CriteriaEntity } from './assignment/models/criteria.entity';
import { ClassEntity } from './class/models/class.entity';
import { CriteriaMarkValueEntity } from './issue/models/criteria-mark-value.entity';
import { IssueEntity } from './issue/models/issue.entity';
import { MarkedAssessmentEntity } from './issue/models/mark-assessment.entity';
import { LessonEntity } from './lesson/models/lesson.entity';

export default [
    ClassEntity,
    AssignmentEntity,
    MarkedAssessmentEntity,
    CriteriaEntity,
    CriteriaLevelEntity,
    CriteriaMarkValueEntity,
    LessonEntity,
    IssueEntity,
    ClassAssignmentEntity,
];
