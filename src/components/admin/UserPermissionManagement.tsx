import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Edit, Users, Shield, Search } from 'lucide-react';

interface UserPermission {
  id: string;
  user_id: string;
  target_audience: string;
  campaign_type: string;
  can_view: boolean;
  can_participate: boolean;
  can_manage: boolean;
  min_budget?: number;
  max_budget?: number;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface UserGroup {
  id: string;
  name: string;
  description: string;
}

interface AccessRule {
  id: string;
  rule_name: string;
  target_audience: string;
  campaign_type: string;
  required_user_tier: string;
  min_budget?: number;
  max_budget?: number;
  is_active: boolean;
}

const UserPermissionManagement = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editingPermission, setEditingPermission] = useState<UserPermission | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [isGroupMembersDialogOpen, setIsGroupMembersDialogOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const { toast } = useToast();

  const targetAudiences = ['General', 'NSF (National Science Foundation)', 'Seniors', 'Mothers'];
  const campaignTypes = ['Facebook Ads', 'Cold Calling'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch permissions with user data
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_campaign_permissions')
        .select(`
          *,
          profiles!inner(full_name, email)
        `);

      if (permissionsError) throw permissionsError;

      // Fetch user groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('user_groups')
        .select('*');

      if (groupsError) throw groupsError;

      // Fetch access rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('campaign_access_rules')
        .select('*');

      if (rulesError) throw rulesError;

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, role')
        .eq('approval_status', 'approved');

      if (usersError) throw usersError;

      setPermissions((permissionsData || []) as any);
      setUserGroups(groupsData || []);
      setAccessRules(rulesData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch permission data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePermission = async (permission: Omit<UserPermission, 'id' | 'profiles'>) => {
    try {
      const currentUser = await supabase.auth.getUser();
      
      if (editingPermission) {
        const { error } = await supabase
          .from('user_campaign_permissions')
          .update({
            user_id: permission.user_id,
            target_audience: permission.target_audience,
            campaign_type: permission.campaign_type,
            can_view: permission.can_view,
            can_participate: permission.can_participate,
            can_manage: permission.can_manage,
            min_budget: permission.min_budget,
            max_budget: permission.max_budget
          })
          .eq('id', editingPermission.id);

        if (error) throw error;
        toast({ title: "Success", description: "Permission updated successfully" });
      } else {
        const { error } = await supabase
          .from('user_campaign_permissions')
          .insert({
            user_id: permission.user_id,
            target_audience: permission.target_audience,
            campaign_type: permission.campaign_type,
            can_view: permission.can_view,
            can_participate: permission.can_participate,
            can_manage: permission.can_manage,
            min_budget: permission.min_budget,
            max_budget: permission.max_budget,
            created_by: currentUser.data.user?.id
          });

        if (error) throw error;
        toast({ title: "Success", description: "Permission created successfully" });
      }

      setIsDialogOpen(false);
      setEditingPermission(null);
      fetchData();
    } catch (error) {
      console.error('Error saving permission:', error);
      toast({
        title: "Error",
        description: "Failed to save permission",
        variant: "destructive"
      });
    }
  };

  const deletePermission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_campaign_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Permission deleted successfully" });
      fetchData();
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive"
      });
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_group_memberships')
        .select(`
          *,
          profiles!user_group_memberships_user_id_fkey(full_name, email)
        `)
        .eq('group_id', groupId);

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch group members",
        variant: "destructive"
      });
    }
  };

  const addMemberToGroup = async (userId: string, groupId: string) => {
    try {
      const currentUser = await supabase.auth.getUser();
      const { error } = await supabase
        .from('user_group_memberships')
        .insert({
          user_id: userId,
          group_id: groupId,
          assigned_by: currentUser.data.user?.id
        });

      if (error) throw error;
      
      toast({ title: "Success", description: "Member added to group successfully" });
      fetchGroupMembers(groupId);
    } catch (error) {
      console.error('Error adding member to group:', error);
      toast({
        title: "Error",
        description: "Failed to add member to group",
        variant: "destructive"
      });
    }
  };

  const removeMemberFromGroup = async (membershipId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('user_group_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Member removed from group successfully" });
      fetchGroupMembers(groupId);
    } catch (error) {
      console.error('Error removing member from group:', error);
      toast({
        title: "Error",
        description: "Failed to remove member from group",
        variant: "destructive"
      });
    }
  };

  const filteredPermissions = permissions.filter(permission =>
    permission.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.target_audience?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PermissionDialog = () => {
    const [formData, setFormData] = useState({
      user_id: editingPermission?.user_id || '',
      target_audience: editingPermission?.target_audience || '',
      campaign_type: editingPermission?.campaign_type || '',
      can_view: editingPermission?.can_view ?? true,
      can_participate: editingPermission?.can_participate ?? true,
      can_manage: editingPermission?.can_manage ?? false,
      min_budget: editingPermission?.min_budget?.toString() || '',
      max_budget: editingPermission?.max_budget?.toString() || ''
    });

    const handleSave = () => {
      savePermission({
        user_id: formData.user_id,
        target_audience: formData.target_audience,
        campaign_type: formData.campaign_type,
        can_view: formData.can_view,
        can_participate: formData.can_participate,
        can_manage: formData.can_manage,
        min_budget: formData.min_budget ? parseInt(formData.min_budget) : undefined,
        max_budget: formData.max_budget ? parseInt(formData.max_budget) : undefined
      });
    };

    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPermission ? 'Edit Permission' : 'Create Permission'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">User</Label>
              <Select value={formData.user_id} onValueChange={(value) => setFormData({...formData, user_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_audience">Target Audience</Label>
              <Select value={formData.target_audience} onValueChange={(value) => setFormData({...formData, target_audience: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  {targetAudiences.map((audience) => (
                    <SelectItem key={audience} value={audience}>
                      {audience}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="campaign_type">Campaign Type</Label>
              <Select value={formData.campaign_type} onValueChange={(value) => setFormData({...formData, campaign_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign type" />
                </SelectTrigger>
                <SelectContent>
                  {campaignTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={formData.can_view} 
                  onCheckedChange={(checked) => setFormData({...formData, can_view: !!checked})}
                />
                <label className="text-sm">Can View</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={formData.can_participate} 
                  onCheckedChange={(checked) => setFormData({...formData, can_participate: !!checked})}
                />
                <label className="text-sm">Can Participate</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={formData.can_manage} 
                  onCheckedChange={(checked) => setFormData({...formData, can_manage: !!checked})}
                />
                <label className="text-sm">Can Manage</label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min_budget">Min Budget</Label>
                <Input
                  type="number"
                  value={formData.min_budget}
                  onChange={(e) => setFormData({...formData, min_budget: e.target.value})}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="max_budget">Max Budget</Label>
                <Input
                  type="number"
                  value={formData.max_budget}
                  onChange={(e) => setFormData({...formData, max_budget: e.target.value})}
                  placeholder="1000"
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              {editingPermission ? 'Update' : 'Create'} Permission
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permissions">User Permissions</TabsTrigger>
          <TabsTrigger value="groups">User Groups</TabsTrigger>
          <TabsTrigger value="rules">Access Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Campaign Permissions</CardTitle>
                  <CardDescription>
                    Manage individual user permissions for campaign access
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingPermission(null);
                  setIsDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Permission
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users or campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                {filteredPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{permission.profiles?.full_name || 'Unknown User'}</div>
                      <div className="text-sm text-muted-foreground">{permission.profiles?.email || 'No email'}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{permission.target_audience}</Badge>
                        <Badge variant="outline">{permission.campaign_type}</Badge>
                        {permission.min_budget && (
                          <Badge variant="secondary">Min: ${permission.min_budget}</Badge>
                        )}
                        {permission.max_budget && (
                          <Badge variant="secondary">Max: ${permission.max_budget}</Badge>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {permission.can_view && <Badge variant="default" className="text-xs">View</Badge>}
                        {permission.can_participate && <Badge variant="default" className="text-xs">Participate</Badge>}
                        {permission.can_manage && <Badge variant="default" className="text-xs">Manage</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPermission(permission);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePermission(permission.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Groups</CardTitle>
              <CardDescription>
                Manage user groups for bulk permission assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userGroups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-muted-foreground">{group.description}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsGroupMembersDialogOpen(true);
                        fetchGroupMembers(group.id);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Members
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Access Rules</CardTitle>
              <CardDescription>
                Manage template-based access rules for automatic permission assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accessRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{rule.rule_name}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{rule.target_audience}</Badge>
                        <Badge variant="outline">{rule.campaign_type}</Badge>
                        <Badge variant="secondary">{rule.required_user_tier}</Badge>
                        {rule.min_budget && (
                          <Badge variant="secondary">Min: ${rule.min_budget}</Badge>
                        )}
                        {rule.max_budget && (
                          <Badge variant="secondary">Max: ${rule.max_budget}</Badge>
                        )}
                        <Badge variant={rule.is_active ? "default" : "destructive"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Edit Rule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PermissionDialog />
      
      {/* Group Members Management Dialog */}
      <Dialog open={isGroupMembersDialogOpen} onOpenChange={setIsGroupMembersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Members - {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Add New Member</Label>
              <Select onValueChange={(userId) => selectedGroup && addMemberToGroup(userId, selectedGroup.id)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user to add" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => !groupMembers.some(member => member.user_id === user.user_id))
                    .map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Current Members</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groupMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members in this group</p>
                ) : (
                  groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{member.profiles?.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">{member.profiles?.email}</div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => selectedGroup && removeMemberFromGroup(member.id, selectedGroup.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPermissionManagement;