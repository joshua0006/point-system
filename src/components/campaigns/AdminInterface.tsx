
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit3, Trash2, Save, Shield, Users, User, Settings, Monitor, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminCampaignMonitor } from "./AdminCampaignMonitor";
import UserPermissionManagement from "../admin/UserPermissionManagement";
import { supabase } from "@/integrations/supabase/client";

const ICON_OPTIONS = [
  { name: 'Shield', component: Shield, value: 'Shield' },
  { name: 'Users', component: Users, value: 'Users' },
  { name: 'User', component: User, value: 'User' }
];

interface AdminInterfaceProps {
  campaignTargets: any[];
  setCampaignTargets: React.Dispatch<React.SetStateAction<any[]>>;
  editingTarget: any;
  setEditingTarget: (target: any) => void;
  showTargetDialog: boolean;
  setShowTargetDialog: (show: boolean) => void;
  refreshTargets: () => Promise<void>;
}

export const AdminInterface = ({
  campaignTargets,
  setCampaignTargets,
  editingTarget,
  setEditingTarget,
  showTargetDialog,
  setShowTargetDialog,
  refreshTargets
}: AdminInterfaceProps) => {
  const { toast } = useToast();
  const [showCampaignTypesDialog, setShowCampaignTypesDialog] = useState(false);
  const [editingTargetForTypes, setEditingTargetForTypes] = useState<any>(null);
  const [targetForm, setTargetForm] = useState({
    id: '',
    name: '',
    description: '',
    icon: 'Users',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    budgetRange: { min: 200, max: 1500, recommended: 500 },
    campaignTypes: ['Facebook Lead Ads', 'Facebook Conversion Ads', 'Facebook Engagement Ads']
  });

  // Load campaign templates from database on mount
  useEffect(() => {
    // Data is now managed by the parent component via props
    // No need to load data here anymore since it's shared
  }, []);

  const openEditTarget = (target: any) => {
    setTargetForm({
      id: target.id,
      name: target.name,
      description: target.description,
      icon: target.icon.name || 'Users',
      bgColor: target.bgColor,
      iconColor: target.iconColor,
      budgetRange: target.budgetRange ? { ...target.budgetRange } : { min: 200, max: 1500, recommended: 500 },
      campaignTypes: target.campaignTypes || ['Facebook Lead Ads', 'Facebook Conversion Ads', 'Facebook Engagement Ads']
    });
    setEditingTarget(target);
    setShowTargetDialog(true);
  };

  const createNewTarget = () => {
    setTargetForm({
      id: `target-${Date.now()}`,
      name: '',
      description: '',
      icon: 'Users',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      budgetRange: { min: 200, max: 1500, recommended: 500 },
      campaignTypes: ['Facebook Lead Ads', 'Facebook Conversion Ads', 'Facebook Engagement Ads']
    });
    setEditingTarget(null);
    setShowTargetDialog(true);
  };

  const saveTarget = async () => {
    try {
      const selectedIcon = ICON_OPTIONS.find(icon => icon.value === targetForm.icon);
      
      const templateData = {
        name: targetForm.name,
        description: targetForm.description,
        target_audience: 'custom', // Database constraint only allows 'custom'
        campaign_angle: 'custom',
        template_config: {
          icon: targetForm.icon,
          bgColor: targetForm.bgColor,
          iconColor: targetForm.iconColor,
          budgetRange: targetForm.budgetRange,
          campaignTypes: targetForm.campaignTypes,
          customAudienceName: targetForm.name // Store the actual audience name in config
        }
      };

      if (editingTarget) {
        // For editing existing targets, we need to handle grouped vs individual templates
        if (editingTarget.isSeeded && editingTarget.templateIds) {
          // Update all templates for this target audience
          for (const templateId of editingTarget.templateIds) {
            const { error } = await supabase
              .from('campaign_templates')
              .update({
                description: templateData.description,
                template_config: templateData.template_config
              })
              .eq('id', templateId);
            
            if (error) throw error;
          }
        } else {
          // Update single custom template
          const { error } = await supabase
            .from('campaign_templates')
            .update(templateData)
            .eq('id', editingTarget.id);
          
          if (error) throw error;
        }
        
        toast({ title: "Target audience updated successfully!" });
      } else {
        const { data, error } = await supabase
          .from('campaign_templates')
          .insert([templateData])
          .select()
          .single();
        
        if (error) throw error;
        
        toast({ title: "New target audience created successfully!" });
      }
      
      setShowTargetDialog(false);
      setEditingTarget(null);
      
      // Refresh data after successful save
      await refreshTargets();
    } catch (error) {
      console.error('Error saving target:', error);
      toast({ title: "Error saving target", variant: "destructive" });
    }
  };

  const deleteTarget = async (targetId: string) => {
    try {
      const target = campaignTargets.find(t => t.id === targetId);
      
      if (target?.isSeeded && target?.templateIds) {
        // Delete all templates for this target audience
        for (const templateId of target.templateIds) {
          const { error } = await supabase
            .from('campaign_templates')
            .delete()
            .eq('id', templateId);
          
          if (error) throw error;
        }
      } else {
        // Delete single custom template
        const { error } = await supabase
          .from('campaign_templates')
          .delete()
          .eq('id', targetId);
        
        if (error) throw error;
      }
      
      // Refresh data after successful delete
      await refreshTargets();
      
      toast({ title: "Target audience deleted successfully!" });
    } catch (error) {
      console.error('Error deleting target:', error);
      toast({ title: "Error deleting target", variant: "destructive" });
    }
  };

  const openCampaignTypesDialog = (target: any) => {
    // Deep clone the target to avoid reference issues
    setEditingTargetForTypes({
      ...target,
      campaignTypes: [...(target.campaignTypes || [])]
    });
    setShowCampaignTypesDialog(true);
  };

  const saveCampaignTypes = async () => {
    if (editingTargetForTypes) {
      try {
        console.log('Saving campaign types for target:', editingTargetForTypes.id);
        console.log('New campaign types:', editingTargetForTypes.campaignTypes);
        
        // For seeded audiences, update all templates with the same target_audience
        // For custom audiences, just update the single template
        if (editingTargetForTypes.isSeeded && editingTargetForTypes.templateIds) {
          // Update all templates for this target audience
          for (const templateId of editingTargetForTypes.templateIds) {
            const { data: template, error: fetchError } = await supabase
              .from('campaign_templates')
              .select('template_config')
              .eq('id', templateId)
              .single();
            
            if (fetchError) {
              console.error(`Error fetching template ${templateId}:`, fetchError);
              continue;
            }
            
            const currentConfig = template.template_config as any;
            const updatedConfig = {
              ...currentConfig,
              campaignTypes: editingTargetForTypes.campaignTypes
            };
            
            const { error: updateError } = await supabase
              .from('campaign_templates')
              .update({ template_config: updatedConfig })
              .eq('id', templateId);
              
            if (updateError) {
              console.error(`Error updating template ${templateId}:`, updateError);
            }
          }
        } else {
          // Update single custom template
          const { data: template, error: fetchError } = await supabase
            .from('campaign_templates')
            .select('template_config')
            .eq('id', editingTargetForTypes.id)
            .single();
          
          if (fetchError) throw fetchError;
          
          const currentConfig = template.template_config as any;
          const updatedConfig = {
            ...currentConfig,
            campaignTypes: editingTargetForTypes.campaignTypes
          };
          
          const { error } = await supabase
            .from('campaign_templates')
            .update({ template_config: updatedConfig })
            .eq('id', editingTargetForTypes.id);
          
          if (error) throw error;
        }
        
        console.log('Successfully saved to database, refreshing data...');
        
        setShowCampaignTypesDialog(false);
        setEditingTargetForTypes(null);
        
        // Refresh data after successful update
        await refreshTargets();
        
        toast({ title: "Campaign types updated successfully!" });
      } catch (error) {
        console.error('Error updating campaign types:', error);
        toast({ title: "Error updating campaign types", variant: "destructive" });
      }
    }
  };

  const addCampaignType = () => {
    setEditingTargetForTypes(prev => ({
      ...prev,
      campaignTypes: [...(prev?.campaignTypes || []), '']
    }));
  };

  const removeCampaignType = (index: number) => {
    setEditingTargetForTypes(prev => ({
      ...prev,
      campaignTypes: (prev?.campaignTypes || []).filter((_, i) => i !== index)
    }));
  };

  const updateCampaignType = (index: number, value: string) => {
    setEditingTargetForTypes(prev => ({
      ...prev,
      campaignTypes: (prev?.campaignTypes || []).map((type, i) => i === index ? value : type)
    }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Campaign Administration</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Complete platform management and monitoring dashboard
        </p>
      </div>

      {/* Admin Dashboard Tabs */}
      <Tabs defaultValue="audiences" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audiences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Target Management
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Campaign Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audiences" className="mt-8">
          {/* Target Audiences Management */}
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
        </TabsContent>

        <TabsContent value="permissions" className="mt-8">
          <UserPermissionManagement />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-8">
          <AdminCampaignMonitor />
        </TabsContent>

      </Tabs>

      {/* Target Editing Dialog */}
      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTarget ? 'Edit Target Audience' : 'Create New Target Audience'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-name">Audience Name</Label>
              <Input
                id="target-name"
                value={targetForm.name}
                onChange={(e) => setTargetForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., NSFs, Seniors"
              />
            </div>
            
            <div>
              <Label htmlFor="target-description">Description</Label>
              <Textarea
                id="target-description"
                value={targetForm.description}
                onChange={(e) => setTargetForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this target audience..."
                rows={3}
              />
            </div>

            <div>
              <Label>Icon</Label>
              <div className="flex gap-2 mt-2">
                {ICON_OPTIONS.map((icon) => (
                  <Button
                    key={icon.value}
                    variant={targetForm.icon === icon.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTargetForm(prev => ({ ...prev, icon: icon.value }))}
                  >
                    <icon.component className="h-4 w-4 mr-1" />
                    {icon.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="budget-min">Min Budget</Label>
                <Input
                  id="budget-min"
                  type="number"
                  value={targetForm.budgetRange.min}
                  onChange={(e) => setTargetForm(prev => ({
                    ...prev,
                    budgetRange: { ...prev.budgetRange, min: parseInt(e.target.value) }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="budget-max">Max Budget</Label>
                <Input
                  id="budget-max"
                  type="number"
                  value={targetForm.budgetRange.max}
                  onChange={(e) => setTargetForm(prev => ({
                    ...prev,
                    budgetRange: { ...prev.budgetRange, max: parseInt(e.target.value) }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="budget-recommended">Recommended</Label>
                <Input
                  id="budget-recommended"
                  type="number"
                  value={targetForm.budgetRange.recommended}
                  onChange={(e) => setTargetForm(prev => ({
                    ...prev,
                    budgetRange: { ...prev.budgetRange, recommended: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>

            <div>
              <Label>Campaign Types</Label>
              <div className="space-y-2 mt-2">
                {targetForm.campaignTypes.map((type, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={type}
                      onChange={(e) => {
                        const newTypes = [...targetForm.campaignTypes];
                        newTypes[index] = e.target.value;
                        setTargetForm(prev => ({ ...prev, campaignTypes: newTypes }));
                      }}
                      placeholder="Campaign type name"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newTypes = targetForm.campaignTypes.filter((_, i) => i !== index);
                        setTargetForm(prev => ({ ...prev, campaignTypes: newTypes }));
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setTargetForm(prev => ({ 
                      ...prev, 
                      campaignTypes: [...prev.campaignTypes, ''] 
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Campaign Type
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTargetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveTarget}>
              <Save className="h-4 w-4 mr-2" />
              Save Target Audience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Types Dialog */}
      <Dialog open={showCampaignTypesDialog} onOpenChange={setShowCampaignTypesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Campaign Types for {editingTargetForTypes?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure which campaign types are available for this target audience.
            </p>
            
            <div className="space-y-2">
              {(editingTargetForTypes?.campaignTypes || []).map((type, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={type}
                    onChange={(e) => updateCampaignType(index, e.target.value)}
                    placeholder="Campaign type name"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeCampaignType(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button onClick={addCampaignType} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Campaign Type
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignTypesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveCampaignTypes}>
              <Save className="h-4 w-4 mr-2" />
              Save Campaign Types
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
