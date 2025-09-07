import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // For now, we'll use a simple approach with favicon services
    // In a real implementation, you would use Clearbit API or similar service
    const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    // Alternative: Use Clearbit Logo API (requires API key)
    // const clearbitUrl = `https://logo.clearbit.com/${domain}`;

    return NextResponse.json({
      logoUrl,
      domain,
      source: "favicon", // or "clearbit" if using Clearbit API
    });
  } catch (error) {
    console.error("Error fetching company logo:", error);
    return NextResponse.json(
      { error: "Failed to fetch company logo" },
      { status: 500 }
    );
  }
}
