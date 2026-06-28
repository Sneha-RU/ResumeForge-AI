/**
 * api_client.ts
 * -------------
 * Typed wrappers around the three ResumeForge AI FastAPI endpoints.
 * Compile:  tsc  (see tsconfig.json)
 */
const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "8000"
    ? "http://localhost:8000" // Local dev where frontend is on port 5500
    : "";                     // Production where frontend is served by FastAPI
// ── API calls ─────────────────────────────────────────────────────────────
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
        let msg = err.detail ?? `Server error ${res.status}`;
        if (Array.isArray(msg)) msg = msg.map(e => e.msg).join(", ");
        throw new Error(msg);
    }
    return res.json();
}
/**
 * POST /analyze-upload
 * Send PDF resume + job description, receive ATS score.
 */
export async function analyzeUploadedResume(file, jobDescription) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);
    const res = await fetch(`${API_BASE}/analyze-upload`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let msg = err.detail ?? `Server error ${res.status}`;
        if (Array.isArray(msg)) msg = msg.map(e => e.msg).join(", ");
        throw new Error(msg);
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
        let msg = err.detail ?? `PDF generation failed: ${res.status}`;
        if (Array.isArray(msg)) msg = msg.map(e => e.msg).join(", ");
        throw new Error(msg);
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