import conf from "../conf.js";
import "./appBar.js";
import "./fhirBundle.js";
import "./fhirServerSelector.js";
import "./fhirResourceList.js";
import "./fhirServerDetails.js";
import "./appTabs.js";

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
                    padding:25px;
                    overflow: auto;
                    flex: 1 1 auto;
                    width: 0;
                }
                #footer {
                    min-height:56px;
                    border-top:1px solid var(--border-color, gray);
                }
                app-tabs {
                    border-bottom:1px solid var(--border-color, gray);                    
                }
                #serverResources, #serverDetails {
                    flex:1 1 auto;
                    overflow: auto;
                    height:0;
                }
                #serverDetails {
                    display:none;
                }
            </style>
            <div id="app">
                <app-bar id="header" title="FHIR Browser"></app-bar>
                <div id="content">
                    <div>
                        <div id="leftPanel">
                            <fhir-server-selector id="serverSelector"></fhir-server-selector>
                            <app-tabs id="tabs">
                                <app-tab id="tabResources" selected>Resources</app-tab>
                                <app-tab id="tabDetails">Details</app-tab>
                            </app-tabs>
                            <fhir-resources-list id="serverResources"></fhir-resources-list>
                            <fhir-server-details id="serverDetails"></fhir-server-details>
                        </div>                        
                        <div id="bdy"></div>
                    </div>
                </div>
                <div id="footer"></div>
            </div>
		`;
        this._bdy = this._shadow.getElementById("bdy");
        this._list = this._shadow.getElementById("serverResources");
        this._serverDetails = this._shadow.getElementById("serverDetails");
        const serverSelector = this._shadow.getElementById("serverSelector");
        serverSelector.setup(conf);
        this._server = null;
    }
    connectedCallback() {
        this._shadow.getElementById("header").addEventListener('navigationClick', (event) => {
            const leftPanel = this._shadow.getElementById("leftPanel");
            leftPanel.style.display = ('none' == leftPanel.style.display) ? 'flex' : 'none';
        });

        this._shadow.getElementById("serverResources").addEventListener('resourceSelected', (event) => {
            while (this._bdy.firstChild) {
                this._bdy.removeChild(this._bdy.lastChild);
            }
            let bundle = document.createElement('fhir-bundle');
            this._bdy.appendChild(bundle);
            bundle.load(this._server, event.detail.resourceType);
        });

        this._shadow.getElementById("serverSelector").addEventListener('serverchanged', (event) => {
            const server = event.detail.server;
            if (server && conf[server]) {
                this.connect(conf[server]);
            }
        });

        this._shadow.getElementById("tabs").addEventListener('click', (event) => {
            const tabId = event.detail.tabId;
            this._list.style.display = (tabId == 'tabResources') ? 'block' : 'none';
            this._serverDetails.style.display = (tabId == 'tabDetails') ? 'block' : 'none';
        });

    }

    connect(server) {
        this._server = server;
        if (server.auth) {
            switch (server.auth.method) {
                case "oauth2":
                    this.oauth2_getToken(server.auth.setup).then(response => {
                        server.headers.Authorization = `${response.token_type} ${response.access_token}`;
                        this.initialize();
                    });
                    break;
                case "basic":
                    let auth = btoa(`${server.auth.setup.username}:${server.auth.setup.password}`);
                    server.headers.Authorization = `Basic ${auth}`;
                    this.initialize();
                    break;
                default:
                    break;
            }
        } else {
            this.initialize();
        }
    }

    async oauth2_getToken(setup) {
        let urlParams = {
            "client_id": setup.client_id,
            "client_secret": setup.client_secret,
            "grant_type": setup.grant_type,
            "username": setup.username,
            "password": setup.password
        }
        let result = new URLSearchParams(urlParams);
        const response = await fetch(setup.access_token_url, {
            "headers": {
                "Content-type": "application/x-www-form-urlencoded"
            },
            "method": "POST",
            "body": result.toString()
        });
        return response.json();
    }

    async initialize() {
        while (this._bdy.firstChild) this._bdy.removeChild(this._bdy.lastChild);
        this._list.clear();
        this._serverDetails.clear();

        this.loadMetadata().then(metadata => {
            this._server.version = this._schemas[metadata.fhirVersion];
            this._server.metadata = metadata;
            this._list.metadata = metadata;
            this._serverDetails.metadata = metadata;
        });
    }

    async loadMetadata() {
        const response = await fetch(`${this._server.url}/metadata?_format=json`, {
            "cache": "reload",
            "headers": this._server.headers
        });
        return response.json();
    }

    async countAllResources(resources) {
        const results = {};
        let urls = [];
        resources.forEach(resource => {
            urls.push(`${this._server.url}/${resource.type}?_summary=count&_format=json`);
        });
        await Promise.all(urls.map(url => fetch(url, { "headers": this._server.headers })
            .then(resp => resp.json())
            .then(result => result.total)))
            .then(counts => {
                counts.map((item, i) => results[resources[i].type] = item);
            })
        return results;
    }

});
