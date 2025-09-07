import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Company from "@/models/Company";
import Expense from "@/models/Expense";
import Income from "@/models/Income";
import Debt from "@/models/Debt";
import Asset from "@/models/Asset";
import PaymentMethod from "@/models/PaymentMethod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get all data in parallel
    const [companies, expenses, income, debts, assets, paymentMethods] =
      await Promise.all([
        Company.find({ userId: session.user.id }),
        Expense.find({ userId: session.user.id, isActive: true }),
        Income.find({ userId: session.user.id, isActive: true }),
        Debt.find({ userId: session.user.id, isActive: true }),
        Asset.find({ userId: session.user.id, isActive: true }),
        PaymentMethod.find({ userId: session.user.id, isActive: true }),
      ]);

    // Calculate totals
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalAssets = assets.reduce(
      (sum, asset) => sum + asset.currentValue,
      0
    );
    const netWorth = totalAssets - totalDebt;

    // Calculate monthly recurring expenses
    const monthlyRecurringExpenses = expenses
      .filter(
        (expense) =>
          expense.expenseType === "subscription" ||
          expense.expenseType === "recurring"
      )
      .reduce((sum, expense) => {
        if (expense.frequency === "monthly") return sum + expense.amount;
        if (expense.frequency === "quarterly") return sum + expense.amount / 3;
        if (expense.frequency === "yearly") return sum + expense.amount / 12;
        if (expense.frequency === "weekly") return sum + expense.amount * 4.33;
        if (expense.frequency === "daily") return sum + expense.amount * 30;
        return sum;
      }, 0);

    // Calculate monthly recurring income
    const monthlyRecurringIncome = income
      .filter((inc) => inc.isRecurring)
      .reduce((sum, inc) => {
        if (inc.frequency === "monthly") return sum + inc.amount;
        if (inc.frequency === "quarterly") return sum + inc.amount / 3;
        if (inc.frequency === "yearly") return sum + inc.amount / 12;
        if (inc.frequency === "weekly") return sum + inc.amount * 4.33;
        if (inc.frequency === "bi-weekly") return sum + inc.amount * 2.17;
        return sum;
      }, 0);

    // Calculate monthly debt payments
    const monthlyDebtPayments = debts.reduce((sum, debt) => {
      if (debt.paymentFrequency === "monthly") return sum + debt.minimumPayment;
      if (debt.paymentFrequency === "quarterly")
        return sum + debt.minimumPayment / 3;
      if (debt.paymentFrequency === "yearly")
        return sum + debt.minimumPayment / 12;
      if (debt.paymentFrequency === "weekly")
        return sum + debt.minimumPayment * 4.33;
      if (debt.paymentFrequency === "bi-weekly")
        return sum + debt.minimumPayment * 2.17;
      return sum;
    }, 0);

    // Get upcoming payments (next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcomingExpenses = expenses.filter(
      (expense) =>
        expense.nextBillingDate &&
        expense.nextBillingDate >= today &&
        expense.nextBillingDate <= thirtyDaysFromNow
    );

    const upcomingDebtPayments = debts.filter(
      (debt) =>
        debt.nextPaymentDate >= today &&
        debt.nextPaymentDate <= thirtyDaysFromNow
    );

    const upcomingIncome = income.filter(
      (inc) =>
        inc.nextPaymentDate &&
        inc.nextPaymentDate >= today &&
        inc.nextPaymentDate <= thirtyDaysFromNow
    );

    // Calculate cash flow
    const monthlyCashFlow =
      monthlyRecurringIncome - monthlyRecurringExpenses - monthlyDebtPayments;

    // Asset breakdown by type
    const assetsByType = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + asset.currentValue;
      return acc;
    }, {} as Record<string, number>);

    // Debt breakdown by type
    const debtsByType = debts.reduce((acc, debt) => {
      acc[debt.type] = (acc[debt.type] || 0) + debt.currentBalance;
      return acc;
    }, {} as Record<string, number>);

    // Expense breakdown by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Income breakdown by category
    const incomeByCategory = income.reduce((acc, inc) => {
      acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      summary: {
        totalCompanies: companies.length,
        totalExpenses: totalExpenses,
        totalIncome: totalIncome,
        totalDebt: totalDebt,
        totalAssets: totalAssets,
        netWorth: netWorth,
        monthlyRecurringExpenses: monthlyRecurringExpenses,
        monthlyRecurringIncome: monthlyRecurringIncome,
        monthlyDebtPayments: monthlyDebtPayments,
        monthlyCashFlow: monthlyCashFlow,
        totalPaymentMethods: paymentMethods.length,
        activeDebts: debts.length,
        totalAssets: assets.length,
      },
      upcoming: {
        expenses: upcomingExpenses.length,
        debtPayments: upcomingDebtPayments.length,
        income: upcomingIncome.length,
      },
      breakdowns: {
        assetsByType,
        debtsByType,
        expensesByCategory,
        incomeByCategory,
      },
      counts: {
        companies: companies.length,
        expenses: expenses.length,
        income: income.length,
        debts: debts.length,
        assets: assets.length,
        paymentMethods: paymentMethods.length,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
