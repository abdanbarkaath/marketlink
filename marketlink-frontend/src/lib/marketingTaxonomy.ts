export type ExpertType = 'agency' | 'freelancer' | 'creator' | 'specialist';

export const marketingSubjectIds = [
  'local-search-seo',
  'paid-ads-lead-generation',
  'website-landing-pages',
  'social-media-community',
  'creator-influencer-marketing',
  'content-copywriting-creative',
  'brand-design-print',
  'email-sms-retention',
  'reviews-reputation',
  'ecommerce-product-marketing',
  'strategy-analytics-consulting',
  'events-pr-partnerships',
] as const;

export type MarketingSubjectId = (typeof marketingSubjectIds)[number];

export const buyerProblemIds = [
  'need-more-customers',
  'cannot-find-business',
  'website-not-converting',
  'social-not-working',
  'want-local-creators',
  'need-better-content',
  'need-professional-brand',
  'need-more-reviews',
  'selling-products-online',
  'launching-something-new',
  'not-sure',
] as const;

export type BuyerProblemId = (typeof buyerProblemIds)[number];

export type MarketingDeliverable = {
  id: string;
  label: string;
  buyerLabel: string;
  description: string;
  serviceTokens: readonly string[];
  recommendedExpertTypes?: readonly ExpertType[];
};

export type MarketingSubcategory = {
  id: string;
  label: string;
  buyerLabel: string;
  shortDescription: string;
  serviceTokens: readonly string[];
  deliverables: readonly MarketingDeliverable[];
};

export type MarketingSubject = {
  id: MarketingSubjectId;
  label: string;
  buyerLabel: string;
  shortDescription: string;
  serviceTokens: readonly string[];
  suggestedExpertTypes: readonly ExpertType[];
  subcategories: readonly MarketingSubcategory[];
};

export type BuyerProblem = {
  id: BuyerProblemId;
  label: string;
  customerLanguage: string;
  outcomePromise: string;
  suggestedSubjectIds: readonly MarketingSubjectId[];
  suggestedServiceTokens: readonly string[];
  priority: number;
};

export type ExpertTypeOption = {
  id: ExpertType;
  label: string;
  description: string;
};

export type GroupedExpertServiceDeliverable = {
  id: string;
  label: string;
  buyerLabel: string;
};

export type GroupedExpertServiceSubcategory = {
  id: string;
  label: string;
  buyerLabel: string;
  deliverables: GroupedExpertServiceDeliverable[];
};

export type GroupedExpertServiceSubject = {
  id: MarketingSubjectId;
  label: string;
  buyerLabel: string;
  subcategories: GroupedExpertServiceSubcategory[];
};

export const expertTypeOptions = [
  { id: 'agency', label: 'Agency', description: 'A team or company offering marketing services.' },
  { id: 'freelancer', label: 'Freelancer', description: 'An independent marketing professional.' },
  { id: 'creator', label: 'Creator', description: 'A local creator or influencer with an audience.' },
  { id: 'specialist', label: 'Specialist', description: 'A focused expert in one marketing area.' },
] as const satisfies readonly ExpertTypeOption[];

export const industryOptions = [
  'restaurant',
  'salon-beauty',
  'fitness',
  'healthcare',
  'home-services',
  'real-estate',
  'retail',
  'events',
  'education',
  'professional-services',
] as const;

export const platformOptions = [
  'google',
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'linkedin',
  'shopify',
  'wordpress',
  'webflow',
  'mailchimp',
  'klaviyo',
] as const;

export const proofSignalOptions = [
  'verified',
  'reviews',
  'portfolio',
  'case-studies',
  'creator-audience',
  'certifications',
  'before-after',
] as const;

