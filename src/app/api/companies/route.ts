import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Company from "@/models/Company";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const companies = await Company.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in POST /api/companies:", session);
    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    const company = new Company({
      ...body,
      userId: session.user.id,
    });
    await company.save();

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error("Error creating company:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Company with this tax ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
