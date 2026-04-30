export type DiscoveryServicePathId =
  | 'show-up-on-google'
  | 'run-local-ads'
  | 'improve-website'
  | 'grow-on-social'
  | 'work-with-creators'
  | 'create-better-content'
  | 'build-brand'
  | 'bring-customers-back';

export type DiscoveryProblemId =
  | 'cant-find-business'
  | 'need-more-calls'
  | 'website-not-helping'
  | 'social-not-working'
  | 'launching-something-new'
  | 'not-sure-what-i-need';

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

function buildExpertsHref(serviceTokens: readonly string[], match: 'any' | 'all' = 'any') {
  const params = new URLSearchParams();
  params.set('service', serviceTokens.join(','));
  if (serviceTokens.length > 1 || match === 'all') params.set('match', match);
  return `/experts?${params.toString()}`;
}

export const discoveryServicePaths = [
  {
    id: 'show-up-on-google',
    plainLabel: 'Show up on Google',
    technicalLabel: 'SEO / local search',
    shortHelp: 'Helps nearby customers find you when they search for what you sell.',
    serviceTokens: ['seo'],
    href: buildExpertsHref(['seo']),
    iconKey: 'search',
    accent: 'green',
    priority: 1,
  },
  {
    id: 'run-local-ads',
    plainLabel: 'Run local ads',
    technicalLabel: 'Google, Facebook, Instagram ads',
    shortHelp: 'Helps you reach people faster with paid campaigns and clear lead goals.',
    serviceTokens: ['ads'],
    href: buildExpertsHref(['ads']),
    iconKey: 'calls',
    accent: 'blue',
    priority: 2,
  },
  {
    id: 'improve-website',
    plainLabel: 'Improve my website',
    technicalLabel: 'Web design / landing pages',
    shortHelp: 'Helps turn visitors into calls, bookings, messages, or purchases.',
    serviceTokens: ['web'],
    href: buildExpertsHref(['web']),
    iconKey: 'website',
    accent: 'amber',
    priority: 3,
  },
  {
    id: 'grow-on-social',
    plainLabel: 'Grow on social media',
    technicalLabel: 'Social media marketing',
    shortHelp: 'Helps your business stay visible with posts, campaigns, and social content.',
    serviceTokens: ['social'],
    href: buildExpertsHref(['social']),
    iconKey: 'social',
    accent: 'rose',
    priority: 4,
  },
  {
    id: 'work-with-creators',
    plainLabel: 'Work with local creators',
    technicalLabel: 'Influencer / creator marketing',
    shortHelp: 'Helps you borrow trust from people who already have a local audience.',
    serviceTokens: ['social', 'video'],
    href: buildExpertsHref(['social', 'video']),
    iconKey: 'social',
    accent: 'teal',
    priority: 5,
  },
  {
    id: 'create-better-content',
    plainLabel: 'Create better content',
    technicalLabel: 'Photo, video, and marketing content',
    shortHelp: 'Helps you explain your offer with stronger photos, videos, copy, and posts.',
    serviceTokens: ['content', 'video'],
    href: buildExpertsHref(['content', 'video']),
    iconKey: 'launch',
    accent: 'orange',
    priority: 6,
  },
  {
    id: 'build-brand',
    plainLabel: 'Make my business look professional',
    technicalLabel: 'Branding / design / print',
    shortHelp: 'Helps your business feel more credible across logos, menus, flyers, and visuals.',
    serviceTokens: ['branding', 'print'],
    href: buildExpertsHref(['branding', 'print']),
    iconKey: 'website',
    accent: 'indigo',
    priority: 7,
  },
  {
    id: 'bring-customers-back',
    plainLabel: 'Bring customers back',
    technicalLabel: 'Email / SMS / follow-up marketing',
    shortHelp: 'Helps past customers hear about offers, reminders, updates, and repeat visits.',
    serviceTokens: ['email'],
    href: buildExpertsHref(['email']),
    iconKey: 'calls',
    accent: 'slate',
    priority: 8,
  },
] as const satisfies readonly DiscoveryServicePath[];

export const discoveryProblemCards = [
  {
    id: 'cant-find-business',
    problemTitle: "People can't find my business",
    customerLanguage: 'Nearby customers search online, but your business does not show up clearly.',
    outcomePromise: 'Get discovered by people already looking for what you sell.',
    suggestedPathIds: ['show-up-on-google', 'improve-website', 'run-local-ads'],
    ctaLabel: 'Find experts who can help',
    visualTone: 'search',
    priority: 1,
  },
  {
    id: 'need-more-calls',
    problemTitle: 'I need more calls or bookings',
    customerLanguage: 'You need more real inquiries, not just more likes or traffic.',
    outcomePromise: 'Turn attention into calls, bookings, and messages.',
    suggestedPathIds: ['run-local-ads', 'improve-website', 'show-up-on-google'],
    ctaLabel: 'Find lead generation help',
    visualTone: 'calls',
    priority: 2,
  },
  {
    id: 'website-not-helping',
    problemTitle: 'My website is not helping',
    customerLanguage: 'People visit your site but do not understand, trust, or contact you.',
    outcomePromise: 'Make your website clearer and easier to act on.',
    suggestedPathIds: ['improve-website', 'show-up-on-google', 'create-better-content'],
    ctaLabel: 'Find website help',
    visualTone: 'website',
    priority: 3,
  },
  {
    id: 'social-not-working',
    problemTitle: 'My social media is not bringing customers',
    customerLanguage: 'You post, but it does not lead to enough awareness, visits, or sales.',
    outcomePromise: 'Build content that supports trust, reach, and local demand.',
    suggestedPathIds: ['grow-on-social', 'create-better-content', 'work-with-creators'],
    ctaLabel: 'Find social media help',
    visualTone: 'social',
    priority: 4,
  },
  {
    id: 'launching-something-new',
    problemTitle: "I'm launching something new",
    customerLanguage: 'You need people to notice a new business, offer, event, or location.',
    outcomePromise: 'Create attention before and after launch day.',
    suggestedPathIds: ['run-local-ads', 'grow-on-social', 'build-brand'],
    ctaLabel: 'Find launch support',
    visualTone: 'launch',
    priority: 5,
  },
  {
    id: 'not-sure-what-i-need',
    problemTitle: "I'm not sure what I need",
    customerLanguage: 'You know the business problem, but not the marketing service name.',
    outcomePromise: 'Start with plain-language options and compare experts from there.',
    suggestedPathIds: ['show-up-on-google', 'run-local-ads', 'improve-website'],
    ctaLabel: 'Start with common paths',
    visualTone: 'guide',
    priority: 6,
  },
] as const satisfies readonly DiscoveryProblemCard[];

export const homepageServicePaths = discoveryServicePaths
  .filter((path) => path.priority <= 8)
  .sort((a, b) => a.priority - b.priority);

export const homepageProblemCards = discoveryProblemCards
  .filter((problem) => problem.priority <= 6)
  .sort((a, b) => a.priority - b.priority);

export function getDiscoveryServicePathsForProblem(problem: DiscoveryProblemCard) {
  return problem.suggestedPathIds
    .map((pathId) => discoveryServicePaths.find((path) => path.id === pathId))
    .filter((path): path is DiscoveryServicePath => Boolean(path));
}

export function getDiscoveryProblemHref(problem: DiscoveryProblemCard) {
  const serviceTokens = getDiscoveryServicePathsForProblem(problem).flatMap((path) => path.serviceTokens);
  const href = buildExpertsHref(Array.from(new Set(serviceTokens)));
  const [pathname, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('problem', problem.id);
  return `${pathname}?${params.toString()}`;
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
