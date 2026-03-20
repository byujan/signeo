import { createAdminClient } from "@/lib/supabase/admin";
import { getClientInfo } from "@/lib/utils/request";
import type { AuditEventType } from "@/types";
import type { Json } from "@/types/database";

export async function logEvent(
  event: {
    documentId: string;
    eventType: AuditEventType;
    recipientId?: string;
    actorId?: string;
    metadata?: Record<string, Json>;
  },
  req: Request
): Promise<void> {
  const admin = createAdminClient();
  const { ip, userAgent } = getClientInfo(req);

  await admin.from("audit_events").insert({
    document_id: event.documentId,
    event_type: event.eventType,
    recipient_id: event.recipientId ?? null,
    actor_id: event.actorId ?? null,
    ip_address: ip,
    user_agent: userAgent,
    metadata: (event.metadata as Json) ?? {},
  });
}
