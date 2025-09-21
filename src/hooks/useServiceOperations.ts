import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ServiceFormData {
  title: string;
  description: string;
  price: number;
  duration_minutes?: number;
  category_id?: string;
  image_url?: string;
  is_active: boolean;
}

export const useCreateService = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceData: ServiceFormData) => {
      console.log('Creating service with data:', serviceData);
      
      // For demo mode, use a hardcoded demo consultant ID if user is not authenticated
      let consultantId: string;
      
      if (!user) {
        console.log('Demo mode - looking up demo consultant');
        // Demo mode - use existing demo consultant
        const { data: demoConsultant, error: demoError } = await supabase
          .from('consultants')
          .select('id')
          .eq('user_id', '952c1a39-f9bf-4f5d-ba81-fac0ab686384') // Demo consultant user ID
          .single();
          
        if (demoError || !demoConsultant) {
          throw new Error('Demo consultant not found. Please set up demo data.');
        }
        
        console.log('Demo consultant found:', demoConsultant);
        consultantId = demoConsultant.id;
        console.log('Using consultant ID:', consultantId);
      } else {
        console.log('Authenticated mode - user:', user);
        // Regular authenticated mode
        const { data: consultant, error: consultantError } = await supabase
          .from('consultants')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (consultantError || !consultant) {
          throw new Error('Consultant profile not found. Please create a consultant profile first.');
        }
        
        consultantId = consultant.id;
      }

      // Create the service
      const insertData = {
        ...serviceData,
        consultant_id: consultantId,
        category_id: serviceData.category_id || null, // Convert empty string to null
        image_url: serviceData.image_url || null, // Convert empty string to null
        is_active: serviceData.is_active ?? true
      };
      
      console.log('Inserting service data:', insertData);
      
      const { data, error } = await supabase
        .from('services')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Service created successfully!",
        description: "Your service is now available in the marketplace.",
      });
      queryClient.invalidateQueries({ queryKey: ['consultant-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create service",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateService = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ServiceFormData> }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Service updated successfully!",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['consultant-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update service",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteService = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Service deleted successfully!",
        description: "The service has been removed from the marketplace.",
      });
      queryClient.invalidateQueries({ queryKey: ['consultant-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('23503')) {
        toast({
          title: "Cannot delete service",
          description: "This service has existing bookings. Consider deactivating it instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to delete service",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });
};

export const useConsultantServices = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['consultant-services', user?.id || 'demo'],
    queryFn: async () => {
      // For demo mode, use the demo consultant's user ID
      const userId = user?.id || '952c1a39-f9bf-4f5d-ba81-fac0ab686384';

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          categories (
            id,
            name
          ),
          consultants!inner (
            id,
            user_id
          )
        `)
        .eq('consultants.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: true, // Always enabled now to support demo mode
  });
};

export const useUploadServiceImage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, serviceId }: { file: File; serviceId?: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceId || 'temp'}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      return { path: data.path, url: publicUrl };
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload image",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Admin-specific service operations for creating services with advanced features
export const useCreateServiceAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (serviceData: any) => {
      // For admin, we can create services for any consultant or create system services
      const insertData = {
        ...serviceData,
        consultant_id: serviceData.consultant_id || null,
        category_id: serviceData.category_id || null,
        image_url: serviceData.image_url || null,
        is_active: serviceData.is_active ?? true,
        service_type: serviceData.service_type || 'consulting',
        features: serviceData.features || [],
        includes: serviceData.includes || [],
        excludes: serviceData.excludes || [],
        service_tier: serviceData.service_tier || 'standard'
      };

      const { data, error } = await supabase
        .from('services')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error: any) => {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    }
  });
};