export const marketingSubjects = [
  {
    id: 'local-search-seo',
    label: 'Local Search & SEO',
    buyerLabel: 'Help customers find me on Google',
    shortDescription: 'Improve visibility in Google, maps, local search, and organic results.',
    serviceTokens: ['seo', 'local-seo', 'google-business-profile', 'technical-seo', 'content-seo', 'citations', 'ai-search'],
    suggestedExpertTypes: ['agency', 'freelancer', 'specialist'],
    subcategories: [
      {
        id: 'google-business-profile',
        label: 'Google Business Profile',
        buyerLabel: 'Improve my Google business listing',
        shortDescription: 'Optimize your listing, categories, photos, services, and map presence.',
        serviceTokens: ['google-business-profile', 'local-seo'],
        deliverables: [
          {
            id: 'gbp-setup',
            label: 'Google Business Profile Setup',
            buyerLabel: 'Set up my Google business profile',
            description: 'Create or clean up the core Google Business Profile foundation.',
            serviceTokens: ['google-business-profile', 'gbp-setup', 'local-seo'],
            recommendedExpertTypes: ['agency', 'freelancer', 'specialist'],
          },
          {
            id: 'gbp-optimization',
            label: 'Google Business Profile Optimization',
            buyerLabel: 'Improve my Google listing',
            description: 'Optimize categories, services, photos, posts, and local trust signals.',
            serviceTokens: ['google-business-profile', 'gbp-optimization', 'local-seo'],
            recommendedExpertTypes: ['agency', 'specialist'],
          },
        ],
      },
      {
        id: 'local-seo',
        label: 'Local SEO',
        buyerLabel: 'Show up for local searches',
        shortDescription: 'Help nearby customers find the business for location-based searches.',
        serviceTokens: ['local-seo', 'seo', 'citations'],
        deliverables: [
          {
            id: 'local-seo-audit',
            label: 'Local SEO Audit',
            buyerLabel: 'Find out why locals cannot find me',
            description: 'Review map visibility, listings, local pages, and search presence.',
            serviceTokens: ['local-seo', 'seo-audit', 'seo'],
          },
          {
            id: 'city-service-pages',
            label: 'City / Service Landing Pages',
            buyerLabel: 'Create city and service pages',
            description: 'Build pages that connect local services with the right nearby searches.',
            serviceTokens: ['local-seo', 'landing-pages', 'content-seo', 'web'],
          },
        ],
      },
      {
        id: 'technical-seo',
        label: 'Technical SEO',
        buyerLabel: 'Fix technical search issues',
        shortDescription: 'Improve crawlability, indexation, structured data, and search health.',
        serviceTokens: ['technical-seo', 'seo'],
        deliverables: [
          {
            id: 'technical-seo-audit',
            label: 'Technical SEO Audit',
            buyerLabel: 'Find technical SEO problems',
            description: 'Audit indexation, metadata, redirects, schema, and page health.',
            serviceTokens: ['technical-seo', 'seo-audit', 'seo'],
          },
          {
            id: 'schema-and-indexing-fixes',
            label: 'Schema & Indexing Fixes',
            buyerLabel: 'Fix search indexing and structured data',
            description: 'Repair common technical search issues that stop pages from performing.',
            serviceTokens: ['technical-seo', 'schema', 'indexing-fixes', 'seo'],
          },
        ],
      },
      {
        id: 'ai-search-visibility',
        label: 'AI Search Visibility',
        buyerLabel: 'Show up better in AI answers',
        shortDescription: 'Improve how your business appears in AI answers and answer engines.',
        serviceTokens: ['ai-search', 'content-seo', 'seo'],
        deliverables: [
          {
            id: 'ai-search-audit',
            label: 'AI Search Visibility Audit',
            buyerLabel: 'Check if AI tools understand my business',
            description: 'Review content clarity, structured information, and answer-engine readiness.',
            serviceTokens: ['ai-search', 'answer-engine-optimization', 'content-seo', 'seo'],
          },
        ],
      },
    ],
  },
  {
    id: 'paid-ads-lead-generation',
    label: 'Paid Ads & Lead Generation',
    buyerLabel: 'Get more calls, bookings, or leads',
    shortDescription: 'Run paid campaigns that create measurable customer demand.',
    serviceTokens: ['ads', 'paid-ads', 'google-ads', 'meta-ads', 'paid-search', 'paid-social', 'lead-generation', 'ppc', 'retargeting', 'conversion-tracking'],
    suggestedExpertTypes: ['agency', 'freelancer', 'specialist'],
    subcategories: [
      {
        id: 'google-ads',
        label: 'Google Ads',
        buyerLabel: 'Run ads on Google',
        shortDescription: 'Reach people who are already searching for your services.',
        serviceTokens: ['google-ads', 'paid-search', 'ppc', 'lead-generation', 'ads'],
        deliverables: [
          {
            id: 'search-campaign-setup',
            label: 'Search Campaign Setup',
            buyerLabel: 'Set up Google search ads',
            description: 'Build campaign structure, keyword themes, and high-intent search ads.',
            serviceTokens: ['google-ads', 'paid-search', 'search-ads', 'ppc', 'ads'],
          },
          {
            id: 'local-service-ads',
            label: 'Local Service Ads',
            buyerLabel: 'Run local service ads',
            description: 'Set up or manage local service ads for calls and bookings.',
            serviceTokens: ['google-ads', 'local-service-ads', 'lead-generation', 'ads'],
          },
          {
            id: 'conversion-tracking',
            label: 'Conversion Tracking',
            buyerLabel: 'Track calls, forms, and bookings',
            description: 'Track what paid campaigns are actually producing.',
            serviceTokens: ['conversion-tracking', 'analytics-setup', 'google-ads', 'ads'],
          },
        ],
      },
      {
        id: 'meta-ads',
        label: 'Facebook & Instagram Ads',
        buyerLabel: 'Run Facebook or Instagram ads',
        shortDescription: 'Reach local audiences through Meta campaigns.',
        serviceTokens: ['meta-ads', 'facebook-ads', 'instagram-ads', 'paid-social', 'ads'],
        deliverables: [
          {
            id: 'lead-form-campaigns',
            label: 'Lead Form Campaigns',
            buyerLabel: 'Collect leads from Facebook or Instagram',
            description: 'Build Meta lead-form campaigns for calls, messages, or inquiries.',
            serviceTokens: ['meta-ads', 'lead-generation', 'paid-social', 'facebook-ads', 'instagram-ads', 'ads'],
          },
          {
            id: 'retargeting-campaigns',
            label: 'Retargeting Campaigns',
            buyerLabel: 'Bring back people who already showed interest',
            description: 'Retarget website visitors or engaged social audiences.',
            serviceTokens: ['retargeting', 'meta-ads', 'paid-social', 'ads'],
          },
        ],
      },
      {
        id: 'tiktok-ads',
        label: 'TikTok Ads',
        buyerLabel: 'Run TikTok ads',
        shortDescription: 'Use short-form video ads to create awareness or leads.',
        serviceTokens: ['tiktok-ads', 'paid-social', 'video-ads', 'ads'],
        deliverables: [
          {
            id: 'tiktok-lead-campaign',
            label: 'TikTok Lead Campaign',
            buyerLabel: 'Use TikTok ads for leads',
            description: 'Create awareness, traffic, or lead campaigns through TikTok ads.',
            serviceTokens: ['tiktok-ads', 'lead-generation', 'video-ads', 'ads'],
          },
        ],
      },
      {
        id: 'youtube-ads',
        label: 'YouTube Ads',
        buyerLabel: 'Run YouTube ads',
        shortDescription: 'Use video ads to build local awareness or support conversion campaigns.',
        serviceTokens: ['youtube-ads', 'video-ads', 'paid-social', 'ads'],
        deliverables: [
          {
            id: 'youtube-video-campaign',
            label: 'YouTube Video Campaign',
            buyerLabel: 'Use YouTube video ads',
            description: 'Create skippable or local awareness video campaigns on YouTube.',
            serviceTokens: ['youtube-ads', 'video-ads', 'ads'],
          },
        ],
      },
      {
        id: 'lead-generation',
        label: 'Lead Generation',
        buyerLabel: 'Get more inquiries',
        shortDescription: 'Build campaigns focused on calls, messages, bookings, or forms.',
        serviceTokens: ['lead-generation', 'paid-ads', 'landing-pages', 'ads'],
        deliverables: [
          {
            id: 'lead-gen-campaign',
            label: 'Lead Generation Campaign',
            buyerLabel: 'Create a campaign to get more leads',
            description: 'Combine ads, targeting, copy, and landing pages around lead goals.',
            serviceTokens: ['lead-generation', 'paid-ads', 'landing-pages', 'ads'],
          },
          {
            id: 'call-booking-funnel',
            label: 'Call / Booking Funnel',
            buyerLabel: 'Drive more calls or bookings',
            description: 'Build a focused flow that pushes traffic into calls, forms, or appointments.',
            serviceTokens: ['lead-generation', 'conversion-tracking', 'landing-pages', 'ads'],
          },
        ],
      },
    ],
  },
  {
    id: 'website-landing-pages',
    label: 'Website & Landing Pages',
    buyerLabel: 'Make my website turn visitors into customers',
    shortDescription: 'Improve websites, landing pages, booking flows, and conversions.',
    serviceTokens: ['web', 'web-design', 'website-redesign', 'landing-pages', 'cro', 'website-copy', 'analytics-setup'],
    suggestedExpertTypes: ['agency', 'freelancer', 'specialist'],
    subcategories: [
      {
        id: 'website-design',
        label: 'Website Design',
        buyerLabel: 'Build or improve my website',
        shortDescription: 'Design or improve a business website that feels trustworthy and clear.',
        serviceTokens: ['web-design', 'web', 'website-redesign'],
        deliverables: [
          {
            id: 'business-website',
            label: 'Business Website',
            buyerLabel: 'Build a business website',
            description: 'Design or build a local-business website with clear calls to action.',
            serviceTokens: ['web-design', 'business-website', 'web'],
          },
          {
            id: 'website-refresh',
            label: 'Website Refresh',
            buyerLabel: 'Refresh my current site',
            description: 'Improve an existing site without a full rebuild.',
            serviceTokens: ['website-redesign', 'web-design', 'web'],
          },
        ],
      },
      {
        id: 'landing-pages',
        label: 'Landing Pages',
        buyerLabel: 'Create a page for ads or offers',
        shortDescription: 'Build focused pages for campaigns, services, or offers.',
        serviceTokens: ['landing-pages', 'cro', 'website-copy', 'web'],
        deliverables: [
          {
            id: 'lead-landing-page',
            label: 'Lead Landing Page',
            buyerLabel: 'Create a page to get more leads',
            description: 'Build a page focused on calls, bookings, or form submissions.',
            serviceTokens: ['landing-pages', 'lead-generation', 'cro', 'web'],
          },
          {
            id: 'offer-page',
            label: 'Offer Page',
            buyerLabel: 'Create a page for a special offer',
            description: 'Build a focused offer page around a product, service, or campaign.',
            serviceTokens: ['landing-pages', 'website-copy', 'web'],
          },
        ],
      },
      {
        id: 'conversion-rate-optimization',
        label: 'Conversion Rate Optimization',
        buyerLabel: 'Get more visitors to take action',
        shortDescription: 'Improve the page so more people call, book, message, or buy.',
        serviceTokens: ['cro', 'analytics-setup', 'website-copy', 'web'],
        deliverables: [
          {
            id: 'conversion-audit',
            label: 'Conversion Audit',
            buyerLabel: 'Find out why visitors do not contact me',
            description: 'Review trust, layout, CTAs, forms, and buyer friction.',
            serviceTokens: ['cro', 'marketing-audit', 'web'],
          },
          {
            id: 'form-booking-optimization',
            label: 'Form & Booking Optimization',
            buyerLabel: 'Make forms or bookings easier',
            description: 'Improve forms, booking steps, and conversion flow clarity.',
            serviceTokens: ['cro', 'booking-optimization', 'web'],
          },
        ],
      },
      {
        id: 'analytics-tracking',
        label: 'Analytics & Tracking',
        buyerLabel: 'Track what my website is doing',
        shortDescription: 'Set up analytics and core conversion measurement on the website.',
        serviceTokens: ['analytics-setup', 'ga4', 'reporting', 'web'],
        deliverables: [
          {
            id: 'ga4-setup',
            label: 'GA4 Setup',
            buyerLabel: 'Set up website analytics',
            description: 'Install and configure analytics for better reporting and decision-making.',
            serviceTokens: ['analytics-setup', 'ga4', 'reporting', 'web'],
          },
        ],
      },
    ],
  },
  {
    id: 'social-media-community',
    label: 'Social Media & Community',
    buyerLabel: 'Make social media actually help my business',
    shortDescription: 'Plan, post, manage, and grow social channels with clearer business goals.',
    serviceTokens: ['social', 'social-media', 'instagram-management', 'tiktok-management', 'content-calendar', 'community-management', 'social-content'],
    suggestedExpertTypes: ['agency', 'freelancer', 'creator', 'specialist'],
    subcategories: [
      {
        id: 'social-strategy',
        label: 'Social Strategy',
        buyerLabel: 'Figure out what to do on social media',
        shortDescription: 'Build a social plan based on audience, offers, and content rhythm.',
        serviceTokens: ['social-media', 'social-strategy', 'content-calendar', 'social'],
        deliverables: [
          {
            id: 'social-strategy-plan',
            label: 'Social Strategy Plan',
            buyerLabel: 'Create a social plan for my business',
            description: 'Define channels, posting themes, goals, and content rhythm.',
            serviceTokens: ['social-media', 'social-strategy', 'content-calendar', 'social'],
          },
        ],
      },
      {
        id: 'instagram-management',
        label: 'Instagram Management',
        buyerLabel: 'Manage my Instagram',
        shortDescription: 'Create and manage Instagram content for awareness and trust.',
        serviceTokens: ['instagram-management', 'social-content', 'social'],
        deliverables: [
          {
            id: 'instagram-monthly-management',
            label: 'Instagram Monthly Management',
            buyerLabel: 'Have someone manage Instagram',
            description: 'Plan, post, and manage Instagram content on a recurring basis.',
            serviceTokens: ['instagram-management', 'social-content', 'content-calendar', 'social'],
          },
        ],
      },
      {
        id: 'tiktok-management',
        label: 'TikTok Management',
        buyerLabel: 'Manage my TikTok',
        shortDescription: 'Use short-form video posting to build visibility and demand.',
        serviceTokens: ['tiktok-management', 'short-form-video', 'social-content', 'social'],
        deliverables: [
          {
            id: 'tiktok-content-series',
            label: 'TikTok Content Series',
            buyerLabel: 'Create a TikTok video series',
            description: 'Produce and publish recurring short-form video content for TikTok.',
            serviceTokens: ['tiktok-management', 'short-form-video', 'social-content', 'video', 'social'],
          },
        ],
      },
      {
        id: 'community-management',
        label: 'Community Management',
        buyerLabel: 'Keep up with comments and messages',
        shortDescription: 'Manage comments, DMs, basic moderation, and audience follow-up.',
        serviceTokens: ['community-management', 'social-media', 'social'],
        deliverables: [
          {
            id: 'comment-and-dm-management',
            label: 'Comment & DM Management',
            buyerLabel: 'Manage comments and messages',
            description: 'Respond to inbound engagement and keep social communication moving.',
            serviceTokens: ['community-management', 'social-media', 'social'],
          },
        ],
      },
    ],
  },
  {
    id: 'creator-influencer-marketing',
    label: 'Creator / Influencer Marketing',
    buyerLabel: 'Work with local creators',
    shortDescription: 'Find creators and influencer partners who can promote your business or make creator-style content.',
    serviceTokens: [
      'creator',
      'influencer',
      'creator-marketing',
      'influencer-marketing',
      'local-influencer',
      'instagram-creator',
      'tiktok-creator',
      'ugc',
      'creator-content',
      'sponsored-post',
      'creator-visit',
      'creator-outreach',
      'social',
      'video',
    ],
    suggestedExpertTypes: ['creator', 'agency', 'specialist'],
    subcategories: [
      {
        id: 'local-influencers',
        label: 'Local Influencers',
        buyerLabel: 'Work with local influencers',
        shortDescription: 'Find creators with a local audience who can promote your business.',
        serviceTokens: ['local-influencer', 'creator-marketing', 'sponsored-post', 'social'],
        deliverables: [
          {
            id: 'sponsored-post',
            label: 'Sponsored Post',
            buyerLabel: 'Have a creator post about my business',
            description: 'A creator posts your business to their audience.',
            serviceTokens: ['sponsored-post', 'creator-marketing', 'social'],
            recommendedExpertTypes: ['creator'],
          },
          {
            id: 'creator-visit',
            label: 'Creator Visit',
            buyerLabel: 'Invite a creator to visit and post',
            description: 'A creator visits your restaurant, salon, gym, store, or event.',
            serviceTokens: ['creator-visit', 'local-influencer', 'sponsored-post', 'social', 'video'],
            recommendedExpertTypes: ['creator'],
          },
        ],
      },
      {
        id: 'instagram-creators',
        label: 'Instagram Creators',
        buyerLabel: 'Work with Instagram creators',
        shortDescription: 'Find creators who can promote your business through Instagram posts, stories, or reels.',
        serviceTokens: ['instagram-creator', 'creator-marketing', 'social'],
        deliverables: [
          {
            id: 'instagram-creator-campaign',
            label: 'Instagram Creator Campaign',
            buyerLabel: 'Run an Instagram creator campaign',
            description: 'Coordinate creator posts or story sequences on Instagram.',
            serviceTokens: ['instagram-creator', 'creator-marketing', 'sponsored-post', 'social'],
            recommendedExpertTypes: ['creator', 'agency'],
          },
        ],
      },
      {
        id: 'tiktok-creators',
        label: 'TikTok Creators',
        buyerLabel: 'Work with TikTok creators',
        shortDescription: 'Use local or niche TikTok creators who can promote your business through their audience.',
        serviceTokens: ['tiktok-creator', 'creator-marketing', 'short-form-video', 'social', 'video'],
        deliverables: [
          {
            id: 'tiktok-creator-campaign',
            label: 'TikTok Creator Campaign',
            buyerLabel: 'Run a TikTok creator campaign',
            description: 'Coordinate TikTok creators for local awareness or demand generation.',
            serviceTokens: ['tiktok-creator', 'creator-marketing', 'short-form-video', 'social', 'video'],
            recommendedExpertTypes: ['creator', 'agency'],
          },
        ],
      },
      {
        id: 'ugc-content',
        label: 'UGC & Creator-Style Content',
        buyerLabel: 'Get creator-style videos for my business',
        shortDescription: 'Get creator-style videos or photos for your ads, posts, or website without relying on audience reach.',
        serviceTokens: ['ugc', 'creator-content', 'short-form-video', 'video', 'instagram-reels'],
        deliverables: [
          {
            id: 'ugc-video-package',
            label: 'UGC Video Package',
            buyerLabel: 'Get creator-style videos',
            description: 'A package of creator-style videos your business can use in ads, posts, or on its own channels.',
            serviceTokens: ['ugc', 'video-production', 'short-form-video', 'instagram-reels', 'video'],
            recommendedExpertTypes: ['creator', 'freelancer'],
          },
        ],
      },
      {
        id: 'creator-outreach',
        label: 'Creator Outreach',
        buyerLabel: 'Find creators for my campaign',
        shortDescription: 'Source, brief, and coordinate creators for a campaign.',
        serviceTokens: ['creator-outreach', 'influencer-marketing', 'creator-marketing'],
        deliverables: [
          {
            id: 'creator-campaign-management',
            label: 'Creator Campaign Management',
            buyerLabel: 'Have someone manage creator campaigns',
            description: 'Find creators, manage outreach, briefs, approvals, and performance.',
            serviceTokens: ['creator-outreach', 'creator-marketing', 'campaign-management'],
            recommendedExpertTypes: ['agency', 'specialist'],
          },
          {
            id: 'giveaway-collaboration',
            label: 'Giveaway Collaboration',
            buyerLabel: 'Run a creator giveaway or collaboration',
            description: 'Coordinate a creator-led giveaway or local collaboration effort.',
            serviceTokens: ['giveaway-collaboration', 'creator-marketing', 'social'],
            recommendedExpertTypes: ['creator', 'agency'],
          },
        ],
      },
    ],
  },
  {
    id: 'content-copywriting-creative',
    label: 'Content, Copywriting & Creative',
    buyerLabel: 'Get better photos, videos, or writing',
    shortDescription: 'Create clearer words and stronger visuals for websites, ads, and social media.',
    serviceTokens: [
      'content',
      'copywriting',
      'website-copy',
      'ad-copy',
      'email-copy',
      'blog-writing',
      'seo-content',
      'photography',
      'video-production',
      'video-editing',
      'short-form-video',
      'instagram-reels',
      'reels-production',
      'reels-editing',
      'video',
    ],
    suggestedExpertTypes: ['agency', 'freelancer', 'creator', 'specialist'],
    subcategories: [
      {
        id: 'website-copy',
        label: 'Website Copy',
        buyerLabel: 'Improve the words on my website',
        shortDescription: 'Clarify website messaging, service pages, and trust-building copy.',
        serviceTokens: ['website-copy', 'copywriting', 'content'],
        deliverables: [
          {
            id: 'website-copy-refresh',
            label: 'Website Copy Refresh',
            buyerLabel: 'Rewrite my website copy',
            description: 'Improve homepage, service page, and core trust messaging.',
            serviceTokens: ['website-copy', 'copywriting', 'content'],
          },
          {
            id: 'landing-page-copy',
            label: 'Landing Page Copy',
            buyerLabel: 'Write copy for a landing page',
            description: 'Write conversion-focused landing-page copy for offers or ads.',
            serviceTokens: ['landing-pages', 'website-copy', 'copywriting', 'content'],
          },
        ],
      },
      {
        id: 'ad-copy',
        label: 'Ad Copy',
        buyerLabel: 'Write better ads',
        shortDescription: 'Sharpen offers, hooks, and ad copy across channels.',
        serviceTokens: ['ad-copy', 'copywriting', 'content'],
        deliverables: [
          {
            id: 'ad-copy-set',
            label: 'Ad Copy Set',
            buyerLabel: 'Write ad headlines and copy',
            description: 'Create ads for Google, Meta, or other paid channels.',
            serviceTokens: ['ad-copy', 'copywriting', 'ads', 'content'],
          },
          {
            id: 'offer-messaging',
            label: 'Offer Messaging',
            buyerLabel: 'Clarify my offer before ads or promos',
            description: 'Sharpen the language around value, urgency, and calls to action.',
            serviceTokens: ['copywriting', 'ad-copy', 'content'],
          },
        ],
      },
      {
        id: 'blog-writing',
        label: 'Blog Writing',
        buyerLabel: 'Publish helpful articles',
        shortDescription: 'Write useful articles, guides, and search-friendly educational content.',
        serviceTokens: ['blog-writing', 'seo-content', 'content'],
        deliverables: [
          {
            id: 'seo-article-package',
            label: 'SEO Article Package',
            buyerLabel: 'Get articles for search traffic',
            description: 'Create a package of articles aimed at improving visibility and trust.',
            serviceTokens: ['blog-writing', 'seo-content', 'content', 'seo'],
          },
        ],
      },
      {
        id: 'photography',
        label: 'Photography',
        buyerLabel: 'Get professional photos',
        shortDescription: 'Create stronger product, location, team, or brand photography.',
        serviceTokens: ['photography', 'content', 'social-content'],
        deliverables: [
          {
            id: 'brand-photo-shoot',
            label: 'Brand Photo Shoot',
            buyerLabel: 'Get photos for my business',
            description: 'Capture brand, space, product, or team visuals for marketing use.',
            serviceTokens: ['photography', 'content', 'social-content'],
          },
        ],
      },
      {
        id: 'video-production',
        label: 'Reels & Short-Form Video Production',
        buyerLabel: 'Film reels or short videos for my business',
        shortDescription: 'Plan, film, and edit reels or short-form videos for your business channels, ads, or promos.',
        serviceTokens: ['video-production', 'video-editing', 'short-form-video', 'instagram-reels', 'reels-production', 'reels-editing', 'video', 'content'],
        deliverables: [
          {
            id: 'promo-video',
            label: 'Business Promo Video',
            buyerLabel: 'Create a promo video',
            description: 'Produce a short promo or brand explainer video.',
            serviceTokens: ['video-production', 'video-editing', 'video', 'content'],
          },
          {
            id: 'instagram-reels-production',
            label: 'Instagram Reels Production',
            buyerLabel: 'Create reels for my business',
            description: 'Plan, shoot, and edit Instagram reels for the business to publish or run as ads.',
            serviceTokens: ['video-production', 'short-form-video', 'instagram-reels', 'reels-production', 'video', 'content'],
          },
          {
            id: 'short-form-video-editing',
            label: 'Reels & Short-Form Editing',
            buyerLabel: 'Edit reels and short videos',
            description: 'Edit clips into usable short-form content for social, creators, or ads.',
            serviceTokens: ['video-editing', 'short-form-video', 'instagram-reels', 'reels-editing', 'video', 'content'],
          },
        ],
      },
    ],
  },
  {
    id: 'brand-design-print',
    label: 'Brand, Design & Print',
    buyerLabel: 'Make my business look professional',
    shortDescription: 'Create a stronger brand system across logo, print, menus, flyers, and visual identity.',
    serviceTokens: ['branding', 'logo-design', 'brand-identity', 'print-design', 'menus', 'flyers', 'social-templates', 'print'],
    suggestedExpertTypes: ['agency', 'freelancer', 'specialist'],
    subcategories: [
      {
        id: 'brand-identity',
        label: 'Brand Identity',
        buyerLabel: 'Improve my logo and brand look',
        shortDescription: 'Create a stronger visual system and identity direction.',
        serviceTokens: ['branding', 'logo-design', 'brand-identity'],
        deliverables: [
          {
            id: 'logo-identity-package',
            label: 'Logo & Identity Package',
            buyerLabel: 'Get a logo and brand identity',
            description: 'Create a logo, brand system, colors, and core visual guidelines.',
            serviceTokens: ['branding', 'logo-design', 'brand-identity'],
          },
        ],
      },
      {
        id: 'print-design',
        label: 'Print Design',
        buyerLabel: 'Create menus, flyers, or printed materials',
        shortDescription: 'Design practical printed pieces for local promotion and trust.',
        serviceTokens: ['print-design', 'menus', 'flyers', 'print'],
        deliverables: [
          {
            id: 'menus-flyers-collateral',
            label: 'Menus, Flyers & Collateral',
            buyerLabel: 'Design print materials for my business',
            description: 'Create usable printed materials for offers, menus, handouts, or events.',
            serviceTokens: ['print-design', 'menus', 'flyers', 'print'],
          },
        ],
      },
      {
        id: 'social-templates',
        label: 'Social Templates',
        buyerLabel: 'Make social posts look more consistent',
        shortDescription: 'Create repeatable visual templates for posts, promos, and stories.',
        serviceTokens: ['social-templates', 'branding', 'social-content'],
        deliverables: [
          {
            id: 'social-template-kit',
            label: 'Social Template Kit',
            buyerLabel: 'Get branded social templates',
            description: 'Create reusable designs for ongoing social posting and promotions.',
            serviceTokens: ['social-templates', 'branding', 'social-content'],
          },
        ],
      },
    ],
  },
  {
    id: 'email-sms-retention',
    label: 'Email, SMS & Retention',
    buyerLabel: 'Bring customers back',
    shortDescription: 'Use email, SMS, and retention flows to drive repeat visits or purchases.',
    serviceTokens: ['email', 'email-marketing', 'sms-marketing', 'retention-marketing', 'automations', 'klaviyo', 'mailchimp'],
    suggestedExpertTypes: ['agency', 'freelancer', 'specialist'],
    subcategories: [
      {
        id: 'email-marketing',
        label: 'Email Marketing',
        buyerLabel: 'Send better emails',
        shortDescription: 'Create email campaigns, sequences, and newsletters that drive action.',
        serviceTokens: ['email', 'email-marketing', 'mailchimp', 'klaviyo'],
        deliverables: [
          {
            id: 'welcome-email-flow',
            label: 'Welcome Email Flow',
            buyerLabel: 'Set up a welcome email sequence',
            description: 'Build an email flow for new subscribers or first-time buyers.',
            serviceTokens: ['email', 'email-marketing', 'automations', 'mailchimp', 'klaviyo'],
          },
          {
            id: 'newsletter-campaign',
            label: 'Newsletter Campaign',
            buyerLabel: 'Send regular email campaigns',
            description: 'Create one-off or recurring email campaigns for offers and updates.',
            serviceTokens: ['email', 'email-marketing', 'mailchimp', 'klaviyo'],
          },
        ],
      },
      {
        id: 'sms-marketing',
        label: 'SMS Marketing',
        buyerLabel: 'Send texts to customers',
        shortDescription: 'Use SMS for reminders, offers, and retention.',
        serviceTokens: ['sms-marketing', 'retention-marketing'],
        deliverables: [
          {
            id: 'sms-campaign-setup',
            label: 'SMS Campaign Setup',
            buyerLabel: 'Set up text-message campaigns',
            description: 'Create SMS campaign structure, compliance basics, and offer messaging.',
            serviceTokens: ['sms-marketing', 'retention-marketing'],
          },
        ],
      },
      {
        id: 'automations-retention',
        label: 'Automations & Retention',
        buyerLabel: 'Bring back existing customers',
        shortDescription: 'Use automated follow-up and win-back flows to increase repeat action.',
        serviceTokens: ['automations', 'retention-marketing', 'email-marketing'],
        deliverables: [
          {
            id: 'reengagement-flow',
            label: 'Re-engagement Flow',
            buyerLabel: 'Bring past customers back',
            description: 'Create follow-up or win-back flows for existing customers.',
            serviceTokens: ['automations', 'retention-marketing', 'email-marketing', 'sms-marketing'],
          },
        ],
      },
    ],
  },
  {
    id: 'reviews-reputation',
    label: 'Reviews & Reputation',
    buyerLabel: 'Get more reviews and trust',
    shortDescription: 'Improve reviews, testimonials, reputation, and local trust signals.',
    serviceTokens: ['reviews', 'google-reviews', 'reputation-management', 'review-management', 'testimonials', 'trust-building'],
    suggestedExpertTypes: ['agency', 'freelancer', 'specialist'],
    subcategories: [
      {
        id: 'review-generation',
        label: 'Review Generation',
        buyerLabel: 'Get more customer reviews',
        shortDescription: 'Build review-request systems that create more social proof.',
        serviceTokens: ['reviews', 'google-reviews', 'review-management'],
        deliverables: [
          {
            id: 'review-request-system',
            label: 'Review Request System',
            buyerLabel: 'Set up a way to ask for reviews',
            description: 'Create a process for collecting more review volume after jobs or visits.',
            serviceTokens: ['reviews', 'google-reviews', 'review-management'],
          },
        ],
      },
      {
        id: 'reputation-management',
        label: 'Reputation Management',
        buyerLabel: 'Manage reviews and public trust',
        shortDescription: 'Monitor and respond to reviews while improving trust signals.',
        serviceTokens: ['reputation-management', 'reviews', 'trust-building'],
        deliverables: [
          {
            id: 'review-response-management',
            label: 'Review Response Management',
            buyerLabel: 'Have someone manage review responses',
            description: 'Respond to reviews and help maintain public trust over time.',
            serviceTokens: ['reputation-management', 'review-management', 'reviews'],
          },
        ],
      },
      {
        id: 'testimonials-trust',
        label: 'Testimonials & Trust',
        buyerLabel: 'Show stronger proof on my website',
        shortDescription: 'Capture and present trust signals more clearly across buyer touchpoints.',
        serviceTokens: ['testimonials', 'trust-building', 'reviews'],
        deliverables: [
          {
            id: 'testimonial-capture',
            label: 'Testimonial Capture',
            buyerLabel: 'Collect better testimonials',
            description: 'Collect and package testimonials for website, profile, or sales use.',
            serviceTokens: ['testimonials', 'trust-building', 'reviews'],
          },
        ],
      },
    ],
  },
  {
    id: 'ecommerce-product-marketing',
    label: 'Ecommerce & Product Marketing',
    buyerLabel: 'Sell more products online',
    shortDescription: 'Improve traffic, product pages, shopping ads, and repeat purchase systems.',
    serviceTokens: ['ecommerce-marketing', 'shopify-marketing', 'shopping-ads', 'product-pages', 'affiliate-marketing', 'email-marketing'],
    suggestedExpertTypes: ['agency', 'freelancer', 'specialist'],
    subcategories: [
      {
        id: 'shopify-marketing',
        label: 'Shopify Marketing',
        buyerLabel: 'Improve my Shopify store marketing',
        shortDescription: 'Grow traffic, conversion, and retention around a Shopify store.',
        serviceTokens: ['ecommerce-marketing', 'shopify-marketing', 'product-pages'],
        deliverables: [
          {
            id: 'shopify-growth-setup',
            label: 'Shopify Growth Setup',
            buyerLabel: 'Set up marketing for my Shopify store',
            description: 'Align store pages, offers, and acquisition basics for product growth.',
            serviceTokens: ['ecommerce-marketing', 'shopify-marketing', 'product-pages'],
          },
        ],
      },
      {
        id: 'shopping-ads',
        label: 'Shopping Ads',
        buyerLabel: 'Run ads for my products',
        shortDescription: 'Use shopping campaigns to reach product buyers more directly.',
        serviceTokens: ['shopping-ads', 'google-ads', 'paid-ads', 'ads'],
        deliverables: [
          {
            id: 'shopping-campaign-setup',
            label: 'Shopping Campaign Setup',
            buyerLabel: 'Set up product ad campaigns',
            description: 'Launch product-focused campaigns for ecommerce demand.',
            serviceTokens: ['shopping-ads', 'google-ads', 'paid-ads', 'ads'],
          },
        ],
      },
      {
        id: 'product-pages',
        label: 'Product Pages',
        buyerLabel: 'Improve my product pages',
        shortDescription: 'Make product pages clearer, more persuasive, and easier to buy from.',
        serviceTokens: ['product-pages', 'website-copy', 'cro'],
        deliverables: [
          {
            id: 'product-page-optimization',
            label: 'Product Page Optimization',
            buyerLabel: 'Improve product pages',
            description: 'Improve messaging, trust, layout, and conversion cues on product pages.',
            serviceTokens: ['product-pages', 'website-copy', 'cro'],
          },
        ],
      },
      {
        id: 'affiliate-marketing',
        label: 'Affiliate Marketing',
        buyerLabel: 'Set up affiliate or referral growth',
        shortDescription: 'Create a simple partner or affiliate program around product growth.',
        serviceTokens: ['affiliate-marketing', 'partnerships'],
        deliverables: [
          {
            id: 'affiliate-program-setup',
            label: 'Affiliate Program Setup',
            buyerLabel: 'Set up an affiliate or referral program',
            description: 'Create a partner or affiliate structure for product promotion.',
            serviceTokens: ['affiliate-marketing', 'partnerships'],
          },
        ],
      },
    ],
  },
  {
    id: 'strategy-analytics-consulting',
    label: 'Strategy, Analytics & Consulting',
    buyerLabel: 'Figure out the right plan before spending more',
    shortDescription: 'Use strategy, audits, reporting, and expert guidance to make better decisions.',
    serviceTokens: ['marketing-strategy', 'marketing-audit', 'growth-strategy', 'analytics', 'ga4', 'reporting', 'consulting'],
    suggestedExpertTypes: ['agency', 'freelancer', 'specialist'],
    subcategories: [
      {
        id: 'marketing-strategy',
        label: 'Marketing Strategy',
        buyerLabel: 'Help me decide what to do next',
        shortDescription: 'Clarify channel priorities, offers, and growth direction.',
        serviceTokens: ['marketing-strategy', 'growth-strategy', 'consulting'],
        deliverables: [
          {
            id: 'marketing-audit',
            label: 'Marketing Audit',
            buyerLabel: 'Audit what is working and what is not',
            description: 'Review the current marketing mix and identify the highest-leverage next moves.',
            serviceTokens: ['marketing-audit', 'marketing-strategy', 'consulting'],
          },
          {
            id: 'growth-roadmap',
            label: 'Growth Roadmap',
            buyerLabel: 'Give me a practical growth roadmap',
            description: 'Turn the business problem into a practical next-steps plan.',
            serviceTokens: ['growth-strategy', 'marketing-strategy', 'consulting'],
          },
        ],
      },
      {
        id: 'analytics-reporting',
        label: 'Analytics & Reporting',
        buyerLabel: 'Help me understand my numbers',
        shortDescription: 'Set up measurement and reporting that supports better decisions.',
        serviceTokens: ['analytics', 'ga4', 'reporting'],
        deliverables: [
          {
            id: 'ga4-dashboard',
            label: 'GA4 Dashboard',
            buyerLabel: 'Set up a dashboard for reporting',
            description: 'Create a usable analytics view for the business owner or team.',
            serviceTokens: ['analytics', 'ga4', 'reporting'],
          },
          {
            id: 'attribution-review',
            label: 'Attribution Review',
            buyerLabel: 'Help me understand where leads or sales come from',
            description: 'Review tracking and channel attribution with practical takeaways.',
            serviceTokens: ['analytics', 'reporting', 'consulting'],
          },
        ],
      },
      {
        id: 'fractional-consulting',
        label: 'Fractional Consulting',
        buyerLabel: 'Get ongoing expert guidance',
        shortDescription: 'Work with a strategist or consultant without hiring a full team.',
        serviceTokens: ['consulting', 'marketing-strategy', 'growth-strategy'],
        deliverables: [
          {
            id: 'fractional-marketing-lead',
            label: 'Fractional Marketing Lead',
            buyerLabel: 'Get ongoing strategic support',
            description: 'Provide recurring senior-level guidance without a full-time hire.',
            serviceTokens: ['consulting', 'marketing-strategy', 'growth-strategy'],
          },
        ],
      },
    ],
  },
  {
    id: 'events-pr-partnerships',
    label: 'Events, PR & Partnerships',
    buyerLabel: 'Promote a launch, event, or local collaboration',
    shortDescription: 'Create visibility around launches, events, local PR, and partnerships.',
    serviceTokens: ['event-marketing', 'grand-opening', 'local-pr', 'partnerships', 'sponsorships', 'creator-marketing'],
    suggestedExpertTypes: ['agency', 'freelancer', 'creator', 'specialist'],
    subcategories: [
      {
        id: 'event-marketing',
        label: 'Event Marketing',
        buyerLabel: 'Promote an event or launch',
        shortDescription: 'Drive awareness before, during, and after an event or launch.',
        serviceTokens: ['event-marketing', 'grand-opening', 'social'],
        deliverables: [
          {
            id: 'grand-opening-promo',
            label: 'Grand Opening Promo',
            buyerLabel: 'Promote my opening or launch',
            description: 'Plan and promote a grand opening, launch, or local activation.',
            serviceTokens: ['event-marketing', 'grand-opening', 'social', 'ads'],
          },
          {
            id: 'event-promo-campaign',
            label: 'Event Promo Campaign',
            buyerLabel: 'Promote a local event',
            description: 'Drive local attention around a workshop, event, or activation.',
            serviceTokens: ['event-marketing', 'social', 'ads'],
          },
        ],
      },
      {
        id: 'local-pr',
        label: 'Local PR',
        buyerLabel: 'Get local press or publicity',
        shortDescription: 'Reach local publications, directories, or media opportunities.',
        serviceTokens: ['local-pr', 'trust-building'],
        deliverables: [
          {
            id: 'local-pr-outreach',
            label: 'Local PR Outreach',
            buyerLabel: 'Get local press attention',
            description: 'Pitch the business to local media, blogs, or community outlets.',
            serviceTokens: ['local-pr', 'trust-building'],
          },
        ],
      },
      {
        id: 'partnerships-sponsorships',
        label: 'Partnerships & Sponsorships',
        buyerLabel: 'Find local partnerships',
        shortDescription: 'Use local partnerships, collabs, and sponsorships to create visibility.',
        serviceTokens: ['partnerships', 'sponsorships'],
        deliverables: [
          {
            id: 'local-partnership-plan',
            label: 'Local Partnership Plan',
            buyerLabel: 'Create a local partnership strategy',
            description: 'Identify and structure local collaborations that can drive trust or demand.',
            serviceTokens: ['partnerships', 'sponsorships'],
          },
        ],
      },
    ],
  },
] as const satisfies readonly MarketingSubject[];

