import { Module } from '@nestjs/common';

import { VectorDbService } from './vector-db-service';

@Module({
    imports: [],
    providers: [VectorDbService],
    exports: [VectorDbService],
})
export class VectorDbModule {}
