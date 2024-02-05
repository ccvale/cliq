// This file contains **generated** code related to the database schema.
// Here, we can see the schema definition, as well as the types for each table.
// We have two tables: Users and messages.
// Users keeps track of all the users in the database. (pretty self-explanatory)
// messages keeps track of all the messages sent between users. (also pretty self-explanatory)

import { buildClient } from "@xata.io/client";
import type {
  BaseClientOptions,
  SchemaInference,
  XataRecord,
} from "@xata.io/client";

const tables = [
  {
    name: "Users",
    columns: [
      { name: "userId", type: "string", notNull: true, defaultValue: "null" },
      {
        name: "birthday",
        type: "datetime",
        notNull: true,
        defaultValue: "1900-01-01T00:00:00.000Z",
      },
      {
        name: "location",
        type: "string",
        notNull: true,
        defaultValue: "Wayne, NJ",
      },
      {
        name: "bio",
        type: "string",
        notNull: true,
        defaultValue: "The user has no bio.",
      },
      { name: "job_position", type: "string", defaultValue: "N/A" },
      { name: "job_company", type: "string", defaultValue: "N/A" },
      { name: "age_filter", type: "multiple" },
      { name: "location_filter", type: "multiple" },
      { name: "primary_palette", type: "string", defaultValue: "Indigo" },
      { name: "secondary_palette", type: "string", defaultValue: "Cyan" },
      { name: "display_name", type: "string", defaultValue: "Nameless" },
      { name: "gender", type: "string", defaultValue: "Other" },
      { name: "matches", type: "multiple" },
      { name: "primary_interest", type: "string", defaultValue: "TV" },
      { name: "secondary_interest", type: "string", defaultValue: "Food" },
      { name: "third_interest", type: "string", defaultValue: "Music" },
      { name: "likes", type: "multiple" },
      { name: "isVerified", type: "boolean", defaultValue: false },
    ],
  },
  {
    name: "messages",
    columns: [
      { name: "sender_id", type: "string" },
      { name: "receiver_id", type: "string" },
      { name: "message", type: "text" },
    ],
  },
] as const;

export type SchemaTables = typeof tables;
export type InferredTypes = SchemaInference<SchemaTables>;

export type Users = InferredTypes["Users"];
export type UsersRecord = Users & XataRecord;

export type Messages = InferredTypes["messages"];
export type MessagesRecord = Messages & XataRecord;

export type DatabaseSchema = {
  Users: UsersRecord;
  messages: MessagesRecord;
};

const DatabaseClient = buildClient();

const defaultOptions = {
  databaseURL:
    "https://Chris-Valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click",
};

export class XataClient extends DatabaseClient<DatabaseSchema> {
  constructor(options?: BaseClientOptions) {
    super({ ...defaultOptions, ...options }, tables);
  }
}

let instance: XataClient | undefined = undefined;

export const getXataClient = () => {
  if (instance) return instance;

  instance = new XataClient();
  return instance;
};
