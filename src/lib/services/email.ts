import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "Signeo <onboarding@resend.dev>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendSigningInvite(params: {
  to: string;
  recipientName: string;
  documentTitle: string;
  signingUrl: string;
  senderName: string;
}) {
  await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `Please sign: ${escapeHtml(params.documentTitle)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Signature requested</h2>
        <p>Hi ${escapeHtml(params.recipientName)},</p>
        <p><strong>${escapeHtml(params.senderName)}</strong> has asked you to sign
          <strong>${escapeHtml(params.documentTitle)}</strong>.</p>
        <a href="${escapeHtml(params.signingUrl)}" style="
          display: inline-block; padding: 12px 24px;
          background: #2563eb; color: white;
          text-decoration: none; border-radius: 6px;
          font-weight: 500; margin: 16px 0;
        ">Review &amp; Sign</a>
        <p style="color: #666; font-size: 14px;">
          This link expires in 7 days. If you didn't expect this email, you can ignore it.
        </p>
      </div>
    `,
  });
}

export async function sendCompletionNotice(params: {
  to: string;
  senderName: string;
  documentTitle: string;
  dashboardUrl: string;
}) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: `Completed: ${escapeHtml(params.documentTitle)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">All signatures collected</h2>
          <p>Hi ${escapeHtml(params.senderName)},</p>
          <p>All recipients have signed <strong>${escapeHtml(params.documentTitle)}</strong>.</p>
          <a href="${escapeHtml(params.dashboardUrl)}" style="
            display: inline-block; padding: 12px 24px;
            background: #16a34a; color: white;
            text-decoration: none; border-radius: 6px;
            font-weight: 500; margin: 16px 0;
          ">View &amp; Download</a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send completion notice email:", err);
  }
}
