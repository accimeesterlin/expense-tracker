import {
  Calendar,
  AlertCircle,
  Edit,
  X,
  MoreVertical,
  DollarSign,
} from "lucide-react";
import CompanyLogo from "./CompanyLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Company {
  _id: string;
  name: string;
  industry: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  createdAt: string;
}

interface Expense {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  tags?: string[];
  expenseType: string;
  frequency?: string;
  startDate?: string;
  nextBillingDate?: string;
  company: Company;
  isActive: boolean;
  receiptUrl?: string;
  receiptS3Key?: string;
  receiptFileName?: string;
  receiptContentType?: string;
  metadata?: {
    companyDomain?: string;
    companyBrandId?: string;
    expenseDomain?: string;
    expenseBrandId?: string;
  };
  comments: Array<{
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface UpcomingSubscriptionsProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onCancel?: (expenseId: string) => void;
  onViewDetails?: (expenseId: string) => void;
  onRecordPayment?: (expense: Expense) => void;
}

export default function UpcomingSubscriptions({
  expenses,
  onEdit,
  onCancel,
  onViewDetails,
  onRecordPayment,
}: UpcomingSubscriptionsProps) {
  const upcomingExpenses = expenses
    .filter((expense) => expense.nextBillingDate)
    .sort(
      (a, b) =>
        new Date(a.nextBillingDate!).getTime() -
        new Date(b.nextBillingDate!).getTime()
    )
    .slice(0, 5);

  const getDaysUntil = (nextBillingDate: string) => {
    const today = new Date();
    const nextDate = new Date(nextBillingDate);
    const diffTime = nextDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusVariant = (
    daysUntil: number
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (daysUntil < 0) return "destructive";
    if (daysUntil <= 7) return "default";
    if (daysUntil <= 30) return "secondary";
    return "outline";
  };

  const getStatusText = (daysUntil: number) => {
    if (daysUntil < 0) return "Overdue";
    if (daysUntil === 0) return "Due Today";
    if (daysUntil === 1) return "Due Tomorrow";
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
    if (daysUntil <= 30) return `Due in ${daysUntil} days`;
    return `Due in ${daysUntil} days`;
  };

  if (upcomingExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <CardTitle className="text-base sm:text-lg lg:text-xl">
              Upcoming Subscriptions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">
              No upcoming subscriptions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            Upcoming Subscriptions
          </CardTitle>
          <Badge variant="default">{upcomingExpenses.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {upcomingExpenses.map((expense) => {
          const daysUntil = getDaysUntil(expense.nextBillingDate!);
          const statusVariant = getStatusVariant(daysUntil);
          const statusText = getStatusText(daysUntil);

          return (
            <div
              key={expense._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg border gap-3 sm:gap-0"
            >
              <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <CompanyLogo
                  companyName={expense.name}
                  domain={expense.metadata?.expenseDomain}
                  size="sm"
                  showAttribution={false}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                    {expense.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {expense.company.name} • {expense.category}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {new Date(expense.nextBillingDate!).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {new Date(expense.nextBillingDate!).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
                <span className="text-base sm:text-lg font-semibold text-foreground">
                  ${expense.amount.toFixed(2)}
                </span>
                <Badge variant={statusVariant} className="whitespace-nowrap">
                  {statusText}
                </Badge>

                {/* Action Buttons */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="flex-shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onRecordPayment && (
                      <DropdownMenuItem
                        onClick={() => onRecordPayment(expense)}
                        className="text-green-600"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Record Payment</span>
                      </DropdownMenuItem>
                    )}
                    {onViewDetails && (
                      <DropdownMenuItem
                        onClick={() => onViewDetails(expense._id)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Edit className="w-4 h-4 mr-2" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                    )}
                    {onCancel && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to cancel this subscription?"
                            )
                          ) {
                            onCancel(expense._id);
                          }
                        }}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        <span>Cancel</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        {expenses.filter((e) => e.nextBillingDate).length > 5 && (
          <div className="text-center pt-4">
            <Button variant="link" className="text-primary">
              View All Subscriptions →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
