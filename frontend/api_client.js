/**
 * api_client.ts
 * -------------
 * Typed wrappers around the three ResumeForge AI FastAPI endpoints.
 * Compile:  tsc  (see tsconfig.json)
 */
const API_BASE = ""; // same origin — FastAPI serves both API and frontend
/**
 * POST /analyze
 * Send plain-text resume + job description, receive ATS score.
 */
export async function analyzeResume(resumeText, jobDescription) {
    const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            resume_text: resumeText,
            job_description: jobDescription,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error ${res.status}`);
    }
    return res.json();
}
/**
 * POST /export-pdf
 * Send the raw XML string; receive and trigger download of PDF.
 */
export async function exportPDF(resumeXML) {
    const res = await fetch(`${API_BASE}/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_xml: resumeXML }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `PDF generation failed: ${res.status}`);
    }
    // Trigger browser download
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
/**
 * GET /health
 * Used during Railway startup checks.
 */
export async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        return res.ok;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=api_client.js.map