export const buyerProblems = [
  {
    id: 'need-more-customers',
    label: 'I need more customers',
    customerLanguage: 'You need more calls, bookings, store visits, or leads.',
    outcomePromise: 'Find experts who can help create real customer demand.',
    suggestedSubjectIds: ['paid-ads-lead-generation', 'local-search-seo', 'website-landing-pages'],
    suggestedServiceTokens: ['ads', 'paid-ads', 'lead-generation', 'google-ads', 'paid-search', 'local-seo', 'landing-pages'],
    priority: 1,
  },
  {
    id: 'cannot-find-business',
    label: 'People cannot find my business',
    customerLanguage: 'Customers search online, but your business does not show up clearly.',
    outcomePromise: 'Improve local visibility on Google, maps, directories, and search.',
    suggestedSubjectIds: ['local-search-seo', 'reviews-reputation', 'website-landing-pages'],
    suggestedServiceTokens: ['seo', 'local-seo', 'google-business-profile', 'citations', 'google-reviews', 'web'],
    priority: 2,
  },
  {
    id: 'website-not-converting',
    label: 'My website is not helping',
    customerLanguage: 'People visit your site but do not call, book, message, or buy.',
    outcomePromise: 'Make your website clearer, more trustworthy, and easier to act on.',
    suggestedSubjectIds: ['website-landing-pages', 'content-copywriting-creative', 'strategy-analytics-consulting'],
    suggestedServiceTokens: ['web', 'landing-pages', 'cro', 'website-copy', 'analytics-setup', 'marketing-audit'],
    priority: 3,
  },
  {
    id: 'social-not-working',
    label: 'My social media is not working',
    customerLanguage: 'You post, but it does not bring enough awareness, trust, visits, or sales.',
    outcomePromise: 'Find help with social strategy, content, posting, and community growth.',
    suggestedSubjectIds: ['social-media-community', 'content-copywriting-creative', 'creator-influencer-marketing'],
    suggestedServiceTokens: ['social', 'social-media', 'instagram-management', 'tiktok-management', 'content-calendar', 'social-content'],
    priority: 4,
  },
  {
    id: 'want-local-creators',
    label: 'I want to work with local creators',
    customerLanguage: 'You want trusted local people to promote your business.',
    outcomePromise: 'Find creators, influencers, and UGC experts who fit your audience.',
    suggestedSubjectIds: ['creator-influencer-marketing', 'content-copywriting-creative', 'paid-ads-lead-generation'],
    suggestedServiceTokens: ['creator-marketing', 'local-influencer', 'instagram-creator', 'tiktok-creator', 'sponsored-post', 'ugc', 'creator-outreach', 'short-form-video'],
    priority: 5,
  },
  {
    id: 'need-better-content',
    label: 'I need better photos, videos, or writing',
    customerLanguage: 'Your business needs stronger content for ads, social media, website, or email.',
    outcomePromise: 'Find creative experts who make your business easier to understand and trust.',
    suggestedSubjectIds: ['content-copywriting-creative', 'social-media-community', 'website-landing-pages'],
    suggestedServiceTokens: ['content', 'copywriting', 'photography', 'video-production', 'video-editing', 'short-form-video', 'instagram-reels', 'website-copy'],
    priority: 6,
  },
  {
    id: 'need-professional-brand',
    label: 'I want my business to look professional',
    customerLanguage: 'Your logo, flyers, menus, website, or visuals feel outdated or inconsistent.',
    outcomePromise: 'Find design experts who can make your business look credible.',
    suggestedSubjectIds: ['brand-design-print', 'website-landing-pages', 'content-copywriting-creative'],
    suggestedServiceTokens: ['branding', 'logo-design', 'brand-identity', 'print-design', 'flyers', 'social-templates'],
    priority: 7,
  },
  {
    id: 'need-more-reviews',
    label: 'I need more reviews and trust',
    customerLanguage: 'People need more proof before they choose your business.',
    outcomePromise: 'Improve reviews, testimonials, reputation, and local trust signals.',
    suggestedSubjectIds: ['reviews-reputation', 'local-search-seo', 'strategy-analytics-consulting'],
    suggestedServiceTokens: ['reviews', 'google-reviews', 'reputation-management', 'testimonials', 'trust-building'],
    priority: 8,
  },
  {
    id: 'selling-products-online',
    label: 'I sell products online',
    customerLanguage: 'You need more product traffic, better listings, stronger pages, or repeat buyers.',
    outcomePromise: 'Find ecommerce marketing help for product pages, ads, email, and creators.',
    suggestedSubjectIds: ['ecommerce-product-marketing', 'paid-ads-lead-generation', 'email-sms-retention'],
    suggestedServiceTokens: ['ecommerce-marketing', 'shopify-marketing', 'shopping-ads', 'product-pages', 'email-marketing', 'ads'],
    priority: 9,
  },
  {
    id: 'launching-something-new',
    label: 'I am launching something new',
    customerLanguage: 'You need people to notice a new business, offer, event, or location.',
    outcomePromise: 'Find help with launch campaigns, ads, creators, PR, and local promotion.',
    suggestedSubjectIds: ['events-pr-partnerships', 'paid-ads-lead-generation', 'creator-influencer-marketing'],
    suggestedServiceTokens: ['event-marketing', 'grand-opening', 'local-pr', 'paid-ads', 'local-influencer', 'creator-marketing'],
    priority: 10,
  },
  {
    id: 'not-sure',
    label: 'I am not sure what I need',
    customerLanguage: 'You know the business problem, but not the marketing service name.',
    outcomePromise: 'Start with a marketing audit or strategy expert before choosing services.',
    suggestedSubjectIds: ['strategy-analytics-consulting', 'paid-ads-lead-generation', 'local-search-seo'],
    suggestedServiceTokens: ['marketing-audit', 'marketing-strategy', 'consulting', 'growth-strategy', 'ads', 'seo'],
    priority: 11,
  },
] as const satisfies readonly BuyerProblem[];

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function subjectMatchesServiceSet(subject: MarketingSubject, serviceSet: ReadonlySet<string>) {
  if (subject.serviceTokens.some((token) => serviceSet.has(token))) return true;

  return subject.subcategories.some((subcategory) => {
    if (subcategory.serviceTokens.some((token) => serviceSet.has(token))) return true;
    return subcategory.deliverables.some((deliverable) => deliverable.serviceTokens.some((token) => serviceSet.has(token)));
  });
}

