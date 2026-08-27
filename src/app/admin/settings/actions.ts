"use server";

import * as profile from "./profile-actions";
import * as billing from "./billing-actions";

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  invoiceUrl?: string;
  needsBilling?: boolean;
} | undefined;

// --- PROFILE ACTIONS ---

export async function updateProfileAction(state: ActionState, formData: FormData) {
  return profile.updateProfileAction(state, formData);
}

export async function updateCombinedSettingsAction(state: ActionState, formData: FormData) {
  return profile.updateCombinedSettingsAction(state, formData);
}

export async function updatePublicProfileAction(state: ActionState, formData: FormData) {
  return profile.updatePublicProfileAction(state, formData);
}

export async function requestEmailChangeAction(state: ActionState, formData: FormData) {
  return profile.requestEmailChangeAction(state, formData);
}

export async function verifyEmailChangeAction(state: ActionState, formData: FormData) {
  return profile.verifyEmailChangeAction(state, formData);
}

export async function uploadAvatarAction(state: ActionState, formData: FormData) {
  return profile.uploadAvatarAction(state, formData);
}

export async function removeAvatarAction() {
  return profile.removeAvatarAction();
}

// --- BILLING ACTIONS ---

export async function saveBillingInfoAction(state: ActionState, formData: FormData) {
  return billing.saveBillingInfoAction(state, formData);
}

export async function verifyPaymentAction() {
  return billing.verifyPaymentAction();
}

export async function changePlanCheckoutAction(state: ActionState, formData: FormData) {
  return billing.changePlanCheckoutAction(state, formData);
}

export async function cancelSubscriptionAction() {
  return billing.cancelSubscriptionAction();
}

export async function reactivateSubscriptionAction() {
  return billing.reactivateSubscriptionAction();
}