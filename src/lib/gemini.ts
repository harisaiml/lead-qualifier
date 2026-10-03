import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_gemini')) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export interface LeadData {
  companyName?: string;
  websiteUrl?: string;
  scrapedContent?: string;
  leadInfo?: string;
  industry?: string;
  contactInfo?: string;
}

export interface ScoringResult {
  overallScore: number;
  breakdown: {
    businessQuality: number;
    buyingIntent: number;
    websiteQuality: number;
    contactCompleteness: number;
    conversionPotential: number;
  };
  summary: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  suggestions: string[];
  outreachTemplate: string;
  companyProfile: {
    industry: string;
    companySize: string;
    stage: string;
    targetMarket: string;
  };
  riskFlags: string[];
  aiModel?: string;
}

export async function scoreLead(leadData: LeadData): Promise<ScoringResult> {
  const genAI = getGenAI();

  if (!genAI) {
    // Graceful fallback heuristic scoring if Gemini API key not configured yet
    console.info('GEMINI_API_KEY not configured, using heuristic scoring model');
    return generateHeuristicScore(leadData);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = buildScoringPrompt(leadData);

  let responseText: string;
  try {
    const result: GenerateContentResult = await model.generateContent(prompt);
    responseText = result.response.text();
  } catch (error) {
    console.warn('Gemini API call failed, falling back to heuristic scoring:', error);
    const fallback = generateHeuristicScore(leadData);
    fallback.summary += ' (Analyzed via fallback heuristic model)';
    return fallback;
  }

  // Extract JSON from the response
  const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
    responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Could not parse AI response as JSON');
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];

  let parsed: ScoringResult;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Failed to parse AI scoring response');
  }

  // Validate and clamp scores
  parsed.overallScore = Math.max(0, Math.min(100, Math.round(parsed.overallScore)));
  parsed.breakdown.businessQuality = Math.max(0, Math.min(100, Math.round(parsed.breakdown.businessQuality)));
  parsed.breakdown.buyingIntent = Math.max(0, Math.min(100, Math.round(parsed.breakdown.buyingIntent)));
  parsed.breakdown.websiteQuality = Math.max(0, Math.min(100, Math.round(parsed.breakdown.websiteQuality)));
  parsed.breakdown.contactCompleteness = Math.max(0, Math.min(100, Math.round(parsed.breakdown.contactCompleteness)));
  parsed.breakdown.conversionPotential = Math.max(0, Math.min(100, Math.round(parsed.breakdown.conversionPotential)));

  // Derive status from overall score
  if (parsed.overallScore >= 80) parsed.status = 'excellent';
  else if (parsed.overallScore >= 60) parsed.status = 'good';
  else if (parsed.overallScore >= 40) parsed.status = 'fair';
  else parsed.status = 'poor';

  return parsed;
}

