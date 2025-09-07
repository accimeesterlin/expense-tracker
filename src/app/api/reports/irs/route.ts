import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import Company from "@/models/Company";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { companyId, year, format = "pdf" } = await request.json();

    if (!companyId || !year) {
      return NextResponse.json(
        { error: "Company ID and year are required" },
        { status: 400 }
      );
    }

    // Fetch company details
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Fetch expenses for the specified year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const expenses = await Expense.find({
      company: companyId,
      startDate: { $lte: endDate },
      $or: [{ endDate: { $gte: startDate } }, { endDate: { $exists: false } }],
    }).populate("company", "name industry");

    // Group expenses by category
    const expensesByCategory: { [key: string]: any[] } = {};
    let totalAmount = 0;

    expenses.forEach((expense) => {
      const category = expense.category;
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = [];
      }
      expensesByCategory[category].push(expense);
      totalAmount += expense.amount;
    });

    if (format === "pdf") {
      // Generate PDF report
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("IRS Expense Report", 105, 20, { align: "center" });

      // Company Information
      doc.setFontSize(14);
      doc.text("Company Information:", 20, 40);
      doc.setFontSize(12);
      doc.text(`Name: ${company.name}`, 20, 50);
      doc.text(`Industry: ${company.industry || "N/A"}`, 20, 60);
      doc.text(`Tax ID: ${company.taxId || "N/A"}`, 20, 70);
      doc.text(`Year: ${year}`, 20, 80);

      // Summary
      doc.setFontSize(14);
      doc.text("Summary:", 20, 100);
      doc.setFontSize(12);
      doc.text(`Total Expenses: $${totalAmount.toFixed(2)}`, 20, 110);
      doc.text(`Number of Expenses: ${expenses.length}`, 20, 120);

      // Expenses by Category
      doc.setFontSize(14);
      doc.text("Expenses by Category:", 20, 140);

      let yPosition = 150;
      Object.entries(expensesByCategory).forEach(
        ([category, categoryExpenses]) => {
          const categoryTotal = categoryExpenses.reduce(
            (sum, exp) => sum + exp.amount,
            0
          );
          doc.setFontSize(12);
          doc.text(`${category}: $${categoryTotal.toFixed(2)}`, 20, yPosition);
          yPosition += 10;
        }
      );

      // Detailed Expense Table
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text("Detailed Expenses:", 20, yPosition);
      yPosition += 10;

      const tableData = expenses.map((expense) => [
        expense.name,
        expense.category,
        expense.expenseType,
        `$${expense.amount.toFixed(2)}`,
        new Date(expense.startDate).toLocaleDateString(),
        expense.frequency || "N/A",
      ]);

      autoTable(doc, {
        head: [
          ["Name", "Category", "Type", "Amount", "Start Date", "Frequency"],
        ],
        body: tableData,
        startY: yPosition,
        margin: { top: 20 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      const pdfBuffer = doc.output("arraybuffer");

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="irs-expense-report-${company.name}-${year}.pdf"`,
        },
      });
    } else {
      // Return JSON report
      return NextResponse.json({
        company: {
          name: company.name,
          industry: company.industry,
          taxId: company.taxId,
        },
        year,
        summary: {
          totalAmount,
          totalExpenses: expenses.length,
        },
        expensesByCategory,
        expenses: expenses.map((expense) => ({
          id: expense._id,
          name: expense.name,
          category: expense.category,
          expenseType: expense.expenseType,
          amount: expense.amount,
          startDate: expense.startDate,
          frequency: expense.frequency,
        })),
      });
    }
  } catch (error) {
    console.error("Error generating IRS report:", error);
    return NextResponse.json(
      { error: "Failed to generate IRS report" },
      { status: 500 }
    );
  }
}
