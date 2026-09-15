import { BranchRepository } from "./branch.repository";
import { AuthUser, PermissionService } from "@/lib/permissions";
import { Role } from "@prisma/client";

export class BranchService {
  static async getBranch(id: string) {
    return BranchRepository.findById(id);
  }

  static async listBranchesForUser(user: AuthUser) {
    const authorized = PermissionService.getAuthorizedBranches(user);
    if (authorized.length === 0) {
      return [];
    }
    return BranchRepository.listByIds(authorized);
  }

  static async listAllBranches() {
    return BranchRepository.listAll();
  }
}
