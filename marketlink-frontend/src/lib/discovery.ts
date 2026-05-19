import {
  buildExpertsHrefForSubject,
  getBuyerProblemById,
  getMarketingSubjectById,
  getServiceTokensForSubject,
  type BuyerProblemId,
  type MarketingSubjectId,
} from '@/lib/marketingTaxonomy';

export type DiscoveryServicePathId = string;
export type DiscoveryProblemId = string;

export type DiscoveryVisualTone = 'search' | 'calls' | 'website' | 'social' | 'launch' | 'guide';
export type DiscoveryAccent = 'green' | 'blue' | 'amber' | 'rose' | 'slate' | 'teal' | 'orange' | 'indigo';

export type DiscoveryServicePath = {
  id: DiscoveryServicePathId;
  plainLabel: string;
  technicalLabel: string;
  shortHelp: string;
  serviceTokens: readonly string[];
  href: string;
  iconKey: DiscoveryVisualTone;
  accent: DiscoveryAccent;
  priority: number;
};

export type DiscoveryProblemCard = {
  id: DiscoveryProblemId;
  problemTitle: string;
  customerLanguage: string;
  outcomePromise: string;
  suggestedPathIds: readonly DiscoveryServicePathId[];
  ctaLabel: string;
  visualTone: DiscoveryVisualTone;
  priority: number;
};

type DiscoveryServicePathConfig = {
  id: DiscoveryServicePathId;
  subjectId: MarketingSubjectId;
  plainLabel: string;
  technicalLabel: string;
  shortHelp: string;
  iconKey: DiscoveryVisualTone;
  accent: DiscoveryAccent;
  priority: number;
};

type DiscoveryProblemCardConfig = {
  id: DiscoveryProblemId;
  buyerProblemId: BuyerProblemId;
  problemTitle: string;
  fallbackCustomerLanguage: string;
  fallbackOutcomePromise: string;
  suggestedPathIds: readonly DiscoveryServicePathId[];
  ctaLabel: string;
  visualTone: DiscoveryVisualTone;
  priority: number;
};

const discoveryServicePathConfig = [
  {
    id: 'show-up-on-google',
    subjectId: 'local-search-seo',
    plainLabel: 'Show up on Google',
    technicalLabel: 'SEO / local search',
    shortHelp: 'Helps nearby customers find you when they search for what you sell.',
    iconKey: 'search',
    accent: 'green',
    priority: 1,
  },
  {
    id: 'run-local-ads',
    subjectId: 'paid-ads-lead-generation',
    plainLabel: 'Run local ads',
    technicalLabel: 'Google, Facebook, Instagram ads',
    shortHelp: 'Helps you reach people faster with paid campaigns and clear lead goals.',
    iconKey: 'calls',
    accent: 'blue',
    priority: 2,
  },
  {
    id: 'improve-website',
    subjectId: 'website-landing-pages',
    plainLabel: 'Improve my website',
    technicalLabel: 'Web design / landing pages',
    shortHelp: 'Helps turn visitors into calls, bookings, messages, or purchases.',
    iconKey: 'website',
    accent: 'amber',
    priority: 3,
  },
  {
    id: 'grow-on-social',
    subjectId: 'social-media-community',
    plainLabel: 'Grow on social media',
    technicalLabel: 'Social media marketing',
    shortHelp: 'Helps your business stay visible with posts, campaigns, and social content.',
    iconKey: 'social',
    accent: 'rose',
    priority: 4,
  },
  {
    id: 'work-with-creators',
    subjectId: 'creator-influencer-marketing',
    plainLabel: 'Work with local creators',
    technicalLabel: 'Influencer / creator marketing',
    shortHelp: 'Helps you borrow trust from people who already have a local audience.',
    iconKey: 'social',
    accent: 'teal',
    priority: 5,
  },
  {
    id: 'create-better-content',
    subjectId: 'content-copywriting-creative',
    plainLabel: 'Create better content',
    technicalLabel: 'Photo, video, and marketing content',
    shortHelp: 'Helps you explain your offer with stronger photos, videos, copy, and posts.',
    iconKey: 'launch',
    accent: 'orange',
    priority: 6,
  },
  {
    id: 'build-brand',
    subjectId: 'brand-design-print',
    plainLabel: 'Make my business look professional',
    technicalLabel: 'Branding / design / print',
    shortHelp: 'Helps your business feel more credible across logos, menus, flyers, and visuals.',
    iconKey: 'website',
    accent: 'indigo',
    priority: 7,
  },
  {
    id: 'bring-customers-back',
    subjectId: 'email-sms-retention',
    plainLabel: 'Bring customers back',
    technicalLabel: 'Email / SMS / follow-up marketing',
    shortHelp: 'Helps past customers hear about offers, reminders, updates, and repeat visits.',
    iconKey: 'calls',
    accent: 'slate',
    priority: 8,
  },
] as const satisfies readonly DiscoveryServicePathConfig[];

