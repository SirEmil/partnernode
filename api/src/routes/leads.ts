import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Pipedrive API configuration
const PIPEDRIVE_API_URL = 'https://api.pipedrive.com/v1';
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

if (!PIPEDRIVE_API_TOKEN) {
  console.warn('PIPEDRIVE_API_TOKEN is not set. Leads functionality will not work.');
}

interface PipedriveLead {
  id: number;
  title: string;
  owner_name: string;
  person_id: number;
  org_id: number;
  stage_id: number;
  status: string;
  add_time: string;
  update_time: string;
  stage_change_time: string;
  active: boolean;
  deleted: boolean;
  currency: string;
  value: number;
  probability: number;
  next_activity_date: string;
  next_activity_time: string;
  next_activity_id: number;
  last_activity_id: number;
  last_activity_date: string;
  lost_reason: string;
  visible_to: string;
  close_time: string;
  pipeline_id: number;
  won_time: string;
  first_won_time: string;
  lost_time: string;
  products_count: number;
  files_count: number;
  notes_count: number;
  followers_count: number;
  email_messages_count: number;
  activities_count: number;
  done_activities_count: number;
  undone_activities_count: number;
  participants_count: number;
  expected_close_date: string;
  last_incoming_mail_time: string;
  last_outgoing_mail_time: string;
  label: string;
  renewal_type: string;
  renewal_time: string;
  stage_order_nr: number;
  person_name: string;
  org_name: string;
  next_activity_subject: string;
  next_activity_type: string;
  next_activity_duration: string;
  next_activity_note: string;
  formatted_value: string;
  weighted_value: number;
  weighted_value_currency: string;
  rotten_time: string;
  cc_email: string;
  org_hidden: boolean;
  person_hidden: boolean;
}

