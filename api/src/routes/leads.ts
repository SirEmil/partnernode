import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Pipedrive API configuration
const PIPEDRIVE_API_URL = 'https://api.pipedrive.com/api/v2';
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

// Norwegian Business Register API configuration
const BRREG_API_URL = 'https://data.brreg.no/enhetsregisteret/api/enheter';

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

// Fetch company information from Norwegian Business Register
router.get('/company-info', authenticateToken, async (req, res) => {
  try {
    const { org_number } = req.query;

    if (!org_number) {
      return res.status(400).json({
        error: 'Organization number is required',
        message: 'Please provide org_number query parameter'
      });
    }

    console.log('🏢 Fetching company info from BRREG for org number:', org_number);

    try {
      const response = await axios.get(`${BRREG_API_URL}/${org_number}`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Contract-Sender-App/1.0'
        }
      });

      const companyData = response.data;
      
      console.log('✅ BRREG API response:', {
        orgNumber: companyData.organisasjonsnummer,
        companyName: companyData.navn,
        status: companyData.registreringsdatoEnhetsregisteret
      });

      res.json({
        success: true,
        data: {
          orgNumber: companyData.organisasjonsnummer,
          companyName: companyData.navn,
          businessAddress: companyData.forretningsadresse,
          postalAddress: companyData.postadresse,
          registrationDate: companyData.registreringsdatoEnhetsregisteret,
          organizationForm: companyData.organisasjonsform,
          industryCode: companyData.naeringskode1,
          industryDescription: companyData.naeringskode1Beskrivelse,
          employees: companyData.antallAnsatte,
          website: companyData.hjemmeside,
          email: companyData.epostadresse,
          phone: companyData.telefonnummer
        },
        source: 'BRREG',
        timestamp: new Date().toISOString()
      });

    } catch (brregError: any) {
      console.error('❌ BRREG API Error:', {
        message: brregError.message,
        status: brregError.response?.status,
        orgNumber: org_number
      });

      if (brregError.response?.status === 404) {
        return res.status(404).json({
          error: 'Company not found',
          message: `No company found with organization number: ${org_number}`,
          orgNumber: org_number
        });
      }

      return res.status(500).json({
        error: 'BRREG API error',
        message: 'Failed to fetch company information from Norwegian Business Register'
      });
    }

  } catch (error: any) {
    console.error('Company info fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch company information',
      message: error.message
    });
  }
});

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

    // Enhanced Pipedrive API v2 search with multiple strategies
    console.log('🔍 Searching Pipedrive v2 for org number:', org_number);
    console.log('🔑 Using API token:', PIPEDRIVE_API_TOKEN?.substring(0, 10) + '...');
    
    let matchingDeals: any[] = [];
    
    try {
      // Strategy 1: Search by organization ID (most reliable)
      console.log('📋 Strategy 1: Searching by organization...');
      
      // First, find the organization by org number
      const orgResponse = await axios.get(`${PIPEDRIVE_API_URL}/organizations`, {
        params: {
          api_token: PIPEDRIVE_API_TOKEN,
          term: org_number,
          limit: 10
        },
        timeout: 15000
      });
      
      const organizations = orgResponse.data.data?.items || [];
      console.log(`📊 Found ${organizations.length} organizations matching "${org_number}"`);
      
      if (organizations.length > 0) {
        // Get deals for the first matching organization
        const orgId = organizations[0].id;
        console.log(`📋 Searching deals for organization ID: ${orgId}`);
        
        const dealsResponse = await axios.get(`${PIPEDRIVE_API_URL}/deals`, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            org_id: orgId,
            limit: 50,
            include_fields: 'custom_fields'
          },
          timeout: 15000
        });
        
        matchingDeals = dealsResponse.data.data?.items || [];
        console.log(`✅ Strategy 1 found ${matchingDeals.length} deals for organization ${orgId}`);
      }
      
      // Strategy 2: If no org-based results, search deals directly
      if (matchingDeals.length === 0) {
        console.log('📋 Strategy 2: Searching deals directly...');
        
        const dealsResponse = await axios.get(`${PIPEDRIVE_API_URL}/deals`, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            term: org_number,
            limit: 50,
            include_fields: 'custom_fields'
          },
          timeout: 15000
        });
        
        const allDeals = dealsResponse.data.data?.items || [];
        console.log(`📊 Found ${allDeals.length} deals in direct search`);
        
        // Filter deals that actually match the org number
        matchingDeals = allDeals.filter((deal: any) => {
          // Check if org number appears in any relevant field
          const fieldsToCheck = [
            deal.title,
            deal.org_name,
            deal.person_name
          ];
          
          // Also check custom fields if they exist
          if (deal.custom_fields) {
            Object.values(deal.custom_fields).forEach((field: any) => {
              if (field && typeof field === 'string') {
                fieldsToCheck.push(field);
              }
            });
          }
          
          const hasMatch = fieldsToCheck.some(field => 
            field && field.toString().includes(org_number.toString())
          );
          
          if (hasMatch) {
            console.log(`✅ Deal ${deal.id} matches: "${deal.title}"`);
          }
          
          return hasMatch;
        });
        
        console.log(`✅ Strategy 2 found ${matchingDeals.length} matching deals`);
      }
      
      // Strategy 3: If still no results, try searching recent deals
      if (matchingDeals.length === 0) {
        console.log('📋 Strategy 3: Searching recent deals...');
        
        const recentDealsResponse = await axios.get(`${PIPEDRIVE_API_URL}/deals`, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            sort_by: 'add_time',
            sort_direction: 'desc',
            limit: 100,
            include_fields: 'custom_fields'
          },
          timeout: 15000
        });
        
        const recentDeals = recentDealsResponse.data.data?.items || [];
        console.log(`📊 Found ${recentDeals.length} recent deals`);
        
        // Search through recent deals
        const recentMatches = recentDeals.filter((deal: any) => {
          const fieldsToCheck = [
            deal.title,
            deal.org_name,
            deal.person_name
          ];
          
          if (deal.custom_fields) {
            Object.values(deal.custom_fields).forEach((field: any) => {
              if (field && typeof field === 'string') {
                fieldsToCheck.push(field);
              }
            });
          }
          
          return fieldsToCheck.some(field => 
            field && field.toString().includes(org_number.toString())
          );
        });
        
        matchingDeals = recentMatches;
        console.log(`✅ Strategy 3 found ${matchingDeals.length} matching deals`);
      }
      
      // Fetch person details for each deal to get phone numbers
      for (let i = 0; i < matchingDeals.length; i++) {
        const deal = matchingDeals[i];
        if (deal.person_id) {
          try {
            const personResponse = await axios.get(`${PIPEDRIVE_API_URL}/persons/${deal.person_id}`, {
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
        console.log('   - API indexing delay (can take 2-5 minutes with v2)');
        console.log('   - Incorrect organization number format');
        console.log('   - Lead imported with different field mapping');
      }
      
    } catch (apiError: any) {
      console.error('❌ Pipedrive API v2 Error:', {
        message: apiError.message,
        status: apiError.response?.status,
        data: apiError.response?.data,
        orgNumber: org_number
      });
      
      // Don't use mock data, return empty results with helpful message
      matchingDeals = [];
      
      console.log('⚠️  Pipedrive API v2 failed. Possible causes:');
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
          ? 'No leads found. This could be due to API indexing delay (2-5 minutes with v2) or lead not yet imported.'
          : `Found ${matchingDeals.length} matching lead(s) using Pipedrive API v2`
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

// Test route to verify PUT is working
router.put('/test', authenticateToken, async (req, res) => {
  res.json({ success: true, message: 'PUT route is working' });
});

// Update a lead
router.put('/:leadId', authenticateToken, async (req, res) => {
  try {
    if (!PIPEDRIVE_API_TOKEN) {
      return res.status(400).json({
        success: false,
        message: 'Pipedrive API token not configured'
      });
    }

    const { leadId } = req.params;
    const updateData = req.body;

    console.log('🔄 Updating lead:', leadId, 'with data:', updateData);

    // Prepare the update payload for Pipedrive
    const pipedriveUpdateData: any = {};

    // Map our form fields to Pipedrive fields
    if (updateData.title) pipedriveUpdateData.title = updateData.title;
    if (updateData.companyName) pipedriveUpdateData.org_name = updateData.companyName;
    if (updateData.value !== undefined) pipedriveUpdateData.value = updateData.value;
    if (updateData.status) pipedriveUpdateData.status = updateData.status;
    if (updateData.source) pipedriveUpdateData.source = updateData.source;
    if (updateData.active_in_pipeline) pipedriveUpdateData.pipeline_id = updateData.active_in_pipeline;

    // Update person details if provided
    if (updateData.personName || updateData.email || updateData.phone) {
      // First get the current deal to find the person_id
      const dealResponse = await axios.get(`${PIPEDRIVE_API_URL}/deals/${leadId}`, {
        params: { api_token: PIPEDRIVE_API_TOKEN },
        timeout: 10000
      });

      const deal = dealResponse.data.data;
      if (deal.person_id) {
        const personUpdateData: any = {};
        if (updateData.personName) personUpdateData.name = updateData.personName;
        if (updateData.email) personUpdateData.email = [{ value: updateData.email, primary: true }];
        if (updateData.phone) personUpdateData.phone = [{ value: updateData.phone, primary: true }];

        // Update the person
        await axios.put(`${PIPEDRIVE_API_URL}/persons/${deal.person_id}`, personUpdateData, {
          params: { api_token: PIPEDRIVE_API_TOKEN },
          timeout: 10000
        });
      }
    }

    // Update the deal
    const response = await axios.put(`${PIPEDRIVE_API_URL}/deals/${leadId}`, pipedriveUpdateData, {
      params: { api_token: PIPEDRIVE_API_TOKEN },
      timeout: 10000
    });

    console.log('✅ Lead updated successfully:', response.data);

    res.json({
      success: true,
      data: response.data.data,
      message: 'Lead updated successfully'
    });

  } catch (error: any) {
    console.error('Lead update error:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'Pipedrive API error',
        error: error.response.data?.error || 'Failed to update lead'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: error.message
    });
  }
});

export default router;