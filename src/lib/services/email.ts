import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = "Signeo <onboarding@resend.dev>"; // Use your verified domain in prod

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
    subject: `Please sign: ${params.documentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Signature requested</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.senderName}</strong> has asked you to sign
          <strong>${params.documentTitle}</strong>.</p>
        <a href="${params.signingUrl}" style="
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
  await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `Completed: ${params.documentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">All signatures collected</h2>
        <p>Hi ${params.senderName},</p>
        <p>All recipients have signed <strong>${params.documentTitle}</strong>.</p>
        <a href="${params.dashboardUrl}" style="
          display: inline-block; padding: 12px 24px;
          background: #16a34a; color: white;
          text-decoration: none; border-radius: 6px;
          font-weight: 500; margin: 16px 0;
        ">View &amp; Download</a>
      </div>
    `,
  });
}