function buildScoringPrompt(data: LeadData): string {
  const parts: string[] = [];

  if (data.companyName) parts.push(`Company Name: ${data.companyName}`);
  if (data.websiteUrl) parts.push(`Website URL: ${data.websiteUrl}`);
  if (data.industry) parts.push(`Industry: ${data.industry}`);
  if (data.contactInfo) parts.push(`Contact Info: ${data.contactInfo}`);
  if (data.leadInfo) parts.push(`Additional Lead Info:\n${data.leadInfo}`);
  if (data.scrapedContent) {
    // Truncate scraped content to avoid token limits
    const truncated = data.scrapedContent.slice(0, 4000);
    parts.push(`Website Content (scraped):\n${truncated}`);
  }

  const leadContext = parts.join('\n\n');

  return `You are an expert B2B sales analyst and lead qualification specialist. Analyze the following business lead and provide a comprehensive quality score.

LEAD INFORMATION:
${leadContext}

SCORING CRITERIA:
1. Business Quality (0-100): Company legitimacy, reputation, years in business, team quality, funding/revenue signals, LinkedIn presence, reviews
2. Buying Intent (0-100): Signs of growth, job postings, tech stack signals, industry news, expansion signals, content they're publishing
3. Website Quality (0-100): Professional design, clear value proposition, trust signals, speed indicators, blog/content, contact info visibility
4. Contact Completeness (0-100): Have email, phone, LinkedIn, decision-maker identified, correct contact for outreach
5. Conversion Potential (0-100): Budget indicators, company size fit, industry match, timing signals, past buying behavior

INSTRUCTIONS:
- Be rigorous and realistic with scoring — most leads should score between 40-75
- Only give 80+ to truly exceptional leads with clear buying signals
- Give 20-40 for leads with serious red flags or very little information
- Provide 3-5 specific, actionable improvement suggestions
- Write a personalized outreach email template based on this lead
- Identify any risk flags (e.g., "website down", "no LinkedIn presence", "very new company")

Respond ONLY with valid JSON in this exact format:
\`\`\`json
{
  "overallScore": <number 0-100>,
  "breakdown": {
    "businessQuality": <number 0-100>,
    "buyingIntent": <number 0-100>,
    "websiteQuality": <number 0-100>,
    "contactCompleteness": <number 0-100>,
    "conversionPotential": <number 0-100>
  },
  "summary": "<2-3 sentence executive summary of this lead's quality>",
  "status": "<excellent|good|fair|poor>",
  "suggestions": [
    "<specific actionable suggestion 1>",
    "<specific actionable suggestion 2>",
    "<specific actionable suggestion 3>",
    "<specific actionable suggestion 4>"
  ],
  "outreachTemplate": "<personalized email template with [NAME] and [YOUR_NAME] placeholders>",
  "companyProfile": {
    "industry": "<detected industry>",
    "companySize": "<startup|small|mid-market|enterprise>",
    "stage": "<early|growth|scale|mature>",
    "targetMarket": "<B2B|B2C|both>"
  },
  "riskFlags": [
    "<risk flag 1 if any>",
    "<risk flag 2 if any>"
  ]
}
\`\`\``;
}

