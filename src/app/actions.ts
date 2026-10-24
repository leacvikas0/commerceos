"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseAmountToMinor, parsePositiveInt } from "@/lib/format";
import {
  authorizeOrder,
  buyerAcceptCounter,
  confirmOrder,
  runNegotiation,
  simulateSupplierRepricing,
  vendorAcceptOffer,
  vendorCounterOffer,
  vendorRejectOffer,
} from "@/lib/negotiation-service";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Buyer submits a requirement; the deterministic engine runs immediately. */
export async function startNegotiationAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = parsePositiveInt(String(formData.get("quantity") ?? ""));
  const target = parseAmountToMinor(String(formData.get("targetPrice") ?? ""));
  const budget = parseAmountToMinor(String(formData.get("budgetCap") ?? ""));
  const deadlineDays = parsePositiveInt(String(formData.get("deadlineDays") ?? ""));

  if (!itemId) fail("/", "Choose an item to negotiate.");
  if (!quantity) fail("/", "Quantity must be a whole number above zero.");
  if (target === null) fail("/", "Target unit price must be a valid amount.");
  if (budget === null) fail("/", "Budget cap must be a valid amount.");
  if (!deadlineDays || deadlineDays > 90) {
    fail("/", "Deadline must be between 1 and 90 days.");
  }

  const buyer = await prisma.buyer.findFirst({ orderBy: { createdAt: "asc" } });
  if (!buyer) fail("/", "No buyer is seeded. Run the database seed first.");

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) fail("/", "That item no longer exists.");

  const negotiation = await prisma.negotiation.create({
    data: {
      buyerId: buyer.id,
      itemId,
      quantity: quantity!,
      targetUnitPriceMinor: target,
      budgetCapMinor: budget,
      deadline: new Date(Date.now() + deadlineDays! * 24 * 60 * 60 * 1000),
      status: "OPEN",
    },
  });

  await runNegotiation(negotiation.id);
  revalidatePath("/vendor");
  redirect(`/negotiation/${negotiation.id}`);
}

export async function vendorAcceptAction(formData: FormData) {
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) fail("/vendor", "Missing offer.");

  try {
    await vendorAcceptOffer(
      offerId,
      "Vendor accepted the offer from the dashboard.",
    );
  } catch {
    fail("/vendor", "That offer could not be accepted. Refresh and try again.");
  }

  revalidatePath("/vendor");
  revalidatePath("/");
  redirect("/vendor?notice=Offer+accepted+%E2%80%94+deal+agreed");
}

export async function vendorRejectAction(formData: FormData) {
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) fail("/vendor", "Missing offer.");

  try {
    await vendorRejectOffer(
      offerId,
      "Vendor rejected the offer from the dashboard.",
    );
  } catch {
    fail("/vendor", "That offer could not be rejected. Refresh and try again.");
  }

  revalidatePath("/vendor");
  redirect("/vendor?notice=Offer+rejected");
}

export async function vendorCounterAction(formData: FormData) {
  const offerId = String(formData.get("offerId") ?? "");
  const counter = parseAmountToMinor(String(formData.get("counterPrice") ?? ""));
  if (!offerId) fail("/vendor", "Missing offer.");
  if (counter === null) fail("/vendor", "Enter a valid counter price.");

  try {
    await vendorCounterOffer(
      offerId,
      counter,
      "Vendor countered from the dashboard.",
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The counter could not be sent.";
    fail("/vendor", message);
  }

  revalidatePath("/vendor");
  redirect("/vendor?notice=Counter+sent+to+the+buyer");
}

export async function buyerAcceptCounterAction(formData: FormData) {
  const offerId = String(formData.get("offerId") ?? "");
  const negotiationId = String(formData.get("negotiationId") ?? "");
  if (!offerId || !negotiationId) fail("/", "Missing offer.");

  try {
    await buyerAcceptCounter(offerId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not accept the counter.";
    fail(`/negotiation/${negotiationId}`, message);
  }

  revalidatePath("/vendor");
  redirect(`/negotiation/${negotiationId}`);
}

export async function authorizeOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const negotiationId = String(formData.get("negotiationId") ?? "");
  if (!orderId || !negotiationId) fail("/", "Missing order.");

  try {
    await authorizeOrder(orderId);
  } catch {
    fail(`/negotiation/${negotiationId}`, "This order cannot be authorized.");
  }

  redirect(`/negotiation/${negotiationId}`);
}

export async function confirmOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const negotiationId = String(formData.get("negotiationId") ?? "");
  if (!orderId || !negotiationId) fail("/", "Missing order.");

  try {
    await confirmOrder(orderId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The order could not be confirmed.";
    fail(`/negotiation/${negotiationId}`, message);
  }

  revalidatePath(`/negotiation/${negotiationId}`);
  redirect(`/negotiation/${negotiationId}`);
}

export async function simulateRepricingAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) fail("/vendor", "Missing listing.");

  try {
    await simulateSupplierRepricing(listingId);
  } catch {
    fail("/vendor", "Could not reprice that listing.");
  }

  revalidatePath("/vendor");
  redirect("/vendor?notice=Supplier+repriced+the+listing");
}
