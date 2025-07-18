import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Trash2, Upload, Save, Shield, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ICON_OPTIONS = [
  { name: 'Shield', component: Shield, value: 'Shield' },
  { name: 'Users', component: Users, value: 'Users' },
  { name: 'User', component: User, value: 'User' }
];

interface AdminInterfaceProps {
  campaignTargets: any[];
  setCampaignTargets: React.Dispatch<React.SetStateAction<any[]>>;
  adMockups: any;
  setAdMockups: React.Dispatch<React.SetStateAction<any>>;
  editingTarget: any;
  setEditingTarget: (target: any) => void;
  editingAd: any;
  setEditingAd: (ad: any) => void;
  showTargetDialog: boolean;
  setShowTargetDialog: (show: boolean) => void;
  showAdDialog: boolean;
  setShowAdDialog: (show: boolean) => void;
}

export const AdminInterface = ({
  campaignTargets,
  setCampaignTargets,
  adMockups,
  setAdMockups,
  editingTarget,
  setEditingTarget,
  editingAd,
  setEditingAd,
  showTargetDialog,
  setShowTargetDialog,
  showAdDialog,
  setShowAdDialog
}: AdminInterfaceProps) => {
  const { toast } = useToast();
  const [targetForm, setTargetForm] = useState({
    id: '',
    name: '',
    description: '',
    icon: 'Users',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    campaignTypes: [],
    campaignTypeCPL: {},
    budgetRange: { min: 200, max: 1500, recommended: 500 },
    costPerLead: { min: 15, max: 35, average: 25 },
    expectedLeads: {
      lowBudget: '8-15 leads/month',
      medBudget: '20-35 leads/month',
      highBudget: '40-70 leads/month'
    }
  });

  const [adForm, setAdForm] = useState({
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    offer: '',
    adCopy: '',
    cta: '',
    performance: { ctr: '0%', cpm: '$0', conversions: 0 },
    targetId: ''
  });

  const [newCampaignType, setNewCampaignType] = useState('');
  const [newCampaignTypeCPL, setNewCampaignTypeCPL] = useState('');
  const [editingCampaignType, setEditingCampaignType] = useState<string | null>(null);
  const [editingCampaignTypeCPL, setEditingCampaignTypeCPL] = useState('');

  const openEditTarget = (target: any) => {
    setTargetForm({
      id: target.id,
      name: target.name,
      description: target.description,
      icon: target.icon.name || 'Users',
      bgColor: target.bgColor,
      iconColor: target.iconColor,
      campaignTypes: [...target.campaignTypes],
      campaignTypeCPL: { ...target.campaignTypeCPL },
      budgetRange: { ...target.budgetRange },
      costPerLead: { ...target.costPerLead },
      expectedLeads: { ...target.expectedLeads }
    });
    setEditingTarget(target);
    setShowTargetDialog(true);
  };

  const openEditAd = (ad: any, targetId: string) => {
    setAdForm({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      offer: ad.offer,
      adCopy: ad.adCopy,
      cta: ad.cta,
      performance: { ...ad.performance },
      targetId
    });
    setEditingAd(ad);
    setShowAdDialog(true);
  };

  const createNewTarget = () => {
    setTargetForm({
      id: `target-${Date.now()}`,
      name: '',
      description: '',
      icon: 'Users',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      campaignTypes: [],
      campaignTypeCPL: {},
      budgetRange: { min: 200, max: 1500, recommended: 500 },
      costPerLead: { min: 15, max: 35, average: 25 },
      expectedLeads: {
        lowBudget: '8-15 leads/month',
        medBudget: '20-35 leads/month',
        highBudget: '40-70 leads/month'
      }
    });
    setEditingTarget(null);
    setShowTargetDialog(true);
  };

  const createNewAd = (targetId: string) => {
    setAdForm({
      id: `ad-${Date.now()}`,
      title: '',
      description: '',
      imageUrl: '',
      offer: '',
      adCopy: '',
      cta: '',
      performance: { ctr: '0%', cpm: '$0', conversions: 0 },
      targetId
    });
    setEditingAd(null);
    setShowAdDialog(true);
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

  const saveAd = () => {
    try {
      const updatedAds = { ...adMockups };
      
      if (!updatedAds[adForm.targetId]) {
        updatedAds[adForm.targetId] = [];
      }

      if (editingAd) {
        updatedAds[adForm.targetId] = updatedAds[adForm.targetId].map((ad: any) =>
          ad.id === editingAd.id ? { ...adForm, targetId: undefined } : ad
        );
        toast({ title: "Ad updated successfully!" });
      } else {
        updatedAds[adForm.targetId].push({ ...adForm, targetId: undefined });
        toast({ title: "New ad created successfully!" });
      }

      setAdMockups(updatedAds);
      setShowAdDialog(false);
      setEditingAd(null);
    } catch (error) {
      toast({ title: "Error saving ad", variant: "destructive" });
    }
  };

  const deleteTarget = (targetId: string) => {
    setCampaignTargets(prev => prev.filter(target => target.id !== targetId));
    
    // Also remove ads for this target
    const updatedAds = { ...adMockups };
    delete updatedAds[targetId];
    setAdMockups(updatedAds);
    
    toast({ title: "Target audience deleted successfully!" });
  };

  const deleteAd = (adId: string, targetId: string) => {
    const updatedAds = { ...adMockups };
    updatedAds[targetId] = updatedAds[targetId].filter((ad: any) => ad.id !== adId);
    setAdMockups(updatedAds);
    toast({ title: "Ad deleted successfully!" });
  };

  const addCampaignType = () => {
    if (newCampaignType && newCampaignTypeCPL) {
      setTargetForm(prev => ({
        ...prev,
        campaignTypes: [...prev.campaignTypes, newCampaignType],
        campaignTypeCPL: {
          ...prev.campaignTypeCPL,
          [newCampaignType]: parseInt(newCampaignTypeCPL)
        }
      }));
      setNewCampaignType('');
      setNewCampaignTypeCPL('');
    }
  };

  const removeCampaignType = (campaignType: string) => {
    setTargetForm(prev => ({
      ...prev,
      campaignTypes: prev.campaignTypes.filter((type: string) => type !== campaignType),
      campaignTypeCPL: Object.fromEntries(
        Object.entries(prev.campaignTypeCPL).filter(([key]) => key !== campaignType)
      )
    }));
  };

  const startEditCampaignType = (campaignType: string) => {
    setEditingCampaignType(campaignType);
    setEditingCampaignTypeCPL(targetForm.campaignTypeCPL[campaignType]?.toString() || '');
  };

  const saveEditCampaignType = () => {
    if (editingCampaignType && editingCampaignTypeCPL) {
      setTargetForm(prev => ({
        ...prev,
        campaignTypeCPL: {
          ...prev.campaignTypeCPL,
          [editingCampaignType]: parseInt(editingCampaignTypeCPL)
        }
      }));
      setEditingCampaignType(null);
      setEditingCampaignTypeCPL('');
    }
  };

  const cancelEditCampaignType = () => {
    setEditingCampaignType(null);
    setEditingCampaignTypeCPL('');
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Campaign Administration</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Manage target audiences, campaign types, and ad creative content.
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
                      <div>Campaign Types: {target.campaignTypes.length}</div>
                      <div>Budget: ${target.budgetRange.min} - ${target.budgetRange.max}</div>
                      <div>Avg CPL: ${target.costPerLead.average}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ad Management */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Creative Management</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignTargets.map((target) => (
            <div key={target.id} className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{target.name} Ads</h3>
                <Button onClick={() => createNewAd(target.id)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ad for {target.name}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(adMockups[target.id] || []).map((ad: any) => (
                  <Card key={ad.id} className="relative">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-3 overflow-hidden">
                        {ad.imageUrl && (
                          <img 
                            src={ad.imageUrl} 
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{ad.title}</h4>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditAd(ad, target.id)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteAd(ad.id, target.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{ad.description}</p>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="secondary">CTR: {ad.performance.ctr}</Badge>
                        <Badge variant="secondary">CPM: {ad.performance.cpm}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
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

            <div className="space-y-4">
              <div>
                <Label>Campaign Types</Label>
                <div className="space-y-2 mt-2">
                  {targetForm.campaignTypes.map((type: string) => (
                    <div key={type} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{type}</span>
                      <div className="flex items-center gap-2">
                        {editingCampaignType === type ? (
                          <>
                            <Input
                              value={editingCampaignTypeCPL}
                              onChange={(e) => setEditingCampaignTypeCPL(e.target.value)}
                              placeholder="CPL"
                              type="number"
                              className="w-20 h-6 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={saveEditCampaignType}
                              className="h-6 w-6 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditCampaignType}
                              className="h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-muted-foreground">
                              CPL: ${targetForm.campaignTypeCPL[type]}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditCampaignType(type)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeCampaignType(type)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Campaign type name"
                    value={newCampaignType}
                    onChange={(e) => setNewCampaignType(e.target.value)}
                  />
                  <Input
                    placeholder="CPL"
                    type="number"
                    value={newCampaignTypeCPL}
                    onChange={(e) => setNewCampaignTypeCPL(e.target.value)}
                  />
                  <Button onClick={addCampaignType} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
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

      {/* Ad Editing Dialog */}
      <Dialog open={showAdDialog} onOpenChange={setShowAdDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAd ? 'Edit Ad Creative' : 'Create New Ad Creative'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ad-title">Ad Title</Label>
                <Input
                  id="ad-title"
                  value={adForm.title}
                  onChange={(e) => setAdForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Free Financial Health Check"
                />
              </div>
              
              <div>
                <Label htmlFor="ad-description">Description</Label>
                <Textarea
                  id="ad-description"
                  value={adForm.description}
                  onChange={(e) => setAdForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the ad..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="ad-image">Image URL</Label>
                <Input
                  id="ad-image"
                  value={adForm.imageUrl}
                  onChange={(e) => setAdForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="ad-offer">Offer</Label>
                <Input
                  id="ad-offer"
                  value={adForm.offer}
                  onChange={(e) => setAdForm(prev => ({ ...prev, offer: e.target.value }))}
                  placeholder="e.g., Free 60-min consultation"
                />
              </div>

              <div>
                <Label htmlFor="ad-cta">Call to Action</Label>
                <Input
                  id="ad-cta"
                  value={adForm.cta}
                  onChange={(e) => setAdForm(prev => ({ ...prev, cta: e.target.value }))}
                  placeholder="e.g., Claim Your Free Session"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ad-copy">Ad Copy</Label>
                <Textarea
                  id="ad-copy"
                  value={adForm.adCopy}
                  onChange={(e) => setAdForm(prev => ({ ...prev, adCopy: e.target.value }))}
                  placeholder="Full ad copy text..."
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="ad-ctr">CTR</Label>
                  <Input
                    id="ad-ctr"
                    value={adForm.performance.ctr}
                    onChange={(e) => setAdForm(prev => ({
                      ...prev,
                      performance: { ...prev.performance, ctr: e.target.value }
                    }))}
                    placeholder="3.2%"
                  />
                </div>
                <div>
                  <Label htmlFor="ad-cpm">CPM</Label>
                  <Input
                    id="ad-cpm"
                    value={adForm.performance.cpm}
                    onChange={(e) => setAdForm(prev => ({
                      ...prev,
                      performance: { ...prev.performance, cpm: e.target.value }
                    }))}
                    placeholder="$4.50"
                  />
                </div>
                <div>
                  <Label htmlFor="ad-conversions">Conversions</Label>
                  <Input
                    id="ad-conversions"
                    type="number"
                    value={adForm.performance.conversions}
                    onChange={(e) => setAdForm(prev => ({
                      ...prev,
                      performance: { ...prev.performance, conversions: parseInt(e.target.value) }
                    }))}
                    placeholder="24"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveAd}>
              <Save className="h-4 w-4 mr-2" />
              Save Ad Creative
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};