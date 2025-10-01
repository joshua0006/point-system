import React, { memo, useState } from "react";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Edit3, Monitor } from "lucide-react";
import { AdminCampaignMonitor } from "@/components/campaigns/AdminCampaignMonitor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { CampaignScriptEditor } from "@/components/admin/CampaignScriptEditor";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";

const AdminCampaigns = memo(function AdminCampaigns() {
  const { campaignTargets, refreshTargets } = useCampaignTargets();
  const [showScriptEditor, setShowScriptEditor] = useState(false);

  return (
    <AdminPageContainer 
      title="Campaign Management" 
      description="Manage lead generation campaigns and settings"
      onRetry={refreshTargets}
    >
      <Tabs defaultValue="monitor" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Campaign Monitor
          </TabsTrigger>
          <TabsTrigger value="targets" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Target Management
          </TabsTrigger>
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Campaign Scripts
          </TabsTrigger>
        </TabsList>

        {/* Campaign Monitor Tab */}
        <TabsContent value="monitor">
          <AdminCampaignMonitor />
        </TabsContent>

        {/* Target Management Tab */}
        <TabsContent value="targets">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Target Audiences</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Audience
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaignTargets.map((target) => {
                  const IconComponent = target.icon;
                  return (
                    <Card key={target.id} className="relative">
                      {target.isSeeded && (
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 border-green-200"
                        >
                          System
                        </Badge>
                      )}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className={`${target.bgColor} p-2 rounded-lg`}>
                            <IconComponent className={`h-5 w-5 ${target.iconColor}`} />
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold mb-2">{target.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{target.description}</p>
                        <div className="space-y-2 text-xs">
                          <div>Budget: {target.budgetRange?.min || 0} - {target.budgetRange?.max || 0} points</div>
                          <div>
                            <div className="font-medium mb-1">Campaign Types:</div>
                            <div className="flex flex-wrap gap-1">
                              {(target.campaignTypes || []).slice(0, 2).map((type, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                              {(target.campaignTypes || []).length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(target.campaignTypes || []).length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaign Scripts Tab */}
        <TabsContent value="scripts">
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
                        <Button size="sm" variant="outline" onClick={() => setShowScriptEditor(true)}>
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
                        <Button size="sm" variant="outline" onClick={() => setShowScriptEditor(true)}>
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
                        <Button size="sm" variant="outline" onClick={() => setShowScriptEditor(true)}>
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit Templates
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Script Editor Modal */}
      {showScriptEditor && (
        <CampaignScriptEditor 
          isOpen={showScriptEditor}
          onClose={() => setShowScriptEditor(false)}
        />
      )}
    </AdminPageContainer>
  );
});

export default AdminCampaigns;