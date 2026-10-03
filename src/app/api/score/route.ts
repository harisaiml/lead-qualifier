import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/scraper';
import { scoreLead, LeadData } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';
import { LeadScore } from '@/lib/supabase';

// Use service role for server-side writes
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your_supabase') || url.includes('placeholder')) {
    return null;
  }
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      websiteUrl,
      leadInfo,
      industry,
      contactInfo,
    } = body;

    // Require at least some info
    if (!companyName && !websiteUrl && !leadInfo) {
      return NextResponse.json(
        { error: 'Please provide at least a company name, website URL, or lead info.' },
        { status: 400 }
      );
    }

    // Build lead data object
    const leadData: LeadData = {
      companyName,
      websiteUrl,
      leadInfo,
      industry,
      contactInfo,
    };

    // Scrape website if URL provided
    if (websiteUrl) {
      try {
        const scraped = await scrapeWebsite(websiteUrl);
        if (!scraped.error) {
          leadData.scrapedContent = [
            scraped.title ? `Title: ${scraped.title}` : '',
            scraped.description ? `Description: ${scraped.description}` : '',
            scraped.emails.length ? `Emails found: ${scraped.emails.join(', ')}` : '',
            scraped.phones.length ? `Phones found: ${scraped.phones.join(', ')}` : '',
            scraped.socialLinks.linkedin ? `LinkedIn: ${scraped.socialLinks.linkedin}` : '',
            scraped.hasBlog ? 'Has blog/content section' : '',
            scraped.hasContactPage ? 'Has contact page' : '',
            scraped.techKeywords.length ? `Tech keywords: ${scraped.techKeywords.join(', ')}` : '',
            scraped.bodyText ? `\nPage Content:\n${scraped.bodyText}` : '',
          ]
            .filter(Boolean)
            .join('\n');

          // Also populate contact info from scraping if not provided
          if (!contactInfo && (scraped.emails.length || scraped.phones.length)) {
            leadData.contactInfo = [
              ...scraped.emails.map((e) => `Email: ${e}`),
              ...scraped.phones.map((p) => `Phone: ${p}`),
            ].join('\n');
          }
        }
      } catch {
        // Scraping failed — continue without scraped data
        console.warn('Scraping failed, continuing without website data');
      }
    }

    // Score the lead with Gemini
    const scoringResult = await scoreLead(leadData);

    // Persist to Supabase
    const supabase = getSupabaseAdmin();
    const leadRecord: LeadScore = {
      company_name: companyName || scoringResult.companyProfile?.industry || 'Unknown',
      website_url: websiteUrl,
      lead_info: leadInfo,
      industry: industry || scoringResult.companyProfile?.industry,
      contact_info: contactInfo || leadData.contactInfo,
      overall_score: scoringResult.overallScore,
      business_quality: scoringResult.breakdown.businessQuality,
      buying_intent: scoringResult.breakdown.buyingIntent,
      website_quality: scoringResult.breakdown.websiteQuality,
      contact_completeness: scoringResult.breakdown.contactCompleteness,
      conversion_potential: scoringResult.breakdown.conversionPotential,
      summary: scoringResult.summary,
      suggestions: scoringResult.suggestions,
      outreach_template: scoringResult.outreachTemplate,
      status: scoringResult.status,
    };

    let savedId = 'lead_' + Date.now();

    if (supabase) {
      try {
        const { data: savedRecord, error: dbError } = await supabase
          .from('lead_scores')
          .insert(leadRecord)
          .select()
          .single();

        if (dbError) {
          console.warn('Database save warning (table may not exist yet):', dbError.message);
        } else if (savedRecord?.id) {
          savedId = savedRecord.id;
        }
      } catch (err) {
        console.warn('Supabase insert exception:', err);
      }
    }

    return NextResponse.json({
      success: true,
      id: savedId,
      score: scoringResult,
      companyProfile: scoringResult.companyProfile,
      riskFlags: scoringResult.riskFlags,
      persistedToDb: Boolean(supabase),
    });
  } catch (error) {
    console.error('Score API error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '0', 10);

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ leads: [], total: 0, persistedToDb: false });
    }

    const { data, error, count } = await supabase
      .from('lead_scores')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.warn('Supabase query error:', error.message);
      return NextResponse.json({ leads: [], total: 0, error: error.message });
    }

    return NextResponse.json({ leads: data || [], total: count || 0, persistedToDb: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ leads: [], total: 0, error: message }, { status: 200 });
  }
}
