const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

// Initialize email transporter
let transporter = null;

function initializeEmail() {
  if (transporter) return transporter;

  // Email configuration from environment variables
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // Only initialize if credentials are provided
  if (emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport(emailConfig);
    console.log('✅ Email service initialized');
  } else {
    console.log('⚠️  Email credentials not found - email notifications disabled');
  }

  return transporter;
}

// Initialize on module load
initializeEmail();

/**
 * Send email
 */
async function sendEmail(to, subject, html, text = null) {
  if (!transporter) {
    console.log('Email service not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `"FshatiBio" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Email template for order confirmation
 */
function getOrderConfirmationTemplate(order, orderItems, address) {
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${parseFloat(item.unit_price).toFixed(2)} L</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${parseFloat(item.total_price).toFixed(2)} L</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .total { font-size: 18px; font-weight: bold; color: #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🥛 FshatiBio</h1>
          <p>Konfirmim Porosie</p>
        </div>
        <div class="content">
          <p>Përshëndetje,</p>
          <p>Faleminderit për porosinë tuaj! Porosia juaj u regjistrua me sukses.</p>
          
          <div class="order-info">
            <h3>Detajet e Porosisë</h3>
            <p><strong>Numri i Porosisë:</strong> #${order.order_number}</p>
            <p><strong>Data:</strong> ${new Date(order.created_at).toLocaleString('sq-AL')}</p>
            <p><strong>Statusi:</strong> ${getStatusLabel(order.status)}</p>
            <p><strong>Metoda e Pagesës:</strong> ${order.payment_method === 'cod' ? 'Para në dorëzim (COD)' : 'Online'}</p>
          </div>

          <div class="order-info">
            <h3>Adresa e Dërgesës</h3>
            <p>${address.street}</p>
            <p>${address.city}${address.postal_code ? ', ' + address.postal_code : ''}</p>
            <p>${address.country || 'Albania'}</p>
            ${address.delivery_notes ? `<p><strong>Shënime:</strong> ${address.delivery_notes}</p>` : ''}
          </div>

          <h3>Produktet</h3>
          <table class="table">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Produkti</th>
                <th style="padding: 10px; text-align: center;">Sasia</th>
                <th style="padding: 10px; text-align: right;">Çmimi</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Nëntotal:</strong></td>
                <td style="padding: 10px; text-align: right;">${parseFloat(order.subtotal).toFixed(2)} L</td>
              </tr>
              ${order.delivery_fee > 0 ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tarifa Dërgese:</strong></td>
                <td style="padding: 10px; text-align: right;">${parseFloat(order.delivery_fee).toFixed(2)} L</td>
              </tr>
              ` : ''}
              ${order.discount_amount > 0 ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Zbritje:</strong></td>
                <td style="padding: 10px; text-align: right;">-${parseFloat(order.discount_amount).toFixed(2)} L</td>
              </tr>
              ` : ''}
              <tr class="total">
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                <td style="padding: 10px; text-align: right;">${parseFloat(order.total).toFixed(2)} L</td>
              </tr>
            </tfoot>
          </table>

          <p>Porosia juaj do të përgatitet dhe do t'ju njoftojmë kur të jetë gati për dërgesë.</p>
          <p>Nëse keni pyetje, ju lutem na kontaktoni.</p>
        </div>
        <div class="footer">
          <p>Faleminderit që zgjodhët FshatiBio!</p>
          <p>© 2025 FshatiBio. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email template for order status update
 */
function getOrderStatusUpdateTemplate(order, newStatus) {
  const statusMessages = {
    confirmed: 'Porosia juaj u konfirmua! Po fillojmë përgatitjen.',
    preparing: 'Porosia juaj po përgatitet. Do të jetë gati së shpejti!',
    on_delivery: 'Porosia juaj është në rrugë! Kurieri do t\'ju kontaktojë së shpejti.',
    delivered: 'Porosia juaj u dorëzua me sukses! Faleminderit për blerjen tuaj.',
    cancelled: 'Porosia juaj u anulua. Nëse keni pyetje, ju lutem na kontaktoni.',
  };

  const message = statusMessages[newStatus] || `Statusi i porosisë u ndryshua në: ${getStatusLabel(newStatus)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .status-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🥛 FshatiBio</h1>
          <p>Përditësim Porosie</p>
        </div>
        <div class="content">
          <p>Përshëndetje,</p>
          <div class="status-box">
            <h2>${message}</h2>
            <p><strong>Numri i Porosisë:</strong> #${order.order_number}</p>
            <p><strong>Statusi i ri:</strong> ${getStatusLabel(newStatus)}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('sq-AL')}</p>
          </div>
          <p>Mund të shikoni detajet e porosisë tuaj në faqen e porosive.</p>
        </div>
        <div class="footer">
          <p>Faleminderit që zgjodhët FshatiBio!</p>
          <p>© 2025 FshatiBio. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email template for password reset
 */
function getPasswordResetTemplate(resetToken, userEmail) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🥛 FshatiBio</h1>
          <p>Rivendos Fjalëkalimin</p>
        </div>
        <div class="content">
          <p>Përshëndetje,</p>
          <p>Kemi marrë kërkesë për rivendosjen e fjalëkalimit tuaj.</p>
          <p>Klikoni butonin më poshtë për të rivendosur fjalëkalimin tuaj:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Rivendos Fjalëkalimin</a>
          </p>
          <p>Ose kopjoni këtë link në shfletuesin tuaj:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>Kjo lidhje është e vlefshme për 1 orë.</strong></p>
          <p>Nëse nuk keni kërkuar rivendosjen e fjalëkalimit, ju lutem injoroni këtë email.</p>
        </div>
        <div class="footer">
          <p>Faleminderit që zgjodhët FshatiBio!</p>
          <p>© 2025 FshatiBio. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get status label in Albanian
 */
function getStatusLabel(status) {
  const labels = {
    pending: 'Në Pritje',
    confirmed: 'E Konfirmuar',
    preparing: 'Duke Përgatitur',
    on_delivery: 'Në Dërgesë',
    delivered: 'E Dorëzuar',
    cancelled: 'E Anuluar',
  };
  return labels[status] || status;
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(orderId) {
  try {
    const orderResult = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) return { success: false, error: 'Order not found' };

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      `SELECT oi.*, p.name as product_name, p.unit
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    // Get address
    const addressResult = await pool.query(
      'SELECT * FROM addresses WHERE id = $1',
      [order.address_id]
    );

    if (addressResult.rows.length === 0) return { success: false, error: 'Address not found' };

    const html = getOrderConfirmationTemplate(order, itemsResult.rows, addressResult.rows[0]);
    const subject = `Konfirmim Porosie #${order.order_number} - FshatiBio`;

    return await sendEmail(order.email, subject, html);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send order status update email
 */
async function sendOrderStatusUpdateEmail(orderId, newStatus) {
  try {
    const orderResult = await pool.query(
      `SELECT o.*, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) return { success: false, error: 'Order not found' };

    const order = orderResult.rows[0];
    const html = getOrderStatusUpdateTemplate(order, newStatus);
    const subject = `Përditësim Porosie #${order.order_number} - ${getStatusLabel(newStatus)}`;

    return await sendEmail(order.email, subject, html);
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(userEmail, resetToken) {
  try {
    const html = getPasswordResetTemplate(resetToken, userEmail);
    const subject = 'Rivendos Fjalëkalimin - FshatiBio';

    return await sendEmail(userEmail, subject, html);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(userEmail, firstName) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🥛 FshatiBio</h1>
            <p>Mirë se vini!</p>
          </div>
          <div class="content">
            <p>Përshëndetje ${firstName || ''},</p>
            <p>Faleminderit që u regjistruat në FshatiBio!</p>
            <p>Tani mund të blini produkte BIO të freskëta direkt nga fshati me cilësi të garantuar.</p>
            <p>Shfletoni koleksionin tonë dhe bëni porosinë tuaj të parë!</p>
          </div>
          <div class="footer">
            <p>Faleminderit që zgjodhët FshatiBio!</p>
            <p>© 2025 FshatiBio. Të gjitha të drejtat e rezervuara.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const subject = 'Mirë se vini në FshatiBio!';

    return await sendEmail(userEmail, subject, html);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  initializeEmail,
};


