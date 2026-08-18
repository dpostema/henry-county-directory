export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Henry County Directory",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://henrycountydirectory.com",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Find great places to stay, eat, shop, or visit from local experts.",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || "henrycountydirectory.com",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@henrycountydirectory.com",
  
  // Cookie Consent
  cookieConsentKey: process.env.NEXT_PUBLIC_COOKIE_CONSENT_KEY || "app_cookie_consent",
  cookieConsentMessage: process.env.NEXT_PUBLIC_COOKIE_CONSENT_MESSAGE || "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking \"Accept All\", you consent to our use of cookies.",
  cookieConsentAccept: "Accept All",
  cookieConsentDecline: "Decline",

  // Regional Defaults
  region: {
    name: "Henry County",
    state: "GA",
    timeZone: "America/New_York"
  },

  // Homepage Hero
  hero: {
    title: "Discover the Best Spots",
    subtitle: "Find the best places by clicking below",
    searchPlaceholder: "What are you looking for?"
  },

  // How it works section
  howItWorks: [
    {
      num: "1",
      title: "Choose What To Do",
      desc: "Looking for a cozy hotel to stay, a restaurant to eat, a museum to visit or a mall to do some shopping?"
    },
    {
      num: "2",
      title: "Find What You Want",
      desc: "Search and filter hundreds of listings, read reviews, explore photos and find the perfect spot."
    },
    {
      num: "3",
      title: "Explore Amazing Places",
      desc: "Go and have a good time or even make a booking directly from the listing page. All of those, thanks to our directory."
    }
  ],

  // Default Categories (Icon names map to lucide-react in HomeClient)
  categories: [
    { name: "Medical", slug: "medicals", iconName: "HeartPulse" },
    { name: "Automotive", slug: "automotive", iconName: "Car" },
    { name: "Food", slug: "foods", iconName: "Utensils" },
    { name: "Services", slug: "services", iconName: "Wrench" },
    { name: "Professional", slug: "professional", iconName: "Briefcase" },
    { name: "Beauty & Spa", slug: "beauty-spa", iconName: "Sparkles" },
    { name: "Shopping", slug: "shopping", iconName: "ShoppingBag" },
    { name: "Fitness", slug: "fitness", iconName: "Dumbbell" }
  ],

  // Featured Destinations (Fallback when not enough data)
  destinations: [
    { name: "McDonough", slug: "mcdonough", count: 20, image: "/mcDonough.png" },
    { name: "Stockbridge", slug: "stockbridge", count: 6, image: "/stockbridge-ga.avif" },
    { name: "Hampton", slug: "hampton", count: 12, image: "/hampton.jpg" },
    { name: "Locust Grove", slug: "locust-grove", count: 4, image: "/locustgrove.jpg" },
    { name: "Flippen", slug: "flippen", count: 0, image: "/flippen.png" },
    { name: "Blacksville", slug: "blacksville", count: 0, image: "/blacksville.png" }
  ],

  // Footer Information
  footer: {
    about: "Discover and support amazing local businesses, restaurants, hotels, services, and events in our community.",
    addressLines: [
      "Global Headquarters:",
      "90 Fifth Avenue, 3rd Floor",
      "New York, NY 10011"
    ],
    socialLinks: {
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      instagram: "https://instagram.com"
    }
  },

  // Articles & Tips
  articles: [
    {
      tag: "Tips, Travel",
      title: "Top 10 Restaurants You Must Try",
      date: "Aug 28th, 2026",
      author: "Admin",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60"
    },
    {
      tag: "Culture",
      title: "Best Local Events Happening This Fall Season",
      date: "Aug 20th, 2026",
      author: "Team",
      image: "https://upload.wikimedia.org/wikipedia/commons/3/32/Googleplex_HQ_%28cropped%29.jpg"
    },
    {
      tag: "Location",
      title: "Hidden Gems: Coffee Shops In Downtown",
      date: "Aug 15th, 2026",
      author: "Staff Writer",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60"
    }
  ]
};
