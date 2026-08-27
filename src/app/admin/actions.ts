"use server";

import * as campaigns from "./campaigns/actions";
import * as groups from "./campaigns/[id]/groups/actions";

export type { ActionState } from "./campaigns/actions";

// --- CAMPAIGN ACTIONS ---

export async function saveCampaignAction(
  campaignId: string | null,
  data: Record<string, unknown>
) {
  return campaigns.saveCampaignAction(campaignId, data);
}

export async function deleteCampaignAction(id: string) {
  return campaigns.deleteCampaignAction(id);
}

export async function toggleCampaignStatusAction(id: string, active: boolean) {
  return campaigns.toggleCampaignStatusAction(id, active);
}

export async function toggleCampaignProtectionAction(campaignId: string, protected_: boolean) {
  return campaigns.toggleCampaignProtectionAction(campaignId, protected_);
}

export async function checkCustomHostnameStatusAction(hostname: string) {
  return campaigns.checkCustomHostnameStatusAction(hostname);
}

// --- GROUP ACTIONS ---

export async function createGroupAction(state: campaigns.ActionState, formData: FormData) {
  return groups.createGroupAction(state, formData);
}

export async function createWhatsAppGroupAction(state: campaigns.ActionState, formData: FormData) {
  return groups.createWhatsAppGroupAction(state, formData);
}

export async function deleteGroupAction(groupId: string, campaignId: string) {
  return groups.deleteGroupAction(groupId, campaignId);
}

export async function toggleGroupStatusAction(groupId: string, campaignId: string, active: boolean) {
  return groups.toggleGroupStatusAction(groupId, campaignId, active);
}

export async function updateGroupUrlAction(groupId: string, campaignId: string, url: string) {
  return groups.updateGroupUrlAction(groupId, campaignId, url);
}

export async function updateCampaignGroupSettingsAction(
  campaignId: string,
  state: campaigns.ActionState,
  formData: FormData
) {
  return groups.updateCampaignGroupSettingsAction(campaignId, state, formData);
}
