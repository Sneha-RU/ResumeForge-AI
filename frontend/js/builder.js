/**
 * builder.ts
 * ----------
 * Entry point for the ResumeForge AI builder page.
 *
 * Responsibilities
 * ----------------
 * 1. On every form change → rebuild XML → update XSLT live preview
 * 2. When user clicks Analyse  → call /analyze → show ATS panel
 * 3. When user clicks Export PDF → call /export-pdf → download PDF
 * 4. Dynamic add/remove of job, project, achievement, bullet rows
 */
import { XMLManager } from "./xml_manager.js";
import { XSLTRenderer } from "./xslt_renderer.js";
import { exportPDF } from "./api_client.js";
import { getCurrentUser, saveDraftHTML, getDraftHTML, saveResume } from "./db.js";

const previewPane = document.getElementById("rf-preview");
const exportBtn = document.getElementById("rf-export-btn");
const saveBtn = document.getElementById("rf-save-btn");
const syncStatus = document.getElementById("auto-sync-status");
const form = document.getElementById("rf-form");

const xml = new XMLManager();
const renderer = new XSLTRenderer();
let syncTimer = null;

async function init() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Load XSLT stylesheet (one-time fetch)
    await renderer.load("../xsl/resume.xsl");
    
    // Load draft if exists
    const draftHTML = getDraftHTML();
    if (draftHTML) {
        form.innerHTML = draftHTML;
        // Strip data-bound so event listeners can be re-attached
        form.querySelectorAll('[data-bound]').forEach(el => delete el.dataset.bound);
    }

    // Re-bind dynamic controls
    _bindDynamicControls();

    // Initial render
    updatePreview();

    // Listen for any form change
    form.addEventListener("input", (e) => {
        // Sync values to attributes so innerHTML captures them
        const target = e.target;
        if (target.tagName === "INPUT") target.setAttribute("value", target.value);
        if (target.tagName === "TEXTAREA") target.textContent = target.value;

        updatePreview();

        if (syncTimer) clearTimeout(syncTimer);
        syncStatus.textContent = "Saving...";
        syncTimer = setTimeout(() => {
            saveDraftHTML(form.innerHTML);
            syncStatus.textContent = "All changes saved";
        }, 1000);
    });

    // Export PDF button
    exportBtn.addEventListener("click", handleExport);

    // Save Resume button
    saveBtn.addEventListener("click", () => {
        const title = prompt("Enter a title for this resume:", "My Resume");
        if (title !== null) {
            saveResume(title, xml.buildXML());
            alert("Resume saved to your Profile!");
        }
    });
}
function updatePreview() {
    const xmlString = xml.buildXML();
    renderer.render(xmlString, previewPane);
}
async function handleExport() {
    exportBtn.disabled = true;
    const originalText = exportBtn.textContent;
    exportBtn.textContent = "Generating PDF…";
    try {
        await exportPDF(xml.buildXML());
        exportBtn.textContent = "✓ Downloaded";
    }
    catch (err) {
        alert(err.message ?? "Export failed");
        exportBtn.textContent = "Export Failed";
    }
    finally {
        exportBtn.disabled = false;
        setTimeout(() => { exportBtn.textContent = originalText; }, 3000);
    }
}
/**
 * Bind all "Add …" and "Remove" buttons for repeatable sections
 * (jobs, projects, achievements, skill groups, bullets).
 */