function subcategoryMatchesServiceSet(subcategory: MarketingSubcategory, serviceSet: ReadonlySet<string>) {
  if (subcategory.serviceTokens.some((token) => serviceSet.has(token))) return true;
  return subcategory.deliverables.some((deliverable) => deliverable.serviceTokens.some((token) => serviceSet.has(token)));
}

function formatExpertTypeLabel(value: string | null | undefined) {
  switch (value) {
    case 'agency':
      return 'Agency';
    case 'freelancer':
      return 'Freelancer';
    case 'creator':
      return 'Creator';
    case 'specialist':
      return 'Specialist';
    default:
      return 'Expert';
  }
}

export function formatServiceTokenLabel(token: string) {
  return token
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getMarketingSubjectById(id: string | undefined) {
  if (!id) return null;
  return marketingSubjects.find((subject) => subject.id === id) ?? null;
}

export function getBuyerProblemById(id: string | undefined) {
  if (!id) return null;
  return buyerProblems.find((problem) => problem.id === id) ?? null;
}

export function getSubcategoriesForSubject(subjectId: string | undefined) {
  const subject = getMarketingSubjectById(subjectId);
  return subject?.subcategories ?? [];
}

export function getSubcategoryById(subjectId: string | undefined, subcategoryId: string | undefined) {
  if (!subcategoryId) return null;
  const subject = getMarketingSubjectById(subjectId);
  if (!subject) return null;
  return subject.subcategories.find((subcategory) => subcategory.id === subcategoryId) ?? null;
}

export function getAllServiceTokensForSubject(subjectId: string | undefined) {
  const subject = getMarketingSubjectById(subjectId);
  if (!subject) return [];

  return uniqueStrings([
    ...subject.serviceTokens,
    ...subject.subcategories.flatMap((subcategory) => subcategory.serviceTokens),
    ...subject.subcategories.flatMap((subcategory) =>
      subcategory.deliverables.flatMap((deliverable) => deliverable.serviceTokens),
    ),
  ]);
}

export function getServiceTokensForSubject(subjectId: string | undefined) {
  return getAllServiceTokensForSubject(subjectId);
}

export function getServiceTokensForSubcategory(subjectId: string | undefined, subcategoryId: string | undefined) {
  const subcategory = getSubcategoryById(subjectId, subcategoryId);
  if (!subcategory) return [];

  return uniqueStrings([
    ...subcategory.serviceTokens,
    ...subcategory.deliverables.flatMap((deliverable) => deliverable.serviceTokens),
  ]);
}

export function buildExpertsHrefForTokens(serviceTokens: readonly string[], match: 'any' | 'all' = 'any') {
  const params = new URLSearchParams();
  const uniqueTokens = uniqueStrings(serviceTokens);

  if (uniqueTokens.length > 0) {
    params.set('service', uniqueTokens.join(','));
    if (uniqueTokens.length > 1 || match === 'all') params.set('match', match);
  }

  const query = params.toString();
  return query ? `/experts?${query}` : '/experts';
}

export function buildExpertsHrefForSubject(subjectId: string) {
  return buildExpertsHrefForTokens(getServiceTokensForSubject(subjectId));
}

export function buildExpertsHrefForSubcategory(subjectId: string, subcategoryId: string) {
  return buildExpertsHrefForTokens(getServiceTokensForSubcategory(subjectId, subcategoryId));
}

export function buildExpertsHrefForBuyerProblem(problemId: string) {
  const problem = getBuyerProblemById(problemId);
  if (!problem) return '/experts';

  const params = new URLSearchParams();
  params.set('service', uniqueStrings(problem.suggestedServiceTokens).join(','));
  params.set('match', 'any');
  params.set('problem', problem.id);

  return `/experts?${params.toString()}`;
}

export function getDisplayPillsForExpert(input: {
  services: string[];
  expertType?: ExpertType | string | null;
  verified?: boolean;
  distanceMiles?: number;
}) {
  const serviceSet = new Set(input.services);

  const matchedSubject = marketingSubjects.find((subject) => subjectMatchesServiceSet(subject, serviceSet));
  const matchedSubcategory = matchedSubject?.subcategories.find((subcategory) =>
    subcategoryMatchesServiceSet(subcategory, serviceSet),
  );

  const pills = [
    matchedSubject?.label,
    matchedSubcategory?.label,
    input.expertType ? formatExpertTypeLabel(input.expertType) : null,
    input.verified ? 'Verified' : typeof input.distanceMiles === 'number' ? `${input.distanceMiles} mi away` : null,
  ].filter(Boolean) as string[];

  return uniqueStrings(pills).slice(0, 4);
}

export function getGroupedServicesForExpert(services: string[]) {
  const serviceSet = new Set(services);

  return marketingSubjects
    .map((subject) => {
      const subcategories = subject.subcategories
        .map((subcategory) => {
          if (!subcategoryMatchesServiceSet(subcategory, serviceSet)) return null;

          const deliverables = subcategory.deliverables
            .filter((deliverable) => deliverable.serviceTokens.some((token) => serviceSet.has(token)))
            .map((deliverable) => ({
              id: deliverable.id,
              label: deliverable.label,
              buyerLabel: deliverable.buyerLabel,
            }));

          return {
            id: subcategory.id,
            label: subcategory.label,
            buyerLabel: subcategory.buyerLabel,
            deliverables,
          };
        })
        .filter((value): value is GroupedExpertServiceSubcategory => Boolean(value));

      if (subcategories.length === 0) return null;

      return {
        id: subject.id,
        label: subject.label,
        buyerLabel: subject.buyerLabel,
        subcategories,
      };
    })
    .filter((value): value is GroupedExpertServiceSubject => Boolean(value));
}

export function getUnmatchedServiceTokensForExpert(services: string[]) {
  const matchedTokens = new Set<string>();

  for (const subject of marketingSubjects) {
    for (const token of subject.serviceTokens) matchedTokens.add(token);
    for (const subcategory of subject.subcategories) {
      for (const token of subcategory.serviceTokens) matchedTokens.add(token);
      for (const deliverable of subcategory.deliverables) {
        for (const token of deliverable.serviceTokens) matchedTokens.add(token);
      }
    }
  }

  return uniqueStrings(services).filter((token) => !matchedTokens.has(token));
}
