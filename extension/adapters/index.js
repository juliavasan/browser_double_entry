import salesforce from "./salesforce.js";

// The systems the extension can enter records into, by the name used in the
// JSON "system" field. To add one, copy template.js and register it here.
export const ADAPTERS = {
  [salesforce.name]: salesforce,
};
