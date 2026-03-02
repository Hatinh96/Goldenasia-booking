export type ChannelType = string;

export type LocationStatus = 'active' | 'maintenance' | 'inactive';
export type ScreenStatus = 'active' | 'maintenance' | 'inactive';
export type CampaignStatus = 'draft' | 'pending' | 'active' | 'paused' | 'completed';
export type BookingStatus = 'pending' | 'confirmed' | 'live' | 'done' | 'cancelled';

export type LocationRow = {
  id: string;
  code: string;
  name: string;
  channel: ChannelType;
  region: string;
  device_type: string;
  weekly_traffic: number;
  operating_hours: string;
  status: LocationStatus;
  created_at: string;
  updated_at?: string;
};

export type CampaignRow = {
  id: string;
  name: string;
  advertiser: string;
  objective: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  created_at: string;
  updated_at?: string;
};

export type ScreenRow = {
  id: string;
  location_id: string;
  screen_code: string;
  screen_type: string;
  model: string;
  slot_count: number;
  status: ScreenStatus;
  created_at: string;
  updated_at?: string;
};

export type BookingRow = {
  id: string;
  location_id: string;
  campaign_id: string;
  start_at: string;
  end_at: string;
  spot_count: number;
  unit_price: number;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at?: string;
};

export type BookingView = BookingRow & {
  location?: LocationRow;
  campaign?: CampaignRow;
};

export type AppModule = 'dashboard' | 'locations' | 'campaigns' | 'bookings' | 'analytics';
