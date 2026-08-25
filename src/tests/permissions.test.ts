import { describe, it, expect } from "vitest";

type CampaignAccessRole = "OWNER" | "MEMBER" | "SHARED_EDITOR" | "SHARED_VIEWER";

interface AccessInput {
  campaignTenantId: string;
  userTenantId: string | null;
  tenantMembershipRole: "ADMIN" | "MEMBER" | null;
  campaignSharePermission: "EDIT" | "VIEW" | null;
}

function resolveAccessRole(input: AccessInput): {
  allowed: boolean;
  role: CampaignAccessRole | null;
  canEdit: boolean;
  canDelete: boolean;
} {
  // 1. Dono direto do Tenant
  if (input.userTenantId && input.campaignTenantId === input.userTenantId) {
    return { allowed: true, role: "OWNER", canEdit: true, canDelete: true };
  }

  // 2. Membro da equipe
  if (input.tenantMembershipRole) {
    return {
      allowed: true,
      role: "MEMBER",
      canEdit: true,
      canDelete: input.tenantMembershipRole === "ADMIN",
    };
  }

  // 3. Compartilhamento individual
  if (input.campaignSharePermission === "EDIT") {
    return { allowed: true, role: "SHARED_EDITOR", canEdit: true, canDelete: false };
  }
  if (input.campaignSharePermission === "VIEW") {
    return { allowed: true, role: "SHARED_VIEWER", canEdit: false, canDelete: false };
  }

  return { allowed: false, role: null, canEdit: false, canDelete: false };
}

describe("Campaign RBAC Permissions", () => {
  it("grants full access to Tenant Owner", () => {
    const access = resolveAccessRole({
      campaignTenantId: "tenant-1",
      userTenantId: "tenant-1",
      tenantMembershipRole: null,
      campaignSharePermission: null,
    });
    expect(access.allowed).toBe(true);
    expect(access.role).toBe("OWNER");
    expect(access.canEdit).toBe(true);
    expect(access.canDelete).toBe(true);
  });

  it("grants edit access to Team Member", () => {
    const access = resolveAccessRole({
      campaignTenantId: "tenant-1",
      userTenantId: "tenant-2",
      tenantMembershipRole: "MEMBER",
      campaignSharePermission: null,
    });
    expect(access.allowed).toBe(true);
    expect(access.role).toBe("MEMBER");
    expect(access.canEdit).toBe(true);
    expect(access.canDelete).toBe(false);
  });

  it("grants edit access (no delete) to Shared Campaign Editor / Traffic Manager", () => {
    const access = resolveAccessRole({
      campaignTenantId: "tenant-1",
      userTenantId: "tenant-gestor",
      tenantMembershipRole: null,
      campaignSharePermission: "EDIT",
    });
    expect(access.allowed).toBe(true);
    expect(access.role).toBe("SHARED_EDITOR");
    expect(access.canEdit).toBe(true);
    expect(access.canDelete).toBe(false);
  });

  it("grants read-only access to Shared Campaign Viewer", () => {
    const access = resolveAccessRole({
      campaignTenantId: "tenant-1",
      userTenantId: "tenant-viewer",
      tenantMembershipRole: null,
      campaignSharePermission: "VIEW",
    });
    expect(access.allowed).toBe(true);
    expect(access.role).toBe("SHARED_VIEWER");
    expect(access.canEdit).toBe(false);
    expect(access.canDelete).toBe(false);
  });

  it("denies access to unrelated users", () => {
    const access = resolveAccessRole({
      campaignTenantId: "tenant-1",
      userTenantId: "tenant-stranger",
      tenantMembershipRole: null,
      campaignSharePermission: null,
    });
    expect(access.allowed).toBe(false);
    expect(access.role).toBeNull();
    expect(access.canEdit).toBe(false);
    expect(access.canDelete).toBe(false);
  });
});
