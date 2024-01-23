// Generated by Xata Codegen 0.28.0. Please do not edit.
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
        defaultValue: "2023-01-01T00:00:00.000Z",
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
      { name: "primary_interest", type: "string", defaultValue: "Art" },
      { name: "secondary_interest", type: "string", defaultValue: "Food" },
      { name: "third_interest", type: "string", defaultValue: "Music" },
      { name: "job_position", type: "string", defaultValue: "No Job" },
      { name: "job_company", type: "string", defaultValue: "No Company" },
      { name: "age_filter", type: "multiple" },
      { name: "location_filter", type: "multiple" },
      { name: "primary_palette", type: "string", defaultValue: "Indigo" },
      { name: "secondary_palette", type: "string", defaultValue: "Cyan" },
      { name: "display_name", type: "string", defaultValue: "Nameless" },
      { name: "gender", type: "string", defaultValue: "Male" },
      { name: "matches", type: "multiple" },
      { name: "likes", type: "multiple" }

    ],
  },
] as const;

export type SchemaTables = typeof tables;
export type InferredTypes = SchemaInference<SchemaTables>;

export type Users = InferredTypes["Users"];
export type UsersRecord = Users & XataRecord;

export type DatabaseSchema = {
  Users: UsersRecord;
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
