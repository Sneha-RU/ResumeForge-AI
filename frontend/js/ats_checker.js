/**
 * ats_checker.ts
 * --------------
 * Manages the ATS Score panel in the builder UI.
 *
 * Renders:
 *   - Animated circular score gauge (0–100)
 *   - Grade badge (A / B / C / D)
 *   - Matched keywords (green badges)
 *   - Missing keywords (red badges)
 *   - Suggestions based on grade
 */
const GRADE_COLOR = {
    A: "#27500A",
    B: "#1a5fa8",
    C: "#633806",
    D: "#791F1F",
};
const GRADE_BG = {
    A: "#EAF3DE",
    B: "#E6F1FB",
    C: "#FAEEDA",
    D: "#FCEBEB",
};
const SUGGESTIONS = {
    A: "Strong match. Review the missing keywords and add any that genuinely apply.",
    B: "Good match. Adding the missing keywords could push you into the A range.",
    C: "Moderate match. Focus on incorporating the red keywords into your bullets.",
    D: "Low match. This job description may need a significantly tailored resume.",
};
export class ATSChecker {
    constructor(panelId, jdTextareaId, analyzeButtonId, onAnalyze) {
        this.debounceTimer = null;
        this.panel = document.getElementById(panelId);
        this.jdTextarea = document.getElementById(jdTextareaId);
        this.analyzeButton = document.getElementById(analyzeButtonId);
        this.onAnalyze = onAnalyze;
        this._bindEvents();
        this._showPlaceholder();
    }
    /** Render the full ATS result into the panel. */
    display(result) {
        const { match_score, matched_keywords, missing_keywords, grade } = result;
        this.panel.innerHTML = `
      <!-- Score gauge -->
      <div class="ats-gauge-row">
        <div class="ats-gauge">
          <svg viewBox="0 0 36 36" class="ats-circle-svg">
            <path class="ats-circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831
                         a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="ats-circle-fill"
              stroke="${this._scoreColor(match_score)}"
              stroke-dasharray="${match_score.toFixed(1)}, 100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831
                         a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <text x="18" y="20.35" class="ats-score-text">${match_score.toFixed(0)}</text>
          </svg>
        </div>
        <div class="ats-grade-block">
          <div class="ats-grade-badge"
               style="color:${GRADE_COLOR[grade]};background:${GRADE_BG[grade]}">
            Grade ${grade}
          </div>
          <p class="ats-suggestion">${SUGGESTIONS[grade]}</p>
        </div>
      </div>

      <!-- Matched keywords -->
      ${matched_keywords.length > 0
            ? `
      <div class="ats-kw-section">
        <p class="ats-kw-label ats-kw-matched">✓ Matched keywords (${matched_keywords.length})</p>
        <div class="ats-kw-wrap">
          ${matched_keywords.map((k) => `<span class="kw-badge kw-green">${k}</span>`).join("")}
        </div>
      </div>`
            : ""}

      <!-- Missing keywords -->
      ${missing_keywords.length > 0
            ? `
      <div class="ats-kw-section">
        <p class="ats-kw-label ats-kw-missing">✗ Add these keywords (${missing_keywords.length})</p>
        <div class="ats-kw-wrap">
          ${missing_keywords.map((k) => `<span class="kw-badge kw-red">${k}</span>`).join("")}
        </div>
      </div>`
            : ""}
    `;
    }
    /** Show loading spinner while request is in flight. */
    showLoading() {
        this.panel.innerHTML = `
      <div class="ats-loading">
        <div class="ats-spinner"></div>
        <p>Analysing…</p>
      </div>`;
    }
    /** Show error state. */
    showError(message) {
        this.panel.innerHTML = `
      <div class="ats-error">
        <p>⚠ ${message}</p>
      </div>`;
    }
    _showPlaceholder() {
        this.panel.innerHTML = `
      <div class="ats-placeholder">
        <p>Paste a job description above and click <strong>Analyse</strong> to see your ATS match score.</p>
      </div>`;
    }
    _bindEvents() {
        this.analyzeButton.addEventListener("click", async () => {
            const jd = this.jdTextarea.value.trim();
            if (!jd) {
                this.showError("Please paste a job description first.");
                return;
            }
            await this.onAnalyze(jd);
        });
        // Auto-analyse after user stops typing (1.2 s debounce)
        this.jdTextarea.addEventListener("input", () => {
            if (this.debounceTimer)
                clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                const jd = this.jdTextarea.value.trim();
                if (jd.length > 100)
                    await this.onAnalyze(jd);
            }, 1200);
        });
    }
    _scoreColor(score) {
        if (score >= 75)
            return "#27500A";
        if (score >= 55)
            return "#1a5fa8";
        if (score >= 35)
            return "#633806";
        return "#791F1F";
    }
}
//# sourceMappingURL=ats_checker.js.map