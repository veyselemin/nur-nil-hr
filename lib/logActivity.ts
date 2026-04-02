import { supabase } from "./supabase";

/**
 * Logs a user action to the activity_logs table.
 * Call this after any significant action in the app.
 *
 * action_type examples:
 *   "added_employee", "edited_employee", "deleted_employee"
 *   "uploaded_document", "deleted_document"
 *   "submitted_leave", "approved_leave", "rejected_leave"
 *   "added_disciplinary"
 *   "approved_employee", "rejected_employee"
 *   "clock_in", "clock_out"
 *   "created_user", "deleted_user", "updated_permissions"
 */
export async function logActivity(params: {
  userId: string;
  userName: string;
  userRole: string;
  actionType: string;
  entityType: string;
  entityId?: string | number | null;
  entityName?: string | null;
  description: string;
  metadata?: Record<string, any>;
}) {
  try {
    await supabase.from("activity_logs").insert({
      user_id: params.userId,
      user_name: params.userName,
      user_role: params.userRole,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId != null ? String(params.entityId) : null,
      entity_name: params.entityName || null,
      description: params.description,
      metadata: params.metadata || {},
    });
  } catch {
    // Logging should never crash the app - silently fail
  }
}
