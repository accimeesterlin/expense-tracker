import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { getUserCompanyAccess } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get("companyId");
    const teamMemberId = searchParams.get("teamMemberId");
    const searchTerm = searchParams.get("search");
    const limitParam = Number(searchParams.get("limit"));
    const pageParam = Number(searchParams.get("page"));

    const limit = Number.isNaN(limitParam) || limitParam <= 0 ? 25 : Math.min(limitParam, 100);
    const page = Number.isNaN(pageParam) || pageParam <= 0 ? 1 : pageParam;

    await dbConnect();

    const companyAccess = await getUserCompanyAccess(session.user.id);
    const authorizedCompanyIds = companyAccess
      .filter((access) =>
        access.isOwner ||
        access.permissions.includes("view_audit_logs") ||
        access.permissions.includes("admin_access")
      )
      .map((access) => access.companyId);

    if (companyId && !authorizedCompanyIds.includes(companyId)) {
      return NextResponse.json({ error: "You do not have access to audit logs for this company" }, { status: 403 });
    }

    if (!authorizedCompanyIds.length) {
      return NextResponse.json(
        { error: "You do not have permission to view audit logs" },
        { status: 403 }
      );
    }

    const query: Record<string, unknown> = {
      company: companyId ? companyId : { $in: authorizedCompanyIds },
    };

    if (teamMemberId) {
      query.teamMember = teamMemberId;
    }

    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      query.$or = [
        { action: regex },
        { description: regex },
        { targetName: regex },
        { actorName: regex },
        { actorEmail: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
