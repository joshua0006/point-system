import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminCampaignLauncher() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Launcher</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Campaign launcher functionality will be implemented here.
          </p>
          <Button variant="outline">
            Launch Campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}