import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { requireClientSession } from "@/lib/client-auth";

export type BusinessManagerAuth =
  | { ok: true; actor: "admin" | "client"; clientId?: string }
  | { ok: false; status: 401 | 403 | 404; error: string };

/**
 * Who may start, change or pay for a business subscription:
 *  - a signed-in admin (any business), or
 *  - a signed-in portal client linked to the business via BusinessClient
 *    with role owner or admin.
 * Never trusts browser-supplied identity — everything is derived from the
 * session cookie and the database.
 */
export async function authorizeBusinessManager(businessId: string): Promise<BusinessManagerAuth> {
  const admin = await requireAdminSession();
  const client = admin ? null : await requireClientSession();
  if (!admin && !client) return { ok: false, status: 401, error: "Unauthorized" };

  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return { ok: false, status: 404, error: "Business not found" };
  if (admin) return { ok: true, actor: "admin" };

  const link = await prisma.businessClient.findUnique({
    where: { businessId_clientId: { businessId, clientId: client!.clientId } },
    select: { role: true },
  });
  if (!link || (link.role !== "owner" && link.role !== "admin")) {
    return { ok: false, status: 403, error: "You do not have permission to manage billing for this business. Contact the business owner." };
  }
  return { ok: true, actor: "client", clientId: client!.clientId };
}
