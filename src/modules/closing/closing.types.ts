import { Closing, Branch, ClosingChecklist, File, ClosingRevision, ShareLink, ActivityLog, User } from "@prisma/client";

export type ClosingWithRelations = Closing & {
  branch: Branch;
  createdBy: Pick<User, "id" | "name" | "email" | "role">;
  verifiedBy?: Pick<User, "id" | "name" | "email" | "role"> | null;
  checklists: ClosingChecklist[];
  files: (File & {
    uploadedBy: Pick<User, "id" | "name" | "email">;
  })[];
  revisions: (ClosingRevision & {
    requestedBy: Pick<User, "id" | "name" | "email" | "role">;
    resolvedBy?: Pick<User, "id" | "name" | "email" | "role"> | null;
  })[];
  shareLinks: ShareLink[];
  activityLogs: (ActivityLog & {
    actor: Pick<User, "id" | "name" | "email" | "role">;
  })[];
};
