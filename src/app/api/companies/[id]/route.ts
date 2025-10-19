import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Company from "@/models/Company";
import { ensureModelsRegistered } from "@/lib/models";
import { getUserCompanyIds, hasPermission } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    
    // Get companies the user has access to (owned or as team member)
    const accessibleCompanyIds = await getUserCompanyIds(session.user.id);
    
    if (!accessibleCompanyIds.includes(id)) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    const company = await Company.findById(id);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Get companies the user has access to (owned or as team member)
    const accessibleCompanyIds = await getUserCompanyIds(session.user.id);
    
    if (!accessibleCompanyIds.includes(id)) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user has permission to manage companies
    const canManageCompanies = await hasPermission(session.user.id, id, 'manage_companies');

    if (!canManageCompanies) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const company = await Company.findByIdAndUpdate(
      id,
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error: unknown) {
    console.error("Error updating company:", error);

    if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
      const mongooseError = error as Error & { errors: Record<string, { message: string }> };
      const validationErrors = Object.values(mongooseError.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Company with this tax ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    
    // Get companies the user has access to (owned or as team member)
    const accessibleCompanyIds = await getUserCompanyIds(session.user.id);
    
    if (!accessibleCompanyIds.includes(id)) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user has permission to manage companies (and is owner for deletion)
    const canManageCompanies = await hasPermission(session.user.id, id, 'manage_companies');

    if (!canManageCompanies) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
