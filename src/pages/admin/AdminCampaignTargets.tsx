import { useState } from "react";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Settings, Trash2 } from "lucide-react";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";
import type { CampaignTarget } from "@/config/types";

export default function AdminCampaignTargets() {
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [editingTarget, setEditingTarget] = useState<CampaignTarget | null>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);

  const createNewTarget = () => {
    // Implementation would be moved from AdminInterface
    setShowTargetDialog(true);
  };

  const openEditTarget = (target: any) => {
    setEditingTarget(target);
    setShowTargetDialog(true);
  };

  const openCampaignTypesDialog = (target: any) => {
    // Implementation would be moved from AdminInterface
  };

  const deleteTarget = async (targetId: string) => {
    // Implementation would be moved from AdminInterface
  };

  return (
    <AdminPageContainer 
      title="Campaign Target Management" 
      description="Manage target audiences and campaign templates"
      onRetry={refreshTargets}
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Target Audiences</CardTitle>
            <Button onClick={createNewTarget}>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditTarget(target)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCampaignTypesDialog(target)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTarget(target.id)}
                        >
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
    </AdminPageContainer>
  );
}