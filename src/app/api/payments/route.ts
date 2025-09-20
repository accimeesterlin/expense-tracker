import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import Debt from "@/models/Debt";
import Income from "@/models/Income";

// GET /api/payments - Get all payments for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const referenceId = searchParams.get("referenceId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let filter: any = { userId: session.user.id };
    if (type) filter.type = type;
    if (referenceId) filter.referenceId = referenceId;

    const payments = await Payment.find(filter)
      .populate("company", "name industry")
      .populate("paymentMethod", "name type")
      .sort({ paymentDate: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await Payment.countDocuments(filter);

    return NextResponse.json({
      payments,
      total,
      hasMore: offset + payments.length < total,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      type,
      referenceId,
      amount,
      paymentDate,
      paymentMethod,
      company,
      category,
      description,
      tags,
      notes,
      receiptUrl,
      receiptS3Key,
      receiptFileName,
      receiptContentType,
      metadata,
    } = body;

    // Validate required fields
    if (!type || !referenceId || !amount || !paymentDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate payment type
    if (!["debt_payment", "income_received"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      );
    }

    let balanceBefore = 0;
    let balanceAfter = 0;

    // If it's a debt payment, update the debt balance
    if (type === "debt_payment") {
      const debt = await Debt.findOne({
        _id: referenceId,
        $or: [{ userId: session.user.id }, { userId: session.user.email }],
      });

      if (!debt) {
        return NextResponse.json({ error: "Debt not found" }, { status: 404 });
      }

      balanceBefore = debt.currentBalance;
      balanceAfter = Math.max(0, debt.currentBalance - amount);

      // Update debt balance and next payment date
      debt.currentBalance = balanceAfter;
      
      // Calculate next payment date based on frequency
      const nextDate = new Date(debt.nextPaymentDate);
      switch (debt.paymentFrequency) {
        case "weekly":
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "bi-weekly":
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case "monthly":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "quarterly":
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case "yearly":
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      debt.nextPaymentDate = nextDate;

      await debt.save();
    }

    // Create the payment record
    const payment = new Payment({
      userId: session.user.id,
      type,
      referenceId,
      amount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      company,
      category,
      description,
      tags: tags || [],
      notes,
      receiptUrl,
      receiptS3Key,
      receiptFileName,
      receiptContentType,
      isAutomatic: false,
      metadata: {
        ...metadata,
        balanceBefore,
        balanceAfter,
      },
    });

    await payment.save();

    // Populate the payment before returning
    await payment.populate([
      { path: "company", select: "name industry" },
      { path: "paymentMethod", select: "name type" },
    ]);

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}