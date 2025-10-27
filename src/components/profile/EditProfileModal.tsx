
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from '@/lib/icons';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { AvatarUpload } from '@/components/forms/AvatarUpload';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  consultant?: any;
}

export function EditProfileModal({ open, onOpenChange, profile, consultant }: EditProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>(consultant?.expertise_areas || []);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch categories for tag suggestions
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const form = useForm({
    defaultValues: {
      full_name: profile?.full_name || '',
      bio: profile?.bio || consultant?.bio || '',
      avatar_url: profile?.avatar_url || ''
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          bio: data.bio
        })
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      // Update consultant data if applicable
      if (consultant) {
        const { error: consultantError } = await supabase
          .from('consultants')
          .update({
            bio: data.bio,
            expertise_areas: tags
          })
          .eq('user_id', profile.user_id);

        if (consultantError) throw consultantError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['consultant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-profile'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      console.error('Update error:', error);
    }
  });

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const addTag = () => {
    if (selectedCategory && !tags.includes(selectedCategory)) {
      setTags([...tags, selectedCategory]);
      setSelectedCategory('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo</FormLabel>
                  <FormControl>
                    <AvatarUpload
                      value={field.value}
                      onChange={field.onChange}
                      disabled={updateProfileMutation.isPending}
                      userId={profile.user_id}
                      fallbackText={form.watch('full_name')?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {consultant ? 'Bio & Expertise' : 'About Me'}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={consultant 
                        ? "Tell others about yourself and your expertise..."
                        : "Tell others about yourself, your interests, and what you're looking for in consultations..."
                      }
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {consultant && (
              <div>
                <FormLabel>Expertise Areas</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select expertise area" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addTag} size="sm" disabled={!selectedCategory}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
