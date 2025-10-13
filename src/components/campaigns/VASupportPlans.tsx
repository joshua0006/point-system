import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare, CalendarClock, CalendarX2, ExternalLink, ArrowLeft } from "lucide-react";
import React from "react";

interface VASupportPlansProps {
  onBack: () => void;
  larkMemoUrl: string;
  onSubscribe: (plan: { key: PlanKey; name: string; price: number }) => void;
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

export const VASupportPlans: React.FC<VASupportPlansProps> = ({ onBack, larkMemoUrl, onSubscribe }) => {
  

  const handleSubscribe = (plan: PlanKey) => {
    const selected = plans.find(p => p.key === plan)!;
    onSubscribe({ key: selected.key, name: selected.name, price: selected.price });
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
          <Card
            key={p.key}
            className={`relative border-2 transition-all duration-300 hover:scale-105 ${
              p.highlight
                ? 'border-primary shadow-lg shadow-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 scale-105'
                : 'border-border hover:border-primary/50 hover:shadow-xl'
            }`}
          >
            <CardContent className="p-8 flex flex-col h-full text-center">
              {p.highlight && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary shadow-md" variant="default">
                  Most Popular
                </Badge>
              )}

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-xl ${
                  p.highlight
                    ? 'bg-primary shadow-lg'
                    : 'bg-primary/10'
                }`}>
                  <MessageSquare className={`h-6 w-6 ${
                    p.highlight ? 'text-white' : 'text-primary'
                  }`} />
                </div>
              </div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold mb-4">{p.name}</h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-muted-foreground">S$</span>
                  <span className="text-5xl font-bold text-foreground">{p.price}</span>
                </div>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-left">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handleSubscribe(p.key)}
                className={`w-full py-6 text-base font-semibold ${
                  p.highlight
                    ? 'bg-primary hover:bg-blue-600 hover:text-white shadow-lg hover:shadow-xl'
                    : 'hover:bg-blue-600 hover:text-white hover:border-blue-600'
                }`}
                variant={p.highlight ? "default" : "outline"}
                size="lg"
              >
                Subscribe Now
              </Button>
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
