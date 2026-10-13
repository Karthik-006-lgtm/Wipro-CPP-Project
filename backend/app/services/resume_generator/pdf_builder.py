import io
from typing import List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from app.schemas.resume_generator import ResumeGeneratorRequest
from app.services.resume_generator.utils import escape_reportlab_text


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that accumulates total page count and stamps
    'Page X of Y' in the bottom right margin.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        # Print only if multi-page to keep single-page resumes completely clean
        if page_count > 1:
            text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(612 - 40, 22, text)
        self.restoreState()


def build_resume_pdf(request: ResumeGeneratorRequest) -> bytes:
    """
    Generates a valid, multi-page aware PDF document from structured resume data.
    Supports 'classic_professional' and 'modern_technical' template layouts.
    """
    buffer = io.BytesIO()
    template_id = request.template_id.lower()
    is_modern = "modern" in template_id

    # Margin setup: 40pt (~0.55 in)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    base_styles = getSampleStyleSheet()
    p_info = request.personal_info

    # -------------------------------------------------------------
    # STYLES CONFIGURATION BASED ON TEMPLATE
    # -------------------------------------------------------------
    if is_modern:
        primary_color = colors.HexColor("#1E3A8A")  # Dark Royal Navy
        secondary_color = colors.HexColor("#3B82F6")  # Accent Blue
        heading_color = colors.HexColor("#1E3A8A")
        sub_color = colors.HexColor("#475569")
        hr_color = colors.HexColor("#2563EB")
        hr_thickness = 1.75

        style_name = ParagraphStyle(
            "M_Name",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=21,
            leading=25,
            textColor=primary_color,
            alignment=0,  # Left
        )
        style_title = ParagraphStyle(
            "M_Title",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=secondary_color,
            alignment=0,
        )
        style_contact = ParagraphStyle(
            "M_Contact",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=sub_color,
            alignment=0,
        )
        style_section_h = ParagraphStyle(
            "M_SectionH",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=heading_color,
            spaceBefore=10,
            spaceAfter=2,
            keepWithNext=True,
        )
    else:  # Classic Professional
        primary_color = colors.HexColor("#111827")  # Classic Slate/Black
        heading_color = colors.HexColor("#111827")
        sub_color = colors.HexColor("#374151")
        hr_color = colors.HexColor("#1F2937")
        hr_thickness = 1.0

        style_name = ParagraphStyle(
            "C_Name",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=primary_color,
            alignment=1,  # Centered
        )
        style_title = ParagraphStyle(
            "C_Title",
            parent=base_styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=10.5,
            leading=13,
            textColor=sub_color,
            alignment=1,
        )
        style_contact = ParagraphStyle(
            "C_Contact",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=sub_color,
            alignment=1,
        )
        style_section_h = ParagraphStyle(
            "C_SectionH",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=13,
            textColor=heading_color,
            spaceBefore=10,
            spaceAfter=2,
            keepWithNext=True,
        )

    # Common body styles
    style_body = ParagraphStyle(
        "Common_Body",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1F2937"),
    )
    style_item_title = ParagraphStyle(
        "Common_ItemTitle",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0F172A"),
    )
    style_item_sub = ParagraphStyle(
        "Common_ItemSub",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor("#334155"),
    )
    style_item_date = ParagraphStyle(
        "Common_ItemDate",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748B"),
        alignment=2,  # Right aligned
    )
    style_bullet = ParagraphStyle(
        "Common_Bullet",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.75,
        leading=12.5,
        textColor=colors.HexColor("#1F2937"),
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=2,
    )

    story: List = []

    # -------------------------------------------------------------
    # 1. HEADER SECTION
    # -------------------------------------------------------------
    name_clean = escape_reportlab_text(p_info.full_name or "Candidate Name")
    story.append(Paragraph(f"<b>{name_clean}</b>", style_name))

    if p_info.title:
        title_clean = escape_reportlab_text(p_info.title)
        story.append(Spacer(1, 2))
        story.append(Paragraph(title_clean, style_title))

    # Contact Details Line
    contact_parts = []
    if p_info.email:
        contact_parts.append(escape_reportlab_text(p_info.email))
    if p_info.phone:
        contact_parts.append(escape_reportlab_text(p_info.phone))
    if p_info.location:
        contact_parts.append(escape_reportlab_text(p_info.location))
    if p_info.linkedin:
        contact_parts.append(escape_reportlab_text(p_info.linkedin))
    if p_info.github:
        contact_parts.append(escape_reportlab_text(p_info.github))
    if p_info.portfolio:
        contact_parts.append(escape_reportlab_text(p_info.portfolio))

    if contact_parts:
        sep = "  •  " if is_modern else "  |  "
        story.append(Spacer(1, 4))
        story.append(Paragraph(sep.join(contact_parts), style_contact))

    # Header divider rule
    story.append(
        HRFlowable(
            width="100%",
            thickness=hr_thickness,
            color=hr_color,
            spaceBefore=6,
            spaceAfter=8,
        )
    )

    # Helper for adding section headings
    def add_section_header(title: str):
        story.append(Paragraph(f"<b>{title.upper()}</b>", style_section_h))
        rule_color = hr_color if is_modern else colors.HexColor("#CBD5E1")
        rule_thickness = 1.0 if is_modern else 0.5
        story.append(
            HRFlowable(
                width="100%",
                thickness=rule_thickness,
                color=rule_color,
                spaceBefore=1,
                spaceAfter=5,
            )
        )

    # -------------------------------------------------------------
    # 2. PROFESSIONAL SUMMARY
    # -------------------------------------------------------------
    if request.summary and request.summary.strip():
        add_section_header("Professional Summary")
        summary_clean = escape_reportlab_text(request.summary.strip())
        story.append(Paragraph(summary_clean, style_body))
        story.append(Spacer(1, 6))

    # -------------------------------------------------------------
    # 3. TECHNICAL SKILLS
    # -------------------------------------------------------------
    if request.skill_groups:
        add_section_header("Technical Skills")
        for sg in request.skill_groups:
            if not sg.skills:
                continue
            cat_clean = escape_reportlab_text(sg.category)
            skills_str = ", ".join(escape_reportlab_text(s) for s in sg.skills)
            skill_line = f"<b>{cat_clean}:</b> {skills_str}"
            story.append(Paragraph(skill_line, style_body))
            story.append(Spacer(1, 2))
        story.append(Spacer(1, 4))

    # -------------------------------------------------------------
    # 4. WORK EXPERIENCE
    # -------------------------------------------------------------
    if request.experience:
        add_section_header("Work Experience")
        for idx, exp in enumerate(request.experience):
            role_clean = escape_reportlab_text(exp.role)
            org_clean = escape_reportlab_text(exp.organization)
            loc_clean = f" ({escape_reportlab_text(exp.location)})" if exp.location else ""

            date_str = ""
            if exp.start_date or exp.end_date or exp.current:
                end_label = "Present" if exp.current else (exp.end_date or "")
                date_str = f"{exp.start_date or ''} - {end_label}".strip(" -")
            date_clean = escape_reportlab_text(date_str)

            # Two-column layout for Role/Org and Date
            col1 = Paragraph(f"<b>{role_clean}</b> — <i>{org_clean}{loc_clean}</i>", style_item_title)
            col2 = Paragraph(date_clean, style_item_date)
            row_table = Table([[col1, col2]], colWidths=[380, 152])
            row_table.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ])
            )
            story.append(row_table)

            # Responsibilities bullets
            for resp in exp.responsibilities:
                if resp.strip():
                    story.append(Paragraph(f"• {escape_reportlab_text(resp.strip())}", style_bullet))

            if idx < len(request.experience) - 1:
                story.append(Spacer(1, 5))
        story.append(Spacer(1, 4))

    # -------------------------------------------------------------
    # 5. TECHNICAL PROJECTS
    # -------------------------------------------------------------
    if request.projects:
        add_section_header("Key Technical Projects")
        for idx, proj in enumerate(request.projects):
            title_clean = escape_reportlab_text(proj.title)
            tech_str = f" [{', '.join(escape_reportlab_text(t) for t in proj.technologies)}]" if proj.technologies else ""
            link_str = f" — {escape_reportlab_text(proj.link)}" if proj.link else ""

            header_p = Paragraph(f"<b>{title_clean}</b><font color='#475569'>{tech_str}{link_str}</font>", style_item_title)
            story.append(header_p)

            if proj.description and proj.description.strip():
                story.append(Paragraph(escape_reportlab_text(proj.description.strip()), style_body))

            for contrib in proj.contributions:
                if contrib.strip():
                    story.append(Paragraph(f"• {escape_reportlab_text(contrib.strip())}", style_bullet))

            if idx < len(request.projects) - 1:
                story.append(Spacer(1, 5))
        story.append(Spacer(1, 4))

    # -------------------------------------------------------------
    # 6. EDUCATION
    # -------------------------------------------------------------
    if request.education:
        add_section_header("Education & Credentials")
        for idx, edu in enumerate(request.education):
            degree_clean = escape_reportlab_text(edu.degree)
            inst_clean = escape_reportlab_text(edu.institution)

            date_str = ""
            if edu.start_date or edu.end_date:
                date_str = f"{edu.start_date or ''} - {edu.end_date or ''}".strip(" -")
            date_clean = escape_reportlab_text(date_str)

            col1 = Paragraph(f"<b>{degree_clean}</b> — {inst_clean}", style_item_title)
            col2 = Paragraph(date_clean, style_item_date)
            row_table = Table([[col1, col2]], colWidths=[380, 152])
            row_table.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ])
            )
            story.append(row_table)

            extra_details = []
            if edu.gpa_or_honors:
                extra_details.append(f"Honors/GPA: {escape_reportlab_text(edu.gpa_or_honors)}")
            if edu.details:
                extra_details.append(escape_reportlab_text(edu.details))

            if extra_details:
                story.append(Paragraph(" | ".join(extra_details), style_item_sub))

            if idx < len(request.education) - 1:
                story.append(Spacer(1, 4))
        story.append(Spacer(1, 4))

    # -------------------------------------------------------------
    # 7. CERTIFICATIONS & ACHIEVEMENTS
    # -------------------------------------------------------------
    if request.certifications:
        add_section_header("Certifications & Awards")
        for cert in request.certifications:
            name_clean = escape_reportlab_text(cert.name)
            issuer_clean = f" — {escape_reportlab_text(cert.issuer)}" if cert.issuer else ""
            date_clean = f" ({escape_reportlab_text(cert.date)})" if cert.date else ""
            cred_clean = f" [ID: {escape_reportlab_text(cert.credential_url_or_id)}]" if cert.credential_url_or_id else ""
            line = f"• <b>{name_clean}</b>{issuer_clean}{date_clean}{cred_clean}"
            story.append(Paragraph(line, style_bullet))
        story.append(Spacer(1, 4))

    # -------------------------------------------------------------
    # 8. OPTIONAL CUSTOM SECTIONS
    # -------------------------------------------------------------
    if request.custom_sections:
        for custom in request.custom_sections:
            if not custom.items:
                continue
            add_section_header(custom.title)
            for item in custom.items:
                if item.strip():
                    story.append(Paragraph(f"• {escape_reportlab_text(item.strip())}", style_bullet))
            story.append(Spacer(1, 4))

    # Build PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
