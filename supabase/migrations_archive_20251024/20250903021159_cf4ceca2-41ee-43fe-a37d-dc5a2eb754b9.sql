-- Create RLS policies for lead_gen_campaigns table

-- Allow users to insert their own campaigns
CREATE POLICY "Users can insert their own campaigns" ON public.lead_gen_campaigns
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Allow users to view their own campaigns
CREATE POLICY "Users can view their own campaigns" ON public.lead_gen_campaigns
  FOR SELECT 
  USING (auth.uid() = created_by);

-- Allow users to update their own campaigns  
CREATE POLICY "Users can update their own campaigns" ON public.lead_gen_campaigns
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Allow users to delete their own campaigns
CREATE POLICY "Users can delete their own campaigns" ON public.lead_gen_campaigns
  FOR DELETE 
  USING (auth.uid() = created_by);