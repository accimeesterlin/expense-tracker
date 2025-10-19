import { useRouter } from "next/navigation";
import CompanyLogo from "./CompanyLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Company {
  _id: string;
  name: string;
  industry?: string;
}

interface Expense {
  _id: string;
  name: string;
  amount: number;
  category: string;
  company: Company;
  metadata?: {
    companyDomain?: string;
    companyBrandId?: string;
    expenseDomain?: string;
    expenseBrandId?: string;
  };
}

interface DashboardExpenseCardProps {
  expense: Expense;
}

export default function DashboardExpenseCard({
  expense,
}: DashboardExpenseCardProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      Travel: "default",
      Entertainment: "secondary",
      "Office Supplies": "outline",
      Marketing: "secondary",
      Technology: "default",
      Other: "outline",
    };
    return colors[category] || "outline";
  };

  const handleClick = () => {
    router.push(`/expenses/${expense._id}`);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <CompanyLogo
              companyName={expense.name}
              domain={expense.metadata?.expenseDomain}
              size="sm"
              showAttribution={false}
              className="w-8 h-8 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground text-sm truncate">
                {expense.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground truncate">
                  {expense.company.name}
                </span>
                <Badge
                  variant={getCategoryColor(expense.category)}
                  className="text-xs"
                >
                  {expense.category}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <span className="font-semibold text-foreground text-sm">
              {formatCurrency(expense.amount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
