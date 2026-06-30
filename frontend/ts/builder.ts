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

import { XMLManager }   from "./xml_manager.js";
import { XSLTRenderer } from "./xslt_renderer.js";
import { ATSChecker }   from "./ats_checker.js";
import { analyzeResume, exportPDF } from "./api_client.js";


const previewPane    = document.getElementById("rf-preview")!;
const exportBtn      = document.getElementById("rf-export-btn")  as HTMLButtonElement;
const exportStatus   = document.getElementById("rf-export-status")!;


const xml      = new XMLManager();
const renderer = new XSLTRenderer();

const ats = new ATSChecker(
  "ats-panel",
  "rf-jd-textarea",
  "rf-analyse-btn",
  async (jdText: string) => {
    ats.showLoading();
    try {
      const result = await analyzeResume(xml.toPlainText(), jdText);
      ats.display(result);
    } catch (err: any) {
      ats.showError(err.message ?? "Analysis failed.");
    }
  }
);


async function init(): Promise<void> {
  // Load XSLT stylesheet (one-time fetch)
  await renderer.load("../xsl/resume.xsl");

  // Initial render with empty form
  updatePreview();

  // Listen for any form change → re-render preview
  document
    .getElementById("rf-form")!
    .addEventListener("input", updatePreview);

  // Export PDF button
  exportBtn.addEventListener("click", handleExport);

  // Dynamic section controls
  _bindDynamicControls();
}


function updatePreview(): void {
  const xmlString = xml.buildXML();
  renderer.render(xmlString, previewPane);
}


async function handleExport(): Promise<void> {
  exportBtn.disabled = true;
  exportStatus.textContent = "Generating PDF…";
  exportStatus.className   = "export-status export-loading";

  try {
    await exportPDF(xml.buildXML());
    exportStatus.textContent = "✓ Downloaded";
    exportStatus.className   = "export-status export-success";
  } catch (err: any) {
    exportStatus.textContent = `✗ ${err.message ?? "Export failed"}`;
    exportStatus.className   = "export-status export-error";
  } finally {
    exportBtn.disabled = false;
    setTimeout(() => { exportStatus.textContent = ""; }, 4000);
  }
}


/**
 * Bind all "Add …" and "Remove" buttons for repeatable sections
 * (jobs, projects, achievements, skill groups, bullets).
 */
function _bindDynamicControls(): void {

  // Add job
  document.getElementById("add-job-btn")?.addEventListener("click", () => {
    const container = document.getElementById("jobs-container")!;
    container.insertAdjacentHTML("beforeend", _jobTemplate());
    _bindRemoveButtons(container);
    updatePreview();
  });

  // Add project
  document.getElementById("add-proj-btn")?.addEventListener("click", () => {
    const container = document.getElementById("projects-container")!;
    container.insertAdjacentHTML("beforeend", _projectTemplate());
    _bindRemoveButtons(container);
    updatePreview();
  });

  // Add achievement
  document.getElementById("add-ach-btn")?.addEventListener("click", () => {
    const container = document.getElementById("achievements-container")!;
    container.insertAdjacentHTML("beforeend", _achievementTemplate());
    _bindRemoveButtons(container);
    updatePreview();
  });

  // Add skill group
  document.getElementById("add-sg-btn")?.addEventListener("click", () => {
    const container = document.getElementById("skills-container")!;
    container.insertAdjacentHTML("beforeend", _skillGroupTemplate());
    _bindRemoveButtons(container);
    updatePreview();
  });

  // Bind add-bullet buttons inside all current sections
  document.querySelectorAll(".add-bullet-btn").forEach(btn => {
    _bindAddBullet(btn as HTMLButtonElement);
  });

  // Bind remove buttons already in the DOM
  document.querySelectorAll(".rf-remove-btn").forEach(btn => {
    _bindOneRemove(btn as HTMLButtonElement);
  });
}

function _bindRemoveButtons(container: HTMLElement): void {
  container.querySelectorAll(".rf-remove-btn").forEach(btn => {
    _bindOneRemove(btn as HTMLButtonElement);
  });
  container.querySelectorAll(".add-bullet-btn").forEach(btn => {
    _bindAddBullet(btn as HTMLButtonElement);
  });
}

function _bindOneRemove(btn: HTMLButtonElement): void {
  if (btn.dataset.bound) return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    btn.closest(".rf-job, .rf-project, .rf-achievement, .rf-skill-group, .rf-bullet-row")
       ?.remove();
    updatePreview();
  });
}

function _bindAddBullet(btn: HTMLButtonElement): void {
  if (btn.dataset.bound) return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    const bulletList = btn.previousElementSibling as HTMLElement;
    const row = document.createElement("div");
    row.className = "rf-bullet-row d-flex gap-2 mb-1";
    row.innerHTML = `
      <textarea class="form-control rf-bullet" rows="2"
        placeholder="Bullet point (XYZ format: achieved X by doing Z)"></textarea>
      <button type="button" class="btn btn-sm btn-outline-danger rf-remove-btn">✕</button>
    `;
    bulletList.appendChild(row);
    _bindOneRemove(row.querySelector(".rf-remove-btn")!);
    (row.querySelector("textarea") as HTMLTextAreaElement).focus();
  });
}


function _jobTemplate(): string {
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

function _projectTemplate(): string {
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

function _achievementTemplate(): string {
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

function _skillGroupTemplate(): string {
  return `
  <div class="rf-skill-group d-flex gap-2 mb-2 align-items-start">
    <input class="form-control rf-sg-name"    placeholder="Label (e.g. Languages)" style="max-width:180px">
    <input class="form-control rf-sg-content" placeholder="Values (comma-separated)">
    <button type="button" class="btn btn-sm btn-outline-danger rf-remove-btn">✕</button>
  </div>`;
}


init().catch(console.error);
