import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare } from "lucide-react";
import { getBusinessSettings } from "@/lib/settings";

export const metadata = { title: "Support" };

export default async function SupportPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Help & Support</h1>
        <p className="mt-2 text-navy-600">Get help with your account and appointments</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-accent-500" />
              Call Us
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-navy-600 mb-4">Speak with our team directly</p>
            <a href={`tel:${settings.phone}`} className="text-lg font-semibold text-accent-600 hover:text-accent-700">
              {settings.phone}
            </a>
            <p className="text-xs text-navy-500 mt-2">Available during business hours</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent-500" />
              Email Us
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-navy-600 mb-4">Send us a message</p>
            <a href={`mailto:${settings.email}`} className="text-lg font-semibold text-accent-600 hover:text-accent-700">
              {settings.email}
            </a>
            <p className="text-xs text-navy-500 mt-2">We respond within 24 hours</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent-500" />
              Contact Form
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-navy-600 mb-4">Submit a support request</p>
            <a href="/contact">
              <Button className="w-full">Send Message</Button>
            </a>
          </CardBody>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardBody className="space-y-6">
          <div>
            <h3 className="font-semibold text-navy-900 mb-2">How do I reschedule an appointment?</h3>
            <p className="text-navy-700">
              Go to the Appointments page and click "Reschedule" on the appointment you want to change. Select a new date and time, and we'll send you confirmation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-navy-700">
              We accept all major credit and debit cards through Stripe. Your payment information is secure and encrypted.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 mb-2">Can I cancel my subscription?</h3>
            <p className="text-navy-700">
              Yes, you can cancel anytime from your billing page. Your subscription will remain active until the end of your current billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 mb-2">Do you offer refunds?</h3>
            <p className="text-navy-700">
              Refund eligibility depends on the service provided. Contact our support team to discuss your specific situation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-navy-700">
              Yes, you can change your plan from the billing page. Changes take effect on your next billing date.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
