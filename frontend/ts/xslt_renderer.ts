/**
 * xslt_renderer.ts
 * ----------------
 * Applies the XSLT stylesheet to the resume XML in the browser,
 * updating the live preview pane without any server round-trip.
 *
 * The browser's native XSLTProcessor handles all transformation.
 * This is why preview is instant — it never touches the network.
 */

export class XSLTRenderer {
  private xslDoc: Document | null = null;
  private processor: XSLTProcessor | null = null;

  /**
   * Load the XSL stylesheet.  Must be called once before render().
   * @param xslPath  URL to the .xsl file (e.g. "../xsl/resume.xsl")
   */
  async load(xslPath: string): Promise<void> {
    const res = await fetch(xslPath);
    if (!res.ok) throw new Error(`Could not load XSL from ${xslPath}`);
    const text = await res.text();
    const parser = new DOMParser();
    this.xslDoc = parser.parseFromString(text, "application/xml");

    this.processor = new XSLTProcessor();
    this.processor.importStylesheet(this.xslDoc);
  }

  /**
   * Transform an XML string → HTML fragment and write it into targetEl.
   * No-op if the stylesheet has not been loaded yet.
   *
   * @param xmlString   Raw XML resume string
   * @param targetEl    DOM element to receive the rendered HTML
   */
  render(xmlString: string, targetEl: HTMLElement): void {
    if (!this.processor) {
      console.warn("XSLTRenderer: stylesheet not loaded yet.");
      return;
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      // XML not yet valid (user still typing) — skip silently
      return;
    }

    const resultDoc = this.processor.transformToDocument(xmlDoc);
    const resultEl  = resultDoc.documentElement;

    // Clear previous content and insert the new render
    targetEl.innerHTML = "";
    const imported = document.importNode(resultEl, true);
    targetEl.appendChild(imported);
  }
}
