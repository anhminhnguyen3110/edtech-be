import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { ESortDirection } from '../constants/database.constant';
import { ETableName } from '../constants/table.constant';
import { PaginationRequestDto } from '../paginate/pagination-request.dto';

export abstract class BaseRepository<T> extends Repository<T> {
    protected alias: ETableName;

    constructor(entity: new () => T, dataSource: DataSource, alias: ETableName) {
        super(entity, dataSource.createEntityManager());
        this.alias = alias;
    }

    protected createQb(): SelectQueryBuilder<T> {
        return this.createQueryBuilder(this.alias);
    }

    protected qbPagination(
        qb: SelectQueryBuilder<T>,
        options: PaginationRequestDto,
    ): SelectQueryBuilder<T> {
        if (typeof options !== 'object') {
            return qb;
        }

        const { limit = 10, page = 1, sortBy, sortDirection = ESortDirection.ASC } = options;

        if (limit > 0) {
            qb.take(limit);
        }

        if (page > 0) {
            qb.skip((page - 1) * limit);
        }

        if (sortBy && this.metadata.columns.find(column => column.propertyName === sortBy)) {
            qb.orderBy(`${this.alias}.${sortBy}`, sortDirection);
        }

        return qb;
    }

    protected qbGroupBy(qb: SelectQueryBuilder<T>, fields: string[]): SelectQueryBuilder<T> {
        fields.forEach((field, index) => {
            if (index === 0) {
                qb.groupBy(`${this.alias}.${field}`);
            } else {
                qb.addGroupBy(`${this.alias}.${field}`);
            }
        });
        return qb;
    }
}
