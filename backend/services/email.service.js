const nodemailer = require('nodemailer');

/**
 * Service pengiriman email OTP / Reset Password via Gmail SMTP
 * Mendukung konfigurasi .env:
 * GMAIL_USER (contoh: your_email@gmail.com)
 * GMAIL_APP_PASSWORD (app password 16 digit dari Google Account Security)
 */

class EmailService {
  getUser() {
    return (process.env.GMAIL_USER || '').trim();
  }

  getPass() {
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '';
    return pass.replace(/\s+/g, '').trim();
  }

  isConfigured() {
    return Boolean(this.getUser() && this.getPass());
  }

  getTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.getUser(),
        pass: this.getPass(),
      },
    });
  }

  /**
   * Kirim Email Tautan (Link) Reset Password via SMTP ke Gmail Pengguna
   */
  async sendResetPasswordLinkEmail(recipientEmail, resetUrl, userName = 'Pengguna SIPANDA') {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #1d4ed8, #4338ca); padding: 28px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 12px; opacity: 0.9; }
          .body { padding: 32px 28px; }
          .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .text { font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn-reset { display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
          .link-fallback { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; word-break: break-all; color: #3b82f6; margin-top: 20px; }
          .warning { font-size: 11px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SIPANDA</h1>
            <p></p>
          </div>
          <div class="body">
            <div class="greeting">Halo, ${userName}</div>
            <div class="text">
              Kami menerima permintaan untuk mereset kata sandi akun SIPANDA Anda. Klik tombol di bawah ini untuk membuat password baru:
            </div>
            <div class="btn-container">
              <a href="${resetUrl}" target="_blank" class="btn-reset">Buat Password Baru</a>
            </div>
            <div class="text" style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
              Tautan di atas berlaku selama <strong>15 menit</strong>. Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut di browser Anda:
            </div>
            <div class="link-fallback">
              ${resetUrl}
            </div>
            <div class="warning">
              Jika Anda tidak meminta perubahan kata sandi ini, abaikan email ini dengan aman. Kata sandi Anda tidak akan berubah sampai Anda mengakses tautan di atas dan menyetel kata sandi baru.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} SIPANDA 
          </div>
        </div>
      </body>
      </html>
    `;

    if (!this.isConfigured()) {
      throw new Error('Konfigurasi Gmail SMTP belum lengkap di server (.env GMAIL_USER / GMAIL_APP_PASSWORD).');
    }

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: `"SIPANDA " <${this.getUser()}>`,
        to: recipientEmail,
        subject: `[SIPANDA] Permintaan Reset Password Akun`,
        html: htmlContent,
      });
      console.log(`[EmailService] Email Link Reset berhasil dikirim via SMTP ke ${recipientEmail}. MessageId: ${info.messageId}`);
      return { sent: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error('[EmailService] Gagal mengirim via SMTP:', err.message);
      throw new Error(`Gagal mengirim email reset via SMTP: ${err.message}`);
    }
  }
}

module.exports = new EmailService();
