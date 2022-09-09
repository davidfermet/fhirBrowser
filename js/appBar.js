customElements.define('app-bar', class AppBar extends HTMLElement {
    connectedCallback() {
        let shadow = this.attachShadow({ mode: 'closed' });
        shadow.innerHTML = `
            <link href="./material.css" rel="stylesheet"/>
            <style>
                div {
                    background-color: var(--primary-color, #000);
                    text-transform: uppercase;
                    color:#FFF; 
                    padding:1em;
                    display:flex;
                    flex-direction:row;
                    align-items:center;
                }
                i {
                    margin-right: 1.3em;
                    cursor: pointer;
                }
            </style>
            <div><i id="menu" class="material-icons">menu</i><span>${this.getAttribute("title")}</span></div>
        `;
        shadow.getElementById("menu").addEventListener("click", (event) => {
            this.dispatchEvent(new CustomEvent("navigationClick", {
                bubbles: false,
                cancelable: false
            }));
            event.stopPropagation();
        });
    }
});
