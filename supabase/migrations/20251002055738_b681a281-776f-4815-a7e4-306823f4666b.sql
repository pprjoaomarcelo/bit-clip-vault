-- Create messages table to store sent and received messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  content TEXT NOT NULL,
  encrypted BOOLEAN NOT NULL DEFAULT false,
  network TEXT NOT NULL,
  network_type TEXT NOT NULL,
  tx_hash TEXT,
  storage_provider TEXT NOT NULL,
  storage_cid TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  gas_fee NUMERIC(20, 10),
  status TEXT NOT NULL DEFAULT 'pending',
  direction TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_messages_user_address ON public.messages(user_address);
CREATE INDEX idx_messages_recipient_address ON public.messages(recipient_address);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_network ON public.messages(network);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages (public read for now since we don't have auth yet)
CREATE POLICY "Anyone can view messages" 
ON public.messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update their messages" 
ON public.messages 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at_trigger
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_messages_updated_at();