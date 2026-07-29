import { CampaignWizard } from "@/components/admin/campaign-wizard";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { getUserTenant } from "@/lib/auth";

export default async function NewCampaignPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("vortex_admin_session")?.value;
  const session = await decrypt(cookie);

  let plan = "FREE";
  if (session?.userId) {
    const userTenant = await getUserTenant(session.userId);
    if (userTenant) {
      plan = userTenant.plan;
    }
  }

  return <CampaignWizard plan={plan} />;
}