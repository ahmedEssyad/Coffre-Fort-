import { Resend } from 'resend';
import config from '../config/env';

class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(config.email.resendApiKey);
  }

  // Send welcome email with set-password link
  async sendWelcomeEmail(email: string, token: string, firstName?: string) {
    const setPasswordUrl = `${config.frontend.url}/set-password?token=${token}`;
    const name = firstName || 'vous';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Bienvenue sur MayanConnect</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name} !</h2>
              <p>Un compte a été créé pour vous sur MayanConnect - votre système de gestion documentaire sécurisé et respectueux de la vie privée.</p>

              <p>Pour commencer, veuillez définir votre mot de passe en cliquant sur le bouton ci-dessous :</p>

              <div style="text-align: center;">
                <a href="${setPasswordUrl}" class="button">Définir Mon Mot de Passe</a>
              </div>

              <div class="warning">
                ⚠️ <strong>Important :</strong> Ce lien expirera dans 24 heures pour des raisons de sécurité.
              </div>

              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #667eea;">${setPasswordUrl}</p>

              <h3>Qu'est-ce que MayanConnect ?</h3>
              <ul>
                <li>🔒 <strong>Confidentialité prioritaire :</strong> Toutes les données restent sur votre infrastructure</li>
                <li>🤖 <strong>Propulsé par IA :</strong> Résumé automatique des documents</li>
                <li>🔍 <strong>Recherche intelligente :</strong> L'OCR rend tous les documents consultables</li>
                <li>⏰ <strong>Contrôle d'accès :</strong> Fenêtres d'accès temporaire pour la sécurité</li>
              </ul>

              <p>Si vous avez des questions, veuillez contacter votre administrateur.</p>
            </div>
            <div class="footer">
              <p>🤖 Généré avec MayanConnect</p>
              <p>Ceci est un email automatique. Merci de ne pas répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const result = await this.resend.emails.send({
        from: config.email.fromEmail,
        to: email,
        subject: '🎉 Bienvenue sur MayanConnect - Définissez Votre Mot de Passe',
        html,
      });

      console.log('✅ Welcome email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, token: string, firstName?: string) {
    const resetPasswordUrl = `${config.frontend.url}/set-password?token=${token}`;
    const name = firstName || 'vous';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Demande de Réinitialisation du Mot de Passe</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name} !</h2>
              <p>Nous avons reçu une demande de réinitialisation de votre mot de passe MayanConnect.</p>

              <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>

              <div style="text-align: center;">
                <a href="${resetPasswordUrl}" class="button">Réinitialiser Mon Mot de Passe</a>
              </div>

              <div class="warning">
                ⚠️ <strong>Important :</strong> Ce lien expirera dans 24 heures pour des raisons de sécurité.
              </div>

              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #667eea;">${resetPasswordUrl}</p>

              <p><strong>Vous n'avez pas demandé cela ?</strong> Vous pouvez ignorer cet email en toute sécurité. Votre mot de passe ne sera pas modifié.</p>
            </div>
            <div class="footer">
              <p>🤖 Généré avec MayanConnect</p>
              <p>Ceci est un email automatique. Merci de ne pas répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const result = await this.resend.emails.send({
        from: config.email.fromEmail,
        to: email,
        subject: '🔐 Réinitialisez Votre Mot de Passe MayanConnect',
        html,
      });

      console.log('✅ Password reset email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

export default new EmailService();
