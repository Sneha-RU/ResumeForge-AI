"""
PDF Generator
=============
Converts a resume XML string into a print-ready PDF using:
  1. xml.etree.ElementTree  — parse the XML
  2. Jinja2                 — render HTML template with resume data
  3. WeasyPrint             — HTML + CSS → PDF bytes

No external binary dependencies (unlike wkhtmltopdf / Puppeteer).
WeasyPrint is a pure-Python renderer that implements CSS 2.1 + CSS 3
selectors, so the template uses only well-supported properties.
"""

import os
import xml.etree.ElementTree as ET
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML as WeasyHTML


_TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")


class PDFGenerator:
    """
    Stateless generator — one instance created at startup, reused per request.
    """

    def __init__(self) -> None:
        self._jinja_env = Environment(
            loader=FileSystemLoader(_TEMPLATE_DIR),
            autoescape=True,
        )

    def generate(self, resume_xml: str) -> bytes:
        """
        Parse *resume_xml* and return PDF bytes.

        Parameters
        ----------
        resume_xml : str   Full XML string produced by the frontend builder

        Returns
        -------
        bytes   Raw PDF data (send as application/pdf)

        Raises
        ------
        ValueError   If the XML is malformed
        """
        data = self._parse_xml(resume_xml)
        html = self._render_html(data)
        return WeasyHTML(string=html).write_pdf()


    def _parse_xml(self, xml_string: str) -> dict:
        """
        Convert the resume XML into a flat Python dict for Jinja2.

        Expected XML structure (mirrors the frontend builder fields):
        <resume>
          <personal>
            <name>, <email>, <phone>, <linkedin>, <github>
          </personal>
          <education>
            <degree>, <institution>, <location>, <gpa>,
            <graduation>, <coursework>, <achievement>
          </education>
          <skills>
            <skill-group name="Languages">…</skill-group>
            …
          </skills>
          <experience>
            <job>
              <title>, <company>, <company-note>, <location>,
              <period>, <bullets><bullet>…</bullet></bullets>
            </job>
          </experience>
          <projects>
            <project>
              <name>, <tech>, <period>,
              <bullets><bullet>…</bullet></bullets>,
              <links><link href="…">label</link></links>
            </project>
          </projects>
          <achievements>
            <item>
              <title>, <subtitle>, <period>,
              <bullets><bullet>…</bullet></bullets>
            </item>
          </achievements>
        </resume>
        """
        try:
            root = ET.fromstring(xml_string)
        except ET.ParseError as exc:
            raise ValueError(f"Malformed XML: {exc}") from exc

        def text(parent, tag, default=""):
            el = parent.find(tag)
            return (el.text or "").strip() if el is not None else default

        def bullets(parent):
            return [
                b.text.strip()
                for b in parent.findall(".//bullet")
                if b.text
            ]

        # personal
        personal_el = root.find("personal") or ET.Element("personal")
        personal = {
            "name":     text(personal_el, "name", "Full Name"),
            "email":    text(personal_el, "email"),
            "phone":    text(personal_el, "phone"),
            "linkedin": text(personal_el, "linkedin"),
            "github":   text(personal_el, "github"),
        }

        # education
        edu_el = root.find("education") or ET.Element("education")
        education = {
            "degree":      text(edu_el, "degree"),
            "institution": text(edu_el, "institution"),
            "location":    text(edu_el, "location"),
            "gpa":         text(edu_el, "gpa"),
            "graduation":  text(edu_el, "graduation"),
            "coursework":  text(edu_el, "coursework"),
            "achievement": text(edu_el, "achievement"),
        }

        # skills — list of {name, content}
        skills = [
            {"name": sg.get("name", ""), "content": (sg.text or "").strip()}
            for sg in root.findall(".//skill-group")
        ]

        # experience — list of jobs
        experience = []
        for job in root.findall(".//job"):
            experience.append({
                "title":        text(job, "title"),
                "company":      text(job, "company"),
                "company_note": text(job, "company-note"),
                "location":     text(job, "location"),
                "period":       text(job, "period"),
                "bullets":      bullets(job),
            })

        # projects
        projects = []
        for proj in root.findall(".//project"):
            links = [
                {"href": lnk.get("href", "#"), "label": (lnk.text or "").strip()}
                for lnk in proj.findall(".//link")
            ]
            projects.append({
                "name":    text(proj, "name"),
                "tech":    text(proj, "tech"),
                "period":  text(proj, "period"),
                "bullets": bullets(proj),
                "links":   links,
            })

        # achievements
        achievements = []
        for item in root.findall(".//achievements/item"):
            achievements.append({
                "title":    text(item, "title"),
                "subtitle": text(item, "subtitle"),
                "period":   text(item, "period"),
                "bullets":  bullets(item),
            })

        return {
            "personal":     personal,
            "education":    education,
            "skills":       skills,
            "experience":   experience,
            "projects":     projects,
            "achievements": achievements,
        }

    def _render_html(self, data: dict) -> str:
        template = self._jinja_env.get_template("resume.html")
        return template.render(**data)
