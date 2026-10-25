import { SalesforceAdapter } from "./salesforce.js";

// To add a system: write an adapter with prepare() and enter(tabId, record),
// and register it here under the name used in the JSON "system" field.
export const ADAPTERS = {
  salesforce: SalesforceAdapter,
};
