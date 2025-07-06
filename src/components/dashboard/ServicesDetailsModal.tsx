
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, ExternalLink, DollarSign, Clock, BarChart3 } from "lucide-react";

interface ServicesDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: any[];
  onEditService: (service: any) => void;
  onDeleteService: (serviceId: string) => void;
  isLoading?: boolean;
}

export function ServicesDetailsModal({ 
  open, 
  onOpenChange, 
  services, 
  onEditService, 
  onDeleteService,
  isLoading = false 
}: ServicesDetailsModalProps) {
  const activeServices = services?.filter(s => s.is_active) || [];
  const inactiveServices = services?.filter(s => !s.is_active) || [];
  const totalRevenue = services?.reduce((sum, s) => sum + (s.price * 5), 0) || 0; // Mock booking count

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>My Services Overview</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading services...</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Total Services</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{services?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-muted-foreground">Active Services</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{activeServices.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-muted-foreground">Est. Revenue</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{totalRevenue.toLocaleString()} pts</div>
                </CardContent>
              </Card>
            </div>

            {/* Active Services */}
            {activeServices.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Active Services ({activeServices.length})</h3>
                <div className="space-y-4">
                  {activeServices.map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-2">{service.title}</h4>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary">
                                {service.categories?.name || 'Uncategorized'}
                              </Badge>
                              <Badge variant="default">Active</Badge>
                              {service.duration_minutes && (
                                <span className="text-sm text-muted-foreground">
                                  • {service.duration_minutes} mins
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {service.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onEditService(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onDeleteService(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.open('#', '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 font-semibold text-accent">
                            <DollarSign className="w-4 h-4" />
                            <span>{service.price} points</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(service.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Services */}
            {inactiveServices.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Inactive Services ({inactiveServices.length})</h3>
                <div className="space-y-4">
                  {inactiveServices.map((service) => (
                    <Card key={service.id} className="opacity-75 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-2">{service.title}</h4>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary">
                                {service.categories?.name || 'Uncategorized'}
                              </Badge>
                              <Badge variant="outline">Inactive</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {service.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onEditService(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onDeleteService(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 font-semibold text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span>{service.price} points</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(service.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Services Message */}
            {(!services || services.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No services created yet. Click "Add Service" to get started.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
