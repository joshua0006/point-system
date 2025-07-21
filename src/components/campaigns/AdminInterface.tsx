import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Trash2, Save, Shield, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


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
}

export const AdminInterface = ({
  campaignTargets,
  setCampaignTargets,
  editingTarget,
  setEditingTarget,
  showTargetDialog,
  setShowTargetDialog
}: AdminInterfaceProps) => {
  const { toast } = useToast();
  const [targetForm, setTargetForm] = useState({
    id: '',
    name: '',
    description: '',
    icon: 'Users',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    budgetRange: { min: 200, max: 1500, recommended: 500 }
  });



  const openEditTarget = (target: any) => {
    setTargetForm({
      id: target.id,
      name: target.name,
      description: target.description,
      icon: target.icon.name || 'Users',
      bgColor: target.bgColor,
      iconColor: target.iconColor,
      budgetRange: target.budgetRange ? { ...target.budgetRange } : { min: 200, max: 1500, recommended: 500 }
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
      budgetRange: { min: 200, max: 1500, recommended: 500 }
    });
    setEditingTarget(null);
    setShowTargetDialog(true);
  };


  const saveTarget = () => {
    try {
      const selectedIcon = ICON_OPTIONS.find(icon => icon.value === targetForm.icon);
      const updatedTarget = {
        ...targetForm,
        icon: selectedIcon?.component || Users
      };

      if (editingTarget) {
        setCampaignTargets(prev => 
          prev.map(target => target.id === editingTarget.id ? updatedTarget : target)
        );
        toast({ title: "Target audience updated successfully!" });
      } else {
        setCampaignTargets(prev => [...prev, updatedTarget]);
        toast({ title: "New target audience created successfully!" });
      }
      
      setShowTargetDialog(false);
      setEditingTarget(null);
    } catch (error) {
      toast({ title: "Error saving target", variant: "destructive" });
    }
  };


  const deleteTarget = (targetId: string) => {
    setCampaignTargets(prev => prev.filter(target => target.id !== targetId));
    toast({ title: "Target audience deleted successfully!" });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Campaign Administration</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Manage target audiences and campaign settings.
        </p>
      </div>

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
                          onClick={() => deleteTarget(target.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{target.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{target.description}</p>
                     <div className="space-y-1 text-xs">
                       <div>Budget: ${target.budgetRange?.min || 0} - ${target.budgetRange?.max || 0}</div>
                     </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>


      {/* Target Editing Dialog */}
      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTarget ? 'Edit Target Audience' : 'Create New Target Audience'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

    </div>
  );
};
