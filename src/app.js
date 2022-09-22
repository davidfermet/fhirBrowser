import "./appBar.js";
import "./fhirBundle.js";
import "./fhirMetadata.js";
import "./fhirResource.js";
import "./fhirServerSelector.js";

/* Only register a service worker if it's supported */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
}

if (window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.setAttribute('color-scheme', 'dark');
}

customElements.define('fhir-browser', class App extends HTMLElement {
    constructor() {
        super();
        this._schemas = {
            '4.3.0': 'R4B',
            '4.0.1': 'R4',
            '3.0.2': 'STU3'
        }

        this._shadow = this.attachShadow({ mode: 'open' });
        this._shadow.innerHTML = `
            <link rel="stylesheet" href="./material.css">
            <style>
                #app {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    font-family: Roboto, Arial, monospace;
                    font-size: 1rem;
                    font-weight: 400;
                    line-height: 1.5;
                    background-color: var(--background-color, rgb(255,255,255));
                    color: var(--text-color-normal, rgb(0,0,0,87%));
                }
                #header {
                    min-height:56px;
                }
                #content {
                    flex:1 1 auto;
                    overflow: auto;
                    height : 0;
                }
                #content > div {
                    display:flex;
                    flex-direction: row;
                    height : 100%;
                }
                #leftPanel {
                    border-right:1px solid var(--border-color, gray);
                    width:300px;
                    display:flex;
                    flex-direction: column;
                    height : 100%;
                }
                #bdy {
                    padding:1em;
                    overflow: auto;
                    flex: 1 1 auto;
                    width: 0;
                }
                #metadata {
                    flex: 1 1 auto;
                    height: 0;
                }
                @media (max-width:480px){
                    #leftPanel {
                        height: calc(100% - 56px - 1px);
                        position: absolute;
                        background-color: var(--background-color, rgb(255,255,255));
                    }
                }
            </style>
            <div id="app">
                <app-bar id="header" title="FHIR Browser"></app-bar>
                <div id="content">
                    <div>
                        <div id="leftPanel">
                            <fhir-server-selector id="serverSelector"></fhir-server-selector>
                            <fhir-metadata id="metadata"></fhir-metadata>
                        </div>
                        <div id="bdy">
                            <fhir-bundle id="bundle" hidden></fhir-bundle>
                            <fhir-resource id="resource" hidden></fhir-resource>
                        </div>
                    </div>
                </div>
            </div>
		`;
        this._bdy = this._shadow.getElementById("bdy");
        this._server = null;
        this._dialog = null;
    }
    connectedCallback() {
        const leftPanel = this._shadow.getElementById("leftPanel");
        const bundle = this._shadow.getElementById("bundle");
        const resource = this._shadow.getElementById("resource");

        this._shadow.getElementById("header").addEventListener('navigationClick', (event) => {
            leftPanel.style.display = ('none' == leftPanel.style.display) ? 'flex' : 'none';
        });

        this._shadow.getElementById("metadata").addEventListener('resourceTypeSelected', (event) => {
            if (window.matchMedia("(max-width: 480px)").matches) {
                leftPanel.style.display = 'none';
            }
            resource.hidden = true;
            bundle.hidden = false;
            bundle.load(this._server, event.detail.resourceType);
        });

        resource.addEventListener('back', (event) => {
            resource.hidden = true;
            bundle.hidden = false;
        });

        bundle.addEventListener('resourceSelected', (event) => {
            bundle.hidden = true;
            resource.hidden = false;
            resource.load({
                "server": this._server,
                "resourceType": event.detail.resourceType,
                "resourceId": event.detail.resourceId
            });
        });

        this._shadow.getElementById("serverSelector").addEventListener('serverchanged', (event) => {
            this._server = event.detail.server;
            bundle.hidden = true;
            resource.hidden = true;

            this.fetchMetadata().then(metadata => {
                this._server.version = this._schemas[metadata.fhirVersion];
                this._server.metadata = metadata;
                this._shadow.getElementById("metadata").metadata = metadata;
            });
        });
    }

    async fetchMetadata() {
        const response = await fetch(`${this._server.url}/metadata?_format=json`, {
            "cache": "reload",
            "headers": this._server.headers
        });
        return response.json();
    }

});
