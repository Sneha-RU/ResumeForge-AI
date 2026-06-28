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
export class XMLManager {
    /**
     * Build the full resume XML string from the current form state.
     * Call this whenever any form field changes.
     */
    buildXML() {
        const e = (id) => this._escape(document.getElementById(id)?.value ?? "");
        const parts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            "<resume>",
            // ── personal ──────────────────────────────────────────
            "  <personal>",
            `    <name>${e("rf-name")}</name>`,
            `    <email>${e("rf-email")}</email>`,
            `    <phone>${e("rf-phone")}</phone>`,
            `    <linkedin>${e("rf-linkedin")}</linkedin>`,
            `    <github>${e("rf-github")}</github>`,
            "  </personal>",
            // ── education ──────────────────────────────────────────
            "  <education>",
            `    <degree>${e("rf-degree")}</degree>`,
            `    <institution>${e("rf-institution")}</institution>`,
            `    <location>${e("rf-edu-location")}</location>`,
            `    <gpa>${e("rf-gpa")}</gpa>`,
            `    <graduation>${e("rf-graduation")}</graduation>`,
            `    <coursework>${e("rf-coursework")}</coursework>`,
            `    <achievement>${e("rf-achievement")}</achievement>`,
            "  </education>",
            // ── skills ─────────────────────────────────────────────
            "  <skills>",
            ...this._skillGroups(),
            "  </skills>",
            // ── experience ─────────────────────────────────────────
            "  <experience>",
            ...this._jobEntries(),
            "  </experience>",
            // ── projects ───────────────────────────────────────────
            "  <projects>",
            ...this._projectEntries(),
            "  </projects>",
            // ── achievements ───────────────────────────────────────
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
    toPlainText() {
        const xml = this.buildXML();
        return xml
            .replace(/<[^>]+>/g, " ") // strip all tags
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, " ")
            .trim();
    }
    // ── Private helpers ────────────────────────────────────────────────────
    /** Read all skill-group inputs (name + content). */
    _skillGroups() {
        const lines = [];
        document.querySelectorAll(".rf-skill-group").forEach(grp => {
            const name = this._escape(grp.querySelector(".rf-sg-name")?.value ?? "");
            const content = this._escape(grp.querySelector(".rf-sg-content")?.value ?? "");
            if (name || content) {
                lines.push(`    <skill-group name="${name}">${content}</skill-group>`);
            }
        });
        return lines;
    }
    /** Read all experience job entries. */
    _jobEntries() {
        const lines = [];
        document.querySelectorAll(".rf-job").forEach(job => {
            const title = this._escape(job.querySelector(".rf-job-title")?.value ?? "");
            const company = this._escape(job.querySelector(".rf-job-company")?.value ?? "");
            const note = this._escape(job.querySelector(".rf-job-note")?.value ?? "");
            const loc = this._escape(job.querySelector(".rf-job-location")?.value ?? "");
            const period = this._escape(job.querySelector(".rf-job-period")?.value ?? "");
            const bullets = this._readBullets(job);
            lines.push("    <job>", `      <title>${title}</title>`, `      <company>${company}</company>`, `      <company-note>${note}</company-note>`, `      <location>${loc}</location>`, `      <period>${period}</period>`, "      <bullets>", ...bullets.map(b => `        <bullet>${this._escape(b)}</bullet>`), "      </bullets>", "    </job>");
        });
        return lines;
    }
    /** Read all project entries. */
    _projectEntries() {
        const lines = [];
        document.querySelectorAll(".rf-project").forEach(proj => {
            const name = this._escape(proj.querySelector(".rf-proj-name")?.value ?? "");
            const tech = this._escape(proj.querySelector(".rf-proj-tech")?.value ?? "");
            const period = this._escape(proj.querySelector(".rf-proj-period")?.value ?? "");
            const ghHref = this._escape(proj.querySelector(".rf-proj-github")?.value ?? "");
            const demoHref = this._escape(proj.querySelector(".rf-proj-demo")?.value ?? "");
            const bullets = this._readBullets(proj);
            lines.push("    <project>", `      <name>${name}</name>`, `      <tech>${tech}</tech>`, `      <period>${period}</period>`, "      <bullets>", ...bullets.map(b => `        <bullet>${this._escape(b)}</bullet>`), "      </bullets>", "      <links>", ...(ghHref ? [`        <link href="${ghHref}">GitHub</link>`] : []), ...(demoHref ? [`        <link href="${demoHref}">Live Demo</link>`] : []), "      </links>", "    </project>");
        });
        return lines;
    }
    /** Read all achievement entries. */
    _achievementEntries() {
        const lines = [];
        document.querySelectorAll(".rf-achievement").forEach(ach => {
            const title = this._escape(ach.querySelector(".rf-ach-title")?.value ?? "");
            const subtitle = this._escape(ach.querySelector(".rf-ach-subtitle")?.value ?? "");
            const period = this._escape(ach.querySelector(".rf-ach-period")?.value ?? "");
            const bullets = this._readBullets(ach);
            lines.push("    <item>", `      <title>${title}</title>`, `      <subtitle>${subtitle}</subtitle>`, `      <period>${period}</period>`, "      <bullets>", ...bullets.map(b => `        <bullet>${this._escape(b)}</bullet>`), "      </bullets>", "    </item>");
        });
        return lines;
    }
    /** Read all textarea bullets inside a parent element. */
    _readBullets(parent) {
        const result = [];
        parent.querySelectorAll(".rf-bullet").forEach(ta => {
            const val = ta.value.trim();
            if (val)
                result.push(val);
        });
        return result;
    }
    /** XML-escape a string. */
    _escape(s) {
        return s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }
}
//# sourceMappingURL=xml_manager.js.map