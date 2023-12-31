(function () {

    class FhirBrowserAbout extends HTMLElement {
        constructor() {
            super();
            this._shadow = this.attachShadow({ mode: 'closed' })
            this._shadow.appendChild(template.content.cloneNode(true));
        }
    }

    const template = document.createElement('template');
    template.innerHTML = `
        <link href="./assets/material.css" rel="stylesheet"/>
        <style>
            main {
                padding:1em;
                max-width:
            }
            icon {
                height: 5em;
            }
            a {
                color:var(--primary-color);
            }
            p {
                max-width
            }
        </style>
        <main>
            <p>
                FHIR Browser is and <a target="_blank" href="https://github.com/hprieurgarrouste/fhirBrowser.git">open source</a> utility developed by and intended for FHIR developers<br/>and all IT professionals who work with a FHIR server.
                <br/>Its purpose is to help users analyze FHIR servers and learn about their content.
            </p>
            <a target="_blank" href="https://github.com/hprieurgarrouste/fhirBrowser/blob/master/licence.md">
                <img src="https://img.shields.io/static/v1?label=license&message=CC-BY-NC-ND-4.0&color=green"/>
            </a>
        </main>
    `;

    window.customElements.define('fhir-browser-about', FhirBrowserAbout);
})();