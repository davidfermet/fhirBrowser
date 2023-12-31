(function () {

    class ListRowCheck extends HTMLElement {
        constructor() {
            super();
            this._shadow = this.attachShadow({ mode: 'closed' });
            this._shadow.appendChild(template.content.cloneNode(true));
        }

        static get observedAttributes() { return ["selected"]; }

        attributeChangedCallback(name, oldValue, newValue) {
            if ("selected" === name) {
                this._shadow.querySelector("input[type=checkbox]").checked = (newValue !== null);
            }
        }
    };

    const template = document.createElement('template');
    template.innerHTML = `
        <style>
            main {
                padding: 0.5em 1em;
                background-color: inherit;
                display: flex;
                flex-direction: row;
                align-items: center;
            }
            main[selected], main:hover {
                background-color: var(--hover-color, rgba(0, 0, 0, 5%));
            }
            div {
                flex-grow: 1;
            }
            input[type="checkbox"] {
                margin-left: 1em;
            }
        </style>
        <main>
            <div><slot></slot></div>
            <input type="checkbox"></input>
        </main>
    `;

    window.customElements.define('list-row-check', ListRowCheck);
})();
