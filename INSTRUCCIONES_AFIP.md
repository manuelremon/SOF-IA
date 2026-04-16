# Guía de Configuración AFIP (Facturación Electrónica)

Esta guía detalla los pasos para obtener los certificados necesarios para que SOF-IA pueda emitir facturas oficiales.

## 1. Generar Clave Privada y CSR (Certificate Signing Request)

Para el entorno de **Homologación** (Pruebas) o **Producción**, necesitas generar una clave privada (.key) y un pedido de certificado (.csr).

Si tienes OpenSSL instalado, ejecuta:

```bash
# Generar clave privada
openssl genrsa -out afip.key 2048

# Generar CSR (reemplaza CUIT_AQUI por tu CUIT sin guiones)
openssl req -new -key afip.key -subj "/C=AR/O=SOF-IA/CN=SOF-IA_CUIT_AQUI/serialNumber=CUIT CUIT_AQUI" -out afip.csr
```

## 2. Obtener el Certificado (.crt) en AFIP

### Para Homologación (Pruebas):
1. Ingresa a [AFIP](https://www.afip.gob.ar) con tu Clave Fiscal.
2. Busca el servicio **"WSASS - Autogestión de Certificados de Homologación"**. (Si no lo tienes, debes adherirlo).
3. Selecciona "Nuevo Certificado".
4. Sube el archivo `afip.csr` generado en el paso anterior.
5. Descarga el certificado generado (ej: `afip.crt`).

### Para Producción:
1. Ingresa a la página de AFIP.
2. Busca el servicio **"Administración de Certificados Digitales"**.
3. Carga el CSR y descarga el CRT.
4. Luego, debes asociar el "Alias" del certificado al servicio **"Facturación Electrónica" (wsfe)** en el servicio **"Administrador de Relaciones de Clave Fiscal"**.

## 3. Configurar en SOF-IA

Una vez que tengas los archivos `afip.key` y `afip.crt`, ve a la sección de **Configuración > Facturación AFIP** en la aplicación y completa:

- **CUIT del Emisor:** Tu CUIT sin guiones.
- **Punto de Venta:** El número de punto de venta configurado en AFIP (ej: 1).
- **Entorno:** Selecciona "Homologación" para pruebas o "Producción" para emitir facturas reales.
- **Archivo Certificado (CRT):** Selecciona el archivo descargado de AFIP.
- **Archivo Clave Privada (KEY):** Selecciona el archivo generado por OpenSSL.

---
*Nota: Es recomendable guardar estos archivos en una carpeta segura fuera del directorio de instalación de la aplicación.*
