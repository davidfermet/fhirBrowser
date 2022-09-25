import "./appDataTable.js";
import "./appLinearLoader.js";
import "./appPagination.js";
import "./appTitle.js";

customElements.define('fhir-bundle', class FhirBundle extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'closed' });
        this._shadow.innerHTML = `
            <link href="./material.css" rel="stylesheet"/>
            <style>
                #wrapper {
                    display:flex;
                    flex-direction:column;
                    height:100%;
                }
                #table {
                    flex:1 1 auto;
                    height:0;
                }
                #header {
                    margin: 0.5em 0;
                    display: flex;
                    align-items: center;
                }
            </style>
            <div id="wrapper">
                <app-title id="title">
                    <app-round-button id="help" title="Help">help</app-round-button>
                </app-title>
                <app-linear-loader id="loader" style="visibility:hidden;"></app-linear-loader>
                <data-table id="table">
                    <data-table-pagination id="pagination" slot="footer"/>
                </data-table>
            </div>
        `;
        this._server = null;
        this._resourceType = null;
        this._skip = 0;
        this._pageSize = 20;
        this._link = null;
        this._count = null;
    }
    connectedCallback() {
        this._shadow.getElementById('help').addEventListener('click', () => {
            window.open(this._resourceType.profile, "_blank");
        });
        this._shadow.getElementById('pagination').addEventListener("pagination", ({ detail }) => {
            this.loadPage(detail.button);
        });
        const dataTable = this._shadow.getElementById('table');
        dataTable.addColumn("id");
        dataTable.addColumn("lastUpdated");
        dataTable.addEventListener('rowclick', ({ detail }) => {
            this.dispatchEvent(new CustomEvent("resourceSelected", {
                bubbles: false,
                cancelable: false,
                'detail': {
                    resourceType: this._resourceType,
                    resourceId: detail.resourceId
                }
            }));
        });
    }

    load(server, resourceType) {
        this._server = server;
        this._resourceType = resourceType;

        this._shadow.getElementById('title').setAttribute('caption', resourceType.type);

        this._skip = 0;
        this._link = {
            "first": `${this._server.url}/${this._resourceType.type}?_count=${this._pageSize}&_elements=entry.id,entry.lastupdated`
        };
        this.loadPage();
    }

    loadPage(page = 'first') {
        switch (page) {
            case 'first':
                this._skip = 0;
                break;
            case 'previous':
                this._skip -= this._pageSize;
                break;
            case 'next':
                this._skip += this._pageSize;
                break;
            case 'last':
                this._skip = Math.floor(this._count / this._pageSize) * this._pageSize;
                break;
            default:
                return;
        }
        const url = this._link[page];
        this._shadow.getElementById('table').removeAll();
        const loader = this._shadow.getElementById('loader');
        loader.style.visibility = "visible";
        this.fetchPage(url).then(data => {

            if (data.total) {
                this._count = data.total;
                this.parsePage(data);
                loader.style.visibility = "hidden";
            } else {
                this.fetchCount().then(count => {
                    this._count = count.total;
                    this.parsePage(data);
                    loader.style.visibility = "hidden";
                });
            }
        });
    }

    parsePage(data) {
        const dataTable = this._shadow.getElementById('table');
        const pagination = this._shadow.getElementById('pagination');
        let range = '0';
        if (this._count != 0) {
            range = `${this._skip + 1}-${Math.min(this._skip + this._pageSize, this._count)}`;
        }
        pagination.text = `${range} of ${this._count}`;
        if (data.entry) {
            data.entry.forEach(entry => {
                if (entry.resource && entry.resource.resourceType == this._resourceType.type) {
                    let row = {
                        "id": entry.resource.id,
                        "lastupdated": formatDate(entry.resource.meta.lastUpdated)
                    }
                    dataTable.addRow(entry.resource.id, row);
                }
                function formatDate(dte) {
                    let date = new Date(dte);
                    return date.toLocaleDateString("en", {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric'
                    });
                }
            });
            this._link = {};
            pagination.first = false;
            pagination.previous = false;
            pagination.next = false;
            pagination.last = false;
            data.link.forEach(link => {
                this._link[link.relation] = link.url;
                switch (link.relation) {
                    case 'first':
                        pagination.first = true;
                        break;
                    case 'previous':
                        pagination.previous = true;
                        break;
                    case 'next':
                        pagination.next = true;
                        break;
                    case 'last':
                        pagination.last = true;
                        break;
                    default:
                        break;
                }
            });
        }
    }

    async fetchPage(url) {
        const response = await fetch(url, {
            "headers": this._server.headers
        });
        return response.json();
    }

    async fetchCount() {
        const response = await fetch(`${this._server.url}/${this._resourceType.type}?_summary=count&_format=json`, {
            "headers": this._server.headers
        });
        return response.json();
    }
});