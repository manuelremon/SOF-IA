import PyPDF2

pdf_path = r"c:\Users\MANUE\Documents\00_TRABAJO\Proyectos\GitHub\SOF-IA\Reporte_Auditoria_SOFIA_Corregido.pdf"
output_path = r"c:\Users\MANUE\Documents\00_TRABAJO\Proyectos\GitHub\SOF-IA\tmp_pdf_ext\output.txt"

with open(pdf_path, "rb") as f:
    reader = PyPDF2.PdfReader(f)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n====\n"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(text)
