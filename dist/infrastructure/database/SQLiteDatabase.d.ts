import BetterSqlite3 from 'better-sqlite3';
export type Db = BetterSqlite3.Database;
export declare function getDb(): Db;
export declare function closeDb(): void;
export declare function runTransaction<T>(db: Db, fn: () => T): T;
export declare function initSchema(db: Db): void;
//# sourceMappingURL=SQLiteDatabase.d.ts.map