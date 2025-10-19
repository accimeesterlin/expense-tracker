import dbConnect from "@/lib/db";
import Company from "@/models/Company";
import TeamMember from "@/models/TeamMember";

export interface UserCompanyAccess {
  companyId: string;
  isOwner: boolean;
  permissions: string[];
  role?: string;
  department?: string;
}

/**
 * Get all companies a user has access to (owned or as team member)
 */
export async function getUserCompanyAccess(userId: string): Promise<UserCompanyAccess[]> {
  await dbConnect();
  
  const access: UserCompanyAccess[] = [];
  
  // Get companies owned by the user
  const ownedCompanies = await Company.find({ userId });
  ownedCompanies.forEach(company => {
    access.push({
      companyId: company._id.toString(),
      isOwner: true,
      permissions: ['all']
    });
  });
  
  // Get companies where the user is a team member
  const teamMemberships = await TeamMember.find({ 
    userId, 
    isActive: true 
  });
  
  teamMemberships.forEach(membership => {
    const companyId = membership.company.toString();
    // Don't duplicate if already owner
    if (!access.find(a => a.companyId === companyId)) {
      access.push({
        companyId,
        isOwner: false,
        permissions: membership.permissions || [],
        role: membership.role,
        department: membership.department
      });
    }
  });
  
  return access;
}

/**
 * Check if user has permission for a specific action on a company
 */
export async function hasPermission(
  userId: string, 
  companyId: string, 
  permission: string
): Promise<boolean> {
  const access = await getUserCompanyAccess(userId);
  const companyAccess = access.find(a => a.companyId === companyId);
  
  if (!companyAccess) return false;
  if (companyAccess.isOwner) return true; // Owner has all permissions
  
  if (companyAccess.permissions.includes('admin_access')) {
    return true;
  }

  return companyAccess.permissions.includes(permission);
}

/**
 * Get all company IDs a user has access to
 */
export async function getUserCompanyIds(userId: string): Promise<string[]> {
  const access = await getUserCompanyAccess(userId);
  return access.map(a => a.companyId);
}
