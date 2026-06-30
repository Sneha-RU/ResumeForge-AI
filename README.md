# ResumeForge AI

ResumeForge AI is a multi-page career workspace that lets developers build structured resumes and optimize them for Applicant Tracking Systems (ATS). It pairs a lightweight, client-side frontend with a FastAPI backend that runs semantic text analysis and live PDF generation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11%2B-blue.svg)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Setup and Installation](#setup-and-installation)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture Overview

- **Frontend**: A single-page structure built with Vanilla JS, Bootstrap 5, and custom styling (with dynamic dark/light mode support). It uses XSLT stylesheets to render structural resume XML into print-ready layouts in real time.
- **Backend**: Built with FastAPI. It handles PDF rendering (via WeasyPrint) and hosts the NLP models used for keyword extraction and score calculation.
- **ATS Semantic Engine**:
  - **Keyword Extraction**: Uses spaCy's NER and statistical tokenization models to automatically identify core industry keywords (languages, concepts, frameworks) in target job descriptions.
  - **Alignment Scoring**: Uses scikit-learn to calculate TF-IDF vector cosine similarity between the resume text and the job description, mapping the result to a letter grade (A–D) and surfacing exact matched vs. missing terms.

---

## Features

- **Live Preview Editor** — Updates your resume's format dynamically using XSLT templates as you type.
- **Local Autocommit** — Saves the current XML structure to LocalStorage on every keystroke, so progress is never lost.
- **ATS Scan** — Paste a target job description to get an alignment score, a letter grade, and highlighted key terms you're missing.
- **Direct PDF Scan** — Upload an existing PDF resume to evaluate its score without rebuilding it manually.
- **Clean PDF Compilation** — Exports print-ready, typographically clean PDFs via WeasyPrint.

---

## Setup and Installation

### Prerequisites

- Python 3.11+
- System packages for **WeasyPrint** (Pango, Cairo, GObject)
  - **macOS**: `brew install pango cairo libffi`
  - **Ubuntu/Debian**:
    ```bash
    sudo apt-get install build-essential python3-dev python3-pip python3-setuptools python3-wheel python3-cffi libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info
    ```

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/resumeforge-ai.git
   cd resumeforge-ai
   ```

2. **Set up the virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt

   # Download the spaCy model
   python -m spacy download en_core_web_sm
   ```

4. **Launch the server:**
   ```bash
   # From the backend folder:
   uvicorn main:app --reload --port 8000
   ```

   Open **http://localhost:8000** in your browser. The frontend is served directly by the backend router.

---

## Deployment

Since WeasyPrint relies on system-level libraries, deploying via **Docker** is highly recommended. A `Dockerfile` is provided in the root directory to bundle the Python environment, spaCy assets, and OS-level C libraries.

To deploy on [Render](https://render.com):

1. Create a new **Web Service**.
2. Link your repository.
3. Select **Docker** as the environment.

Render will automatically build the image and serve the application.

---

## Project Structure

```
resumeforge-ai/
├── backend/
│   ├── main.py            # FastAPI app entrypoint
│   ├── requirements.txt   # Python dependencies
│   └── ...                # NLP, scoring, and PDF rendering modules
├── frontend/
│   ├── index.html
│   ├── static/             # JS, CSS, XSLT stylesheets
│   └── ...
├── Dockerfile
└── README.md
```

---

## Contributing

Contributions are welcome! Please open an issue to discuss any major changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).