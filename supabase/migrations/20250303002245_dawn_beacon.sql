/*
  # Initial Schema Setup for Field Shield

  1. New Tables
    - `profiles` - User profile information
    - `devices` - User's registered devices
    - `device_detections` - Detection events from devices
    - `device_images` - Images captured by devices
    - `support_tickets` - User support tickets
    - `ticket_messages` - Messages in support tickets
    - `ticket_attachments` - File attachments for tickets

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::JSONB
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline')) DEFAULT 'offline',
  battery_level INTEGER DEFAULT 100,
  location TEXT,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  last_detection TIMESTAMPTZ,
  settings JSONB,
  UNIQUE(user_id, serial_number)
);

-- Create device_detections table
CREATE TABLE IF NOT EXISTS device_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  device_id UUID NOT NULL REFERENCES devices ON DELETE CASCADE,
  detection_type TEXT NOT NULL,
  detection_data JSONB,
  image_url TEXT
);

-- Create device_images table
CREATE TABLE IF NOT EXISTS device_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  device_id UUID NOT NULL REFERENCES devices ON DELETE CASCADE,
  url TEXT NOT NULL,
  detection_id UUID REFERENCES device_detections ON DELETE SET NULL
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'closed')) DEFAULT 'open',
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  device_id UUID REFERENCES devices ON DELETE SET NULL
);

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  ticket_id UUID NOT NULL REFERENCES support_tickets ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_support BOOLEAN DEFAULT FALSE
);

-- Create ticket_attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  ticket_id UUID NOT NULL REFERENCES support_tickets ON DELETE CASCADE,
  message_id UUID REFERENCES ticket_messages ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for devices
CREATE POLICY "Users can view their own devices"
  ON devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for device_detections
CREATE POLICY "Users can view detections for their devices"
  ON device_detections FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM devices
    WHERE devices.id = device_id
    AND devices.user_id = auth.uid()
  ));

-- Create policies for device_images
CREATE POLICY "Users can view images for their devices"
  ON device_images FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM devices
    WHERE devices.id = device_id
    AND devices.user_id = auth.uid()
  ));

-- Create policies for support_tickets
CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for ticket_messages
CREATE POLICY "Users can view messages for their tickets"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_id
    AND support_tickets.user_id = auth.uid()
  ));

CREATE POLICY "Users can add messages to their tickets"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Create policies for ticket_attachments
CREATE POLICY "Users can view attachments for their tickets"
  ON ticket_attachments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_id
    AND support_tickets.user_id = auth.uid()
  ));

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update device last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_device_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for device updates
CREATE TRIGGER update_device_timestamp
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE PROCEDURE public.update_device_timestamp();

-- Create function to update ticket last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket updates
CREATE TRIGGER update_ticket_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE PROCEDURE public.update_ticket_timestamp();

-- Create function to update device last_detection timestamp
CREATE OR REPLACE FUNCTION public.update_device_last_detection()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE devices
  SET last_detection = NEW.created_at
  WHERE id = NEW.device_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new detections
CREATE TRIGGER update_device_last_detection
  AFTER INSERT ON device_detections
  FOR EACH ROW EXECUTE PROCEDURE public.update_device_last_detection();