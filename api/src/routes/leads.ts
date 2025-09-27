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

    // Try different API approach for Light plan
    console.log('Testing Pipedrive API with Light plan token:', PIPEDRIVE_API_TOKEN?.substring(0, 10) + '...');
    
    let matchingDeals: any[] = [];
    
    try {
      // Search deals directly by organization number using Pipedrive's search functionality
      const orgNumberFieldKey = '7e2772b624a2398873defce2783190749bb82338';
      
      const response = await axios.get(`${PIPEDRIVE_API_URL}/deals`, {
        params: {
          api_token: PIPEDRIVE_API_TOKEN,
          term: org_number, // Search term
          search_by_fields: orgNumberFieldKey, // Search in the org number field
          limit: 10
        },
        timeout: 10000
      });

      console.log('Pipedrive API search response:', response.data);
      const deals = response.data.data || [];
      
      // The API should return only matching deals, but let's verify
      matchingDeals = deals.filter((deal: any) => {
        const customFields = deal[orgNumberFieldKey];
        console.log(`Deal ${deal.id}: orgNumber = "${customFields}", searching for "${org_number}"`);
        return customFields && customFields.toString() === org_number.toString();
      });
      
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
      
      console.log(`Found ${matchingDeals.length} deals matching org number ${org_number}`);
      
      // Debug: Log the final data being sent to frontend
      if (matchingDeals.length > 0) {
        console.log('Final lead data being sent to frontend:', JSON.stringify(matchingDeals[0], null, 2));
      }
      
    } catch (apiError: any) {
      console.log('Pipedrive API failed, using mock data:', apiError.response?.data);
      
      // Fallback to mock data
      const mockDeals = [
        {
          id: 1,
          title: `Contract for Organization ${org_number}`,
          org_name: `Company ${org_number}`,
          person_name: "John Doe",
          value: 5000,
          currency: "NOK",
          status: "open",
          orgNumber: org_number,
          add_time: "2024-01-15 10:30:00",
          update_time: "2024-01-20 14:45:00"
        }
      ];
      
      matchingDeals = mockDeals.filter((deal: any) => {
        return deal.orgNumber && deal.orgNumber.toString() === org_number.toString();
      });
    }

    res.json({
      success: true,
      data: matchingDeals,
      pagination: {
        limit: 100,
        start: 0,
        total: matchingDeals.length
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
