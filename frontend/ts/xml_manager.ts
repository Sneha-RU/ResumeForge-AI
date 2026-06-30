/**
 * xml_manager.ts
 * --------------
 * Converts builder form fields → XML string.
 * Also provides toPlainText() for the ML scoring endpoint.
 *
 * XML structure mirrors the Jinja2 template expectations in
 * backend/pdf/templates/resume.html and the XSLT in
 * frontend/xsl/resume.xsl.
 */

interface BulletSection {
  title:       string;
  subtitle?:   string;
  location?:   string;
  period?:     string;
  note?:       string;        // e.g. company description in parentheses
  bullets:     string[];
  tech?:       string;        // projects only
  links?:      { href: string; label: string }[];
}

export class XMLManager {

  /**
   * Build the full resume XML string from the current form state.
   * Call this whenever any form field changes.
   */
  buildXML(): string {
    const e = (id: string): string =>
      this._escape((document.getElementById(id) as HTMLInputElement)?.value ?? "");

    const parts: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<resume>",

      "  <personal>",
      `    <name>${e("rf-name")}</name>`,
      `    <email>${e("rf-email")}</email>`,
      `    <phone>${e("rf-phone")}</phone>`,
      `    <linkedin>${e("rf-linkedin")}</linkedin>`,
      `    <github>${e("rf-github")}</github>`,
      "  </personal>",

      "  <education>",
      `    <degree>${e("rf-degree")}</degree>`,
      `    <institution>${e("rf-institution")}</institution>`,
      `    <location>${e("rf-edu-location")}</location>`,
      `    <gpa>${e("rf-gpa")}</gpa>`,
      `    <graduation>${e("rf-graduation")}</graduation>`,
      `    <coursework>${e("rf-coursework")}</coursework>`,
      `    <achievement>${e("rf-achievement")}</achievement>`,
      "  </education>",

      "  <skills>",
      ...this._skillGroups(),
      "  </skills>",

      "  <experience>",
      ...this._jobEntries(),
      "  </experience>",

      "  <projects>",
      ...this._projectEntries(),
      "  </projects>",

      "  <achievements>",
      ...this._achievementEntries(),
      "  </achievements>",

      "</resume>",
    ];

    return parts.join("\n");
  }

  /**
   * Extract plain text from the current XML for ML scoring.
   * Strips all XML tags and returns space-separated content.
   */
  toPlainText(): string {
    const xml = this.buildXML();
    return xml
      .replace(/<[^>]+>/g, " ")   // strip all tags
      .replace(/&amp;/g,  "&")
      .replace(/&lt;/g,   "<")
      .replace(/&gt;/g,   ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g,    " ")
      .trim();
  }


  /** Read all skill-group inputs (name + content). */
  private _skillGroups(): string[] {
    const lines: string[] = [];
    document.querySelectorAll<HTMLElement>(".rf-skill-group").forEach(grp => {
      const name = this._escape(
        (grp.querySelector(".rf-sg-name") as HTMLInputElement)?.value ?? ""
      );
      const content = this._escape(
        (grp.querySelector(".rf-sg-content") as HTMLInputElement)?.value ?? ""
      );
      if (name || content) {
        lines.push(`    <skill-group name="${name}">${content}</skill-group>`);
      }
    });
    return lines;
  }

  /** Read all experience job entries. */
  private _jobEntries(): string[] {
    const lines: string[] = [];
    document.querySelectorAll<HTMLElement>(".rf-job").forEach(job => {
      const title   = this._escape((job.querySelector(".rf-job-title")    as HTMLInputElement)?.value ?? "");
      const company = this._escape((job.querySelector(".rf-job-company")  as HTMLInputElement)?.value ?? "");
      const note    = this._escape((job.querySelector(".rf-job-note")     as HTMLInputElement)?.value ?? "");
      const loc     = this._escape((job.querySelector(".rf-job-location") as HTMLInputElement)?.value ?? "");
      const period  = this._escape((job.querySelector(".rf-job-period")   as HTMLInputElement)?.value ?? "");
      const bullets = this._readBullets(job);
      lines.push(
        "    <job>",
        `      <title>${title}</title>`,
        `      <company>${company}</company>`,
        `      <company-note>${note}</company-note>`,
        `      <location>${loc}</location>`,
        `      <period>${period}</period>`,
        "      <bullets>",
        ...bullets.map(b => `        <bullet>${this._escape(b)}</bullet>`),
        "      </bullets>",
        "    </job>",
      );
    });
    return lines;
  }

  /** Read all project entries. */
  private _projectEntries(): string[] {
    const lines: string[] = [];
    document.querySelectorAll<HTMLElement>(".rf-project").forEach(proj => {
      const name   = this._escape((proj.querySelector(".rf-proj-name")   as HTMLInputElement)?.value ?? "");
      const tech   = this._escape((proj.querySelector(".rf-proj-tech")   as HTMLInputElement)?.value ?? "");
      const period = this._escape((proj.querySelector(".rf-proj-period") as HTMLInputElement)?.value ?? "");
      const ghHref = this._escape((proj.querySelector(".rf-proj-github") as HTMLInputElement)?.value ?? "");
      const demoHref = this._escape((proj.querySelector(".rf-proj-demo") as HTMLInputElement)?.value ?? "");
      const bullets = this._readBullets(proj);
      lines.push(
        "    <project>",
        `      <name>${name}</name>`,
        `      <tech>${tech}</tech>`,
        `      <period>${period}</period>`,
        "      <bullets>",
        ...bullets.map(b => `        <bullet>${this._escape(b)}</bullet>`),
        "      </bullets>",
        "      <links>",
        ...(ghHref   ? [`        <link href="${ghHref}">GitHub</link>`]   : []),
        ...(demoHref ? [`        <link href="${demoHref}">Live Demo</link>`] : []),
        "      </links>",
        "    </project>",
      );
    });
    return lines;
  }

  /** Read all achievement entries. */
  private _achievementEntries(): string[] {
    const lines: string[] = [];
    document.querySelectorAll<HTMLElement>(".rf-achievement").forEach(ach => {
      const title    = this._escape((ach.querySelector(".rf-ach-title")    as HTMLInputElement)?.value ?? "");
      const subtitle = this._escape((ach.querySelector(".rf-ach-subtitle") as HTMLInputElement)?.value ?? "");
      const period   = this._escape((ach.querySelector(".rf-ach-period")   as HTMLInputElement)?.value ?? "");
      const bullets  = this._readBullets(ach);
      lines.push(
        "    <item>",
        `      <title>${title}</title>`,
        `      <subtitle>${subtitle}</subtitle>`,
        `      <period>${period}</period>`,
        "      <bullets>",
        ...bullets.map(b => `        <bullet>${this._escape(b)}</bullet>`),
        "      </bullets>",
        "    </item>",
      );
    });
    return lines;
  }

  /** Read all textarea bullets inside a parent element. */
  private _readBullets(parent: HTMLElement): string[] {
    const result: string[] = [];
    parent.querySelectorAll<HTMLTextAreaElement>(".rf-bullet").forEach(ta => {
      const val = ta.value.trim();
      if (val) result.push(val);
    });
    return result;
  }

  /** XML-escape a string. */
  private _escape(s: string): string {
    return s
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&apos;");
  }
}
