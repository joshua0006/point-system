import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAdminServices, AdminService } from '@/hooks/useAdminServices';
import { useUpdateService, useDeleteService, useCreateServiceAdmin } from '@/hooks/useServiceOperations';
import { useCategories } from '@/hooks/useServices';
import { ServiceForm } from '@/components/forms/ServiceForm';
import { ServiceTypeManager } from '@/components/admin/ServiceTypeManager';
import { TierBadge } from '@/components/TierBadge';
import { Search, Edit, Trash2, ExternalLink, Plus, Phone, Users, Target, DollarSign } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';

export const AdminServiceManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 'consulting' | 'cold_calling' | 'va_support' | 'lead_generation'>('all');
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('services');

  const { data: services = [], isLoading, refetch } = useAdminServices();
  const { data: categories = [] } = useCategories();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const createService = useCreateServiceAdmin();
  const { toast } = useToast();

  // Filter services based on search term, status, and service type
  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.consultant?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && service.is_active) ||
                         (statusFilter === 'inactive' && !service.is_active);
    
    const matchesServiceType = serviceTypeFilter === 'all' || 
                              (service as any).service_type === serviceTypeFilter ||
                              (serviceTypeFilter === 'consulting' && !(service as any).service_type);
    
    return matchesSearch && matchesStatus && matchesServiceType;
  });

  // Group services by type for better organization
  const servicesByType = {
    consulting: filteredServices.filter(s => !(s as any).service_type || (s as any).service_type === 'consulting'),
    cold_calling: filteredServices.filter(s => (s as any).service_type === 'cold_calling'),
    va_support: filteredServices.filter(s => (s as any).service_type === 'va_support'),
    lead_generation: filteredServices.filter(s => (s as any).service_type === 'lead_generation'),
  };

  const handleEdit = (service: AdminService) => {
    setEditingService(service);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: any) => {
    if (!editingService) return;

    try {
      await updateService.mutateAsync({
        id: editingService.id,
        updates: formData
      });
      setIsEditModalOpen(false);
      setEditingService(null);
      refetch();
      toast({
        title: "Service updated",
        description: "The service has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await deleteService.mutateAsync(serviceId);
      refetch();
      toast({
        title: "Service deleted",
        description: "The service has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting service:', error);
      
      // Check if it's a foreign key constraint error
      if (error?.code === '23503') {
        toast({
          title: "Cannot delete service",
          description: "This service has existing bookings and transactions. Consider deactivating it instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete service. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const stats = {
    total: services.length,
    active: services.filter(s => s.is_active).length,
    inactive: services.filter(s => !s.is_active).length,
    totalRevenue: services.reduce((sum, s) => sum + s.price, 0)
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading services...</div>
        </CardContent>
      </Card>
    );
  }

  const handleCreateService = async (serviceData: any) => {
    try {
      await createService.mutateAsync(serviceData);
      refetch();
      toast({
        title: "Service created",
        description: "The service has been successfully created.",
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

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Services</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active Services</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-sm text-muted-foreground">Inactive Services</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Service Type Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">All Services</TabsTrigger>
          <TabsTrigger value="cold_calling">Cold Calling</TabsTrigger>
          <TabsTrigger value="va_support">VA Support</TabsTrigger>
          <TabsTrigger value="lead_generation">Lead Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>All Services Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search services, consultants, or categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={serviceTypeFilter} onValueChange={(value: any) => setServiceTypeFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="cold_calling">Cold Calling</SelectItem>
                    <SelectItem value="va_support">VA Support</SelectItem>
                    <SelectItem value="lead_generation">Lead Generation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Services Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Consultant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {service.description}
                            </div>
                            {(service as any).features && (service as any).features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(service as any).features.slice(0, 2).map((feature: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                                {(service as any).features.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(service as any).features.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {(service as any).service_type || 'consulting'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {service.consultant?.profile?.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {service.consultant?.profile?.email}
                              </div>
                            </div>
                            <TierBadge tier={service.consultant?.tier || 'bronze'} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {service.category?.name || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(service.price)}
                        </TableCell>
                        <TableCell>
                          {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.is_active ? 'default' : 'secondary'}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(service.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {service.image_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(service.image_url!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No services found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cold_calling">
          <ServiceTypeManager
            serviceType="cold_calling"
            services={servicesByType.cold_calling}
            onServiceUpdate={handleUpdate}
            onServiceCreate={handleCreateService}
          />
        </TabsContent>

        <TabsContent value="va_support">
          <ServiceTypeManager
            serviceType="va_support"
            services={servicesByType.va_support}
            onServiceUpdate={handleUpdate}
            onServiceCreate={handleCreateService}
          />
        </TabsContent>

        <TabsContent value="lead_generation">
          <ServiceTypeManager
            serviceType="lead_generation"
            services={servicesByType.lead_generation}
            onServiceUpdate={handleUpdate}
            onServiceCreate={handleCreateService}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Service Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              initialData={{
                title: editingService.title,
                description: editingService.description,
                price: editingService.price,
                duration_minutes: editingService.duration_minutes || undefined,
                category_id: editingService.category?.id || '',
                image_url: editingService.image_url || '',
                is_active: editingService.is_active
              }}
              onSubmit={handleUpdate}
              isLoading={updateService.isPending}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};