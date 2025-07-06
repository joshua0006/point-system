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
      if (!user) throw new Error('User not authenticated');

      // First, get the consultant record
      const { data: consultant, error: consultantError } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (consultantError || !consultant) {
        throw new Error('Consultant profile not found. Please create a consultant profile first.');
      }

      // Create the service
      const { data, error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          consultant_id: consultant.id,
          is_active: serviceData.is_active ?? true
        })
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
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete service",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useConsultantServices = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['consultant-services', user?.id],
    queryFn: async () => {
      if (!user) return [];

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
        .eq('consultants.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
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