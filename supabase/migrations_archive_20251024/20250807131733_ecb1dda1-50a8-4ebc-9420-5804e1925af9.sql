-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for other essential tables
CREATE POLICY "Users can view their own consultants record" ON public.consultants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultants record" ON public.consultants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consultants record" ON public.consultants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Services policies (consultants can manage their own services, others can view active ones)
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Consultants can manage their own services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.consultants 
      WHERE consultants.id = services.consultant_id 
      AND consultants.user_id = auth.uid()
    )
  );

-- Categories - public read access
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

-- Points transactions - users can view their own
CREATE POLICY "Users can view their own transactions" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.points_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations - users can view their own conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert conversations where they are buyer or seller" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages - users can view/send messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Campaign related policies
CREATE POLICY "Anyone can view active campaign templates" ON public.campaign_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own campaign participants" ON public.campaign_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaign participants" ON public.campaign_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);