function _bindDynamicControls() {
    // Add job
    document.getElementById("add-job-btn")?.addEventListener("click", () => {
        const container = document.getElementById("jobs-container");
        container.insertAdjacentHTML("beforeend", _jobTemplate());
        _bindRemoveButtons(container);
        updatePreview();
    });
    // Add project
    document.getElementById("add-proj-btn")?.addEventListener("click", () => {
        const container = document.getElementById("projects-container");
        container.insertAdjacentHTML("beforeend", _projectTemplate());
        _bindRemoveButtons(container);
        updatePreview();
    });
    // Add achievement
    document.getElementById("add-ach-btn")?.addEventListener("click", () => {
        const container = document.getElementById("achievements-container");
        container.insertAdjacentHTML("beforeend", _achievementTemplate());
        _bindRemoveButtons(container);
        updatePreview();
    });
    // Add skill group
    document.getElementById("add-sg-btn")?.addEventListener("click", () => {
        const container = document.getElementById("skills-container");
        container.insertAdjacentHTML("beforeend", _skillGroupTemplate());
        _bindRemoveButtons(container);
        updatePreview();
    });
    // Bind add-bullet buttons inside all current sections
    document.querySelectorAll(".add-bullet-btn").forEach(btn => {
        _bindAddBullet(btn);
    });
    // Bind remove buttons already in the DOM
    document.querySelectorAll(".rf-remove-btn").forEach(btn => {
        _bindOneRemove(btn);
    });
}
function _bindRemoveButtons(container) {
    container.querySelectorAll(".rf-remove-btn").forEach(btn => {
        _bindOneRemove(btn);
    });
    container.querySelectorAll(".add-bullet-btn").forEach(btn => {
        _bindAddBullet(btn);
    });
}
function _bindOneRemove(btn) {
    if (btn.dataset.bound)
        return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
        btn.closest(".rf-job, .rf-project, .rf-achievement, .rf-skill-group, .rf-bullet-row")
            ?.remove();
        updatePreview();
    });
}
function _bindAddBullet(btn) {
    if (btn.dataset.bound)
        return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
        const bulletList = btn.previousElementSibling;
        const row = document.createElement("div");
        row.className = "rf-bullet-row d-flex gap-2 mb-1";
        row.innerHTML = `
      <textarea class="form-control rf-bullet" rows="2"
        placeholder="Bullet point (XYZ format: achieved X by doing Z)"></textarea>
      <button type="button" class="btn btn-sm btn-outline-danger rf-remove-btn">✕</button>
    `;
        bulletList.appendChild(row);
        _bindOneRemove(row.querySelector(".rf-remove-btn"));
        row.querySelector("textarea").focus();
    });
}
function _jobTemplate() {
    return `
  <div class="rf-job card mb-2 p-3">
    <div class="d-flex justify-content-between mb-2">
      <strong>Job</strong>
      <button type="button" class="btn btn-sm btn-outline-danger rf-remove-btn">Remove</button>
    </div>
    <div class="row g-2 mb-2">
      <div class="col-6"><input class="form-control rf-job-title"    placeholder="Job title"></div>
      <div class="col-6"><input class="form-control rf-job-company"  placeholder="Company name"></div>
      <div class="col-6"><input class="form-control rf-job-note"     placeholder="Company note (e.g. Startup)"></div>
      <div class="col-6"><input class="form-control rf-job-location" placeholder="Location"></div>
      <div class="col-6"><input class="form-control rf-job-period"   placeholder="Period (e.g. Jan 2025 – Mar 2026)"></div>
    </div>
    <div class="rf-bullet-list mb-1"></div>
    <button type="button" class="btn btn-sm btn-outline-secondary add-bullet-btn">+ Add bullet</button>
  </div>`;
}
function _projectTemplate() {
    return `
  <div class="rf-project card mb-2 p-3">
    <div class="d-flex justify-content-between mb-2">
      <strong>Project</strong>
      <button type="button" class="btn btn-sm btn-outline-danger rf-remove-btn">Remove</button>
    </div>
    <div class="row g-2 mb-2">
      <div class="col-6"><input class="form-control rf-proj-name"   placeholder="Project name"></div>
      <div class="col-6"><input class="form-control rf-proj-tech"   placeholder="Tech stack"></div>
      <div class="col-6"><input class="form-control rf-proj-period" placeholder="Period"></div>
      <div class="col-6"><input class="form-control rf-proj-github" placeholder="GitHub URL"></div>
      <div class="col-6"><input class="form-control rf-proj-demo"   placeholder="Live Demo URL (optional)"></div>
    </div>
    <div class="rf-bullet-list mb-1"></div>
    <button type="button" class="btn btn-sm btn-outline-secondary add-bullet-btn">+ Add bullet</button>
  </div>`;
}
function _achievementTemplate() {
    return `
  <div class="rf-achievement card mb-2 p-3">
    <div class="d-flex justify-content-between mb-2">
      <strong>Achievement / Extracurricular</strong>
      <button type="button" class="btn btn-sm btn-outline-danger rf-remove-btn">Remove</button>
    </div>
    <div class="row g-2 mb-2">
      <div class="col-6"><input class="form-control rf-ach-title"    placeholder="Title"></div>
      <div class="col-6"><input class="form-control rf-ach-subtitle" placeholder="Subtitle (e.g. AKTU, Greater Noida)"></div>
      <div class="col-6"><input class="form-control rf-ach-period"   placeholder="Period"></div>
    </div>
    <div class="rf-bullet-list mb-1"></div>
    <button type="button" class="btn btn-sm btn-outline-secondary add-bullet-btn">+ Add bullet</button>
  </div>`;
}
function _skillGroupTemplate() {
    return `
  <div class="rf-skill-group d-flex gap-2 mb-2 align-items-start">
    <input class="form-control rf-sg-name"    placeholder="Label (e.g. Languages)" style="max-width:180px">
    <input class="form-control rf-sg-content" placeholder="Values (comma-separated)">
    <button type="button" class="btn btn-sm btn-outline-danger rf-remove-btn">✕</button>
  </div>`;
}
init().catch(console.error);
//# sourceMappingURL=builder.js.map