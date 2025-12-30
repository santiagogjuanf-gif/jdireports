// ================================================
// GENERADOR DE PDFs - JD CLEANING SERVICES
// ================================================

const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

// ================================================
// CONFIGURACIÓN
// ================================================

const config = {
  reportsDir: path.join(__dirname, '../../uploads/reports'),
  logoPath: path.join(__dirname, '../../assets/logo.png'),

  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#10b981',
    text: '#1e293b',
    lightGray: '#f1f5f9'
  },

  fonts: {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique'
  }
};

// ================================================
// INICIALIZAR DIRECTORIO DE REPORTES
// ================================================

const initializeReportsDirectory = async () => {
  try {
    await fs.mkdir(config.reportsDir, { recursive: true });
    console.log(' Directorio de reportes inicializado');
  } catch (error) {
    console.error('L Error al inicializar directorio de reportes:', error);
    throw error;
  }
};

// ================================================
// FORMATEAR FECHA
// ================================================

const formatDate = (date, language = 'es') => {
  if (!date) return 'N/A';

  const d = new Date(date);

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  const locales = {
    es: 'es-ES',
    en: 'en-US',
    fr: 'fr-FR'
  };

  return d.toLocaleString(locales[language] || 'es-ES', options);
};

// ================================================
// TRADUCIR TEXTOS
// ================================================

const translations = {
  title: {
    es: 'REPORTE DE SERVICIO DE LIMPIEZA',
    en: 'CLEANING SERVICE REPORT',
    fr: 'RAPPORT DE SERVICE DE NETTOYAGE'
  },
  orderNumber: {
    es: 'Número de Orden',
    en: 'Order Number',
    fr: 'Numéro de Commande'
  },
  orderType: {
    es: 'Tipo de Orden',
    en: 'Order Type',
    fr: 'Type de Commande'
  },
  regular: {
    es: 'Limpieza Regular',
    en: 'Regular Cleaning',
    fr: 'Nettoyage Régulier'
  },
  postConstruction: {
    es: 'Post-Construcción',
    en: 'Post-Construction',
    fr: 'Post-Construction'
  },
  clientInfo: {
    es: 'Información del Cliente',
    en: 'Client Information',
    fr: 'Informations Client'
  },
  client: {
    es: 'Cliente',
    en: 'Client',
    fr: 'Client'
  },
  address: {
    es: 'Dirección',
    en: 'Address',
    fr: 'Adresse'
  },
  phone: {
    es: 'Teléfono',
    en: 'Phone',
    fr: 'Téléphone'
  },
  email: {
    es: 'Email',
    en: 'Email',
    fr: 'Email'
  },
  serviceDetails: {
    es: 'Detalles del Servicio',
    en: 'Service Details',
    fr: 'Détails du Service'
  },
  scheduledDate: {
    es: 'Fecha Programada',
    en: 'Scheduled Date',
    fr: 'Date Prévue'
  },
  startedAt: {
    es: 'Iniciado',
    en: 'Started',
    fr: 'Commencé'
  },
  completedAt: {
    es: 'Completado',
    en: 'Completed',
    fr: 'Terminé'
  },
  workers: {
    es: 'Trabajadores Asignados',
    en: 'Assigned Workers',
    fr: 'Travailleurs Assignés'
  },
  responsible: {
    es: 'Responsable',
    en: 'Responsible',
    fr: 'Responsable'
  },
  areasCompleted: {
    es: 'Áreas Completadas',
    en: 'Areas Completed',
    fr: 'Zones Terminées'
  },
  area: {
    es: 'Área',
    en: 'Area',
    fr: 'Zone'
  },
  completedBy: {
    es: 'Completada por',
    en: 'Completed by',
    fr: 'Terminée par'
  },
  dailyReports: {
    es: 'Reportes Diarios',
    en: 'Daily Reports',
    fr: 'Rapports Quotidiens'
  },
  date: {
    es: 'Fecha',
    en: 'Date',
    fr: 'Date'
  },
  description: {
    es: 'Descripción',
    en: 'Description',
    fr: 'Description'
  },
  notes: {
    es: 'Notas',
    en: 'Notes',
    fr: 'Notes'
  },
  photoSummary: {
    es: 'Resumen de Fotos',
    en: 'Photo Summary',
    fr: 'Résumé des Photos'
  },
  totalPhotos: {
    es: 'Total de Fotos',
    en: 'Total Photos',
    fr: 'Total de Photos'
  },
  signatures: {
    es: 'Firmas',
    en: 'Signatures',
    fr: 'Signatures'
  },
  workerSignature: {
    es: 'Firma del Trabajador',
    en: 'Worker Signature',
    fr: 'Signature du Travailleur'
  },
  clientSignature: {
    es: 'Firma del Cliente',
    en: 'Client Signature',
    fr: 'Signature du Client'
  },
  footer: {
    es: 'JD Cleaning Services - Reporte Generado Automáticamente',
    en: 'JD Cleaning Services - Automatically Generated Report',
    fr: 'JD Cleaning Services - Rapport Généré Automatiquement'
  }
};

const t = (key, language = 'es') => {
  return translations[key]?.[language] || translations[key]?.es || key;
};

// ================================================
// GENERAR PDF DE ORDEN
// ================================================

const generateOrderPDF = async (orderData, options = {}) => {
  const { language = 'es' } = options;

  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${t('orderNumber', language)}: ${orderData.order_number}`,
          Author: 'JD Cleaning Services',
          Subject: t('title', language)
        }
      });

      const chunks = [];
      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // ENCABEZADO
      doc.fontSize(20)
         .fillColor(config.colors.primary)
         .font(config.fonts.bold)
         .text('JD CLEANING SERVICES', { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(14)
         .fillColor(config.colors.text)
         .text(t('title', language), { align: 'center' });

      doc.moveDown(1);
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke(config.colors.primary);

      // INFORMACIÓN DE LA ORDEN
      doc.moveDown(1);
      doc.fontSize(12)
         .font(config.fonts.bold)
         .fillColor(config.colors.text)
         .text(`${t('orderNumber', language)}:`, 50, doc.y, { continued: true })
         .font(config.fonts.regular)
         .text(` ${orderData.order_number}`);

      doc.font(config.fonts.bold)
         .text(`${t('orderType', language)}:`, 50, doc.y, { continued: true })
         .font(config.fonts.regular)
         .text(` ${orderData.order_type === 'regular' ? t('regular', language) : t('postConstruction', language)}`);

      // INFORMACIÓN DEL CLIENTE
      doc.moveDown(1.5);
      doc.fontSize(14)
         .font(config.fonts.bold)
         .fillColor(config.colors.primary)
         .text(t('clientInfo', language));

      doc.moveDown(0.5);
      doc.fontSize(11)
         .fillColor(config.colors.text)
         .font(config.fonts.bold)
         .text(`${t('client', language)}:`, 50, doc.y, { continued: true })
         .font(config.fonts.regular)
         .text(` ${orderData.client_name}`);

      doc.font(config.fonts.bold)
         .text(`${t('address', language)}:`, 50, doc.y, { continued: true })
         .font(config.fonts.regular)
         .text(` ${orderData.address}${orderData.city ? `, ${orderData.city}` : ''}`);

      if (orderData.client_phone) {
        doc.font(config.fonts.bold)
           .text(`${t('phone', language)}:`, 50, doc.y, { continued: true })
           .font(config.fonts.regular)
           .text(` ${orderData.client_phone}`);
      }

      if (orderData.client_email) {
        doc.font(config.fonts.bold)
           .text(`${t('email', language)}:`, 50, doc.y, { continued: true })
           .font(config.fonts.regular)
           .text(` ${orderData.client_email}`);
      }

      // DETALLES DEL SERVICIO
      doc.moveDown(1.5);
      doc.fontSize(14)
         .font(config.fonts.bold)
         .fillColor(config.colors.primary)
         .text(t('serviceDetails', language));

      doc.moveDown(0.5);
      doc.fontSize(11)
         .fillColor(config.colors.text)
         .font(config.fonts.bold)
         .text(`${t('scheduledDate', language)}:`, 50, doc.y, { continued: true })
         .font(config.fonts.regular)
         .text(` ${formatDate(orderData.scheduled_date, language)}`);

      if (orderData.work_started_at) {
        doc.font(config.fonts.bold)
           .text(`${t('startedAt', language)}:`, 50, doc.y, { continued: true })
           .font(config.fonts.regular)
           .text(` ${formatDate(orderData.work_started_at, language)}`);
      }

      if (orderData.work_completed_at) {
        doc.font(config.fonts.bold)
           .text(`${t('completedAt', language)}:`, 50, doc.y, { continued: true })
           .font(config.fonts.regular)
           .fillColor(config.colors.success)
           .text(` ${formatDate(orderData.work_completed_at, language)}`);
      }

      // TRABAJADORES
      if (orderData.workers && orderData.workers.length > 0) {
        doc.moveDown(1.5);
        doc.fontSize(14)
           .font(config.fonts.bold)
           .fillColor(config.colors.primary)
           .text(t('workers', language));

        doc.moveDown(0.5);
        doc.fontSize(11)
           .fillColor(config.colors.text);

        orderData.workers.forEach(worker => {
          const label = worker.is_responsible
            ? ` ${worker.name} (${t('responsible', language)})`
            : `  ${worker.name}`;
          doc.font(config.fonts.regular)
             .text(label, 60);
        });
      }

      // ÁREAS COMPLETADAS (Solo órdenes regulares)
      if (orderData.order_type === 'regular' && orderData.areas && orderData.areas.length > 0) {
        doc.moveDown(1.5);
        doc.fontSize(14)
           .font(config.fonts.bold)
           .fillColor(config.colors.primary)
           .text(t('areasCompleted', language));

        doc.moveDown(0.5);
        doc.fontSize(11)
           .fillColor(config.colors.text);

        orderData.areas.forEach(area => {
          const areaName = area[`name_${language}`] || area.name_es;
          doc.font(config.fonts.regular)
             .text(` ${areaName}`, 60);

          if (area.completed_by_name && area.completed_at) {
            doc.fontSize(9)
               .fillColor(config.colors.secondary)
               .text(`   ${t('completedBy', language)}: ${area.completed_by_name} - ${formatDate(area.completed_at, language)}`, 60);
            doc.fontSize(11)
               .fillColor(config.colors.text);
          }
        });
      }

      // REPORTES DIARIOS (Solo post-construcción)
      if (orderData.order_type === 'post_construction' && orderData.daily_reports && orderData.daily_reports.length > 0) {
        doc.addPage();
        doc.fontSize(14)
           .font(config.fonts.bold)
           .fillColor(config.colors.primary)
           .text(t('dailyReports', language), 50, 50);

        doc.moveDown(0.5);
        doc.fontSize(11)
           .fillColor(config.colors.text);

        orderData.daily_reports.forEach((report, index) => {
          if (index > 0) doc.moveDown(1);

          doc.font(config.fonts.bold)
             .text(`${t('date', language)}: ${formatDate(report.report_date, language)}`, 50);

          doc.font(config.fonts.regular)
             .text(report.description, 60, doc.y, {
               width: 480,
               align: 'justify'
             });

          if (report.photos_count) {
            doc.fontSize(9)
               .fillColor(config.colors.secondary)
               .text(`${t('totalPhotos', language)}: ${report.photos_count}`, 60);
            doc.fontSize(11)
               .fillColor(config.colors.text);
          }
        });
      }

      // NOTAS
      if (orderData.notes) {
        doc.moveDown(1.5);
        doc.fontSize(14)
           .font(config.fonts.bold)
           .fillColor(config.colors.primary)
           .text(t('notes', language));

        doc.moveDown(0.5);
        doc.fontSize(11)
           .fillColor(config.colors.text)
           .font(config.fonts.regular)
           .text(orderData.notes, 60, doc.y, {
             width: 480,
             align: 'justify'
           });
      }

      // RESUMEN DE FOTOS
      if (orderData.photos_count) {
        doc.moveDown(1.5);
        doc.fontSize(14)
           .font(config.fonts.bold)
           .fillColor(config.colors.primary)
           .text(t('photoSummary', language));

        doc.moveDown(0.5);
        doc.fontSize(11)
           .fillColor(config.colors.text)
           .font(config.fonts.regular)
           .text(`${t('totalPhotos', language)}: ${orderData.photos_count}`, 60);

        doc.fontSize(9)
           .fillColor(config.colors.secondary)
           .text('(Las fotos están disponibles en el sistema digital)', 60);
      }

      // PIE DE PÁGINA
      doc.fontSize(9)
         .fillColor(config.colors.secondary)
         .font(config.fonts.italic)
         .text(
           `${t('footer', language)}\n${formatDate(new Date(), language)}`,
           50,
           doc.page.height - 50,
           { align: 'center', width: doc.page.width - 100 }
         );

      // Finalizar documento
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

// ================================================
// GUARDAR PDF EN DISCO
// ================================================

const savePDFToFile = async (pdfBuffer, filename) => {
  try {
    const filePath = path.join(config.reportsDir, filename);
    await fs.writeFile(filePath, pdfBuffer);
    return filePath;
  } catch (error) {
    console.error('L Error al guardar PDF:', error);
    throw error;
  }
};

// ================================================
// GENERAR Y GUARDAR REPORTE DE ORDEN
// ================================================

const generateAndSaveOrderReport = async (orderData, options = {}) => {
  try {
    // Inicializar directorio si no existe
    await initializeReportsDirectory();

    // Generar PDF
    const pdfBuffer = await generateOrderPDF(orderData, options);

    // Generar nombre de archivo
    const filename = `reporte-${orderData.order_number}-${Date.now()}.pdf`;

    // Guardar en disco
    const filePath = await savePDFToFile(pdfBuffer, filename);

    return {
      filename,
      filePath,
      url: `/uploads/reports/${filename}`
    };

  } catch (error) {
    console.error('L Error al generar y guardar reporte:', error);
    throw error;
  }
};

// ================================================
// EXPORTAR FUNCIONES
// ================================================

module.exports = {
  generateOrderPDF,
  savePDFToFile,
  generateAndSaveOrderReport,
  initializeReportsDirectory,
  formatDate,
  config
};
