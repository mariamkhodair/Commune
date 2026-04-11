const sections = [
  {
    title: "1. Who We Are",
    body: [
      "Commune is a peer-to-peer item swapping platform operated from Cairo, Egypt. We can be reached at commune.eg@gmail.com.",
    ],
  },
  {
    title: "2. What We Collect",
    body: [
      "Account information: your name and email address when you sign up.",
      "Profile information: a profile photo and any other details you choose to add.",
      "Item listings: photos, descriptions, and condition details for items you list.",
      "Location data: a one-time location snapshot when you tap 'Off to Swap' during an active swap. This is used only to let your swap partner know you are on your way. It is not tracked continuously and is deleted within 24 hours of the swap completing.",
      "Messages: the content of messages you exchange with other members through the in-app chat.",
      "Ratings: the ratings you give and receive after completed swaps.",
      "Device data: a push notification token so we can send you notifications about your swaps. This is tied to your device, not your identity.",
    ],
  },
  {
    title: "3. How We Use It",
    body: [
      "To operate the platform: matching items, facilitating swaps, enabling messaging between members, and calculating your community rating.",
      "To send notifications: alerting you when someone proposes a swap, accepts your proposal, messages you, or when a swap is scheduled.",
      "To send transactional emails: important updates about your account and swaps, sent to the email address you registered with.",
      "We do not use your data for advertising. We do not sell your data to third parties.",
    ],
  },
  {
    title: "4. How We Store It",
    body: [
      "Your data is stored on Supabase (PostgreSQL), hosted on servers in the European Union. All data is encrypted at rest and all connections use HTTPS (TLS).",
      "Item photos are stored in Supabase Storage. Location snapshots are automatically deleted within 24 hours.",
    ],
  },
  {
    title: "5. Who Can See Your Data",
    body: [
      "Other Commune members can see your public profile (name, photo, items listed, ratings). They cannot see your email address.",
      "Members you are in an active swap with can temporarily see your location during the 'Off to Swap' period.",
      "The Commune team can access your data for moderation purposes (e.g. reviewing a reported member).",
      "We use the following third-party services to operate the platform: Supabase (database and authentication), Resend (transactional email), Vercel (web hosting), and Expo (mobile app infrastructure). Each of these processes only the data necessary to perform their function.",
    ],
  },
  {
    title: "6. Your Rights",
    body: [
      "You can update or delete your profile information at any time from your account settings.",
      "You can delete your account by contacting us at commune.eg@gmail.com. We will delete your personal data within 30 days, except where retention is required by law.",
      "To request a copy of the data we hold about you, email commune.eg@gmail.com.",
    ],
  },
  {
    title: "7. Children",
    body: [
      "Commune is not intended for anyone under the age of 16. We do not knowingly collect data from children.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    body: [
      "We may update this policy from time to time. If we make material changes, we will notify you by email or through the app before the change takes effect.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-10">
          <a href="/" className="text-sm text-[#8B7355] hover:text-[#4A3728] transition-colors">← Commune</a>
          <h1 className="text-3xl font-light text-[#4A3728] mt-6 mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#8B7355]">Last updated 11 April 2026</p>
        </div>

        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-[#4A3728] mb-3">{section.title}</h2>
              <div className="flex flex-col gap-3">
                {section.body.map((para, i) => (
                  <p key={i} className="text-sm text-[#6B5040] leading-relaxed">{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[#D9CFC4]">
          <p className="text-xs text-[#A09080]">
            Questions? Email us at{" "}
            <a href="mailto:commune.eg@gmail.com" className="text-[#4A3728] hover:underline">
              commune.eg@gmail.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
