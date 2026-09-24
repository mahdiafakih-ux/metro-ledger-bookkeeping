import { redirect } from "next/navigation";

// /portal → dashboard (the protected layout sends signed-out visitors to login).
export default function PortalIndex() {
  redirect("/portal/dashboard");
}
