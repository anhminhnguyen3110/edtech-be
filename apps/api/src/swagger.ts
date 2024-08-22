import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const configBuilder = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('EdTech Assistant API documentation')
    .setDescription('This is the first version of this swagger documentation.')
    .setVersion('1.0')
    .setContact('Minh Nguyen', 'https://www.linkedin.com/in/minhanhngn/', 'nganhminh2003@gmail.com')
    .setLicense('MIT License', 'https://opensource.org/licenses/MIT')
    .setExternalDoc('GitHub', 'https://github.com/') // We will put the link to vuedocs later
    .build();

export function initSwagger(app: INestApplication, path?: string) {
    const document = SwaggerModule.createDocument(app, configBuilder);
    SwaggerModule.setup(path || 'api/docs', app, document);
}
