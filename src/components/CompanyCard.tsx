import { MapPin, Mail, Edit, Trash2 } from "lucide-react";
import CompanyLogo from "./CompanyLogo";
import Link from "next/link";

interface Company {
  _id: string;
  name: string;
  industry?: string;
  domain?: string;
  address?: {
    city?: string;
    state?: string;
  };
  contactInfo?: {
    email?: string;
    website?: string;
  };
}

interface CompanyCardProps {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CompanyCard({
  company,
  onEdit,
  onDelete,
}: CompanyCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <Link
          href={`/companies/${company._id}`}
          className="flex-1 block hover:bg-gray-50 -m-4 p-4 rounded-lg"
        >
          <div className="flex items-center space-x-3 mb-2">
            <CompanyLogo
              companyName={company.name}
              domain={company.domain}
              website={company.contactInfo?.website}
              size="md"
              showAttribution={true}
            />
            <div>
              <h3 className="font-semibold text-gray-900 text-lg hover:text-[#006BFF] transition-colors">
                {company.name}
              </h3>
              {company.industry && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {company.industry}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {company.address?.city && company.address?.state && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {company.address.city}, {company.address.state}
                </span>
              </div>
            )}
            {company.contactInfo?.email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{company.contactInfo.email}</span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit company"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete company"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
