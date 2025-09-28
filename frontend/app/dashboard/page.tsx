'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Send, 
  LogOut, 
  Phone, 
  RefreshCw,
  User,
  Clock,
  CheckCircle,
  Package,
  Settings,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { productsAPI, termsAPI, Product, Terms } from '../../lib/api';

interface Lead {
  id: number;
  title: string;
  owner_name: string;
  person_name: string;
  org_name: string;
  status: string;
  add_time: string;
  phone?: string; // Phone number from person details
}

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [terms, setTerms] = useState<Terms[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<Terms | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [smsPhone, setSmsPhone] = useState('');
  const [manualTemplateData, setManualTemplateData] = useState({
    price: '',
    customer_name: '',
    product_name: '',
    company_name: '',
    orgnr: '',
    phone: '',
    email: '',
    date: ''
  });
  
  // SMS tracking state
  const [sentSmsRecords, setSentSmsRecords] = useState<Array<{
    id: string;
    firestoreId: string;
    contactNumber: string;
    message: string;
    sentAt: Date;
    contractConfirmed: boolean;
    contractConfirmedAt?: Date;
  }>>([]);

  // Debug: Log when manualTemplateData changes
  useEffect(() => {
    console.log('manualTemplateData updated:', manualTemplateData);
  }, [manualTemplateData]);

  // Helper function to handle Firebase timestamps
  const formatFirebaseTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    
    try {
      let date: Date;
      
      // Handle Firebase Timestamp objects
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle regular Date objects
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Handle ISO strings or other date formats
      else {
        date = new Date(timestamp);
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return '';
      }
      
      return date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return '';
    }
  };

  // Function to check for contract confirmations
  const checkContractConfirmations = async () => {
    if (sentSmsRecords.length === 0) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Get all SMS records for this user
      const response = await fetch(`${API_BASE_URL}/api/sms/records`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        const confirmedRecords = result.data || [];
        
        // Update local state with confirmed contracts
        setSentSmsRecords(prev => prev.map(sms => {
          const confirmedRecord = confirmedRecords.find((record: any) => 
            record.firestoreId === sms.firestoreId || 
            record.contactNumber === sms.contactNumber
          );
          
          if (confirmedRecord && confirmedRecord.contractConfirmed && !sms.contractConfirmed) {
            return {
              ...sms,
              contractConfirmed: true,
              contractConfirmedAt: confirmedRecord.contractConfirmedAt
            };
          }
          return sms;
        }));
      }
    } catch (error) {
      console.log('Error checking contract confirmations:', error);
    }
  };

  // Check for contract confirmations every 30 seconds (reduced frequency to avoid rate limiting)
  useEffect(() => {
    if (sentSmsRecords.length === 0) return;
    
    const interval = setInterval(checkContractConfirmations, 30000); // Increased from 10s to 30s
    return () => clearInterval(interval);
  }, [sentSmsRecords.length]);
  const router = useRouter();

  // SSE connection for real-time contract confirmations
  useEffect(() => {
    if (!user || !sentSmsRecords.length) return;

    const latestSmsId = sentSmsRecords[0]?.firestoreId; // Most recent SMS
    if (!latestSmsId) return;

    console.log(`🔌 Connecting to SSE for SMS: ${latestSmsId}`);

    // EventSource doesn't support custom headers, so we'll pass them as query params
    const sseUrl = `/api/sse?userId=${encodeURIComponent(user.uid)}&viewingSmsId=${encodeURIComponent(latestSmsId)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 SSE message received:', data);

        if (data.type === 'contract_confirmed' && data.smsId === latestSmsId) {
          console.log('✅ Contract confirmed via SSE!', data);
          
          // Update the SMS record immediately
          setSentSmsRecords(prev => prev.map(sms => 
            sms.firestoreId === data.smsId 
              ? { 
                  ...sms, 
                  contractConfirmed: true, 
                  contractConfirmedAt: new Date(data.confirmedAt) 
                }
              : sms
          ));

          // Show success toast
          toast.success(`Contract confirmed by ${data.contactNumber}!`, {
            duration: 5000,
            icon: '✅'
          });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log('🔌 SSE connection opened');
    };

    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
    };
  }, [user, sentSmsRecords.length, sentSmsRecords[0]?.firestoreId]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchTerms();
    } else if (!loading) {
      // Redirect to login if not authenticated
      router.push('/');
    }
  }, [user, loading, router]);

  const fetchLeads = async (orgNumber?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
      
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Build URL with org_number query parameter if provided
      const url = new URL(`${API_BASE_URL}/api/leads/fetch`);
      if (orgNumber) {
        url.searchParams.append('org_number', orgNumber);
      }
      
      console.log('Fetching leads from:', url.toString());
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('Leads API Error:', errorData);
        toast.error(errorData.message || errorData.error || 'Failed to fetch leads');
      }
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast.error(`Failed to fetch leads: ${error.message || 'Network error'}`);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Error fetching products');
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await termsAPI.getAll();
      setTerms(response.data);
      // Set the first terms as default if available
      if (response.data.length > 0 && !selectedTerms) {
        setSelectedTerms(response.data[0]);
      }
    } catch (error) {
      toast.error('Error fetching terms');
    }
  };

  // Clear manual template data when product changes
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    
    // Auto-populate price with product's standard price
    setManualTemplateData(prev => ({
      price: product.price.toString(), // Auto-populate with product's standard price
      customer_name: prev.customer_name, // Keep existing customer name if any
      product_name: prev.product_name, // Keep existing product name if any
      company_name: prev.company_name, // Keep existing company name if any
      orgnr: prev.orgnr, // Keep existing org number if any
      phone: prev.phone, // Keep existing phone if any
      email: prev.email, // Keep existing email if any
      date: prev.date // Keep existing date if any
    }));
    
    console.log('Selected product:', product);
    console.log('Auto-populated price:', product.price);
  };

  const sendSMS = async () => {
    if (!selectedProduct || !smsPhone.trim()) {
      toast.error('Please select a product and enter phone number');
      return;
    }

    setSendingSms(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Prepare template data (manual values override automatic values)
      const templateData = {
        price: manualTemplateData.price || selectedProduct.price,
        Price: manualTemplateData.price || selectedProduct.price,
        product_name: manualTemplateData.product_name || selectedProduct.name,
        customer_name: manualTemplateData.customer_name || selectedLead?.person_name || '[customer_name]',
        company_name: manualTemplateData.company_name || selectedLead?.org_name || '[company_name]',
        Company: manualTemplateData.company_name || selectedLead?.org_name || '[Company]',
        orgnr: manualTemplateData.orgnr || '[orgnr]',
        Orgnr: manualTemplateData.orgnr || '[Orgnr]',
        terms: selectedTerms?.url || '[terms]',
        Terms: selectedTerms?.url || '[Terms]',
        phone: manualTemplateData.phone || smsPhone,
        email: manualTemplateData.email || '[email]',
        date: manualTemplateData.date || new Date().toLocaleDateString()
      };

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      const response = await fetch(`${API_BASE_URL}/api/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          contact_number: smsPhone, // E.164 format
          body: selectedProduct.smsTemplate,
          templateData: templateData,
          restrict_once: 'No' // Allow sending to same number multiple times
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('SMS sent successfully!');
        
        // Store SMS record for tracking
        const smsRecord = {
          id: result.message_id || Date.now().toString(),
          firestoreId: result.firestoreId || '',
          contactNumber: smsPhone,
          message: selectedProduct.smsTemplate,
          sentAt: new Date(),
          contractConfirmed: false
        };
        
        setSentSmsRecords(prev => [smsRecord, ...prev]);
        
        setSmsPhone('');
        setSelectedLead(null);
        setSelectedProduct(null);
      } else {
        const error = await response.json();
        console.error('SMS API Error:', error);
        toast.error(error.message || error.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('SMS Send Error:', error);
      toast.error(`Error sending SMS: ${error.message || 'Network error'}`);
    } finally {
      setSendingSms(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it starts with 47, add + prefix
    if (digits.startsWith('47')) {
      return '+' + digits;
    }
    
    // If it starts with 4 (Norwegian mobile), add +47 prefix
    if (digits.startsWith('4') && digits.length >= 8) {
      return '+47' + digits;
    }
    
    // If it's 8 digits, assume it's Norwegian mobile and add +47
    if (digits.length === 8) {
      return '+47' + digits;
    }
    
    // If it's already in international format, return as is
    if (digits.startsWith('47') && digits.length >= 10) {
      return '+' + digits;
    }
    
    // Default: return original if we can't format it
    return phone;
  };

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    
    // Format phone number to +47xxxxxxxx format
    const formattedPhone = lead.phone ? formatPhoneNumber(lead.phone) : '';
    
    // Auto-populate fields from the selected lead
    setManualTemplateData(prev => ({
      ...prev,
      customer_name: lead.person_name || prev.customer_name,
      company_name: lead.org_name || lead.title || prev.company_name, // Use org_name or title as company name
      phone: formattedPhone || prev.phone, // Auto-populate formatted phone number
    }));
    
    // Set SMS phone number if available (formatted)
    if (formattedPhone) {
      setSmsPhone(formattedPhone);
    }
    
    // Debug logging
    console.log('Selected lead:', lead);
    console.log('Lead org_name:', lead.org_name);
    console.log('Lead title:', lead.title);
    console.log('Lead person_name:', lead.person_name);
    console.log('Lead phone (original):', lead.phone);
    console.log('Lead phone (formatted):', formattedPhone);
    console.log('Setting company_name to:', lead.org_name || lead.title);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Contract Sender</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.authLevel === 1 && (
                <>
                  <button
                    onClick={() => router.push('/admin')}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS Records</span>
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SMS Composer */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Send className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Send Contract</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Product
                  </label>
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-600">
                              {product.price} {product.currency}
                            </p>
                          </div>
                          {selectedProduct?.id === product.id && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No products found</p>
                        {user?.authLevel === 1 && (
                          <button
                            onClick={() => router.push('/settings')}
                            className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                          >
                            Create your first product
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <div className="space-y-2">
                    {terms.map((term) => (
                      <div
                        key={term.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTerms?.id === term.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTerms(term)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{term.name}</h3>
                          </div>
                          {selectedTerms?.id === term.id && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                    {terms.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No terms found</p>
                        {user?.authLevel === 1 && (
                          <button
                            onClick={() => router.push('/settings')}
                            className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                          >
                            Add terms in settings
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      placeholder="+14155551234"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>



              </div>
            </div>
          </div>

          {/* Leads List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
                  </div>
                  <button
                    onClick={() => {
                      if (manualTemplateData.orgnr.trim()) {
                        setDataLoading(true);
                        fetchLeads(manualTemplateData.orgnr.trim());
                      } else {
                        toast.error('Please enter an organization number first');
                      }
                    }}
                    disabled={dataLoading}
                    className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {dataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Searching for leads...</span>
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No leads found</p>
                    <p className="text-sm text-gray-400 mt-2">Enter an organization number and click Search to find leads</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedLead?.id === lead.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => selectLead(lead)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {lead.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{lead.person_name}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(lead.add_time)}</span>
                              </span>
                            </div>
                            {lead.org_name && (
                              <p className="text-sm text-gray-500 mt-1">
                                {lead.org_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lead.status === 'open' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.status}
                            </span>
                            {selectedLead?.id === lead.id && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SMS Preview Box - Inside Leads List */}
              {selectedProduct && (
                <div className="border-t">
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900">SMS Preview</h3>
                      <span className="text-xs text-gray-500 ml-auto">
                        {selectedProduct.smsTemplate
                          .replace(/\[price\]/g, manualTemplateData.price || selectedProduct.price.toString())
                          .replace(/\[Price\]/g, manualTemplateData.price || selectedProduct.price.toString())
                          .replace(/\[product_name\]/g, manualTemplateData.product_name || selectedProduct.name)
                          .replace(/\[customer_name\]/g, manualTemplateData.customer_name || selectedLead?.person_name || '[customer_name]')
                          .replace(/\[company_name\]/g, manualTemplateData.company_name || selectedLead?.org_name || '[company_name]')
                          .replace(/\[Company\]/g, manualTemplateData.company_name || selectedLead?.org_name || '[Company]')
                          .replace(/\[orgnr\]/g, manualTemplateData.orgnr || '[orgnr]')
                          .replace(/\[Orgnr\]/g, manualTemplateData.orgnr || '[Orgnr]')
                          .replace(/\[terms\]/g, selectedTerms?.url || '[terms]')
                          .replace(/\[Terms\]/g, selectedTerms?.url || '[Terms]')
                          .replace(/\[phone\]/g, manualTemplateData.phone || smsPhone || '[phone]')
                          .replace(/\[email\]/g, manualTemplateData.email || '[email]')
                          .replace(/\[date\]/g, manualTemplateData.date || new Date().toLocaleDateString())
                          .length} chars
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border-l-2 border-blue-500">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedProduct.smsTemplate
                          .replace(/\[price\]/g, manualTemplateData.price || selectedProduct.price.toString())
                          .replace(/\[Price\]/g, manualTemplateData.price || selectedProduct.price.toString())
                          .replace(/\[product_name\]/g, manualTemplateData.product_name || selectedProduct.name)
                          .replace(/\[customer_name\]/g, manualTemplateData.customer_name || selectedLead?.person_name || '[customer_name]')
                          .replace(/\[company_name\]/g, manualTemplateData.company_name || selectedLead?.org_name || '[company_name]')
                          .replace(/\[Company\]/g, manualTemplateData.company_name || selectedLead?.org_name || '[Company]')
                          .replace(/\[orgnr\]/g, manualTemplateData.orgnr || '[orgnr]')
                          .replace(/\[Orgnr\]/g, manualTemplateData.orgnr || '[Orgnr]')
                          .replace(/\[terms\]/g, selectedTerms?.url || '[terms]')
                          .replace(/\[Terms\]/g, selectedTerms?.url || '[Terms]')
                          .replace(/\[phone\]/g, manualTemplateData.phone || smsPhone || '[phone]')
                          .replace(/\[email\]/g, manualTemplateData.email || '[email]')
                          .replace(/\[date\]/g, manualTemplateData.date || new Date().toLocaleDateString())
                        }
                      </p>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>To: {smsPhone || 'No phone number'}</span>
                      <span>Product: {selectedProduct.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Manual Template Fields Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Edit className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Customize</h2>
              </div>

              {selectedProduct ? (
                <div className="space-y-4">
                  {/* Organization Number - Always at the top with autofill tag */}
                  {selectedProduct.smsTemplate.includes('[orgnr]') || selectedProduct.smsTemplate.includes('[Orgnr]') ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Organization Number</label>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                          Autofill
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <input
                          type="text"
                          value={manualTemplateData.orgnr}
                          onChange={(e) => setManualTemplateData({...manualTemplateData, orgnr: e.target.value})}
                          placeholder="Enter organization number to search"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-green-50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (manualTemplateData.orgnr.trim()) {
                              setDataLoading(true);
                              fetchLeads(manualTemplateData.orgnr.trim());
                            } else {
                              toast.error('Please enter an organization number');
                            }
                          }}
                          disabled={dataLoading || !manualTemplateData.orgnr.trim()}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap flex-shrink-0"
                        >
                          {dataLoading ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enter organization number to fetch leads from Pipedrive</p>
                    </div>
                  ) : null}

                  {/* Only show other fields that are used in the current product's template */}
                  {selectedProduct.smsTemplate.includes('[price]') || selectedProduct.smsTemplate.includes('[Price]') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                      <input
                        type="text"
                        value={manualTemplateData.price}
                        onChange={(e) => setManualTemplateData({...manualTemplateData, price: e.target.value})}
                        placeholder="Override product price"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : null}
                  
                  {selectedProduct.smsTemplate.includes('[customer_name]') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                      <input
                        type="text"
                        value={manualTemplateData.customer_name}
                        onChange={(e) => setManualTemplateData({...manualTemplateData, customer_name: e.target.value})}
                        placeholder="Override customer name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : null}
                  
                  {selectedProduct.smsTemplate.includes('[company_name]') || selectedProduct.smsTemplate.includes('[Company]') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={manualTemplateData.company_name}
                        onChange={(e) => setManualTemplateData({...manualTemplateData, company_name: e.target.value})}
                        placeholder="Override company name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : null}
                  
                  {selectedProduct.smsTemplate.includes('[email]') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={manualTemplateData.email}
                        onChange={(e) => setManualTemplateData({...manualTemplateData, email: e.target.value})}
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : null}
                  
                  {selectedProduct.smsTemplate.includes('[date]') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="text"
                        value={manualTemplateData.date}
                        onChange={(e) => setManualTemplateData({...manualTemplateData, date: e.target.value})}
                        placeholder="Enter custom date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : null}
                  
                  {selectedProduct.smsTemplate.includes('[phone]') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={manualTemplateData.phone}
                        onChange={(e) => setManualTemplateData({...manualTemplateData, phone: e.target.value})}
                        placeholder="Override phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : null}
                  
                  
                  {/* Show message if no customizable fields are found */}
                  {!selectedProduct.smsTemplate.match(/\[(price|Price|customer_name|company_name|Company|orgnr|Orgnr|email|date|phone)\]/g) && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No customizable fields</p>
                      <p className="text-xs mt-1">This template has no editable placeholders</p>
                    </div>
                  )}
                  
                  {/* Clear All Button */}
                  {Object.values(manualTemplateData).some(value => value.trim() !== '') && (
                    <div className="pt-4 border-t">
                      <button
                        onClick={() => {
                          setManualTemplateData({
                            price: '',
                            customer_name: '',
                            product_name: '',
                            company_name: '',
                            orgnr: '',
                            phone: '',
                            email: '',
                            date: ''
                          });
                        }}
                        className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        Clear All Fields
                      </button>
                    </div>
                  )}
                  
                  {/* Big Send SMS Button */}
                  <div className="pt-6 border-t">
                    <button
                      onClick={sendSMS}
                      disabled={sendingSms || !selectedProduct || !smsPhone.trim()}
                      className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-3 ${
                        sendingSms || !selectedProduct || !smsPhone.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                      }`}
                    >
                      {sendingSms ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Sending SMS...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Send Contract SMS</span>
                        </>
                      )}
                    </button>
                    
                    {/* Contract Confirmation Tracker */}
                    {sentSmsRecords.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent SMS Status</h4>
                        <div className="space-y-2">
                          {sentSmsRecords.slice(0, 5).map((sms) => (
                            <div key={sms.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                              {/* Status Square */}
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  sms.contractConfirmed 
                                    ? 'bg-green-100 border-2 border-green-500' 
                                    : 'bg-gray-100 border-2 border-gray-300'
                                }`}>
                                  {sms.contractConfirmed ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-500" />
                                  )}
                                </div>
                              </div>
                              
                              {/* SMS Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {sms.contactNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {sms.contractConfirmed 
                                    ? `Contract confirmed ${formatFirebaseTimestamp(sms.contractConfirmedAt)}`
                                    : `Sent ${formatFirebaseTimestamp(sms.sentAt)}`
                                  }
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Button Status Info */}
                    <div className="mt-3 text-center">
                      {!selectedProduct ? (
                        <p className="text-xs text-gray-500">Select a product to send SMS</p>
                      ) : !smsPhone.trim() ? (
                        <p className="text-xs text-gray-500">Enter phone number to send SMS</p>
                      ) : (
                        <p className="text-xs text-green-600">Ready to send SMS</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Edit className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Select a product to customize</p>
                  <p className="text-xs mt-1">Choose a product to see customizable fields</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}