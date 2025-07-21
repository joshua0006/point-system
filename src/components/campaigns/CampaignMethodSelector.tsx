
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Phone } from "lucide-react";

interface CampaignMethodSelectorProps {
  onMethodSelect: (method: 'facebook-ads' | 'cold-calling') => void;
}

export const CampaignMethodSelector = ({ onMethodSelect }: CampaignMethodSelectorProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose Your Campaign Method</h2>
        <p className="text-xl text-muted-foreground">
          Select the lead generation strategy that best fits your business goals.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20"
          onClick={() => onMethodSelect('facebook-ads')}
        >
          <CardContent className="p-8 text-center">
            <div className="bg-blue-500/10 p-6 rounded-2xl mb-6 w-fit mx-auto group-hover:scale-110 transition-transform">
              <Target className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Facebook Ad Campaigns</h3>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Launch targeted Facebook ad campaigns with proven templates designed for financial advisors in Singapore. Choose from specialized audiences and track performance.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                ✓ Targeted audiences (NSF, Seniors, General Public)
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                ✓ Proven ad templates with performance data
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                ✓ Expected 15-30 leads per $1000 spent
              </div>
            </div>
            <Button className="w-full" size="lg">
              Start Facebook Campaign
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20"
          onClick={() => onMethodSelect('cold-calling')}
        >
          <CardContent className="p-8 text-center">
            <div className="bg-green-500/10 p-6 rounded-2xl mb-6 w-fit mx-auto group-hover:scale-110 transition-transform">
              <Phone className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Cold Calling Campaigns</h3>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Hire professional telemarketers to generate leads through direct outreach. More personal approach with higher conversion rates for qualified prospects.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                ✓ Professional telemarketers at 6 points/hour
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                ✓ Direct personal engagement with prospects
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                ✓ Higher conversion rates on qualified leads
              </div>
            </div>
            <Button className="w-full" size="lg">
              Start Cold Calling
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
