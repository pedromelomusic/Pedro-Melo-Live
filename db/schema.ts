import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const requests=sqliteTable('requests',{id:text('id').primaryKey(),song:text('song').notNull(),name:text('name').notNull(),created:integer('created').notNull(),status:text('status').notNull().default('pending'),client:text('client').notNull()},t=>[index('requests_created').on(t.created),index('requests_client_created').on(t.client,t.created)]);
export const settings=sqliteTable('settings',{key:text('key').primaryKey(),value:text('value').notNull()});
