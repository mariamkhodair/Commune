export type Profile = {
  id: string;
  name: string;
  area: string;
  city: string;
  phone: string;
  avatar_url: string | null;
  rating_sum: number;
  rating_count: number;
  created_at: string;
};

export type Item = {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  brand: string | null;
  condition: string;
  description: string;
  points: number;
  status: "Available" | "In a Swap" | "Swapped";
  photos: string[];
  created_at: string;
  // joined from profiles
  owner?: Pick<Profile, "id" | "name" | "area" | "city">;
  // joined from item_likes
  like_count?: number;
  liked_by_me?: boolean;
};

export type Swap = {
  id: string;
  proposer_id: string;
  receiver_id: string;
  status: "Proposed" | "Accepted" | "In Progress" | "Completed" | "Declined";
  created_at: string;
};

export type WantedItem = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  notes: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  member1_id: string;
  member2_id: string;
  swap_id: string | null;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: "text" | "date_suggestion" | "date_confirmed";
  suggested_date: string | null;
  created_at: string;
};

export type ScheduledSwap = {
  id: string;
  swap_id: string;
  scheduled_date: string;
  status: "Confirmed" | "Completed";
  created_at: string;
};

export type Rating = {
  id: string;
  swap_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  created_at: string;
};
