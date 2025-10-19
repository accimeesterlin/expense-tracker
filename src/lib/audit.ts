import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";

interface Actor {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface Target {
  type: string;
  id?: string;
  name?: string;
}

interface LogAuditParams {
  action: string;
  actor: Actor;
  target: Target;
  description?: string;
  companyId?: string;
  teamMemberId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent({
  action,
  actor,
  target,
  description,
  companyId,
  teamMemberId,
  metadata,
}: LogAuditParams) {
  try {
    await dbConnect();

    await AuditLog.create({
      action,
      actorId: actor.id,
      actorName: actor.name ?? undefined,
      actorEmail: actor.email ?? undefined,
      targetType: target.type,
      targetId: target.id,
      targetName: target.name,
      description,
      company: companyId,
      teamMember: teamMemberId,
      metadata,
    });
  } catch (error) {
    console.error("Failed to log audit event", error);
  }
}