// Fetch leads from Pipedrive by organization number
router.get('/fetch', authenticateToken, async (req, res) => {
  try {
    if (!PIPEDRIVE_API_TOKEN) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          limit: 50,
          start: 0,
          total: 0
        },
        message: 'Pipedrive API token not configured. No leads available.'
      });
    }

    const { org_number } = req.query;

    if (!org_number) {
      return res.status(400).json({
        error: 'Organization number is required',
        message: 'Please provide org_number query parameter'
      });
    }

    // Enhanced Pipedrive API search with multiple strategies
    console.log('🔍 Searching Pipedrive for org number:', org_number);
    console.log('🔑 Using API token:', PIPEDRIVE_API_TOKEN?.substring(0, 10) + '...');
    
    let matchingDeals: any[] = [];
    
    try {
      // Strategy 1: Search by custom field (org number field)
      const orgNumberFieldKey = '7e2772b624a2398873defce2783190749bb82338';
      
      console.log('📋 Strategy 1: Searching by custom field...');
      const response = await axios.get(`${PIPEDRIVE_API_URL}/deals`, {
        params: {
          api_token: PIPEDRIVE_API_TOKEN,
          term: org_number,
          search_by_fields: orgNumberFieldKey,
          limit: 50 // Increased limit to catch more results
        },
        timeout: 15000
      });

      console.log('📊 Pipedrive API search response:', {
        success: response.data.success,
        dataCount: response.data.data?.length || 0,
        additionalData: response.data.additional_data
      });
      
      const deals = response.data.data || [];
      
      // Filter deals that actually match the org number
      matchingDeals = deals.filter((deal: any) => {
        const customFields = deal[orgNumberFieldKey];
        const matches = customFields && customFields.toString() === org_number.toString();
        console.log(`📋 Deal ${deal.id}: orgNumber = "${customFields}", searching for "${org_number}", matches: ${matches}`);
        return matches;
      });
      
      console.log(`✅ Strategy 1 found ${matchingDeals.length} matching deals`);
      
      // Strategy 2: If no results, try searching all deals and filter manually
      if (matchingDeals.length === 0) {
        console.log('📋 Strategy 2: Searching all recent deals...');
        
        const allDealsResponse = await axios.get(`${PIPEDRIVE_API_URL}/deals`, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            limit: 100,
            sort: 'add_time DESC' // Get most recent deals first
          },
          timeout: 15000
        });
        
        const allDeals = allDealsResponse.data.data || [];
        console.log(`📊 Found ${allDeals.length} total deals, searching for org number "${org_number}"`);
        
        // Search through all deals for the org number
        const manualMatches = allDeals.filter((deal: any) => {
          // Check custom fields
          const customFields = deal[orgNumberFieldKey];
          if (customFields && customFields.toString() === org_number.toString()) {
            console.log(`✅ Manual match found in deal ${deal.id}: "${customFields}"`);
            return true;
          }
          
          // Also check if org number appears in title or org_name
          const titleMatch = deal.title && deal.title.includes(org_number);
          const orgMatch = deal.org_name && deal.org_name.includes(org_number);
          
          if (titleMatch || orgMatch) {
            console.log(`✅ Text match found in deal ${deal.id}: title="${deal.title}", org="${deal.org_name}"`);
            return true;
          }
          
          return false;
        });
        
        matchingDeals = manualMatches;
        console.log(`✅ Strategy 2 found ${matchingDeals.length} matching deals`);
      }
      
      // Strategy 3: If still no results, try searching with different field variations
      if (matchingDeals.length === 0) {
        console.log('📋 Strategy 3: Trying alternative field searches...');
        
        // Try searching without specifying the field (general search)
        const generalSearchResponse = await axios.get(`${PIPEDRIVE_API_URL}/deals`, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            term: org_number,
            limit: 50
          },
          timeout: 15000
        });
        
        const generalDeals = generalSearchResponse.data.data || [];
        console.log(`📊 General search found ${generalDeals.length} deals`);
        
        // Filter for actual matches
        const generalMatches = generalDeals.filter((deal: any) => {
          // Check all possible fields where org number might appear
          const fieldsToCheck = [
            deal[orgNumberFieldKey],
            deal.title,
            deal.org_name,
            deal.person_name
          ];
          
          const hasMatch = fieldsToCheck.some(field => 
            field && field.toString().includes(org_number)
          );
          
          if (hasMatch) {
            console.log(`✅ General search match found in deal ${deal.id}`);
          }
          
          return hasMatch;
        });
        
        matchingDeals = generalMatches;
        console.log(`✅ Strategy 3 found ${matchingDeals.length} matching deals`);
      }
      
      // Fetch person details for each deal to get phone numbers
      for (let i = 0; i < matchingDeals.length; i++) {
        const deal = matchingDeals[i];
        if (deal.person_id && deal.person_id.value) {
          try {
            const personResponse = await axios.get(`${PIPEDRIVE_API_URL}/persons/${deal.person_id.value}`, {
              params: {
                api_token: PIPEDRIVE_API_TOKEN
              },
              timeout: 5000
            });
            
            const person = personResponse.data.data;
            if (person && person.phone && person.phone.length > 0) {
              // Get the first phone number
              matchingDeals[i].phone = person.phone[0].value;
            }
          } catch (personError: any) {
            console.log(`Could not fetch person details for deal ${deal.id}:`, personError.message || personError);
          }
        }
      }
      
      console.log(`🎯 FINAL RESULT: Found ${matchingDeals.length} matching deals for org number: ${org_number}`);
      
      // Debug: Log the final data being sent to frontend
      if (matchingDeals.length > 0) {
        console.log('📤 Final lead data being sent to frontend:', JSON.stringify(matchingDeals[0], null, 2));
      } else {
        console.log('❌ No matching deals found. This could be due to:');
        console.log('   - Lead not yet imported to Pipedrive');
        console.log('   - API indexing delay (can take 5-15 minutes)');
        console.log('   - Incorrect organization number format');
        console.log('   - Lead imported with different field mapping');
      }
      
    } catch (apiError: any) {
      console.error('❌ Pipedrive API Error:', {
        message: apiError.message,
        status: apiError.response?.status,
        data: apiError.response?.data,
        orgNumber: org_number
      });
      
      // Don't use mock data, return empty results with helpful message
      matchingDeals = [];
      
      console.log('⚠️  Pipedrive API failed. Possible causes:');
      console.log('   - API token expired or invalid');
      console.log('   - Network connectivity issues');
      console.log('   - Pipedrive API rate limiting');
      console.log('   - Lead not yet available in API (indexing delay)');
    }

    res.json({
      success: true,
      data: matchingDeals,
      pagination: {
        limit: 100,
        start: 0,
        total: matchingDeals.length
      },
      debug: {
        orgNumber: org_number,
        searchStrategies: matchingDeals.length > 0 ? 'Found via API search' : 'No matches found',
        timestamp: new Date().toISOString(),
        message: matchingDeals.length === 0 
          ? 'No leads found. This could be due to API indexing delay (5-15 minutes) or lead not yet imported.'
          : `Found ${matchingDeals.length} matching lead(s)`
      }
    });

  } catch (error: any) {
    console.error('Leads fetch error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Pipedrive API error',
        message: error.response.data?.error || 'Failed to fetch leads'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch leads',
      message: error.message
    });
  }
});

// Get lead details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!PIPEDRIVE_API_TOKEN) {
      return res.status(500).json({ 
        error: 'Pipedrive API token not configured' 
      });
    }

    const { id } = req.params;

    const response = await axios.get(`${PIPEDRIVE_API_URL}/deals/${id}`, {
      params: {
        api_token: PIPEDRIVE_API_TOKEN
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data.data
    });

  } catch (error: any) {
    console.error('Pipedrive API error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Pipedrive API error',
        message: error.response.data?.error || 'Failed to fetch lead details'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch lead details',
      message: error.message
    });
  }
});

export default router;
