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
              <h1>🚀 Bienvenue sur Coffre-Fort</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name} !</h2>
              <p>Un compte a été créé pour vous sur Coffre-Fort - votre système de gestion documentaire sécurisé et respectueux de la vie privée.</p>

              <p>Pour commencer, veuillez définir votre mot de passe en cliquant sur le bouton ci-dessous :</p>

              <div style="text-align: center;">
                <a href="${setPasswordUrl}" class="button">Définir Mon Mot de Passe</a>
              </div>

              <div class="warning">
                ⚠️ <strong>Important :</strong> Ce lien expirera dans 24 heures pour des raisons de sécurité.
              </div>

              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #667eea;">${setPasswordUrl}</p>

              <h3>Qu'est-ce que Coffre-Fort ?</h3>
              <ul>
                <li>🔒 <strong>Confidentialité prioritaire :</strong> Toutes les données restent sur votre infrastructure</li>
                <li>🤖 <strong>Propulsé par IA :</strong> Résumé automatique des documents</li>
                <li>🔍 <strong>Recherche intelligente :</strong> L'OCR rend tous les documents consultables</li>
                <li>⏰ <strong>Contrôle d'accès :</strong> Fenêtres d'accès temporaire pour la sécurité</li>
              </ul>

              <p>Si vous avez des questions, veuillez contacter votre administrateur.</p>
            </div>
            <div class="footer">
              <p>🤖 Généré avec Coffre-Fort</p>
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
        subject: '🎉 Bienvenue sur Coffre-Fort - Définissez Votre Mot de Passe',
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
              <p>Nous avons reçu une demande de réinitialisation de votre mot de passe Coffre-Fort.</p>

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
              <p>🤖 Généré avec Coffre-Fort</p>
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
        subject: '🔐 Réinitialisez Votre Mot de Passe Coffre-Fort',
        html,
      });

      console.log('✅ Password reset email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send access granted email
  async sendAccessGrantedEmail(
    email: string,
    firstName: string | null,
    startDate: Date,
    endDate: Date
  ) {
    const name = firstName || 'vous';
    const dashboardUrl = `${config.frontend.url}/dashboard`;

    // Format dates in French
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(date);
    };

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
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
              background: #10b981;
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
            .info-box {
              background: #d1fae5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
            }
            .date-info {
              background: white;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            .date-label {
              font-weight: bold;
              color: #059669;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Accès Temporaire Accordé</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name} !</h2>
              <p>Bonne nouvelle ! Un accès temporaire vous a été accordé sur MayanConnect.</p>

              <div class="info-box">
                ✨ Vous pouvez maintenant accéder à vos documents pendant la période définie ci-dessous.
              </div>

              <div class="date-info">
                <p><span class="date-label">📅 Début de l'accès :</span><br/>${formatDate(startDate)}</p>
                <p><span class="date-label">📅 Fin de l'accès :</span><br/>${formatDate(endDate)}</p>
              </div>

              <p>Pour accéder à vos documents, cliquez sur le bouton ci-dessous :</p>

              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Accéder au Tableau de Bord</a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                ⚠️ <strong>Important :</strong> Votre accès sera automatiquement révoqué après la date de fin. Si vous avez besoin d'une extension, veuillez contacter votre administrateur.
              </p>
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
        subject: '✅ Accès Temporaire Accordé - MayanConnect',
        html,
      });

      console.log('✅ Access granted email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending access granted email:', error);
      throw new Error('Failed to send access granted email');
    }
  }

  // Send access updated email
  async sendAccessUpdatedEmail(
    email: string,
    firstName: string | null,
    startDate: Date,
    endDate: Date,
    isActive: boolean
  ) {
    const name = firstName || 'vous';
    const dashboardUrl = `${config.frontend.url}/dashboard`;

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(date);
    };

    const statusText = isActive
      ? '✅ Votre accès est <strong>actif</strong>'
      : '⏸️ Votre accès a été <strong>suspendu</strong>';
    const statusColor = isActive ? '#10b981' : '#f59e0b';

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
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
              background: #3b82f6;
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
            .info-box {
              background: #dbeafe;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
            }
            .date-info {
              background: white;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            .date-label {
              font-weight: bold;
              color: #2563eb;
            }
            .status-badge {
              background: ${statusColor};
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Accès Temporaire Modifié</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name} !</h2>
              <p>Votre accès temporaire sur MayanConnect a été modifié par un administrateur.</p>

              <div style="text-align: center;">
                <div class="status-badge">${statusText}</div>
              </div>

              <div class="info-box">
                ℹ️ Voici les nouvelles dates d'accès :
              </div>

              <div class="date-info">
                <p><span class="date-label">📅 Début de l'accès :</span><br/>${formatDate(startDate)}</p>
                <p><span class="date-label">📅 Fin de l'accès :</span><br/>${formatDate(endDate)}</p>
              </div>

              ${isActive ? `
              <p>Vous pouvez continuer à accéder à vos documents pendant cette période.</p>
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Accéder au Tableau de Bord</a>
              </div>
              ` : `
              <p style="color: #d97706;">⚠️ Votre accès est actuellement suspendu. Vous ne pourrez pas accéder aux documents tant que l'accès n'est pas réactivé.</p>
              `}

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Si vous avez des questions concernant cette modification, veuillez contacter votre administrateur.
              </p>
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
        subject: '🔄 Modification de Votre Accès Temporaire - MayanConnect',
        html,
      });

      console.log('✅ Access updated email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending access updated email:', error);
      throw new Error('Failed to send access updated email');
    }
  }

  // Send access revoked email
  async sendAccessRevokedEmail(
    email: string,
    firstName: string | null
  ) {
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
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .warning-box {
              background: #fee2e2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Accès Temporaire Révoqué</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name} !</h2>
              <p>Nous vous informons que votre accès temporaire sur MayanConnect a été révoqué.</p>

              <div class="warning-box">
                ⚠️ <strong>Accès révoqué</strong><br/>
                Vous n'avez plus accès aux documents sur MayanConnect.
              </div>

              <p>Cette révocation a été effectuée par un administrateur. Les raisons peuvent inclure :</p>
              <ul>
                <li>Fin de votre période d'accès</li>
                <li>Changement dans votre statut ou votre rôle</li>
                <li>Demande administrative</li>
              </ul>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Si vous pensez qu'il s'agit d'une erreur ou si vous avez besoin d'un nouvel accès, veuillez contacter votre administrateur.
              </p>

              <p>Merci d'avoir utilisé MayanConnect.</p>
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
        subject: '🔒 Accès Temporaire Révoqué - MayanConnect',
        html,
      });

      console.log('✅ Access revoked email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending access revoked email:', error);
      throw new Error('Failed to send access revoked email');
    }
  }
}

export default new EmailService();
