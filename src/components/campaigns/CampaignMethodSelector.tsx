import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Phone, MessageSquare, Check } from "lucide-react";

export const CampaignMethodSelector = React.memo(() => {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Choose Your Campaign Method</h2>
        <p className="text-base text-muted-foreground">
          Select the lead generation strategy that best fits your business goals.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20"
          onClick={() => navigate('/campaigns/facebook-ads')}
        >
          <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
            <div className="bg-blue-500 p-3 sm:p-4 lg:p-6 rounded-2xl mb-4 sm:mb-6 w-fit mx-auto group-hover:scale-110 transition-transform shadow-lg" aria-hidden="true">
              <Target className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">Facebook Ad Campaigns</h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
              Launch targeted Facebook ad campaigns with proven templates designed for financial advisors in Singapore. Choose from specialized audiences and track performance.
            </p>
            <div className="mt-auto">
              <ul className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 text-left">
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Targeted audiences (NSF, Seniors, General Public)</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Proven ad templates with performance data</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Expected 15-30 leads per $1000 spent</span>
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Start Facebook Campaign
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20"
          onClick={() => navigate('/campaigns/cold-calling')}
        >
          <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
            <div className="bg-green-500 p-3 sm:p-4 lg:p-6 rounded-2xl mb-4 sm:mb-6 w-fit mx-auto group-hover:scale-110 transition-transform shadow-lg" aria-hidden="true">
              <Phone className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">Cold Calling Campaigns</h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
              Hire professional telemarketers to generate leads through direct outreach. More personal approach with higher conversion rates for qualified prospects.
            </p>
            <div className="mt-auto">
              <ul className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 text-left">
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Professional telemarketers at 6 points/hour</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Direct personal engagement with prospects</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Higher conversion rates on qualified leads</span>
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Start Cold Calling
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20"
          onClick={() => navigate('/campaigns/va-support')}
        >
          <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
            <div className="bg-purple-500 p-3 sm:p-4 lg:p-6 rounded-2xl mb-4 sm:mb-6 w-fit mx-auto group-hover:scale-110 transition-transform shadow-lg" aria-hidden="true">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">VA Support Services</h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
              Subscribe to managed follow-ups, appointment setting, and reminders so you can focus on selling.
            </p>
            <div className="mt-auto">
              <ul className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 text-left">
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Basic, Standard, Comprehensive, or Self-Managed</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Fixed monthly pricing in SGD (no GST)</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Wallet-based monthly billing</span>
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Explore VA Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

CampaignMethodSelector.displayName = 'CampaignMethodSelector';

export default CampaignMethodSelector;