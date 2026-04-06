import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "crypto";
import { admin, adminSelectOne, adminSelectMany } from "@/lib/supabase/typed-admin";
import { downloadFile, uploadFile } from "./storage";
import { logEvent } from "./audit";
import type { Field } from "@/types";

export async function getPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes);
  return doc.getPageCount();
}

export async function finalizePdf(
  documentId: string,
  req: Request
): Promise<{ hash: string }> {
  const db = admin();
  const doc = await adminSelectOne("documents", "id", documentId);
  if (!doc) throw new Error("Document not found");

  // Download original PDF
  const originalBytes = await downloadFile(
    "documents",
    doc.original_storage_path!
  );

  // Load PDF
  const pdfDoc = await PDFDocument.load(originalBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Fetch all filled fields
  const allFields = await adminSelectMany("fields", "document_id", documentId);
  const filledFields = allFields.filter((f) => f.value) as Field[];

  // Stamp each field
  const pageCount = pdfDoc.getPageCount();
  for (const field of filledFields) {
    if (field.page < 1 || field.page > pageCount) {
      console.error(`Field ${field.id} references invalid page ${field.page} (document has ${pageCount} pages)`);
      continue;
    }
    const page = pdfDoc.getPage(field.page - 1);
    const { width: pw, height: ph } = page.getSize();

    const x = (field.x / 100) * pw;
    const y = ph - ((field.y + field.height) / 100) * ph;
    const w = (field.width / 100) * pw;
    const h = (field.height / 100) * ph;

    if (field.type === "signature" || field.type === "initials") {
      try {
        const imgBytes = await downloadFile("signatures", field.value!);
        const imgUint8 = new Uint8Array(imgBytes);
        let img;
        try {
          img = await pdfDoc.embedPng(imgUint8);
        } catch {
          img = await pdfDoc.embedJpg(imgUint8);
        }
        page.drawImage(img, { x, y, width: w, height: h });
      } catch (err) {
        console.error(`Failed to embed signature for field ${field.id}:`, err);
      }
    } else if (field.type === "checkbox") {
      if (field.value === "true") {
        page.drawText("X", {
          x: x + w * 0.25,
          y: y + h * 0.2,
          size: h * 0.6,
          font,
          color: rgb(0, 0, 0),
        });
      }
    } else {
      const fontSize = Math.min(h * 0.6, 12);
      page.drawText(field.value ?? "", {
        x: x + 2,
        y: y + h * 0.25,
        size: fontSize,
        font,
        maxWidth: w - 4,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Save and hash
  const pdfBytes = await pdfDoc.save();
  const hash = createHash("sha256").update(pdfBytes).digest("hex");

  // Upload signed PDF
  const signedPath = `${doc.org_id}/${documentId}/signed.pdf`;
  await uploadFile("documents", signedPath, pdfBytes, "application/pdf");

  // Update document
  await db
    .from("documents")
    .update({
      signed_storage_path: signedPath,
      signed_pdf_hash: hash,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  await logEvent(
    { documentId, eventType: "pdf.finalized", metadata: { hash } },
    req
  );
  await logEvent({ documentId, eventType: "document.completed" }, req);

  return { hash };
}
