export interface BookingWithDetails {
  id: string;
  user_id: string;
  consultant_id: string;
  service_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  points_spent: number;
  created_at: string;
  scheduled_at: string | null;
  notes: string | null;
  buyer_completed: boolean;
  consultant_completed: boolean;
  services: {
    title: string;
    description: string;
    price: number;
    duration_minutes: number | null;
    image_url: string | null;
  };
  buyer_profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  consultant_profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_profile: {
    full_name: string | null;
    email: string;
  };
}