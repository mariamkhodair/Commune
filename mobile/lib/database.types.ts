export type Profile = {
  id: string;
  name: string;
  phone: string;
  area: string | null;
  city: string | null;
  avatar_url: string | null;
  rating_sum: number;
  rating_count: number;
  created_at: string;
  location_privacy_accepted: boolean;
};

export type SwapSafetySession = {
  id: string;
  swap_id: string;
  user_id: string;
  departure_lat: number | null;
  departure_lng: number | null;
  departed_at: string | null;
  completion_lat: number | null;
  completion_lng: number | null;
  completed_at: string | null;
  expires_at: string | null;
};

export type Item = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string;
  condition: string;
  points: number;
  photos: string[];
  status: "Available" | "In a Swap" | "Swapped";
  created_at: string;
};

export type WantedItem = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Swap = {
  id: string;
  proposer_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  points_difference: number;
  created_at: string;
};
