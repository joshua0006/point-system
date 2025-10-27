import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Phone, Users, Target, DollarSign, Plus, Minus, Edit } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';

interface ServiceTypeManagerProps {
  serviceType: 'cold_calling' | 'va_support' | 'lead_generation';
  services: any[];
  onServiceUpdate: (serviceId: string, updates: any) => Promise<void>;
  onServiceCreate: (serviceData: any) => Promise<void>;
}

export const ServiceTypeManager: React.FC<ServiceTypeManagerProps> = ({
  serviceType,
  services,
  onServiceUpdate,
  onServiceCreate
}) => {
  const [editingService, setEditingService] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    title: '',
    description: '',
    price: '',
    duration_minutes: '',
    service_type: serviceType,
    features: [''],
    includes: [''],
    excludes: [''],
    service_tier: 'standard',
    is_active: true
  });
  const { toast } = useToast();

  const serviceTypeConfig = {
    cold_calling: {
      icon: Phone,
      title: 'Cold Calling Services',
      description: 'Manage cold calling campaign rates and features',
      color: 'bg-blue-500/10 text-blue-600',
      defaultFeatures: ['Professional calling scripts', 'Lead qualification', 'CRM integration', 'Call reporting']
    },
    va_support: {
      icon: Users,
      title: 'VA Support Services',
      description: 'Manage virtual assistant support packages and rates',
      color: 'bg-green-500/10 text-green-600',
      defaultFeatures: ['Administrative support', 'Email management', 'Calendar scheduling', 'Data entry']
    },
    lead_generation: {
      icon: Target,
      title: 'Lead Generation Services',
      description: 'Manage lead generation campaign configurations',
      color: 'bg-purple-500/10 text-purple-600',
      defaultFeatures: ['Targeted prospecting', 'Email campaigns', 'Social media outreach', 'Lead scoring']
    }
  };

  const config = serviceTypeConfig[serviceType];
  const IconComponent = config.icon;

  const handleFeatureChange = (index: number, value: string, type: 'features' | 'includes' | 'excludes') => {
    const updatedArray = [...newServiceData[type]];
    updatedArray[index] = value;
    setNewServiceData({ ...newServiceData, [type]: updatedArray });
  };

  const addFeature = (type: 'features' | 'includes' | 'excludes') => {
    setNewServiceData({
      ...newServiceData,
      [type]: [...newServiceData[type], '']
    });
  };

  const removeFeature = (index: number, type: 'features' | 'includes' | 'excludes') => {
    const updatedArray = newServiceData[type].filter((_, i) => i !== index);
    setNewServiceData({ ...newServiceData, [type]: updatedArray });
  };

  const handleCreateService = async () => {
    try {
      const cleanedData = {
        ...newServiceData,
        price: parseInt(newServiceData.price) * 100, // Convert to cents
        duration_minutes: newServiceData.duration_minutes ? parseInt(newServiceData.duration_minutes) : null,
        features: newServiceData.features.filter(f => f.trim()),
        includes: newServiceData.includes.filter(f => f.trim()),
        excludes: newServiceData.excludes.filter(f => f.trim())
      };
      
      await onServiceCreate(cleanedData);
      setIsCreateModalOpen(false);
      setNewServiceData({
        title: '',
        description: '',
        price: '',
        duration_minutes: '',
        service_type: serviceType,
        features: [''],
        includes: [''],
        excludes: [''],
        service_tier: 'standard',
        is_active: true
      });
      toast({
        title: "Service created",
        description: `${config.title} service has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{config.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create {config.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Service Title</Label>
                    <Input
                      id="title"
                      value={newServiceData.title}
                      onChange={(e) => setNewServiceData({ ...newServiceData, title: e.target.value })}
                      placeholder="Enter service title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newServiceData.price}
                      onChange={(e) => setNewServiceData({ ...newServiceData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newServiceData.description}
                    onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                    placeholder="Describe the service..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newServiceData.duration_minutes}
                      onChange={(e) => setNewServiceData({ ...newServiceData, duration_minutes: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier">Service Tier</Label>
                    <Select
                      value={newServiceData.service_tier}
                      onValueChange={(value) => setNewServiceData({ ...newServiceData, service_tier: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Features</Label>
                  {newServiceData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value, 'features')}
                        placeholder="Enter feature"
                      />
                      {newServiceData.features.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index, 'features')}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addFeature('features')}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>

                <div>
                  <Label>What's Included</Label>
                  {newServiceData.includes.map((include, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={include}
                        onChange={(e) => handleFeatureChange(index, e.target.value, 'includes')}
                        placeholder="What's included"
                      />
                      {newServiceData.includes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index, 'includes')}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addFeature('includes')}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Include
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={newServiceData.is_active}
                    onCheckedChange={(checked) => setNewServiceData({ ...newServiceData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active Service</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateService}>
                    Create Service
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {config.title.toLowerCase()} services found. Create one to get started.
            </div>
          ) : (
            services.map((service) => (
              <Card key={service.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{service.title}</h3>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{service.service_tier || 'standard'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatCurrency(service.price)}</span>
                      </div>
                      {service.duration_minutes && (
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          <span>{service.duration_minutes} minutes</span>
                        </div>
                      )}
                    </div>

                    {service.features && service.features.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-medium">Features: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {service.features.map((feature: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingService(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};