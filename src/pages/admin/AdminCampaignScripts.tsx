import { useState } from "react";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CampaignScriptEditor } from "@/components/admin/CampaignScriptEditor";
import { Edit3 } from "lucide-react";

export default function AdminCampaignScripts() {
  const [showScriptEditor, setShowScriptEditor] = useState(false);

  return (
    <AdminPageContainer 
      title="Campaign Script Management" 
      description="Manage calling, texting, and reminder scripts for campaign templates"
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Campaign Scripts Management</CardTitle>
            <Button onClick={() => setShowScriptEditor(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Campaign Scripts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Script Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Cold Calling Scripts</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Scripts used for cold calling campaigns and lead outreach.
                    </p>
                    <Button size="sm" variant="outline">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit Scripts
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">SMS Templates</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Text message templates for campaign follow-ups and notifications.
                    </p>
                    <Button size="sm" variant="outline">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit Templates
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Email Templates</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Email templates for campaign communications and reminders.
                    </p>
                    <Button size="sm" variant="outline">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit Templates
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Script Management</h3>
              <p className="text-muted-foreground mb-4">
                Manage calling, texting, and reminder scripts for all campaign templates. 
                These scripts are delivered to users when they launch campaigns.
              </p>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Quick Actions</h4>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowScriptEditor(true)}>
                    Open Script Editor
                  </Button>
                  <Button size="sm" variant="outline">
                    Export Scripts
                  </Button>
                  <Button size="sm" variant="outline">
                    Import Scripts
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Script Editor Modal */}
      {showScriptEditor && (
        <CampaignScriptEditor 
          isOpen={showScriptEditor}
          onClose={() => setShowScriptEditor(false)}
        />
      )}
    </AdminPageContainer>
  );
}