import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Settings, X } from "lucide-react";
import { format } from "date-fns";
import { useServiceAssignments } from "@/hooks/useServiceAssignments";
import { toast } from "sonner";
import type { UserProfile } from "@/config/types";

interface UserServiceAssignmentsProps {
  user: UserProfile;
}

export const UserServiceAssignments = memo(function UserServiceAssignments({ 
  user 
}: UserServiceAssignmentsProps) {
  const { fetchUserAssignments, cancelService, isCancelling } = useServiceAssignments();
  const { data: assignments, isLoading } = fetchUserAssignments(user.user_id);

  const handleCancelService = async (assignmentId: string, serviceType: string, serviceLevel: string) => {
    try {
      await cancelService(assignmentId);
      toast.success(`${serviceType === 'va_support' ? 'VA Support' : 'Cold Calling'} service cancelled`);
    } catch (error) {
      console.error('Cancel service error:', error);
      toast.error("Failed to cancel service");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading assignments...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No active service assignments
          </div>
        </CardContent>
      </Card>
    );
  }

  const getServiceDisplayName = (type: string, level: string) => {
    if (type === 'va_support') {
      const levels = {
        'basic': 'Basic VA Support',
        'standard': 'Standard VA Support', 
        'comprehensive': 'Comprehensive VA Support'
      };
      return levels[level as keyof typeof levels] || level;
    } else if (type === 'cold_calling') {
      const levels = {
        '20_hours': 'Cold Calling (20 Hours)',
        '40_hours': 'Cold Calling (40 Hours)',
        '60_hours': 'Cold Calling (60 Hours)',
        '80_hours': 'Cold Calling (80 Hours)'
      };
      return levels[level as keyof typeof levels] || level;
    }
    return `${type} - ${level}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Service Assignments ({assignments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div 
              key={assignment.id}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {getServiceDisplayName(assignment.service_type, assignment.service_level)}
                    </h4>
                    <Badge variant="default">Active</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {assignment.monthly_cost.toLocaleString()} credits/month
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Next billing: {format(new Date(assignment.next_billing_date), 'MMM d, yyyy')}
                    </div>
                  </div>

                  {assignment.notes && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {assignment.notes}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancelService(
                    assignment.id, 
                    assignment.service_type, 
                    assignment.service_level
                  )}
                  disabled={isCancelling}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});