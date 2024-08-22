import { Module } from '@nestjs/common';

import { GoogleWebSearchService } from './google-web-search.service';

@Module({
    imports: [],
    providers: [GoogleWebSearchService],
    exports: [GoogleWebSearchService],
})
export class GoogleWebSearchModule {}
