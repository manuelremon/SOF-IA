from fpdf import FPDF
from fpdf.enums import XPos, YPos

class AuditReportPDF(FPDF):
    def header(self):
        # Logo o Titulo Principal
        self.set_font('helvetica', 'B', 20)
        self.set_text_color(33, 37, 41)
        self.cell(0, 15, 'REPORTE DE AUDITORIA DE SOFTWARE', new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
        self.set_font('helvetica', 'I', 12)
        self.cell(0, 10, 'Proyecto: SOF-IA - Sistema de Gestion para Comercios', new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
        self.ln(10)
        # Linea divisoria
        self.set_draw_color(200, 200, 200)
        self.line(10, 40, 200, 40)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Pagina {self.page_no()}', align='C')

    def chapter_title(self, title):
        self.set_font('helvetica', 'B', 14)
        self.set_fill_color(240, 240, 240)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, title, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
        self.ln(4)

    def section_title(self, title):
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def body_text(self, text, is_quote=False):
        self.set_font('helvetica', '', 11)
        self.set_text_color(60, 60, 60)
        if is_quote:
            self.set_font('courier', 'I', 10)
            self.set_text_color(100, 0, 0)
            self.set_left_margin(15)
            self.multi_cell(0, 6, text)
            self.set_left_margin(10)
        else:
            self.multi_cell(0, 7, text)
        self.ln(4)

def create_pdf():
    pdf = AuditReportPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)
    
    # 1. Plan Mental
    pdf.chapter_title('1. Areas Criticas Analizadas')
    plan = [
        "* Seguridad y Autenticacion: Manejo de PINs y proteccion de datos.",
        "* Integridad de Datos: Transaccionalidad en el control de stock.",
        "* Arquitectura: Comunicacion IPC (Inter-Process Communication).",
        "* Rendimiento: Operaciones masivas y eficiencia SQLite.",
        "* UX/UI: Gestion de estado global y reactividad del frontend.",
        "* Ciclo de Vida: Migraciones de base de datos y consistencia."
    ]
    for item in plan:
        pdf.body_text(item)

    # 2. Hallazgos y Riesgos
    pdf.chapter_title('2. Hallazgos: Fallas y Riesgos Detectados')
    
    # A. Seguridad
    pdf.section_title('A. Seguridad: Hashing Debil y Falta de Salt')
    pdf.body_text('Ubicacion: electron/main/db/connection.ts')
    pdf.body_text('Fragmento critico:', is_quote=True)
    pdf.body_text('function hashPin(pin: string) { return createHash("sha256").update(pin).digest("hex") }', is_quote=True)
    pdf.body_text('Riesgo: El uso de SHA-256 sin salt es vulnerable a ataques de fuerza bruta. Un atacante con acceso a la base de datos podria extraer los PINs facilmente.')
    
    # B. Integridad
    pdf.section_title('B. Integridad: Condicion de Carrera en Control de Stock')
    pdf.body_text('Ubicacion: electron/main/services/salesService.ts')
    pdf.body_text('Fragmento critico (Validacion fuera de la transaccion):', is_quote=True)
    pdf.body_text('if (product.stock < item.quantity) { throw new Error("Stock insuficiente") }', is_quote=True)
    pdf.body_text('Riesgo: En entornos multi-terminal, dos ventas simultaneas podrian pasar la validacion antes de actualizar el stock, resultando en inventario negativo.')

    # C. Arquitectura
    pdf.section_title('C. Arquitectura: Tipado "unknown" en el Puente IPC')
    pdf.body_text('Ubicacion: electron/preload/index.ts')
    pdf.body_text('Impacto: Se pierde la seguridad de tipos en el frontend, lo que facilita la introduccion de errores al consumir APIs del backend sin validacion de esquemas.')

    # 3. Oportunidades de Mejora
    pdf.chapter_title('3. Oportunidades de Mejora')
    pdf.body_text('* Migrar a Drizzle Migrations puro: Eliminar scripts manuales de actualizacion de esquema en connection.ts.')
    pdf.body_text('* Optimizacion de Carga: Implementar actualizaciones masivas (bulk updates) eficientes.')
    pdf.body_text('* Robustecimiento de PINs: Implementar Argon2 o Bcrypt con salt unico por usuario.')

    # 4. Propuestas
    pdf.chapter_title('4. Nuevas Funcionalidades Sugeridas')
    pdf.body_text('1. Auditoria de Transacciones: Tabla de logs para rastrear ajustes manuales.')
    pdf.body_text('2. Validacion con Zod: Asegurar que los datos recibidos por IPC cumplan con el esquema.')
    pdf.body_text('3. Motor de Promociones: Soporte nativo para descuentos por cantidad.')

    # Conclusion
    pdf.ln(10)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(0, 102, 51)
    pdf.multi_cell(0, 10, 'CONCLUSION: El proyecto SOF-IA posee una arquitectura solida basada en estandares modernos. No obstante, los riesgos en seguridad y atomicidad deben ser priorizados antes de una fase de produccion critica.', border=1, align='C')

    pdf.output('Reporte_Auditoria_SOFIA_Corregido.pdf')

if __name__ == "__main__":
    create_pdf()
