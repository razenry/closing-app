import { Role, ClosingStatus } from "@prisma/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  branchId?: string | null;
  authorizedBranchIds?: string | null;
  active?: boolean;
}

export interface ClosingResource {
  id: string;
  branchId: string;
  status: ClosingStatus;
  completenessPercentage?: number;
}

export interface FileResource {
  id: string;
  closingId: string;
  closing?: {
    branchId: string;
    status: ClosingStatus;
  } | null;
}

export class PermissionService {
  /**
   * Helper to retrieve array of authorized branch IDs.
   * STAFF_CABANG -> [user.branchId]
   * STAFF_PUSAT -> user.authorizedBranchIds (split by comma, or all if empty/asterisk)
   */
  static getAuthorizedBranches(user: AuthUser): string[] {
    if (user.role === Role.STAFF_CABANG) {
      return user.branchId ? [user.branchId] : [];
    }
    if (user.role === Role.STAFF_PUSAT) {
      if (!user.authorizedBranchIds) return [];
      return user.authorizedBranchIds.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }

  /**
   * Check if user is allowed to access a given branch.
   */
  static canAccessBranch(user: AuthUser, branchId: string): boolean {
    const branches = this.getAuthorizedBranches(user);
    return branches.includes(branchId);
  }

  /**
   * BR-005 & BR-006:
   * Staff Cabang only own branch.
   * Staff Pusat only authorized branches.
   */
  static canViewClosing(user: AuthUser, closing: ClosingResource): boolean {
    return this.canAccessBranch(user, closing.branchId);
  }

  /**
   * canEditClosing:
   * Staff Cabang, own branch, status is DRAFT or REVISION_REQUIRED.
   * BR-007: VERIFIED closings cannot be freely edited.
   * SUBMITTED closings cannot be edited until revision requested.
   */
  static canEditClosing(user: AuthUser, closing: ClosingResource): boolean {
    if (user.role !== Role.STAFF_CABANG) return false;
    if (!this.canAccessBranch(user, closing.branchId)) return false;
    return closing.status === ClosingStatus.DRAFT || closing.status === ClosingStatus.REVISION_REQUIRED;
  }

  /**
   * canUploadFile:
   * Same as canEditClosing.
   */
  static canUploadFile(user: AuthUser, closing: ClosingResource): boolean {
    return this.canEditClosing(user, closing);
  }

  /**
   * canSubmitClosing:
   * Staff Cabang, own branch, DRAFT or REVISION_REQUIRED, completeness must be 100%.
   */
  static canSubmitClosing(user: AuthUser, closing: ClosingResource): boolean {
    if (user.role !== Role.STAFF_CABANG) return false;
    if (!this.canAccessBranch(user, closing.branchId)) return false;
    if (closing.status !== ClosingStatus.DRAFT && closing.status !== ClosingStatus.REVISION_REQUIRED) {
      return false;
    }
    return (closing.completenessPercentage ?? 0) >= 100;
  }

  /**
   * canRequestRevision:
   * Staff Pusat, authorized branch, status must not be VERIFIED (VERIFIED is immutable).
   */
  static canRequestRevision(user: AuthUser, closing: ClosingResource): boolean {
    if (user.role !== Role.STAFF_PUSAT) return false;
    if (!this.canAccessBranch(user, closing.branchId)) return false;
    return closing.status !== ClosingStatus.VERIFIED;
  }

  /**
   * canVerifyClosing:
   * Staff Pusat, authorized branch, status must be SUBMITTED, completeness must be 100%.
   */
  static canVerifyClosing(user: AuthUser, closing: ClosingResource): boolean {
    if (user.role !== Role.STAFF_PUSAT) return false;
    if (!this.canAccessBranch(user, closing.branchId)) return false;
    if (closing.status !== ClosingStatus.SUBMITTED) return false;
    return (closing.completenessPercentage ?? 0) >= 100;
  }

  /**
   * canDownloadFile:
   * User can download if they can view the closing.
   */
  static canDownloadFile(user: AuthUser, branchId: string): boolean {
    return this.canAccessBranch(user, branchId);
  }

  /**
   * canGenerateShareLink:
   * Staff Pusat with authorized branch or authorized branch staff.
   */
  static canGenerateShareLink(user: AuthUser, closing: ClosingResource): boolean {
    return this.canViewClosing(user, closing);
  }
}
