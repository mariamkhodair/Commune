"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// Placeholder — will be replaced with Supabase data
const placeholderConversations = [
  { id: 1, name: "Sara M.", lastMessage: "Sure, I can meet this weekend!", time: "2m ago", unread: true },
  { id: 2, name: "Karim A.", lastMessage: "Is the keyboard still available?", time: "1h ago", unread: true },
  { id: 3, name: "Nour T.", lastMessage: "Thanks for the swap, enjoy the book!", time: "Yesterday", unread: false },
  { id: 4, name: "Dina H.", lastMessage: "Would you consider swapping for a mascara set?", time: "2d ago", unread: false },
];

export default function Messages() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">Messages</h1>
        <p className="text-[#8B7355] mb-6">Chat with members about swaps.</p>

        {placeholderConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">No messages yet</p>
            <p className="text-[#A09080]">When you propose or get matched for a swap, you can chat here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-2xl">
            {placeholderConversations.map((convo) => (
              <Link
                key={convo.id}
                href={`/messages/${convo.id}`}
                className="bg-white/60 backdrop-blur-sm rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[#EDE8DF] flex items-center justify-center text-lg font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
                    {convo.name.charAt(0)}
                  </div>
                  {convo.unread && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#A0624A] border-2 border-white" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm ${convo.unread ? "font-semibold text-[#4A3728]" : "font-medium text-[#4A3728]"}`}>
                      {convo.name}
                    </p>
                    <p className="text-xs text-[#A09080] shrink-0 ml-2">{convo.time}</p>
                  </div>
                  <p className={`text-sm truncate ${convo.unread ? "text-[#6B5040]" : "text-[#A09080]"}`}>
                    {convo.lastMessage}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
