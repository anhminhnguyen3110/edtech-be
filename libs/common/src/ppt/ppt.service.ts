import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EFileService } from '@app/common/constants/service.constant';
import { AFileService } from '@app/common/file/file.abstract';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LessonContentDto } from 'apps/api/src/modules/lesson/dtos/create-lesson-request.dto';
import * as fs from 'fs';
import * as path from 'path';

import { FileDeletionService } from '../utils/file-remove.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pptx = require('pptxgenjs');

@Injectable()
export class PptService {
    private readonly pathToSave: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(EFileService.FILE_SERVICE)
        private readonly fileService: AFileService,
        private readonly fileDeletionService: FileDeletionService,
    ) {
        this.pathToSave = this.configService.get<string>(ECommonConfig.STAGE_PATH);
    }

    async createLessonPpt(lessonContent: LessonContentDto, lessonId: number, lessoneName: string) {
        const ppt = new pptx();
        ppt.layout = 'LAYOUT_WIDE';
        ppt.author = 'Minh Nguyen';

        const addTextWithOverflow = (slide, text, x, y, w, h, fontSize, color, bold, align) => {
            const maxLength = 1000;
            if (text.length > maxLength) {
                const splitText = text.match(new RegExp(`.{1,${maxLength}}`, 'g'));
                splitText.forEach((part, index) => {
                    if (index === 0) {
                        slide.addText(part, {
                            x,
                            y,
                            w,
                            h,
                            fontSize,
                            color,
                            bold,
                            align,
                        });
                    } else {
                        slide = ppt.addSlide();
                        slide.addText(part, {
                            x,
                            y,
                            w,
                            h,
                            fontSize,
                            color,
                            bold,
                            align,
                        });
                    }
                });
            } else {
                slide.addText(text, {
                    x,
                    y,
                    w,
                    h,
                    fontSize,
                    color,
                    bold,
                    align,
                });
            }
            return slide;
        };

        const addListWithOverflow = (slide, list, startY, w, fontSize, color, bulletChar) => {
            const itemHeight = 0.5; // Adjust based on your font size and padding
            const slideHeight = 7.5; // Total height of the slide

            let currentY = startY;
            let currentSlide = slide;

            list.forEach((item, _) => {
                // Check if currentY plus itemHeight exceeds slideHeight
                if (currentY + itemHeight > slideHeight) {
                    // Add a new slide
                    currentSlide = ppt.addSlide();
                    currentY = 1; // Reset Y position to 1 for the new slide
                }

                // Add the list item to the current slide
                currentSlide.addText(item, {
                    x: 0.5,
                    y: currentY,
                    w,
                    h: itemHeight,
                    fontSize,
                    color,
                    bullet: { char: bulletChar },
                });

                // Increment currentY for the next item
                currentY += itemHeight;
            });

            return currentSlide;
        };

        const addContentWithDynamicSpacing = (slide, content, startY) => {
            let currentY = startY + 0.5; // Start at 0.5 and add 0.5 for the title
            const slideHeight = 7.5;

            Object.entries(content.points).forEach(([pointTitle, pointValues]) => {
                // Check if we need a new slide
                if (currentY > 6.5) {
                    slide = ppt.addSlide();
                    currentY = 0.5;
                }

                // Add point title
                slide.addText(pointTitle, {
                    x: 0.5,
                    y: currentY,
                    w: '95%',
                    h: 0.5,
                    fontSize: 20,
                    color: '363636',
                    bold: true,
                });
                currentY += 0.5;

                if (Array.isArray(pointValues)) {
                    // Handle list
                    const listHeight = pointValues.length * 0.3; // Estimate height based on number of items
                    if (currentY + listHeight > slideHeight) {
                        slide = ppt.addSlide();
                        currentY = 0.5;
                    }
                    slide = addListWithOverflow(
                        slide,
                        pointValues,
                        currentY,
                        '95%',
                        16,
                        '363636',
                        '•',
                    );
                    currentY += listHeight + 0.7; // Add some padding after the list
                } else {
                    // Handle text
                    const textHeight = Math.ceil((pointValues as string).length / 100) * 0.5; // Rough estimate of text height
                    if (currentY + textHeight > slideHeight - 0.2) {
                        slide = ppt.addSlide();
                        currentY = 0.5;
                    }
                    slide = addTextWithOverflow(
                        slide,
                        pointValues,
                        0.5,
                        currentY,
                        '95%',
                        textHeight,
                        16,
                        '363636',
                        false,
                        'justify',
                    );
                    currentY += textHeight + 0.3; // Add some padding after the text
                }
            });

            return slide;
        };

        const addQuizTimeSlide = () => {
            const slide = ppt.addSlide();
            slide.addText('Quiz Time!', {
                x: 0.5,
                y: 2.5,
                w: '95%',
                h: 1,
                fontSize: 60,
                color: '363636',
                bold: true,
                align: 'center',
            });
            slide.addText('Get ready to test your knowledge', {
                x: 0.5,
                y: 4,
                w: '95%',
                h: 0.5,
                fontSize: 32,
                color: '363636',
                align: 'center',
            });
            return slide;
        };

        let slide = ppt.addSlide();
        slide.addText('Essay Writing Skills Improvement', {
            x: 1,
            y: 1,
            w: '80%',
            h: 1,
            fontSize: 44,
            color: '363636',
            bold: true,
        });
        slide.addText('Addressing Common Issues in Class Assignments', {
            x: 1,
            y: 2.5,
            w: '80%',
            h: 0.5,
            fontSize: 32,
            color: '363636',
        });

        slide = ppt.addSlide();
        slide.addText('Introduction', {
            x: 0.5,
            y: 0.5,
            w: '95%',
            h: 0.5,
            fontSize: 36,
            color: '363636',
            bold: true,
        });
        slide = addTextWithOverflow(
            slide,
            lessonContent.introduction.overview,
            0.5,
            1.0,
            '95%',
            2,
            18,
            '363636',
            false,
            'justify',
        );
        slide.addText('Objectives:', {
            x: 0.5,
            y: 3.0,
            w: '95%',
            h: 0.5,
            fontSize: 24,
            color: '363636',
            bold: true,
        });
        slide = addListWithOverflow(
            slide,
            lessonContent.introduction.objectives,
            3.5,
            '95%',
            16,
            '363636',
            '•',
        );

        // Add Quiz Time slide after introduction
        slide = addQuizTimeSlide();

        lessonContent.issues.forEach(issue => {
            slide = ppt.addSlide();
            slide.addText(issue.issue, {
                x: 0.5,
                y: 1,
                w: '95%',
                h: 0.8,
                fontSize: 40,
                color: '363636',
                bold: true,
                align: 'center',
            });
            slide = addTextWithOverflow(
                slide,
                issue.description,
                0.5,
                3,
                '95%',
                2,
                24,
                '363636',
                false,
                'justify',
            );

            issue.content.forEach(content => {
                slide = ppt.addSlide();
                slide.addText(content.title, {
                    x: 0.5,
                    y: 0.3,
                    w: '95%',
                    h: 0.5,
                    fontSize: 24,
                    color: '363636',
                    bold: true,
                });
                slide = addContentWithDynamicSpacing(slide, content, 0.3);
            });
        });

        // Add Quiz Time slide before conclusion
        slide = addQuizTimeSlide();

        // Conclusion slides
        slide = ppt.addSlide();
        slide.addText('Conclusion', {
            x: 0.5,
            y: 0.5,
            w: '95%',
            h: 0.5,
            fontSize: 36,
            color: '363636',
            bold: true,
        });
        slide = addTextWithOverflow(
            slide,
            lessonContent.conclusion.summary,
            0.5,
            1.5,
            '95%',
            2,
            18,
            '363636',
            false,
            'justify',
        );

        slide = ppt.addSlide();
        slide.addText('Key Takeaways', {
            x: 0.5,
            y: 0.5,
            w: '95%',
            h: 0.5,
            fontSize: 24,
            color: '363636',
            bold: true,
        });
        slide = addListWithOverflow(
            slide,
            lessonContent.conclusion.takeaways,
            1.5,
            '95%',
            16,
            '363636',
            '•',
        );

        const filePathToSave = `${this.pathToSave}/lesson-${lessonId}.pptx`;

        try {
            if (!fs.existsSync(path.dirname(filePathToSave))) {
                fs.mkdirSync(path.dirname(filePathToSave), { recursive: true });
            }

            await ppt.writeFile({
                fileName: filePathToSave,
            });

            await this.uploadPptToS3(filePathToSave, lessonId, lessoneName);
        } catch (error) {
            throw new Error(`Error creating lesson ppt: ${error}`);
        }
    }

    async uploadPptToS3(filePath: string, lessonId: number, lessonName: string) {
        try {
            const s3Folder = this.configService.get<string>(ECommonConfig.LESSON_S3_FOLDER);
            const externalFilePath = `${s3Folder}/${lessonId}/${lessonName}.pptx`;
            return this.fileService.uploadFile(
                filePath,
                externalFilePath,
                this.configService.get<string>(ECommonConfig.DEFAULT_LESSON_FILE_FORMAT),
            );
        } catch (error) {
            throw new Error(`Error uploading file to S3: ${error}`);
        } finally {
            await this.fileDeletionService.deleteFile(filePath);
        }
    }
}
