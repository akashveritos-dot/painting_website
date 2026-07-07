export interface HomeContent {
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleAccent: string;
  heroTitleLine3: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroImage: string;
  heroImageAlt: string;
  heroImageLabel: string;
  heroImageTitle: string;
  heroImageDescription: string;
  exhibitionTitle: string;
  exhibitionDescription: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  stat4Value: string;
  stat4Label: string;
  trustTitle: string;
  trustDescription: string;
}

export const HOME_CONTENT_KEY = 'home_content';

export const DEFAULT_HOME_CONTENT: HomeContent = {
  heroEyebrow: 'Preserving Mithila Heritage',
  heroTitleLine1: 'Hand-Painted',
  heroTitleAccent: 'Intricate Stories',
  heroTitleLine3: 'On Handmade Paper',
  heroDescription:
    'Explore our world-class digital exhibition of authentic Madhubani paintings. Handcrafted with natural organic pigments, double outlines, and detailed line hatching by master artisans.',
  heroPrimaryCta: 'View Exhibition',
  heroSecondaryCta: 'Browse All Art',
  heroImage: '/assets/images/celestial_peacock.png',
  heroImageAlt: 'Featured Madhubani Peacock Art',
  heroImageLabel: 'Curator Choice',
  heroImageTitle: 'The Celestial Peacock',
  heroImageDescription: 'By Master Artisan, Bharni Style',
  exhibitionTitle: 'The Exhibition',
  exhibitionDescription:
    'Individually signed paintings directly from Mithila workshops. Includes certified frames and seals.',
  stat1Value: '20+',
  stat1Label: 'Master Artisans',
  stat2Value: '100%',
  stat2Label: 'Organic Pigments',
  stat3Value: '15+',
  stat3Label: 'Villages Supported',
  stat4Value: '1,200+',
  stat4Label: 'Paintings Shipped',
  trustTitle: 'Patron Protection Guarantee',
  trustDescription:
    'Every creation is verified by local guilds. Ships with certificate seals signed by the painting artist, guaranteeing organic dye authenticity and local fair-trade wages.',
};

export function normalizeHomeContent(value: Partial<HomeContent> | null | undefined): HomeContent {
  return {
    ...DEFAULT_HOME_CONTENT,
    ...(value || {}),
  };
}
