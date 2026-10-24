import type {
  getNegotiationDetail,
  getRecentNegotiations,
  getStorefront,
  getVendorDashboard,
} from "@/lib/queries";

/** Shared view types derived from the Lead's query return shapes. */

export type Storefront = Awaited<ReturnType<typeof getStorefront>>;
export type StorefrontItem = Storefront["items"][number];
export type StorefrontOffer = StorefrontItem["offers"][number];
export type Buyer = Storefront["buyer"];

export type NegotiationDetail = NonNullable<
  Awaited<ReturnType<typeof getNegotiationDetail>>
>;
export type NegotiationRound = NegotiationDetail["rounds"][number];
export type NegotiationOffer = NegotiationRound["offers"][number];
export type OrderDetail = NonNullable<NegotiationDetail["order"]>;

export type VendorDashboard = Awaited<ReturnType<typeof getVendorDashboard>>;
export type VendorOffer = VendorDashboard["pending"][number];
export type VendorListing = VendorDashboard["listings"][number];

export type RecentNegotiation = Awaited<
  ReturnType<typeof getRecentNegotiations>
>[number];
