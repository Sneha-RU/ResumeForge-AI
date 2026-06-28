# ResumeForge AI

ResumeForge AI is an intelligent, multi-page resume builder that leverages Machine Learning (TF-IDF + spaCy) to automatically grade your resume against target job descriptions and help you optimize for ATS (Applicant Tracking Systems). 

Built with a blazing-fast Python FastAPI backend and a sleek, glassmorphic vanilla JavaScript frontend.

## Features
- 📝 **Live PDF Preview**: See your resume update in real-time as you type, rendered dynamically using XSLT.
- 💾 **Local Auto-Sync**: Your progress is saved locally on every keystroke. Never lose your draft!
- 🤖 **AI ATS Scorer**: Paste a Job Description to get an instant match score (0-100), a letter grade, and a list of missing/matched keywords.
- 📄 **PDF Uploads**: Already have a resume? Upload a PDF to the ATS Scorer to grade it without rebuilding it.
- 🚀 **Full PDF Export**: One-click download of a beautifully formatted, print-ready PDF powered by WeasyPrint.

## Tech Stack
- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Glassmorphism design), Bootstrap 5.
- **Backend**: Python 3.11, FastAPI.
- **Machine Learning**: `scikit-learn` (TF-IDF cosine similarity), `spaCy` (NER and Tokenization).
- **PDF Generation**: `weasyprint`, `Jinja2`.

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/resumeforge-ai.git
   cd resumeforge-ai
   ```

2. **Set up the Python Virtual Environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Download the spaCy AI model
   python -m spacy download en_core_web_sm
   ```

4. **Run the Application**
   ```bash
   # From the backend folder:
   uvicorn main:app --reload --port 8000
   ```
   *The frontend is served directly by the FastAPI app. Open your browser and navigate to `http://localhost:8000` to view the app!*

## Deployment (Docker / Render)

Because ResumeForge AI utilizes WeasyPrint (which requires OS-level dependencies like Pango and Cairo), it is highly recommended to deploy this application using **Docker**.

A production-ready `Dockerfile` is included in the root of the project.

### Deploying to Render (Free)
1. Push this repository to your GitHub account.
2. Go to [Render.com](https://render.com) and create a new **Web Service**.
3. Connect your GitHub account and select this repository.
4. Render will automatically detect the `Dockerfile`. 
5. Click **Create Web Service**. Render will build the Docker container (which installs the required C-libraries, Python packages, and the spaCy model) and deploy it.

## License
MIT License.
