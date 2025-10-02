import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useGiftingCredits() {
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const convertToGiftingCredits = async (amount: number) => {
    setIsConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-to-gifting-credits', {
        body: { amount },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Conversion Successful",
        description: `${amount} flexi credits converted to gifting credits`,
      });

      return data;
    } catch (error: any) {
      console.error('Error converting credits:', error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert credits",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  return {
    convertToGiftingCredits,
    isConverting,
  };
}