import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import {
  queryProfile,
  queryDocuments,
  queryRecipientsForDocs,
} from "@/lib/supabase/helpers";
import type { DocumentWithRecipients } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await queryProfile(supabase, user.id);
  if (!profile) redirect("/login");

  const documents = await queryDocuments(supabase, profile.org_id);
  const docIds = documents.map((d) => d.id);
  const allRecipients = await queryRecipientsForDocs(supabase, docIds);

  const docsWithRecipients: DocumentWithRecipients[] = documents.map(
    (doc) => ({
      ...doc,
      recipients: allRecipients.filter((r) => r.document_id === doc.id),
    })
  ) as DocumentWithRecipients[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your documents and track signing progress.
        </p>
      </div>

      <DocumentList documents={docsWithRecipients} />
    </div>
  );
}
