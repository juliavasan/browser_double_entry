// Adapter for Salesforce Lightning. See adapters/template.js for what each
// property means; this file is a filled-in example of it.

// Lightning names the inputs of compound fields (Name, addresses) differently
// from their API names. Other fields use the API name as the input name.
const INPUT_NAMES = {
  Salutation: "salutation",
  FirstName: "firstName",
  MiddleName: "middleName",
  LastName: "lastName",
  Suffix: "suffix",
};

const BASE_URL = /^(https:\/\/[^/]+\.(?:lightning\.force|my\.salesforce)\.com)\//;
const RECORD_URL = /\/lightning\/r\/(?:\w+\/)?([a-zA-Z0-9]{15,18})\/view/;

export default {
  name: "salesforce",
  label: "Salesforce",

  // Must match host_permissions in manifest.json.
  urls: ["https://*.lightning.force.com/*", "https://*.my.salesforce.com/*"],

  baseUrl(tabUrl) {
    return BASE_URL.exec(tabUrl)?.[1] ?? null;
  },

  // An expired session redirects to the login page on another domain.
  isLoggedIn(tabUrl, base) {
    return tabUrl.startsWith(base);
  },

  // The parent's ID goes in the address, so the child's form opens with the
  // link already filled in and nobody types into the lookup field.
  newRecordUrl(base, object, parent) {
    const url = `${base}/lightning/o/${object}/new`;
    return parent ? `${url}?defaultFieldValues=${linkField(parent.object)}=${parent.id}` : url;
  },

  inputSelector(object, field) {
    const name = INPUT_NAMES[field] ?? field;
    return `input[name="${name}"], textarea[name="${name}"]`;
  },

  saveButtonText: "Save",

  // After a save, Lightning shows the new record at /lightning/r/<Object>/<id>/view.
  savedRecordId(tabUrl) {
    return RECORD_URL.exec(tabUrl)?.[1] ?? null;
  },

  errorSelector: ".slds-form-element__help, .pageLevelErrors, [role='alert']",
};

// The child's field that points at its parent: AccountId for Account,
// Community__c for a custom object Community__c.
export function linkField(parentObject) {
  return parentObject.endsWith("__c") ? parentObject : `${parentObject}Id`;
}
