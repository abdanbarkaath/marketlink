// lib/mockProviders.ts
export type Provider = {
  id: string;
  businessName: string;
  slug: string;
  tagline?: string;
  city: string;
  state: string;
  rating?: number;
  verified?: boolean;
  distance?: number; // placeholder for now
  logo?: string;
  services: string[];
};

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: "p1",
    businessName: "Windy City Growth",
    slug: "windy-city-growth",
    tagline: "Meta + Google Ads for local",
    city: "Chicago",
    state: "IL",
    rating: 4.7,
    verified: true,
    logo: "https://placehold.co/80x80",
    services: ["seo", "ads", "social"]
  },
  {
    id: "p2",
    businessName: "Naperville Media Lab",
    slug: "naperville-media-lab",
    tagline: "Short-form reels that convert",
    city: "Naperville",
    state: "IL",
    rating: 4.5,
    verified: true,
    logo: "https://placehold.co/80x80",
    services: ["video", "social"]
  }
];
