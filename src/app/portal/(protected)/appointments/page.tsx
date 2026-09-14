import { prisma } from "@/lib/db";
import { getClientSession, requireClientSession } from "@/lib/client-auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, MapPin, Phone } from "lucide-react";

export const metadata = { title: "Appointments" };

export default async function AppointmentsPage() {
  const session = await requireClientSession();
  if (!session) return null;

  const appointments = await prisma.appointment.findMany({
    where: { clientId: session.clientId },
    orderBy: { scheduledStart: "desc" },
  });

  const upcoming = appointments.filter((a: any) => new Date(a.scheduledStart) > new Date());
  const past = appointments.filter((a: any) => new Date(a.scheduledStart) <= new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Your Appointments</h1>
        <p className="mt-2 text-navy-600">Manage your notary service appointments</p>
      </div>

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments ({upcoming.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((apt: any) => (
                <div key={apt.id} className="rounded-lg border border-navy-100 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy-900">{apt.serviceType}</h3>
                      <div className="mt-2 space-y-1 text-sm text-navy-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(apt.scheduledStart).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(apt.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {apt.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {apt.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-navy-500 mb-2">{apt.confirmationNumber}</p>
                      <Link href={`/portal/appointments/${apt.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-navy-600 py-8">No upcoming appointments</p>
          )}
        </CardBody>
      </Card>

      {/* Past */}
      <Card>
        <CardHeader>
          <CardTitle>Past Appointments ({past.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {past.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {past.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border border-navy-100 p-3 text-sm">
                  <div>
                    <p className="font-medium text-navy-900">{apt.serviceType}</p>
                    <p className="text-navy-600">{new Date(apt.scheduledStart).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold ${apt.status === "completed" ? "text-success-600" : "text-navy-500"}`}>
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-navy-600 py-8">No past appointments</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
