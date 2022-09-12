import "./appTabs.js";
import "./fhirResourceTypes.js";
import "./fhirServerDetails.js";

customElements.define('fhir-metadata', class FhirMetadata extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'closed' });
        this._shadow.innerHTML = `
            <style>
                #wrapper {
                    display:flex;
                    flex-direction: column;
                    height : 100%;
                }
                #tabs {
                    border-bottom:1px solid var(--border-color, gray);                    
                }                
                #resourceTypes, #serverDetails {
                    flex:1 1 auto;
                    overflow: auto;
                    height:0;
                }
                #serverDetails {
                    display:none;
                }
            </style>
            <div id="wrapper">
                <app-tabs id="tabs">
                    <app-tab id="tabResources" selected>Resource Types</app-tab>
                    <app-tab id="tabDetails">Details</app-tab>
                </app-tabs>
                <fhir-resource-types id="resourceTypes"></fhir-resource-types>
                <fhir-server-details id="serverDetails"></fhir-server-details>
            </div>
        `;
        this._metadata = null;
    }
    connectedCallback() {
        this._shadow.getElementById("tabs").addEventListener('click', (event) => {
            const tabId = event.detail.tabId;
            this._shadow.getElementById("resourceTypes").style.display = (tabId == 'tabResources') ? 'block' : 'none';
            this._shadow.getElementById("serverDetails").style.display = (tabId == 'tabDetails') ? 'block' : 'none';
        });
        this._shadow.getElementById("resourceTypes").addEventListener('resourceTypeSelected', (event) => {
            this.dispatchEvent(new CustomEvent("resourceTypeSelected", {
                bubbles: false,
                cancelable: false,
                'detail': {
                    resourceType: event.detail.resourceType
                }
            }));
            event.stopPropagation();
        });
    }

    /**
    * @param {FhirMetadata} metadata
    */
    set metadata(metadata) {
        this._shadow.getElementById("resourceTypes").metadata = metadata;
        this._shadow.getElementById("serverDetails").metadata = metadata;
    }

});
