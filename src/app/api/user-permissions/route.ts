import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserCompanyAccess } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Get user's access to all companies
    const userAccess = await getUserCompanyAccess(session.user.id);
    
    // Find access for this specific company
    const companyAccess = userAccess.find(access => access.companyId === companyId);
    
    if (!companyAccess) {
      return NextResponse.json({ error: "No access to this company" }, { status: 403 });
    }

    return NextResponse.json({
      permissions: companyAccess.permissions,
      isOwner: companyAccess.isOwner,
      role: companyAccess.role,
      department: companyAccess.department
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user permissions" },
      { status: 500 }
    );
  }
}