/**
 * db.js
 * -----
 * LocalStorage wrapper for persistence in the multi-page flow.
 */

const DB_KEY = "rf_app_data";

function getDB() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
        return {
            currentUser: null,
            resumes: [], // array of { id, title, xml, lastModified, atsScore, atsGrade }
            currentDraft: null // stores active XML while building
        };
    }
    try {
        return JSON.parse(raw);
    } catch(e) {
        console.error("Failed to parse DB", e);
        return { currentUser: null, resumes: [], currentDraft: null };
    }
}

function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function getCurrentUser() {
    return getDB().currentUser;
}

export function loginUser(name, email) {
    const db = getDB();
    db.currentUser = { name, email };
    saveDB(db);
}

export function registerUser(name, email, password) {
    const db = getDB();
    // Register user and set active session
    db.currentUser = { name, email };
    saveDB(db);
}

export function logoutUser() {
    const db = getDB();
    db.currentUser = null;
    saveDB(db);
}

export function saveDraft(xml) {
    const db = getDB();
    db.currentDraft = xml;
    saveDB(db);
}

export function saveDraftHTML(html) {
    const db = getDB();
    db.currentDraftHTML = html;
    saveDB(db);
}

export function getDraftHTML() {
    return getDB().currentDraftHTML;
}


export function getDraft() {
    return getDB().currentDraft;
}

export function saveResume(title, xml) {
    const db = getDB();
    const id = Date.now().toString();
    db.resumes.push({
        id,
        title: title || "Untitled Resume",
        xml,
        lastModified: new Date().toISOString(),
        atsScore: null,
        atsGrade: null
    });
    saveDB(db);
    return id;
}

export function updateATSScore(id, score, grade) {
    const db = getDB();
    const resume = db.resumes.find(r => r.id === id);
    if (resume) {
        resume.atsScore = score;
        resume.atsGrade = grade;
        saveDB(db);
    }
}

export function getResumes() {
    return getDB().resumes || [];
}