function generateHeuristicScore(data: LeadData): ScoringResult {
  const content = [
    data.companyName || '',
    data.websiteUrl || '',
    data.leadInfo || '',
    data.contactInfo || '',
    data.scrapedContent || '',
    data.industry || '',
  ].join(' ').toLowerCase();

  // 1. Business Quality factors
  let businessQuality = 45;
  if (data.companyName && data.companyName.trim().length > 2) businessQuality += 10;
  if (data.websiteUrl) businessQuality += 10;
  if (/series [a-e]|funded|venture|backed|enterprise|corporation|inc\b|ltd\b/.test(content)) businessQuality += 15;
  if (/customers|clients|partners|reviews|testimonials|case studies/.test(content)) businessQuality += 10;
  if (/terms of service|privacy policy|security|soc2|gdpr/.test(content)) businessQuality += 5;
  businessQuality = Math.min(95, Math.max(30, businessQuality));

  // 2. Buying Intent factors
  let buyingIntent = 40;
  if (/hiring|careers|open positions|we're hiring|expanding|jobs/.test(content)) buyingIntent += 20;
  if (/new product|launching|announcing|recent|updated|growth|scale/.test(content)) buyingIntent += 15;
  if (/pricing|schedule a demo|request demo|book a call|free trial|get started/.test(content)) buyingIntent += 15;
  buyingIntent = Math.min(95, Math.max(25, buyingIntent));

  // 3. Website Quality factors
  let websiteQuality = 35;
  if (data.websiteUrl) {
    websiteQuality += 20;
    if (data.websiteUrl.startsWith('https://')) websiteQuality += 5;
    if (/has blog|blog\/content|articles/.test(content)) websiteQuality += 15;
    if (/has contact page/.test(content)) websiteQuality += 15;
    if (/tech keywords|dashboard|platform|api/.test(content)) websiteQuality += 10;
  }
  websiteQuality = Math.min(95, Math.max(20, websiteQuality));

  // 4. Contact Completeness factors
  let contactCompleteness = 30;
  if (/@/.test(data.contactInfo || '') || /emails found/.test(content)) contactCompleteness += 25;
  if (/\d{3}[-\s.]?\d{3}[-\s.]?\d{4}/.test(data.contactInfo || '') || /phones found/.test(content)) contactCompleteness += 20;
  if (/linkedin\.com/.test(content) || /founder|ceo|vp|director|manager|lead/.test(content)) contactCompleteness += 20;
  contactCompleteness = Math.min(95, Math.max(20, contactCompleteness));

  // 5. Conversion Potential factors
  let conversionPotential = Math.round(
    businessQuality * 0.35 + buyingIntent * 0.35 + websiteQuality * 0.15 + contactCompleteness * 0.15
  );
  conversionPotential = Math.min(95, Math.max(25, conversionPotential));

  const overallScore = Math.round(
    businessQuality * 0.25 +
    buyingIntent * 0.25 +
    websiteQuality * 0.20 +
    contactCompleteness * 0.15 +
    conversionPotential * 0.15
  );

  let status: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  if (overallScore >= 80) status = 'excellent';
  else if (overallScore >= 60) status = 'good';
  else if (overallScore >= 40) status = 'fair';

  const company = data.companyName || (data.websiteUrl ? 'this company' : 'this prospect');
  const targetIndustry = data.industry || 'B2B Tech / SaaS';

  const suggestions: string[] = [];
  if (contactCompleteness < 65) {
    suggestions.push('Enrich verified decision-maker emails (CEO/VP Sales) using LinkedIn or Apollo before outreach.');
  }
  if (buyingIntent < 60) {
    suggestions.push('Look for active trigger events such as recent executive hires, funding rounds, or tool migrations.');
  } else {
    suggestions.push('Reference their current expansion signals or open job openings in your cold outreach.');
  }
  if (websiteQuality < 60) {
    suggestions.push('Audit their digital presence or current tech stack to frame your pitch around a specific operational bottleneck.');
  } else {
    suggestions.push('Highlight ROI and quick implementation since their tech infrastructure appears mature.');
  }
  suggestions.push('Use a multi-channel sequence (Email + LinkedIn connection + soft touch) within a 14-day cadence.');

  const riskFlags: string[] = [];
  if (!/@/.test(data.contactInfo || '') && !/emails found/.test(content)) {
    riskFlags.push('Missing verified direct email address');
  }
  if (!data.websiteUrl) {
    riskFlags.push('No website URL provided for digital verification');
  }
  if (buyingIntent < 40) {
    riskFlags.push('Low current buying signals detected in publicly available data');
  }

  const outreachTemplate = `Subject: Quick question regarding ${company}'s growth

Hi [NAME],

I noticed ${company}'s work in ${targetIndustry} and was really impressed by your current trajectory.

Given your focus on scale, many teams at your stage run into bottlenecks when trying to accelerate qualified pipeline without inflating customer acquisition costs.

We recently helped a similar team in ${targetIndustry} increase their conversion rates by 34% within the first 60 days.

Do you have 10 minutes next Tuesday for a brief chat to see if this could be relevant for ${company}?

Best regards,
[YOUR_NAME]
[YOUR_TITLE]`;

  return {
    overallScore,
    breakdown: {
      businessQuality,
      buyingIntent,
      websiteQuality,
      contactCompleteness,
      conversionPotential,
    },
    summary: `${company} demonstrates ${status === 'excellent' ? 'strong' : status === 'good' ? 'solid' : 'moderate'} commercial indicators with a composite qualification score of ${overallScore}/100. Key strengths include ${businessQuality >= 65 ? 'verified corporate credibility' : 'market alignment'}, while outreach timing should leverage active signals.`,
    status,
    suggestions,
    outreachTemplate,
    companyProfile: {
      industry: data.industry || 'SaaS / B2B Services',
      companySize: overallScore >= 75 ? 'mid-market' : overallScore >= 55 ? 'small' : 'startup',
      stage: overallScore >= 75 ? 'growth' : 'early',
      targetMarket: 'B2B',
    },
    riskFlags,
    aiModel: 'Smart Heuristic Engine (Gemini Compatible)',
  };
}