const discoveryProblemCardConfig = [
  {
    id: 'cant-find-business',
    buyerProblemId: 'cannot-find-business',
    problemTitle: "People can't find my business",
    fallbackCustomerLanguage: 'Nearby customers search online, but your business does not show up clearly.',
    fallbackOutcomePromise: 'Get discovered by people already looking for what you sell.',
    suggestedPathIds: ['show-up-on-google', 'improve-website', 'run-local-ads'],
    ctaLabel: 'Find experts who can help',
    visualTone: 'search',
    priority: 1,
  },
  {
    id: 'need-more-calls',
    buyerProblemId: 'need-more-customers',
    problemTitle: 'I need more calls or bookings',
    fallbackCustomerLanguage: 'You need more real inquiries, not just more likes or traffic.',
    fallbackOutcomePromise: 'Turn attention into calls, bookings, and messages.',
    suggestedPathIds: ['run-local-ads', 'improve-website', 'show-up-on-google'],
    ctaLabel: 'Find lead generation help',
    visualTone: 'calls',
    priority: 2,
  },
  {
    id: 'website-not-helping',
    buyerProblemId: 'website-not-converting',
    problemTitle: 'My website is not helping',
    fallbackCustomerLanguage: 'People visit your site but do not understand, trust, or contact you.',
    fallbackOutcomePromise: 'Make your website clearer and easier to act on.',
    suggestedPathIds: ['improve-website', 'show-up-on-google', 'create-better-content'],
    ctaLabel: 'Find website help',
    visualTone: 'website',
    priority: 3,
  },
  {
    id: 'social-not-working',
    buyerProblemId: 'social-not-working',
    problemTitle: 'My social media is not bringing customers',
    fallbackCustomerLanguage: 'You post, but it does not lead to enough awareness, visits, or sales.',
    fallbackOutcomePromise: 'Build content that supports trust, reach, and local demand.',
    suggestedPathIds: ['grow-on-social', 'create-better-content', 'work-with-creators'],
    ctaLabel: 'Find social media help',
    visualTone: 'social',
    priority: 4,
  },
  {
    id: 'launching-something-new',
    buyerProblemId: 'launching-something-new',
    problemTitle: "I'm launching something new",
    fallbackCustomerLanguage: 'You need people to notice a new business, offer, event, or location.',
    fallbackOutcomePromise: 'Create attention before and after launch day.',
    suggestedPathIds: ['run-local-ads', 'grow-on-social', 'build-brand'],
    ctaLabel: 'Find launch support',
    visualTone: 'launch',
    priority: 5,
  },
  {
    id: 'not-sure-what-i-need',
    buyerProblemId: 'not-sure',
    problemTitle: "I'm not sure what I need",
    fallbackCustomerLanguage: 'You know the business problem, but not the marketing service name.',
    fallbackOutcomePromise: 'Start with plain-language options and compare experts from there.',
    suggestedPathIds: ['show-up-on-google', 'run-local-ads', 'improve-website'],
    ctaLabel: 'Start with common paths',
    visualTone: 'guide',
    priority: 6,
  },
] as const satisfies readonly DiscoveryProblemCardConfig[];

export const discoveryServicePaths = discoveryServicePathConfig.map((config) => {
  const subject = getMarketingSubjectById(config.subjectId);
  const serviceTokens = getServiceTokensForSubject(config.subjectId);

  return {
    id: config.id,
    plainLabel: config.plainLabel,
    technicalLabel: config.technicalLabel,
    shortHelp: config.shortHelp,
    serviceTokens,
    href: subject ? buildExpertsHrefForSubject(subject.id) : '/experts',
    iconKey: config.iconKey,
    accent: config.accent,
    priority: config.priority,
  };
}) satisfies readonly DiscoveryServicePath[];

export const discoveryProblemCards = discoveryProblemCardConfig.map((config) => {
  const buyerProblem = getBuyerProblemById(config.buyerProblemId);

  return {
    id: config.id,
    problemTitle: config.problemTitle,
    customerLanguage: buyerProblem?.customerLanguage ?? config.fallbackCustomerLanguage,
    outcomePromise: buyerProblem?.outcomePromise ?? config.fallbackOutcomePromise,
    suggestedPathIds: config.suggestedPathIds,
    ctaLabel: config.ctaLabel,
    visualTone: config.visualTone,
    priority: config.priority,
  };
}) satisfies readonly DiscoveryProblemCard[];

export const homepageServicePaths = [...discoveryServicePaths]
  .filter((path) => path.priority <= 8)
  .sort((a, b) => a.priority - b.priority);

export const homepageProblemCards = [...discoveryProblemCards]
  .filter((problem) => problem.priority <= 6)
  .sort((a, b) => a.priority - b.priority);

export function getDiscoveryServicePathsForProblem(problem: DiscoveryProblemCard) {
  return problem.suggestedPathIds
    .map((pathId) => discoveryServicePaths.find((path) => path.id === pathId))
    .filter((path): path is DiscoveryServicePath => Boolean(path));
}

export function getDiscoveryProblemHref(problem: DiscoveryProblemCard) {
  const serviceTokens = getDiscoveryServicePathsForProblem(problem).flatMap((path) => path.serviceTokens);
  const params = new URLSearchParams();

  if (serviceTokens.length > 0) {
    params.set('service', Array.from(new Set(serviceTokens)).join(','));
    if (serviceTokens.length > 1) params.set('match', 'any');
  }

  params.set('problem', problem.id);

  return `/experts?${params.toString()}`;
}

export function getDiscoveryProblemById(problemId: string | undefined) {
  if (!problemId) return null;
  return discoveryProblemCards.find((problem) => problem.id === problemId) ?? null;
}

export function getDiscoveryServicePathHrefForProblem(path: DiscoveryServicePath, problem: DiscoveryProblemCard) {
  const [pathname, query = ''] = path.href.split('?');
  const params = new URLSearchParams(query);
  params.set('problem', problem.id);
  return `${pathname}?${params.toString()}`;
}
