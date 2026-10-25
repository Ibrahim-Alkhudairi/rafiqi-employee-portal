import "server-only";
import { demoStore } from "./demo-store";
import { sqlStore } from "./sql-store";
import type { Store } from "./types";

export const store: Store = process.env.RAFIQI_DB_URL ? sqlStore : demoStore;
