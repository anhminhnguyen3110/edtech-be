import { ESortDirection } from '../constants/database.constant';

export interface IPagination {
    limit: number;
    page: number;
    sortBy?: string;
    sortDirection?: ESortDirection;
}
