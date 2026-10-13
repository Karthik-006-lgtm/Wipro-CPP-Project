import io
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

from app.schemas.resume_generator import ResumeGeneratorRequest


def add_bottom_border_to_paragraph(paragraph, color_hex="1F2937", size="12"):
    """
    Applies an XML bottom border to a Word paragraph.
    color_hex: e.g. '1F2937' or '2563EB'
    size: border thickness in 1/8 pt (e.g. '12' = 1.5 pt)
    """
    pPr = paragraph._p.get_or_add_pPr()
    pBdr = parse_xml(
        f'<w:pBdr {nsdecls("w")}>\n'
        f'  <w:bottom w:val="single" w:sz="{size}" w:space="4" w:color="{color_hex}"/>\n'
        f'</w:pBdr>'
    )
    pPr.append(pBdr)


def build_resume_docx(request: ResumeGeneratorRequest) -> bytes:
    """
    Generates a valid Microsoft Word compatible .docx resume document.
    Preserves section structure, headings, dates, and bullet points.
    Supports 'classic_professional' and 'modern_technical' layouts.
    """
    doc = docx.Document()
    template_id = request.template_id.lower()
    is_modern = "modern" in template_id

    # Configure printable margins: 0.65 in
    for section in doc.sections:
        section.top_margin = Inches(0.6)
        section.bottom_margin = Inches(0.6)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)

    p_info = request.personal_info

    # -------------------------------------------------------------
    # COLOR PALETTE SETUP
    # -------------------------------------------------------------
    if is_modern:
        name_color = RGBColor(30, 58, 138)  # Deep Navy #1E3A8A
        title_color = RGBColor(37, 99, 235)  # Royal Blue #2563EB
        heading_color = RGBColor(30, 58, 138)
        border_hex = "2563EB"
        border_sz = "14"  # ~1.75pt
        align_header = WD_ALIGN_PARAGRAPH.LEFT
    else:
        name_color = RGBColor(17, 24, 39)  # Slate Black #111827
        title_color = RGBColor(55, 65, 81)  # Charcoal #374151
        heading_color = RGBColor(17, 24, 39)
        border_hex = "1F2937"
        border_sz = "8"  # ~1pt
        align_header = WD_ALIGN_PARAGRAPH.CENTER

    body_color = RGBColor(31, 41, 55)  # #1F2937
    sub_color = RGBColor(71, 85, 105)  # #475569

    # -------------------------------------------------------------
    # 1. HEADER (NAME, TITLE, CONTACT DETAILS)
    # -------------------------------------------------------------
    p_name = doc.add_paragraph()
    p_name.alignment = align_header
    p_name.paragraph_format.space_before = Pt(0)
    p_name.paragraph_format.space_after = Pt(2)
    r_name = p_name.add_run(p_info.full_name or "Candidate Name")
    r_name.font.name = "Arial"
    r_name.font.size = Pt(22 if is_modern else 20)
    r_name.font.bold = True
    r_name.font.color.rgb = name_color

    if p_info.title:
        p_title = doc.add_paragraph()
        p_title.alignment = align_header
        p_title.paragraph_format.space_before = Pt(0)
        p_title.paragraph_format.space_after = Pt(3)
        r_title = p_title.add_run(p_info.title)
        r_title.font.name = "Arial"
        r_title.font.size = Pt(10.5)
        r_title.font.bold = is_modern
        r_title.font.italic = not is_modern
        r_title.font.color.rgb = title_color

    # Contact Info Line
    contact_parts = []
    if p_info.email:
        contact_parts.append(p_info.email)
    if p_info.phone:
        contact_parts.append(p_info.phone)
    if p_info.location:
        contact_parts.append(p_info.location)
    if p_info.linkedin:
        contact_parts.append(p_info.linkedin)
    if p_info.github:
        contact_parts.append(p_info.github)
    if p_info.portfolio:
        contact_parts.append(p_info.portfolio)

    if contact_parts:
        sep = "  •  " if is_modern else "  |  "
        p_contact = doc.add_paragraph()
        p_contact.alignment = align_header
        p_contact.paragraph_format.space_before = Pt(0)
        p_contact.paragraph_format.space_after = Pt(8)
        r_contact = p_contact.add_run(sep.join(contact_parts))
        r_contact.font.name = "Arial"
        r_contact.font.size = Pt(8.5)
        r_contact.font.color.rgb = sub_color

    # Helper for adding section headings with bottom line border
    def add_section_header(title: str):
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(10)
        p_sec.paragraph_format.space_after = Pt(4)
        p_sec.paragraph_format.keep_with_next = True
        r_sec = p_sec.add_run(title.upper())
        r_sec.font.name = "Arial"
        r_sec.font.size = Pt(11)
        r_sec.font.bold = True
        r_sec.font.color.rgb = heading_color
        add_bottom_border_to_paragraph(p_sec, color_hex=border_hex, size=border_sz)

    # -------------------------------------------------------------
    # 2. PROFESSIONAL SUMMARY
    # -------------------------------------------------------------
    if request.summary and request.summary.strip():
        add_section_header("Professional Summary")
        p_sum = doc.add_paragraph()
        p_sum.paragraph_format.space_before = Pt(2)
        p_sum.paragraph_format.space_after = Pt(6)
        r_sum = p_sum.add_run(request.summary.strip())
        r_sum.font.name = "Arial"
        r_sum.font.size = Pt(9.5)
        r_sum.font.color.rgb = body_color

    # -------------------------------------------------------------
    # 3. TECHNICAL SKILLS
    # -------------------------------------------------------------
    if request.skill_groups:
        add_section_header("Technical Skills")
        for sg in request.skill_groups:
            if not sg.skills:
                continue
            p_skill = doc.add_paragraph()
            p_skill.paragraph_format.space_before = Pt(1)
            p_skill.paragraph_format.space_after = Pt(2)
            
            r_cat = p_skill.add_run(f"{sg.category}: ")
            r_cat.font.name = "Arial"
            r_cat.font.size = Pt(9.5)
            r_cat.font.bold = True
            r_cat.font.color.rgb = heading_color if is_modern else body_color

            r_items = p_skill.add_run(", ".join(sg.skills))
            r_items.font.name = "Arial"
            r_items.font.size = Pt(9.5)
            r_items.font.color.rgb = body_color

    # -------------------------------------------------------------
    # 4. WORK EXPERIENCE
    # -------------------------------------------------------------
    if request.experience:
        add_section_header("Work Experience")
        for exp in request.experience:
            p_exp = doc.add_paragraph()
            p_exp.paragraph_format.space_before = Pt(4)
            p_exp.paragraph_format.space_after = Pt(1)
            p_exp.paragraph_format.keep_with_next = True

            r_role = p_exp.add_run(exp.role)
            r_role.font.name = "Arial"
            r_role.font.size = Pt(10)
            r_role.font.bold = True
            r_role.font.color.rgb = body_color

            loc_str = f" ({exp.location})" if exp.location else ""
            r_org = p_exp.add_run(f" — {exp.organization}{loc_str}")
            r_org.font.name = "Arial"
            r_org.font.size = Pt(9.5)
            r_org.font.italic = True
            r_org.font.color.rgb = sub_color

            # Dates
            date_str = ""
            if exp.start_date or exp.end_date or exp.current:
                end_label = "Present" if exp.current else (exp.end_date or "")
                date_str = f"  [{exp.start_date or ''} - {end_label}]".replace("[]", "")
            if date_str:
                r_date = p_exp.add_run(f"  {date_str}")
                r_date.font.name = "Arial"
                r_date.font.size = Pt(8.5)
                r_date.font.color.rgb = sub_color

            # Responsibilities bullets
            for resp in exp.responsibilities:
                if resp.strip():
                    p_b = doc.add_paragraph(style="List Bullet")
                    p_b.paragraph_format.space_before = Pt(0)
                    p_b.paragraph_format.space_after = Pt(1.5)
                    r_b = p_b.add_run(resp.strip())
                    r_b.font.name = "Arial"
                    r_b.font.size = Pt(9)
                    r_b.font.color.rgb = body_color

    # -------------------------------------------------------------
    # 5. TECHNICAL PROJECTS
    # -------------------------------------------------------------
    if request.projects:
        add_section_header("Key Technical Projects")
        for proj in request.projects:
            p_proj = doc.add_paragraph()
            p_proj.paragraph_format.space_before = Pt(4)
            p_proj.paragraph_format.space_after = Pt(1)
            p_proj.paragraph_format.keep_with_next = True

            r_pname = p_proj.add_run(proj.title)
            r_pname.font.name = "Arial"
            r_pname.font.size = Pt(10)
            r_pname.font.bold = True
            r_pname.font.color.rgb = body_color

            if proj.technologies:
                r_tech = p_proj.add_run(f"  [{', '.join(proj.technologies)}]")
                r_tech.font.name = "Arial"
                r_tech.font.size = Pt(8.5)
                r_tech.font.color.rgb = title_color if is_modern else sub_color

            if proj.link:
                r_link = p_proj.add_run(f" — {proj.link}")
                r_link.font.name = "Arial"
                r_link.font.size = Pt(8.5)
                r_link.font.color.rgb = sub_color

            if proj.description and proj.description.strip():
                p_pdesc = doc.add_paragraph()
                p_pdesc.paragraph_format.space_before = Pt(0)
                p_pdesc.paragraph_format.space_after = Pt(1.5)
                r_pdesc = p_pdesc.add_run(proj.description.strip())
                r_pdesc.font.name = "Arial"
                r_pdesc.font.size = Pt(9)
                r_pdesc.font.color.rgb = body_color

            for contrib in proj.contributions:
                if contrib.strip():
                    p_b = doc.add_paragraph(style="List Bullet")
                    p_b.paragraph_format.space_before = Pt(0)
                    p_b.paragraph_format.space_after = Pt(1.5)
                    r_b = p_b.add_run(contrib.strip())
                    r_b.font.name = "Arial"
                    r_b.font.size = Pt(9)
                    r_b.font.color.rgb = body_color

    # -------------------------------------------------------------
    # 6. EDUCATION
    # -------------------------------------------------------------
    if request.education:
        add_section_header("Education & Credentials")
        for edu in request.education:
            p_edu = doc.add_paragraph()
            p_edu.paragraph_format.space_before = Pt(3)
            p_edu.paragraph_format.space_after = Pt(1)
            p_edu.paragraph_format.keep_with_next = True

            r_deg = p_edu.add_run(edu.degree)
            r_deg.font.name = "Arial"
            r_deg.font.size = Pt(10)
            r_deg.font.bold = True
            r_deg.font.color.rgb = body_color

            r_inst = p_edu.add_run(f" — {edu.institution}")
            r_inst.font.name = "Arial"
            r_inst.font.size = Pt(9.5)
            r_inst.font.color.rgb = sub_color

            date_str = ""
            if edu.start_date or edu.end_date:
                date_str = f"  [{edu.start_date or ''} - {edu.end_date or ''}]".replace("[]", "")
            if date_str:
                r_edate = p_edu.add_run(f"  {date_str}")
                r_edate.font.name = "Arial"
                r_edate.font.size = Pt(8.5)
                r_edate.font.color.rgb = sub_color

            extra_details = []
            if edu.gpa_or_honors:
                extra_details.append(f"Honors/GPA: {edu.gpa_or_honors}")
            if edu.details:
                extra_details.append(edu.details)

            if extra_details:
                p_edet = doc.add_paragraph()
                p_edet.paragraph_format.space_before = Pt(0)
                p_edet.paragraph_format.space_after = Pt(2)
                r_edet = p_edet.add_run(" | ".join(extra_details))
                r_edet.font.name = "Arial"
                r_edet.font.size = Pt(8.5)
                r_edet.font.color.rgb = sub_color

    # -------------------------------------------------------------
    # 7. CERTIFICATIONS & ACHIEVEMENTS
    # -------------------------------------------------------------
    if request.certifications:
        add_section_header("Certifications & Awards")
        for cert in request.certifications:
            p_cert = doc.add_paragraph(style="List Bullet")
            p_cert.paragraph_format.space_before = Pt(0)
            p_cert.paragraph_format.space_after = Pt(1.5)

            r_cname = p_cert.add_run(cert.name)
            r_cname.font.name = "Arial"
            r_cname.font.size = Pt(9)
            r_cname.font.bold = True
            r_cname.font.color.rgb = body_color

            if cert.issuer:
                r_ciss = p_cert.add_run(f" — {cert.issuer}")
                r_ciss.font.name = "Arial"
                r_ciss.font.size = Pt(9)
                r_ciss.font.color.rgb = sub_color

            if cert.date:
                r_cdate = p_cert.add_run(f" ({cert.date})")
                r_cdate.font.name = "Arial"
                r_cdate.font.size = Pt(8.5)
                r_cdate.font.color.rgb = sub_color

            if cert.credential_url_or_id:
                r_cid = p_cert.add_run(f" [ID: {cert.credential_url_or_id}]")
                r_cid.font.name = "Arial"
                r_cid.font.size = Pt(8)
                r_cid.font.color.rgb = sub_color

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
                    p_c = doc.add_paragraph(style="List Bullet")
                    p_c.paragraph_format.space_before = Pt(0)
                    p_c.paragraph_format.space_after = Pt(1.5)
                    r_c = p_c.add_run(item.strip())
                    r_c.font.name = "Arial"
                    r_c.font.size = Pt(9)
                    r_c.font.color.rgb = body_color

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
