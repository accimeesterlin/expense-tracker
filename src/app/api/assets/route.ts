import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Asset from "@/models/Asset";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const isLiquid = searchParams.get("isLiquid");

    const query: { userId: string; isActive: boolean; type?: string; category?: string; isLiquid?: boolean } = { userId: session.user.id, isActive: true };

    if (type) query.type = type;
    if (category) query.category = category;
    if (isLiquid !== null) query.isLiquid = isLiquid === "true";

    const assets = await Asset.find(query).sort({ currentValue: -1 });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    const asset = new Asset({
      ...body,
      userId: session.user.id,
    });

    await asset.save();

    return NextResponse.json(asset, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating asset:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      const validationError = error as Error & { errors: Record<string, { message: string }> };
      const validationErrors = Object.values(validationError.errors).map(
        (err: { message: string }) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}
