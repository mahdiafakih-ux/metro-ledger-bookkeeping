import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/client-auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireClientSession();
  if (!session) return null;

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
  });

  if (!client) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Your Profile</h1>
        <p className="mt-2 text-navy-600">View your account information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-navy-600">Full Name</p>
              <p className="text-lg font-semibold text-navy-900">{client.name}</p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Email</p>
              <p className="text-lg font-semibold text-navy-900">{client.email}</p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Phone</p>
              <p className="text-lg font-semibold text-navy-900">{client.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Company</p>
              <p className="text-lg font-semibold text-navy-900">{client.company || "—"}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-navy-600">Client Type</p>
              <p className="text-lg font-semibold text-navy-900 capitalize">
                {client.clientType.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Lead Status</p>
              <p className="text-lg font-semibold text-navy-900 capitalize">
                {client.leadStatus.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Member Since</p>
              <p className="text-lg font-semibold text-navy-900">
                {client.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Total Appointments</p>
              <p className="text-lg font-semibold text-navy-900">{client.totalAppointments}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-navy-700">{client.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
