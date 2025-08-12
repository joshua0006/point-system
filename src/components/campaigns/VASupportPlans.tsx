import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare, CalendarClock, CalendarX2, ExternalLink, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import React from "react";

interface VASupportPlansProps {
  onBack: () => void;
  larkMemoUrl: string;
}

const plans = [
  {
    key: "basic" as const,
    name: "Basic VA Support",
    price: 50,
    features: [
      "Follow-up texting only",
      "You take over after lead responds",
      "Update CRM & Google Calendar",
    ],
    highlight: false,
  },
  {
    key: "standard" as const,
    name: "Standard VA Support",
    price: 75,
    features: [
      "Follow-up texting",
      "Appointment setting",
      "You handle reminders & rescheduling",
    ],
    highlight: true,
  },
  {
    key: "comprehensive" as const,
    name: "Comprehensive VA Support",
    price: 100,
    features: [
      "Follow-up texting",
      "Appointment setting",
      "Reminder texting (we handle reminders)",
      "Minimal action needed after appointment is set",
    ],
    highlight: false,
  },
] as const;

type PlanKey = typeof plans[number]["key"];

export const VASupportPlans: React.FC<VASupportPlansProps> = ({ onBack, larkMemoUrl }) => {
  const { toast } = useToast();

  const handleSubscribe = async (plan: PlanKey) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-va-support-checkout", {
        body: { plan },
      });
      if (error) throw error;
      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        title: "Subscription error",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to methods
      </button>

      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">VA Support Services</h2>
        <p className="text-muted-foreground">Monthly subscriptions in SGD (no GST). Choose a plan and subscribe instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((p) => (
          <Card key={p.key} className={`relative border-2 ${p.highlight ? 'border-primary' : 'border-border'}`}>
            <CardContent className="p-6 flex flex-col h-full">
              {p.highlight && (
                <Badge className="absolute -top-3 left-4" variant="default">Popular</Badge>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/10 p-3 rounded-lg"><MessageSquare className="h-5 w-5 text-primary" /></div>
                <h3 className="text-xl font-semibold">{p.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">S${p.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => handleSubscribe(p.key)} className="mt-auto w-full">Subscribe</Button>
            </CardContent>
          </Card>
        ))}

        {/* Self-managed card */}
        <Card className="md:col-span-3 border-dashed">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-muted p-3 rounded-lg"><CalendarClock className="h-5 w-5 text-muted-foreground" /></div>
                  <h3 className="text-lg font-semibold">Self-Managed</h3>
                  <Badge variant="outline">S$0</Badge>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CalendarX2 className="h-4 w-4 mt-0.5" /> No VA support apart from the first initial message (FOC)</li>
                  <li className="ml-6">You handle all follow-ups, appointments, CRM, calendar, reminders</li>
                </ul>
              </div>
              <div className="md:text-right">
                <a href={larkMemoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm underline underline-offset-4">
                  View penalties <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VASupportPlans;
