import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIssueRequestDto {
    @ApiProperty({
        description: 'ID of the class',
        example: 1,
    })
    @IsNotEmpty()
    @IsInt()
    classAssignmentId: number;

    @ApiProperty({
        description: 'Name of the issue',
        example: 'Homework not submitted',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Student count affected by the issue',
        example: 5,
        required: false,
    })
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    studentCount: number;

    @ApiProperty({
        description: 'Description of the issue',
        example: 'Several students have not submitted their homework on time.',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    studentRate?: string;
}

export class ExtractIssuesRequestDto {
    @ApiProperty({
        description: 'Class Assignment Id of the class',
        example: 1,
    })
    @IsNotEmpty()
    @IsInt()
    classAssignmentId: number;
}
