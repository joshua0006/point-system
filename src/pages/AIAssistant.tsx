import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  ExternalLink, 
  Plus, 
  Edit3, 
  Trash2, 
  PenTool, 
  Search, 
  Phone, 
  Target, 
  Users, 
  BarChart3,
  Shield,
  DollarSign,
  Settings
} from "lucide-react";

interface CustomGPTLink {
  id: string;
  name: string;
  url: string;
  description: string | null;
  icon_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const ICON_OPTIONS = [
  { name: 'Bot', component: Bot },
  { name: 'PenTool', component: PenTool },
  { name: 'Search', component: Search },
  { name: 'Phone', component: Phone },
  { name: 'Target', component: Target },
  { name: 'Users', component: Users },
  { name: 'BarChart3', component: BarChart3 },
  { name: 'Shield', component: Shield },
  { name: 'DollarSign', component: DollarSign },
  { name: 'Settings', component: Settings },
];

export default function AIAssistant() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [gptLinks, setGptLinks] = useState<CustomGPTLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingLink, setEditingLink] = useState<CustomGPTLink | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    icon_name: 'Bot'
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'master_admin';

  useEffect(() => {
    fetchGPTLinks();
  }, []);

  const fetchGPTLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_gpt_links')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setGptLinks(data || []);
    } catch (error) {
      console.error('Error fetching GPT links:', error);
      toast({
        title: "Error",
        description: "Failed to load AI assistants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingLink(null);
    setFormData({
      name: '',
      url: '',
      description: '',
      icon_name: 'Bot'
    });
    setShowAdminModal(true);
  };

  const openEditModal = (link: CustomGPTLink) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description || '',
      icon_name: link.icon_name
    });
    setShowAdminModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.url.trim()) {
        toast({
          title: "Validation Error",
          description: "Name and URL are required",
          variant: "destructive"
        });
        return;
      }

      const linkData = {
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim() || null,
        icon_name: formData.icon_name
      };

      if (editingLink) {
        // Update existing link
        const { error } = await supabase
          .from('custom_gpt_links')
          .update(linkData)
          .eq('id', editingLink.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "AI assistant updated successfully"
        });
      } else {
        // Create new link
        const { error } = await supabase
          .from('custom_gpt_links')
          .insert({
            ...linkData,
            sort_order: gptLinks.length + 1
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "AI assistant added successfully"
        });
      }

      setShowAdminModal(false);
      fetchGPTLinks();
    } catch (error) {
      console.error('Error saving GPT link:', error);
      toast({
        title: "Error",
        description: "Failed to save AI assistant",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('custom_gpt_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI assistant removed successfully"
      });
      
      fetchGPTLinks();
    } catch (error) {
      console.error('Error deleting GPT link:', error);
      toast({
        title: "Error",
        description: "Failed to remove AI assistant",
        variant: "destructive"
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(icon => icon.name === iconName);
    return iconOption ? iconOption.component : Bot;
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">AI Assistants</h1>
            <p className="text-muted-foreground mb-8">Loading your custom AI assistants...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Assistants</h1>
            <p className="text-muted-foreground">
              Access your custom GPT assistants for various business tasks
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openAddModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add AI Assistant
            </Button>
          )}
        </div>

        {gptLinks.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI Assistants Found</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin 
                ? "Add your first custom GPT assistant to get started"
                : "No AI assistants are currently available"
              }
            </p>
            {isAdmin && (
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Assistant
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gptLinks.map((link) => {
              const IconComponent = getIconComponent(link.icon_name);
              return (
                <Card key={link.id} className="hover:shadow-lg transition-shadow group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(link)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(link.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{link.name}</h3>
                    {link.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {link.description}
                      </p>
                    )}
                    
                    <Button 
                      asChild 
                      className="w-full"
                      variant="outline"
                    >
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Assistant
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Admin Management Modal */}
        <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLink ? 'Edit AI Assistant' : 'Add AI Assistant'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Marketing Copy Assistant"
                />
              </div>
              
              <div>
                <Label htmlFor="url">GPT URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://chatgpt.com/g/g-..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What does this AI assistant help with?"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select 
                  value={formData.icon_name} 
                  onValueChange={(value) => setFormData({...formData, icon_name: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => {
                      const IconComponent = icon.component;
                      return (
                        <SelectItem key={icon.name} value={icon.name}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {icon.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdminModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingLink ? 'Update' : 'Add'} Assistant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}