import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Plus } from '@/lib/icons';
import UserPermissionManagement from "../admin/UserPermissionManagement";
import { AdminCampaignLauncher } from "../admin/AdminCampaignLauncher";

export const SuperAdminInterface = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Super Admin Controls</h2>
        <p className="text-muted-foreground">
          Advanced administration tools for system management
        </p>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="launcher" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Campaign Launcher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-6">
          <UserPermissionManagement />
        </TabsContent>

        <TabsContent value="launcher" className="mt-6">
          <AdminCampaignLauncher />
        </TabsContent>
      </Tabs>
    </div>
  );
};