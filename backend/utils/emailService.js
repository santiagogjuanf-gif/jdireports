// ================================================
// SERVICIO DE EMAILS
// JD CLEANING SERVICES
// ================================================

const nodemailer = require('nodemailer');

/**
 * Configuración del transporter de emails
 * En desarrollo usa Mailtrap, en producción usa Gmail
 */
const createTransporter = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // Mailtrap para desarrollo
    return nodemailer.createTransporter({
      host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
      port: process.env.MAILTRAP_PORT || 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
      }
    });
  } else {
    // Gmail para producción
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
};

/**
 * Template HTML base para emails
 */
const getEmailTemplate = (content, title = 'JDI Reports') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1E88E5, #43A047);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #1E88E5;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        .credentials-box {
          background: white;
          border-left: 4px solid #43A047;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .credentials-box strong {
          color: #1E88E5;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🧽 JD CLEANING SERVICES</div>
        <div>${title}</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>JD Cleaning Services<br>
        Email: jdireports@gmail.com<br>
        © ${new Date().getFullYear()} All rights reserved</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Email de bienvenida con credenciales
 */
const sendWelcomeEmail = async (userEmail, userName, username, temporaryPassword) => {
  try {
    const transporter = createTransporter();

    const content = `
      <h2>Welcome to JDI Reports, ${userName}!</h2>
      <p>Your account has been created successfully. Below are your login credentials:</p>

      <div class="credentials-box">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>

      <p><strong>⚠️ Important:</strong> You will be required to change your password on first login.</p>

      <p>You can access the system at:</p>
      <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="button">Access JDI Reports</a>

      <p>If you have any questions, please contact your administrator.</p>
    `;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'JDI Reports'}" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Welcome to JDI Reports - Your Account Credentials',
      html: getEmailTemplate(content, 'Welcome to JDI Reports')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email de asignación de orden
 */
const sendOrderAssignedEmail = async (userEmail, userName, orderNumber, clientName, address) => {
  try {
    const transporter = createTransporter();

    const content = `
      <h2>New Order Assigned</h2>
      <p>Hello ${userName},</p>
      <p>You have been assigned to a new work order.</p>

      <div class="credentials-box">
        <p><strong>Order:</strong> ${orderNumber}</p>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Address:</strong> ${address}</p>
      </div>

      <p>Please access the system to view order details and start work.</p>
      <a href="${process.env.APP_URL || 'http://localhost:5000'}/orders/${orderNumber}" class="button">View Order Details</a>
    `;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'JDI Reports'}" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `New Order Assigned - ${orderNumber}`,
      html: getEmailTemplate(content, 'New Order Assigned')
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email de orden completada
 */
const sendOrderCompletedEmail = async (userEmail, userName, orderNumber, clientName, workerName) => {
  try {
    const transporter = createTransporter();

    const content = `
      <h2>Order Completed</h2>
      <p>Hello ${userName},</p>
      <p>An order has been completed and is ready for review.</p>

      <div class="credentials-box">
        <p><strong>Order:</strong> ${orderNumber}</p>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Completed by:</strong> ${workerName}</p>
      </div>

      <p>Please review the work and generate the PDF report.</p>
      <a href="${process.env.APP_URL || 'http://localhost:5000'}/orders/${orderNumber}" class="button">Review Order</a>
    `;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'JDI Reports'}" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Order Completed - ${orderNumber}`,
      html: getEmailTemplate(content, 'Order Completed')
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email de solicitud de inventario aprobada
 */
const sendInventoryApprovedEmail = async (userEmail, userName, requestId, items) => {
  try {
    const transporter = createTransporter();

    const itemsList = items.map(item => `<li>${item.name} - Quantity: ${item.quantity}</li>`).join('');

    const content = `
      <h2>Inventory Request Approved</h2>
      <p>Hello ${userName},</p>
      <p>Your materials request #${requestId} has been approved.</p>

      <div class="credentials-box">
        <p><strong>Approved Items:</strong></p>
        <ul>
          ${itemsList}
        </ul>
      </div>

      <p>The materials will be delivered soon.</p>
    `;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'JDI Reports'}" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Materials Request Approved - #${requestId}`,
      html: getEmailTemplate(content, 'Request Approved')
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verifica la configuración de email
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is correct');
    return { success: true };
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderAssignedEmail,
  sendOrderCompletedEmail,
  sendInventoryApprovedEmail,
  verifyEmailConfig
};
