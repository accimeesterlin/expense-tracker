import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Budget from "@/models/Budget";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const budgets = await Budget.find({ 
      userId: session.user.email,
      isActive: true
    }).sort({ startDate: -1 });
    
    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    await connectToDatabase();

    const budget = new Budget({
      userId: session.user.email,
      ...data,
    });

    await budget.save();
    return NextResponse.json(budget, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating budget:", error);
    if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
      const mongooseError = error as Error & { message: string };
      return NextResponse.json(
        { error: mongooseError.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}