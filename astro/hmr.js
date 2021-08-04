if (import.meta.hot) {
  const parser = new DOMParser();
  let refreshIndicator = null;
  const appendRefreshIndicator = () => {
    if (refreshIndicator !== null) {
      return refreshIndicator;
    }
    class AstroHMR extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: 'open'});
        const div = document.createElement('div');
        div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
</svg>`
        const style = document.createElement('style');
        style.textContent = `:host {
          --size: 40px;
          --offset: 12px;
          --radius: 8px;

          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          position: fixed;
          bottom: var(--offset);
          right: var(--offset);
          width: var(--size);
          height: var(--size);
          background: black;
          border-radius: var(--radius);
          pointer-events: none;
          transition: opacity 400ms cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 0 0 0 2px white;
        }

        :host([data-count="1"])::after {
          content: none;
        }
        :host::after {
          content: attr(data-count);
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 12px;
          font-weight: bold;
          padding: 4px;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: red;
          color: white;
          font-variant-numeric: tabular-nums;
        }

        svg {
          color: white;
          display: block;
          width: 24px;
          height: 24px;
        }

        :host(.active) svg {
          animation: spin 1200ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        :host(.active) {
          opacity: 1;
          transition: opacity 1s cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        @keyframes spin {
          from {
            transform: rotate(0);
          }
          to {
            transform: rotate(-360deg);
          }
        }`
        this.shadowRoot.append(style, div);
      }

      show() {
        clearTimeout(this.timeout);
        this.classList.add('active');
        this.dataset.count = (Number.parseInt(this.dataset.count || '0') + 1).toString()
        this.timeout = setTimeout(() => {
          this.classList.remove('active');
          delete this.dataset.count;
        }, 2500)
      }
    }
    customElements.define('astro-hmr', AstroHMR);

    const el = document.createElement('astro-hmr');
    document.body.appendChild(el);

    refreshIndicator = el;
    return refreshIndicator;
  }
  import.meta.hot.on("astro:reload", async ({ html }) => {
    const badge = appendRefreshIndicator();
    setTimeout(() => {
      badge.show();
    }, 0)
    const doc = parser.parseFromString(html, "text/html");

    updateHead(document.head, doc.head);
    updateBody(document.body, doc.body);

    function updateHead(head, newHead) {
      if (!newHead) {
        return;
      }

      // remove all nodes from the current HEAD except immutable ones
      for (let i = 0; i < head.childNodes.length; i++) {
        const current = head.childNodes[i];
        if (current.tagName === 'LINK') {
          continue;
        }
        head.removeChild(current);
        i--;
      }

      for (let i = 0; i < newHead.childNodes.length; i++) {
        const current = newHead.childNodes[i];
        if (
          current.nodeType !== current.ELEMENT_NODE
        ) {
          continue;
        }
        head.appendChild(current);
        // when we append existing child to another parent it removes
        // the node from a previous parent
        i--;
      }
    }

    async function updateBody(body, newBody) {
      const { default: morphdom } = await import("morphdom");
      morphdom(body, newBody, {
        onBeforeNodeDiscarded(node) {
          if (node.tagName === 'ASTRO-HMR') {
            return false;
          }
        },
        onBeforeElUpdated: function (fromEl, toEl) {
          // spec - https://dom.spec.whatwg.org/#concept-node-equals
          if (fromEl.isEqualNode(toEl)) {
            return false;
          }

          return true;
        },
      });
    }
  });
}
