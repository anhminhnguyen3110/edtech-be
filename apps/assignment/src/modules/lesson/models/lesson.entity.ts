import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { LessonContentDto } from 'apps/api/src/modules/lesson/dtos/create-lesson-request.dto';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { ClassAssignmentEntity } from '../../assignment/models/class-assignment.entity';

@Entity(ETableName.LESSON)
export class LessonEntity extends BaseEntity {
    @ManyToOne(
        () => ClassAssignmentEntity,
        classAssignmentEntity => classAssignmentEntity.lessons,
        {
            eager: false,
        },
    )
    @JoinColumn({ name: 'class_assignment_id' })
    classAssignment: ClassAssignmentEntity;

    @Column({
        name: 'class_assignment_id',
        nullable: false,
    })
    classAssignmentId: number;

    @Column({
        name: 'file_format',
        type: 'enum',
        enum: ['pdf', 'docx'],
        nullable: true,
    })
    fileFormat: string;

    @Column({
        name: 'name',
        nullable: false,
        default: 'untitled',
    })
    name: string;

    @Column({
        name: 'content',
        type: 'json',
        nullable: true,
    })
    content: LessonContentDto;
}
