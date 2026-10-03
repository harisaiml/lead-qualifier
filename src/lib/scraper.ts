import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedData {
  title: string;
  description: string;
  bodyText: string;
  emails: string[];
  phones: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  hasContactPage: boolean;
  hasBlog: boolean;
  techKeywords: string[];
  error?: string;
}

const TECH_KEYWORDS = [
  'saas', 'cloud', 'api', 'platform', 'software', 'enterprise', 'ai', 'machine learning',
  'automation', 'integration', 'analytics', 'dashboard', 'crm', 'erp', 'b2b', 'b2c',
  'startup', 'funded', 'series a', 'series b', 'venture', 'scale', 'growth',
];

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const result: ScrapedData = {
    title: '',
    description: '',
    bodyText: '',
    emails: [],
    phones: [],
    socialLinks: {},
    hasContactPage: false,
    hasBlog: false,
    techKeywords: [],
  };

  try {
    const response = await axios.get(normalizedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    // Remove non-content elements
    $('script, style, nav, footer, header, iframe, noscript').remove();

    // Extract title
    result.title =
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      '';

    // Extract meta description
    result.description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('p').first().text().trim().slice(0, 300) ||
      '';

    // Extract body text (limit to 5000 chars for AI processing)
    result.bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const allText = response.data as string;
    const foundEmails = allText.match(emailRegex) || [];
    result.emails = [...new Set(foundEmails)].filter(
      (e) => !e.includes('example.com') && !e.includes('sentry') && !e.includes('wix')
    ).slice(0, 5);

    // Extract phone numbers
    const phoneRegex = /(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g;
    const phones = allText.match(phoneRegex) || [];
    result.phones = [...new Set(phones)].slice(0, 3);

    // Extract social links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('linkedin.com')) result.socialLinks.linkedin = href;
      if (href.includes('twitter.com') || href.includes('x.com')) result.socialLinks.twitter = href;
      if (href.includes('facebook.com')) result.socialLinks.facebook = href;
    });

    // Check for contact/about/blog pages
    const links = $('a').map((_, el) => $(el).attr('href') || '').get().join(' ').toLowerCase();
    result.hasContactPage = /contact|reach\s?us|get\s?in\s?touch/.test(links);
    result.hasBlog = /blog|articles|news|insights|resources/.test(links);

    // Extract tech keywords from body
    const bodyLower = result.bodyText.toLowerCase();
    result.techKeywords = TECH_KEYWORDS.filter((kw) => bodyLower.includes(kw));

    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.error = `Failed to scrape: ${msg}`;
    return result;
  }
}
