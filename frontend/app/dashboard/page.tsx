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
  Edit,
  Users,
  Trophy,
  Workflow,
  Target,
  X,
  HelpCircle,
  Mail,
  ChevronDown,
  StickyNote,
  FileText,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { productsAPI, termsAPI, Product, Terms } from '../../lib/api';
import DraggableDialer from '../../components/DraggableDialer';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Lead {
  id: number;
  title: string;
  owner_name: string;
  person_name: string;
  org_name: string;
  status: string;
  add_time: string;
  phone?: string; // Phone number from person details
  email?: string; // Email address
  notes?: string; // Notes about the lead
  companyName?: string; // Company name
  name?: string; // Contact person name
  org_number?: string; // Organization number (read-only)
  postal_code?: string; // Postal code
  postal_area?: string; // Postal area
  address?: string; // Address
  city?: string; // City
  active_in_pipeline?: string; // Active pipeline ID
  admin_email?: string; // Admin email
  createdAt?: Date; // Created timestamp
  current_stage?: string; // Current pipeline stage
  importedAt?: Date; // Imported timestamp
  importedBy?: string; // Imported by user ID
  lastActivityAt?: Date; // Last activity timestamp
  prefix?: string; // Prefix
  processing_timestamp?: string; // Processing timestamp
  rating?: string; // Rating
  source?: string; // Source
  updatedAt?: Date; // Updated timestamp
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  assignedRepId: string;
  assignedRepEmail: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  stages: PipelineStage[];
}

// Get responsive grid class based on stage count
const getGridClass = (stageCount: number): string => {
  if (stageCount <= 2) {
    return "grid grid-cols-1 md:grid-cols-2 gap-4";
  } else if (stageCount <= 3) {
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
  } else if (stageCount <= 4) {
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
  } else if (stageCount <= 5) {
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4";
  } else if (stageCount <= 6) {
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3";
  } else {
    // For more than 6 stages, use a more compact layout
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2";
  }
};

// Droppable Stage Component
const DroppableStage = ({ stage, stageCount, children }: { stage: any; stageCount: number; children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      ref={setNodeRef}
      key={stage.id}
      className="bg-gray-50 rounded-lg border border-gray-200 h-[500px] flex flex-col"
    >
      {children}
    </div>
  );
};

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
  const [assignedPipeline, setAssignedPipeline] = useState<Pipeline | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineLeads, setPipelineLeads] = useState<{[stageId: string]: Lead[]}>({});
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showLeadEditModal, setShowLeadEditModal] = useState(false);
  const [leadEditForm, setLeadEditForm] = useState({
    companyName: '',
    name: '',
    org_number: '',
    phone: '',
    email: '',
    notes: '',
    postal_code: '',
    postal_area: '',
    address: '',
    city: ''
  });
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  
  // Help widget state
  const [showHelpWidget, setShowHelpWidget] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpEmail, setHelpEmail] = useState('');
  
  // Dialer state
  const [showDialer, setShowDialer] = useState(false);
  const [dialerPhone, setDialerPhone] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callingNumber, setCallingNumber] = useState('');
  const [callInProgress, setCallInProgress] = useState(false);
  const [currentCallInfo, setCurrentCallInfo] = useState<{
    to: string;
    from: string;
    duration: number;
    startTime: Date;
    callId?: string;
  } | null>(null);
  
  // JustCall embedded dialer state
  const [showJustCallDialer, setShowJustCallDialer] = useState(false);
  const [dialerPhoneNumber, setDialerPhoneNumber] = useState<string>('');
  const [dialerMetadata, setDialerMetadata] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  
  // Admin dropdown state
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  
  // Close admin dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showAdminDropdown && !target.closest('.admin-dropdown')) {
        setShowAdminDropdown(false);
      }
    };

    if (showAdminDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminDropdown]);

  // Monitor call state when dialer is open
  useEffect(() => {
    if (!showJustCallDialer) return;

    const interval = setInterval(() => {
      const inCall = checkIfInCall();
      setIsInCall(inCall);
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [showJustCallDialer]);

  // Fetch calling number from settings
  const fetchCallingNumber = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      const response = await fetch(`${API_BASE_URL}/api/sms-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.callingNumber) {
          setCallingNumber(data.data.callingNumber);
          return data.data.callingNumber;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching calling number:', error);
      return null;
    }
  };

  // Fetch calling number on component mount
  useEffect(() => {
    if (user) {
      fetchCallingNumber();
    }
  }, [user]);

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callInProgress && currentCallInfo) {
      interval = setInterval(() => {
        setCurrentCallInfo(prev => {
          if (!prev) return null;
          const now = new Date();
          const duration = Math.floor((now.getTime() - prev.startTime.getTime()) / 1000);
          return { ...prev, duration };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callInProgress, currentCallInfo]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
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

  // Resend timer state
  const [resendTimer, setResendTimer] = useState<number | null>(null);
  const [canResend, setCanResend] = useState(false);

  // Debug: Log when manualTemplateData changes
  useEffect(() => {
    console.log('manualTemplateData updated:', manualTemplateData);
  }, [manualTemplateData]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer === null) return;

    if (resendTimer <= 0) {
      setCanResend(true);
      setResendTimer(null);
      return;
    }

    const interval = setInterval(() => {
      setResendTimer(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  // Helper function to validate and format numbers only
  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    // Remove all non-digit characters
    const numbersOnly = value.replace(/\D/g, '');
    setter(numbersOnly);
  };

  // Helper function to format Norwegian phone numbers for API
  const formatPhoneForAPI = (phone: string) => {
    if (!phone) return phone;
    
    // Remove any existing +47 prefix and spaces
    let cleaned = phone.replace(/^\+47/, '').replace(/\s/g, '');
    
    // If it starts with 47, remove it
    if (cleaned.startsWith('47')) {
      cleaned = cleaned.substring(2);
    }
    
    // If it's a valid Norwegian mobile number (8 digits starting with 4 or 9)
    if (/^[49]\d{7}$/.test(cleaned)) {
      return `+47${cleaned}`;
    }
    
    // If it's a valid Norwegian landline (8 digits starting with 2 or 3)
    if (/^[23]\d{7}$/.test(cleaned)) {
      return `+47${cleaned}`;
    }
    
    // If it already has a country code, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Otherwise, assume it's Norwegian and add +47
    if (cleaned.length >= 8) {
      return `+47${cleaned}`;
    }
    
    return phone;
  };

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
      
      // Get user's own SMS records (not admin endpoint)
      const response = await fetch(`${API_BASE_URL}/api/sms/my-records`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        const confirmedRecords = result.records || [];
        
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

  // Check for contract confirmations every 5 seconds (frequent polling for real-time updates)
  useEffect(() => {
    if (sentSmsRecords.length === 0) return;
    
    const interval = setInterval(checkContractConfirmations, 5000); // Poll every 5 seconds for faster updates
    return () => clearInterval(interval);
  }, [sentSmsRecords.length]);
  const router = useRouter();

  // SSE connection for real-time contract confirmations
  useEffect(() => {
    console.log('🔌 SSE useEffect triggered:', {
      user: !!user,
      userUid: user?.uid,
      userAuthLevel: user?.authLevel,
      sentSmsRecordsLength: sentSmsRecords.length,
      sentSmsRecords: sentSmsRecords
    });

    if (!user) {
      console.log('🔌 SSE connection skipped: No user');
      return;
    }

    // If no SMS records yet, establish connection anyway to receive future updates
    if (!sentSmsRecords.length) {
      console.log('🔌 SSE connection established without SMS records - ready for future updates');
    }

    // Check if user has required fields
    if (!user.uid) {
      console.error('❌ User object missing uid:', user);
      return;
    }

    const latestSmsId = sentSmsRecords[0]?.firestoreId; // Most recent SMS
    
    // If no SMS records yet, use a placeholder ID for the connection
    const viewingSmsId = latestSmsId || 'pending';
    
    console.log('🔌 SSE connection details:', {
      latestSmsId,
      viewingSmsId,
      sentSmsRecordsCount: sentSmsRecords.length
    });

    console.log(`🔌 Connecting to SSE for SMS: ${viewingSmsId}`, {
      userId: user.uid,
      userEmail: user.email,
      authLevel: user.authLevel,
      latestSmsId,
      viewingSmsId
    });

    // EventSource doesn't support custom headers, so we'll pass them as query params
    const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
    const sseUrl = `${API_BASE_URL}/api/sse?userId=${encodeURIComponent(user.uid)}&viewingSmsId=${encodeURIComponent(viewingSmsId)}`;
    console.log(`🔌 SSE URL: ${sseUrl}`);
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 SSE message received:', data);

        if (data.type === 'contract_confirmed') {
          console.log('✅ Contract confirmed via SSE!', data);
          
          // Simple: Mark the most recent SMS as confirmed
          setSentSmsRecords(prev => {
            if (prev.length > 0) {
              const updated = [...prev];
              updated[0] = {
                ...updated[0],
                contractConfirmed: true,
                contractConfirmedAt: new Date(data.confirmedAt)
              };
              return updated;
            }
            return prev;
          });

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
      console.error('SSE connection state:', eventSource.readyState);
      console.error('SSE URL that failed:', sseUrl);
      
      // If SSE fails, fall back to polling more frequently
      console.log('🔄 SSE failed, falling back to frequent polling');
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log('🔌 SSE connection opened successfully');
      console.log('🔌 SSE connection state:', eventSource.readyState);
      console.log('🔌 SSE URL:', sseUrl);
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
      fetchAssignedPipeline();
      fetchCallLogs();
    } else if (!loading) {
      // Redirect to login if not authenticated
      router.push('/');
    }
  }, [user, loading, router]);

  const fetchAssignedPipeline = async () => {
    if (!user) return;
    
    setPipelineLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/pipelines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const pipelines = result.pipelines || [];
        
        // Find pipeline assigned to current user
        const userPipeline = pipelines.find((pipeline: Pipeline) => 
          pipeline.assignedRepId === user.uid && pipeline.isActive
        );
        
        // Also check for inactive pipelines for debugging
        const inactiveUserPipeline = pipelines.find((pipeline: Pipeline) => 
          pipeline.assignedRepId === user.uid && !pipeline.isActive
        );
        
        if (inactiveUserPipeline) {
          console.warn('⚠️ User has an inactive pipeline:', inactiveUserPipeline);
        }
        
        console.log('All pipelines:', pipelines);
        console.log('User ID:', user.uid);
        console.log('Pipeline details:', pipelines.map((p: Pipeline) => ({
          id: p.id,
          name: p.name,
          assignedRepId: p.assignedRepId,
          isActive: p.isActive,
          assignedRepEmail: p.assignedRepEmail
        })));
        console.log('Found user pipeline:', userPipeline);
        
        setAssignedPipeline(userPipeline || null);
        
        // Initialize pipeline leads if pipeline exists
        if (userPipeline) {
          await initializePipelineLeads(userPipeline);
        }
      } else {
        console.error('Failed to fetch pipelines');
      }
    } catch (error) {
      console.error('Error fetching assigned pipeline:', error);
    } finally {
      setPipelineLoading(false);
    }
  };

  const initializePipelineLeads = async (pipeline: Pipeline) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Fetch pipeline items
      console.log('Fetching pipeline items for pipeline:', pipeline.id);
      const response = await fetch(`${API_BASE_URL}/api/pipelines/${pipeline.id}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Pipeline items response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Pipeline items result:', result);
        console.log('Pipeline items count:', result.count);
        console.log('Pipeline items array:', result.items);
        const itemsByStage = result.itemsByStage || {};
        console.log('Items by stage:', itemsByStage);
        console.log('Pipeline stages:', pipeline.stages);
        
        // Check for items without stageId
        const itemsWithoutStage = result.items.filter((item: any) => !item.stageId);
        if (itemsWithoutStage.length > 0) {
          console.warn('⚠️ Found items without stageId:', itemsWithoutStage);
        }
        
        // Convert pipeline items to Lead format for the dashboard
        const leadsByStage: {[stageId: string]: Lead[]} = {};
        
    pipeline.stages.forEach(stage => {
          leadsByStage[stage.id] = [];
        });

        // Fetch full lead data for each pipeline item
        const allLeadIds = result.items.map((item: any) => item.leadId);
        console.log('🔍 Fetching full lead data for lead IDs:', allLeadIds);
        
        if (allLeadIds.length > 0) {
          const leadsResponse = await fetch(`${API_BASE_URL}/api/leads-collection/bulk-fetch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadIds: allLeadIds })
          });

          if (leadsResponse.ok) {
            const leadsData = await leadsResponse.json();
            console.log('📊 Full leads data:', leadsData);
            
            // Create a map of leadId to lead data
            const leadsMap = new Map();
            leadsData.leads.forEach((lead: any) => {
              leadsMap.set(lead.id, lead);
            });

            Object.entries(itemsByStage).forEach(([stageId, items]) => {
              console.log(`🔄 Processing stage ${stageId} with ${(items as any[]).length} items:`, items);
              leadsByStage[stageId] = (items as any[]).map((item: any) => {
                const fullLeadData = leadsMap.get(item.leadId);
                console.log(`📝 Converting item ${item.id} with full lead data:`, fullLeadData);
                
                return {
                  id: item.leadId,
                  title: fullLeadData?.title || 'Unnamed Lead',
                  owner_name: fullLeadData?.owner_name || "Current User",
                  person_name: fullLeadData?.person_name || 'Unknown',
                  org_name: fullLeadData?.org_name || "Unknown Company",
                  status: fullLeadData?.status || "open",
                  add_time: fullLeadData?.add_time || item.addedAt || new Date().toISOString(),
                  phone: fullLeadData?.phone || '',
                  email: fullLeadData?.email || '',
                  notes: fullLeadData?.notes || '',
                  companyName: fullLeadData?.companyName || fullLeadData?.org_name || 'Unknown Company',
                  name: fullLeadData?.name || fullLeadData?.person_name || 'Unknown',
                  org_number: fullLeadData?.org_number || '',
                  postal_code: fullLeadData?.postal_code || '',
                  postal_area: fullLeadData?.postal_area || '',
                  address: fullLeadData?.address || '',
                  city: fullLeadData?.city || '',
                  active_in_pipeline: fullLeadData?.active_in_pipeline || '',
                  admin_email: fullLeadData?.admin_email || '',
                  createdAt: fullLeadData?.createdAt || undefined,
                  current_stage: fullLeadData?.current_stage || '',
                  importedAt: fullLeadData?.importedAt || undefined,
                  importedBy: fullLeadData?.importedBy || '',
                  lastActivityAt: fullLeadData?.lastActivityAt || undefined,
                  prefix: fullLeadData?.prefix || '',
                  processing_timestamp: fullLeadData?.processing_timestamp || '',
                  rating: fullLeadData?.rating || '',
                  source: fullLeadData?.source || '',
                  updatedAt: fullLeadData?.updatedAt || undefined,
                  pipeline_item_id: item.id // Store the pipeline item ID for moving
                };
              });
            });
          } else {
            console.error('Failed to fetch full lead data');
            // Fallback to using pipeline item data only
            Object.entries(itemsByStage).forEach(([stageId, items]) => {
              leadsByStage[stageId] = (items as any[]).map((item: any) => ({
                id: item.leadId,
                title: 'Unnamed Lead',
                owner_name: "Current User",
                person_name: 'Unknown',
                org_name: "Unknown Company",
                status: "open",
                add_time: item.addedAt || new Date().toISOString(),
                phone: '',
                email: '',
                notes: '',
                companyName: 'Unknown Company',
                name: 'Unknown',
                org_number: '',
                postal_code: '',
                postal_area: '',
                address: '',
                city: '',
                active_in_pipeline: '',
                admin_email: '',
                createdAt: undefined,
                current_stage: '',
                importedAt: undefined,
                importedBy: '',
                lastActivityAt: undefined,
                prefix: '',
                processing_timestamp: '',
                rating: '',
                source: '',
                updatedAt: undefined,
                pipeline_item_id: item.id
              }));
            });
          }
        } else {
          // No items to process
          Object.entries(itemsByStage).forEach(([stageId, items]) => {
            leadsByStage[stageId] = [];
          });
        }

        setPipelineLeads(leadsByStage);
        console.log('Pipeline leads loaded:', leadsByStage);
        console.log('Total leads in all stages:', Object.values(leadsByStage).flat().length);
      } else {
        console.error('Failed to fetch pipeline items');
        // Fallback to empty stages
        const emptyLeads: {[stageId: string]: Lead[]} = {};
        pipeline.stages.forEach(stage => {
          emptyLeads[stage.id] = [];
        });
        setPipelineLeads(emptyLeads);
      }
    } catch (error) {
      console.error('Error fetching pipeline items:', error);
      // Fallback to empty stages
      const emptyLeads: {[stageId: string]: Lead[]} = {};
      pipeline.stages.forEach(stage => {
        emptyLeads[stage.id] = [];
      });
      setPipelineLeads(emptyLeads);
    }
  };

  const handleLeadDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !assignedPipeline) return;

    const leadId = active.id.toString();
    let targetStageId = over.id.toString();

    // If we're dropping on a lead instead of a stage, find the stage that contains that lead
    if (targetStageId !== leadId) {
      // Check if the over.id is a lead ID (not a stage ID)
      let isLeadId = false;
      Object.entries(pipelineLeads).forEach(([stageId, leads]) => {
        const lead = leads.find(l => l.id.toString() === targetStageId);
        if (lead) {
          isLeadId = true;
          targetStageId = stageId; // Use the stage ID instead
        }
      });

      // If over.id is not a lead ID, it should be a stage ID
      if (!isLeadId) {
        // Verify it's a valid stage ID
        const validStage = assignedPipeline.stages.find(s => s.id === targetStageId);
        if (!validStage) {
          console.error('Invalid target stage ID:', targetStageId);
          return;
        }
      }
    }

    // Find which stage the lead is currently in
    let currentStageId = '';
    let leadToMove: Lead | null = null;

    Object.entries(pipelineLeads).forEach(([stageId, leads]) => {
      const lead = leads.find(l => l.id.toString() === leadId);
      if (lead) {
        currentStageId = stageId;
        leadToMove = lead;
      }
    });

    // If dropped in the same stage, do nothing
    if (!leadToMove || currentStageId === targetStageId) {
      return;
    }

    // Get the pipeline item ID from the lead
    const pipelineItemId = (leadToMove as any).pipeline_item_id;
    console.log('🔍 Pipeline item ID:', pipelineItemId);
    console.log('🔍 Lead to move:', leadToMove);
    console.log('🔍 Assigned pipeline ID:', assignedPipeline.id);
    console.log('🔍 Target stage ID:', targetStageId);
    
    if (!pipelineItemId) {
      console.error('No pipeline item ID found for lead');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication token missing');
        return;
      }

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      const moveUrl = `${API_BASE_URL}/api/pipelines/${assignedPipeline.id}/items/${pipelineItemId}/move`;
      console.log('🔍 Move URL:', moveUrl);
      
      // Call API to move pipeline item
      const response = await fetch(moveUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stageId: targetStageId
        })
      });

      if (response.ok) {
        // Update local cache instead of refetching
        setPipelineLeads(prevLeads => {
          const newLeads = { ...prevLeads };
          
          // Remove lead from current stage
          if (newLeads[currentStageId]) {
            newLeads[currentStageId] = newLeads[currentStageId].filter(lead => lead.id.toString() !== leadId);
          }
          
          // Add lead to target stage
      if (leadToMove) {
            if (newLeads[targetStageId]) {
              newLeads[targetStageId] = [...newLeads[targetStageId], leadToMove];
            } else {
              newLeads[targetStageId] = [leadToMove];
            }
      }
      
      return newLeads;
    });

        const targetStageName = assignedPipeline.stages.find(s => s.id === targetStageId)?.name || 'new stage';
        toast.success(`Lead moved to ${targetStageName}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to move pipeline item:', errorData);
        toast.error(`Failed to move lead: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error moving pipeline item:', error);
      toast.error('Failed to move lead. Please try again.');
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const leadId = active.id.toString();
    
    // Find the lead being dragged
    let leadToDrag: Lead | null = null;
    Object.entries(pipelineLeads).forEach(([stageId, leads]) => {
      const lead = leads.find(l => l.id.toString() === leadId);
      if (lead) {
        leadToDrag = lead;
      }
    });
    
    setActiveLead(leadToDrag);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    handleLeadDragEnd(event);
  };

  const handleLeadDoubleClick = (lead: Lead) => {
    setEditingLead(lead);
    setLeadEditForm({
      companyName: lead.companyName || lead.org_name || '',
      name: lead.name || lead.person_name || '',
      org_number: lead.org_number || '',
      phone: lead.phone || '',
      email: lead.email || '',
      notes: lead.notes || '',
      postal_code: lead.postal_code || '',
      postal_area: lead.postal_area || '',
      address: lead.address || '',
      city: lead.city || ''
    });
    setShowLeadEditModal(true);
  };

  const handleLeadEditSubmit = async () => {
    if (!editingLead) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication token missing');
        return;
      }

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Update the lead in the database
      const response = await fetch(`${API_BASE_URL}/api/leads-collection/${editingLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
                  body: JSON.stringify({
                    companyName: leadEditForm.companyName,
                    name: leadEditForm.name,
                    phone: leadEditForm.phone,
                    email: leadEditForm.email,
                    notes: leadEditForm.notes,
                    postal_code: leadEditForm.postal_code,
                    postal_area: leadEditForm.postal_area,
                    address: leadEditForm.address,
                    city: leadEditForm.city
                  })
      });

      if (response.ok) {
        // Update local cache instead of refetching
        setPipelineLeads(prevLeads => {
          const newLeads = { ...prevLeads };
          
          // Update the lead in all stages where it appears
          Object.keys(newLeads).forEach(stageId => {
            newLeads[stageId] = newLeads[stageId].map(lead => {
              if (lead.id.toString() === editingLead.id.toString()) {
                          return {
                            ...lead,
                            companyName: leadEditForm.companyName,
                            name: leadEditForm.name,
                            phone: leadEditForm.phone,
                            email: leadEditForm.email,
                            notes: leadEditForm.notes,
                            postal_code: leadEditForm.postal_code,
                            postal_area: leadEditForm.postal_area,
                            address: leadEditForm.address,
                            city: leadEditForm.city
                          };
              }
              return lead;
            });
          });
          
          return newLeads;
        });

        toast.success('Lead updated successfully');
        setShowLeadEditModal(false);
        setEditingLead(null);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to update lead: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead. Please try again.');
    }
  };

  const handleLeadEditCancel = () => {
    setShowLeadEditModal(false);
    setEditingLead(null);
    setLeadEditForm({
      companyName: '',
      name: '',
      org_number: '',
      phone: '',
      email: '',
      notes: '',
      postal_code: '',
      postal_area: '',
      address: '',
      city: ''
    });
  };

  const handleContractButton = () => {
    if (!editingLead?.org_number) {
      toast.error('No organization number available for this lead');
      return;
    }

    // Fill the organization number and phone number in the SMS template data
    setManualTemplateData(prev => ({
      ...prev,
      orgnr: editingLead.org_number || '',
      phone: editingLead.phone || ''
    }));

    // Set SMS phone number if available
    if (editingLead.phone) {
      setSmsPhone(editingLead.phone);
    }

    // Close the modal
    setShowLeadEditModal(false);
    setEditingLead(null);

    // Scroll to the SMS sender section first
    setTimeout(() => {
      const smsSection = document.querySelector('[data-sms-section]');
      if (smsSection) {
        smsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        // Show speech bubble after scrolling
        setTimeout(() => {
          setShowSpeechBubble(true);
          
          // Auto-hide speech bubble after 4 seconds
          setTimeout(() => {
            setShowSpeechBubble(false);
          }, 4000);
        }, 500);
      }
    }, 100);
  };

  // Sortable Lead Component
  const SortableLead = ({ lead }: { lead: Lead }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: lead.id.toString() });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? 'none' : transition, // Disable transition when dragging
      opacity: isDragging ? 0.3 : 1, // Make original semi-transparent when dragging
    };

    const formattedPhone = lead.phone ? formatPhoneNumber(lead.phone) : '';

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onDoubleClick={() => handleLeadDoubleClick(lead)}
        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {lead.companyName || lead.title || 'Unnamed Company'}
            </h4>
            <p className="text-xs text-gray-600 mt-1 truncate">
              {lead.name || lead.person_name || 'Unknown Contact'}
            </p>
            {formattedPhone && (
              <p className="text-xs text-blue-600 mt-1 truncate">
                📞 {formattedPhone}
              </p>
            )}
            {lead.email && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                ✉️ {lead.email}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 ml-2 flex flex-col items-end space-y-1">
            <span className={`inline-block w-2 h-2 rounded-full ${
              lead.status === 'open' ? 'bg-green-500' : 'bg-gray-400'
            }`}></span>
            {lead.notes && lead.notes.trim() && (
              <div title="Has notes">
                <StickyNote className="w-3 h-3 text-yellow-500" />
              </div>
            )}
                      {formattedPhone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isInCall) {
                              openJustCallDialerWithLead(lead);
                            }
                          }}
                          className={`w-6 h-6 text-white rounded-full flex items-center justify-center transition-all duration-200 ${
                            isInCall 
                              ? 'bg-gray-400 cursor-not-allowed blur-sm' 
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                          title={isInCall ? 'Cannot call while in active call' : `Call ${formattedPhone}`}
                          disabled={isInCall}
                        >
                          <Phone className="w-3 h-3" />
                        </button>
                      )}
          </div>
        </div>
      </div>
    );
  };

  const fetchLeads = async (orgNumber?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
      
      if (!orgNumber) {
        toast.error('Organization number is required');
        return;
      }
      
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Use BRREG API to get company information
      const url = new URL(`${API_BASE_URL}/api/leads/company-info`);
      url.searchParams.append('org_number', orgNumber);
      
      console.log('Fetching company info from BRREG:', url.toString());
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const companyData = data.data;
        
        // Update manual template data with company information
        setManualTemplateData(prev => ({
          ...prev,
          company_name: companyData.companyName || '',
          customer_name: companyData.companyName || '',
          phone: companyData.phone || '',
          email: companyData.email || '',
          orgnr: orgNumber
        }));
        
        // Create a "lead" object from BRREG data for display
        const brregLead = {
          id: companyData.orgNumber,
          title: companyData.companyName,
          org_name: companyData.companyName,
          person_name: companyData.companyName,
          phone: companyData.phone,
          email: companyData.email,
          business_address: companyData.businessAddress,
          industry: companyData.industryDescription,
          employees: companyData.employees,
          website: companyData.website,
          source: 'BRREG',
          // Required Lead interface properties
          owner_name: 'BRREG',
          status: 'active',
          add_time: new Date().toISOString()
        };
        
        setLeads([brregLead]);
        
        toast.success(`Found company: ${companyData.companyName}`, { duration: 3000 });
        console.log('✅ BRREG company data:', companyData);
        
      } else if (response.status === 404) {
        // Company not found in BRREG
        setLeads([]);
        toast.error(`No company found with organization number: ${orgNumber}`, { duration: 5000 });
        console.log('❌ Company not found in BRREG');
      } else {
        const errorData = await response.json();
        console.error('BRREG API Error:', errorData);
        toast.error(errorData.message || errorData.error || 'Failed to fetch company information');
      }
    } catch (error: any) {
      console.error('Error fetching company info:', error);
      toast.error(`Failed to fetch company information: ${error.message || 'Network error'}`);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
      // Set the first product as default if available
      if (response.data.length > 0 && !selectedProduct) {
        setSelectedProduct(response.data[0]);
      }
    } catch (error) {
      toast.error('Error fetching products');
    }
  };

  // Fetch call logs
  const fetchCallLogs = async () => {
    try {
      setCallLogsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      const response = await fetch(`${API_BASE_URL}/api/calls/call-logs?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCallLogs(data.data || []);
      } else {
        console.error('Failed to fetch call logs');
      }
    } catch (error) {
      console.error('Error fetching call logs:', error);
    } finally {
      setCallLogsLoading(false);
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
        phone: formatPhoneForAPI(manualTemplateData.phone || smsPhone),
        email: manualTemplateData.email || '[email]',
        date: manualTemplateData.date || new Date().toLocaleDateString()
      };

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      const formattedPhone = formatPhoneForAPI(manualTemplateData.phone || smsPhone);
      
      // Debug logging
      console.log('SMS Debug:', {
        originalPhone: manualTemplateData.phone || smsPhone,
        formattedPhone: formattedPhone,
        smsPhone: smsPhone,
        manualPhone: manualTemplateData.phone
      });
      
      const response = await fetch(`${API_BASE_URL}/api/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          contact_number: formattedPhone, // E.164 format
          body: selectedProduct.smsTemplate,
          templateData: templateData,
          restrict_once: 'No' // Allow sending to same number multiple times
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📱 SMS API Response:', result);
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
        
        console.log('📱 Created SMS record:', smsRecord);
        
        setSentSmsRecords(prev => [smsRecord, ...prev]);
        
        // Start 10-second resend timer
        setResendTimer(10);
        setCanResend(false);
        
        // Keep selections for potential resend (don't clear them)
        // setSmsPhone(''); // Keep phone number
        // setSelectedLead(null); // Keep selected lead
        // setSelectedProduct(null); // Keep selected product
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

  const resendSMS = async () => {
    if (!canResend) return;
    
    // Reset timer and resend
    setResendTimer(null);
    setCanResend(false);
    
    // Send SMS again (this will create a new SMS record and SSE connection)
    await sendSMS();
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
    
    // Auto-populate dialer phone field
    if (formattedPhone) {
      setDialerPhone(formattedPhone);
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

  // Dialer functions
  const openDialer = (phoneNumber?: string) => {
    if (phoneNumber) {
      setDialerPhone(phoneNumber);
    }
    setShowDialer(true);
  };

  // Check if there's an active call in the JustCall dialer
  const checkIfInCall = () => {
    try {
      const iframe = document.querySelector('iframe[title="JustCall Dialer"]') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        // Look for call-related elements in the iframe
        const callElements = iframe.contentDocument.querySelectorAll('[class*="call"], [class*="active"], [class*="ringing"], [class*="connected"]');
        const hasCallElements = callElements.length > 0;
        
        // Also check for common call state indicators
        const callButtons = iframe.contentDocument.querySelectorAll('button[class*="hang"], button[class*="end"], button[class*="call"]');
        const hasCallButtons = Array.from(callButtons).some(btn => 
          btn.textContent?.toLowerCase().includes('hang') || 
          btn.textContent?.toLowerCase().includes('end') ||
          btn.textContent?.toLowerCase().includes('call')
        );
        
        return hasCallElements || hasCallButtons;
      }
    } catch (error) {
      // Cross-origin restrictions prevent access, assume not in call
      console.log('Cannot access iframe content due to cross-origin restrictions');
    }
    return false;
  };

  const openJustCallDialer = (phoneNumber?: string) => {
    try {
      // Format phone number for JustCall (ensure it has + prefix)
      let formattedNumber = phoneNumber || '';
      if (formattedNumber && !formattedNumber.startsWith('+')) {
        // Assume Norwegian number if no country code
        formattedNumber = '+47' + formattedNumber.replace(/\D/g, '');
      }
      
      // Set state for embedded dialer
      setDialerPhoneNumber(formattedNumber);
      setDialerMetadata(null);
      setShowJustCallDialer(true);
      
      toast.success(formattedNumber ? `Opening dialer for ${formattedNumber}` : 'Opening JustCall dialer');
      
    } catch (error: any) {
      console.error('Failed to open JustCall dialer:', error);
      toast.error('Failed to open dialer. Please try again.');
    }
  };

  const openJustCallDialerWithLead = (lead: any) => {
    console.log('openJustCallDialerWithLead called with lead:', lead);
    try {
      // Format phone number for JustCall (ensure it has + prefix)
      let formattedNumber = lead.phone || '';
      console.log('Original phone number:', lead.phone);
      console.log('Formatted phone number:', formattedNumber);
      
      if (formattedNumber && !formattedNumber.startsWith('+')) {
        // Assume Norwegian number if no country code
        formattedNumber = '+47' + formattedNumber.replace(/\D/g, '');
      }
      
      if (!formattedNumber) {
        toast.error('No phone number available for this lead');
        return;
      }
      
      // Create custom metadata with lead information
      const metadata = {
        lead_id: lead.id,
        lead_name: lead.name || lead.title,
        lead_company: lead.org_name || lead.companyName,
        lead_email: lead.email,
        lead_status: lead.status,
        pipeline_id: lead.active_in_pipeline || '',
        source: 'CRM Integration'
      };
      
      // If dialer is already open, check if there's an active call
      if (showJustCallDialer) {
        const currentlyInCall = checkIfInCall() || isInCall; // Check both detection and tracked state
        if (currentlyInCall) {
          toast.error('Cannot change number while in an active call. Please end the current call first.');
          return; // CRITICAL: This prevents any state updates
        }
        
        // Only update state if not in call (this prevents iframe reload)
        setDialerPhoneNumber(formattedNumber);
        setDialerMetadata(metadata);
        toast.success(`Updated dialer for ${lead.name || lead.title} (${formattedNumber})`);
      } else {
        // Set state for embedded dialer with metadata
        setDialerPhoneNumber(formattedNumber);
        setDialerMetadata(metadata);
        setShowJustCallDialer(true);
        toast.success(`Opening dialer for ${lead.name || lead.title} (${formattedNumber})`);
        
        // Note: Call log will be created automatically via JustCall webhook when dial button is pressed
      }
      
    } catch (error: any) {
      console.error('Failed to open JustCall dialer:', error);
      toast.error('Failed to open dialer. Please try again.');
    }
  };

  // Log call initiation to Firestore (DEPRECATED - now handled by JustCall webhooks)
  /*
  const logCallInitiation = async (phoneNumber: string, lead: any, metadata: any) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        return;
      }

      // Get calling number from settings
      const callingNumber = await fetchCallingNumber();
      console.log('Calling number:', callingNumber);

      const callLogData = {
        fromNumber: callingNumber || '+4721564923',  // Fallback to default
        toNumber: phoneNumber,               // Lead's phone number
        leadId: lead.id,
        leadName: lead.name || lead.title,
        leadCompany: lead.org_name || lead.companyName,
        callDirection: 'outbound',
        callStatus: 'initiated',
        duration: 0,
        pickup: false,                       // Will be updated when call is answered
        cost: 0,                            // Will be updated with actual cost
        metadata
      };

      console.log('Sending call log data:', callLogData);

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      const response = await fetch(`${API_BASE_URL}/api/calls/log-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(callLogData)
      });

      console.log('Call log response status:', response.status);
      console.log('Call log response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Call logged successfully:', result.data.callLogId);
        return result.data.callLogId; // Return the call log ID for future updates
      } else {
        const errorText = await response.text();
        console.error('Call log failed:', response.status, errorText);
        toast.error(`Failed to log call: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to log call:', error);
    }
  };
  */

  // Update call log with completion details
  const updateCallLog = async (callLogId: string, updates: any) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/calls/log-call/${callLogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        console.log('Call log updated successfully');
      }
    } catch (error) {
      console.error('Failed to update call log:', error);
    }
  };

  const closeDialer = () => {
    setShowDialer(false);
    setDialerPhone('');
    setIsCalling(false);
  };

  const startCall = (to: string, from: string, callId?: string) => {
    setCallInProgress(true);
    setCurrentCallInfo({
      to,
      from,
      duration: 0,
      startTime: new Date(),
      callId
    });
    setShowDialer(false);
  };

  const endCall = async () => {
    try {
      // If we have a call ID, try to end the call through the API
      if (currentCallInfo?.callId) {
        const token = localStorage.getItem('authToken');
        if (token) {
          const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
          try {
            await fetch(`${API_BASE_URL}/api/calls/end/${currentCallInfo.callId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            console.log('Call ended via API:', currentCallInfo.callId);
          } catch (apiError) {
            console.error('Failed to end call via API:', apiError);
            // Continue with local end call even if API fails
          }
        }
      }
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      // Always end the call locally
      setCallInProgress(false);
      setCurrentCallInfo(null);
      toast.success('Call ended');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initiateCall = async () => {
    if (!dialerPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!callingNumber) {
      toast.error('Calling number not configured. Please set it in Settings > Phone Configuration.');
      return;
    }

    setIsCalling(true);
    
    try {
      // Format phone number for JustCall API
      const formattedPhone = formatPhoneForAPI(dialerPhone);
      
      console.log('Initiating call from:', callingNumber, 'to:', formattedPhone);
      
      // Call the actual JustCall API
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      const response = await fetch(`${API_BASE_URL}/api/calls/make`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to_number: formattedPhone,
          from_number: callingNumber,
          call_type: 'outbound'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to initiate call');
      }
      
      if (data.success) {
        // Start the call session with call ID
        startCall(formattedPhone, callingNumber, data.data?.callId);
        toast.success(`Call initiated to ${formattedPhone}`);
        
        // Store call ID for potential future use
        if (data.data?.callId) {
          console.log('Call ID:', data.data.callId);
        }
      } else {
        throw new Error(data.message || 'Call initiation failed');
      }
      
    } catch (error: any) {
      console.error('Call initiation failed:', error);
      toast.error(`Failed to initiate call: ${error.message}`);
    } finally {
      setIsCalling(false);
    }
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
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">Contract Sender</h1>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-black">N</span>
                  </div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Norges Mediehus
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Primary Actions - Compact buttons */}
              <div className="flex items-center space-x-2">
                {/* SMS Records - Compact */}
                <button
                  onClick={() => router.push('/sms-list')}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>
                
                {/* Leaderboard - Compact */}
                <button
                  onClick={() => router.push('/leaderboard')}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-md hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>🏆</span>
                </button>
              </div>
              
              {/* Dialer - JustCall Integration */}
              <div className="relative">
                <button
                  onClick={() => openJustCallDialer()}
                  className="group relative flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <div className="relative">
                    <Phone className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <span className="font-medium text-sm">Call</span>
                </button>
                
              </div>
              
              {/* Admin Dropdown - Compact */}
              {user?.authLevel === 1 && (
                <div className="relative admin-dropdown">
                  <button
                    onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Admin</span>
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${showAdminDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showAdminDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          router.push('/settings');
                          setShowAdminDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          router.push('/admin');
                          setShowAdminDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Admin Panel</span>
                      </button>
                      <button
                        onClick={() => {
                          router.push('/users');
                          setShowAdminDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Users</span>
                      </button>
                      <button
                        onClick={() => {
                          router.push('/admin/kpis');
                          setShowAdminDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>KPIs</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* User Info - Compact */}
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{user?.email}</span>
                <span className="sm:hidden">{user?.email?.split('@')[0]}</span>
              </div>
              
              {/* Logout - Compact */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Call Status Bar */}
      {callInProgress && currentCallInfo && (
        <div className="sticky top-16 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Call in progress</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-xs text-blue-100">
                      {currentCallInfo.to} • From: {currentCallInfo.from}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-lg font-mono font-semibold">
                    {formatDuration(currentCallInfo.duration)}
                  </div>
                  <div className="text-xs text-blue-100">Duration</div>
                </div>
                
                <button
                  onClick={endCall}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Phone className="w-4 h-4 rotate-180" />
                  <span className="text-sm font-medium">End Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${callInProgress ? 'pt-20' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SMS Composer */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 h-[calc(100vh-200px)] flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <Send className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Send Contract</h2>
              </div>

              <div className="space-y-4 flex-grow">
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

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <div className="flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 font-medium">
                      +47
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={smsPhone}
                        onChange={(e) => handleNumberInput(e.target.value, setSmsPhone)}
                        placeholder="41234567"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-phone-field
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter Norwegian phone number (8 digits)</p>
                  
                  {/* Speech Bubble Reminder */}
                  {showSpeechBubble && (
                    <div className="absolute top-full left-0 z-50 animate-bounce mt-2">
                      <div className="relative bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs">
                        <div className="text-sm font-medium">
                          Husk å endre nummer hvis dette er feil!
                        </div>
                        {/* Speech bubble tail pointing up */}
                        <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-500"></div>
                      </div>
                    </div>
                  )}
                </div>



              </div>
            </div>
          </div>

          {/* Leads List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-150px)] flex flex-col">
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

              <div className="p-6 flex-grow overflow-y-auto">
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
            <div className="bg-white rounded-lg shadow-sm border p-6 h-[calc(100vh-150px)] flex flex-col" data-sms-section>
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
                          onChange={(e) => handleNumberInput(e.target.value, (value) => setManualTemplateData({...manualTemplateData, orgnr: value}))}
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
                      <p className="text-xs text-gray-500 mt-1">Enter organization number to fetch company information from Norwegian Business Register</p>
                    </div>
                  ) : null}

                  {/* Only show other fields that are used in the current product's template */}
                  {selectedProduct.smsTemplate.includes('[price]') || selectedProduct.smsTemplate.includes('[Price]') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                      <input
                        type="text"
                        value={manualTemplateData.price}
                        onChange={(e) => handleNumberInput(e.target.value, (value) => setManualTemplateData({...manualTemplateData, price: value}))}
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
                      <div className="flex">
                        <div className="flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 font-medium">
                          +47
                        </div>
                        <input
                          type="tel"
                          value={manualTemplateData.phone}
                          onChange={(e) => handleNumberInput(e.target.value, (value) => setManualTemplateData({...manualTemplateData, phone: value}))}
                          placeholder="41234567"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
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
                    {resendTimer !== null ? (
                      // Resend timer active
                      <div className="space-y-3">
                        <div className="text-center text-sm text-gray-600">
                          SMS sent! You can resend in {resendTimer} seconds
                        </div>
                        <button
                          onClick={resendSMS}
                          disabled={!canResend || sendingSms}
                          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-3 ${
                            !canResend || sendingSms
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                          }`}
                        >
                          {sendingSms ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span>Resending SMS...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              <span>Resend SMS ({resendTimer}s)</span>
                            </>
                          )}
                        </button>
                        <div className="text-xs text-gray-500 text-center">
                          You can edit the price above before resending
                        </div>
                      </div>
                    ) : (
                      // Normal send button
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
                    )}
                    
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
                <div className="flex-grow flex items-center justify-center">
                  <div className="text-center py-12 px-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Edit className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a Product to Customize</h3>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
                      Choose a product to see customizable fields and personalize your SMS templates
                    </p>
                    <div className="mt-6 flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cool Separator */}
        <div className="mt-16 mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="bg-gray-50 px-6 py-3 rounded-full border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Pipeline Management</span>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Section */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 shadow-lg w-full">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Workflow className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">My Pipeline</h2>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Manage your leads through the sales pipeline stages. Drag and drop leads between stages to track their progress.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 w-full">
              {pipelineLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading pipeline...</span>
                </div>
              ) : assignedPipeline ? (
                <div className="space-y-6">
                  {/* Pipeline Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {assignedPipeline.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {assignedPipeline.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>{assignedPipeline.stages.length} stages</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Active</span>
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        Assigned to You
                      </span>
                    </div>
                  </div>

                  {/* Pipeline Stages */}
                  {assignedPipeline.stages.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-gray-900">Pipeline Board</h4>
                      </div>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <div className={getGridClass(assignedPipeline.stages.length)}>
                          {assignedPipeline.stages
                            .sort((a, b) => a.order - b.order)
                            .map((stage) => (
                              <DroppableStage key={stage.id} stage={stage} stageCount={assignedPipeline.stages.length}>
                                {/* Stage Header */}
                                <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg flex-shrink-0">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
                                        {stage.order}
                                      </div>
                                      <h5 className="font-medium text-gray-900 text-sm">
                                        {stage.name}
                                      </h5>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs text-gray-500">
                                        {pipelineLeads[stage.id]?.length || 0}
                                      </span>
                                      {stage.isRequired && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                          Required
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Stage Content */}
                                <div className="flex flex-col flex-1 min-h-0">
                                  <div className="flex-grow overflow-y-auto p-3 min-h-0">
                                    <SortableContext
                                      items={(pipelineLeads[stage.id] || []).map(lead => lead.id.toString())}
                                      strategy={horizontalListSortingStrategy}
                                    >
                                      <div className="space-y-2">
                                        {(pipelineLeads[stage.id] || []).map((lead) => (
                                          <SortableLead key={lead.id} lead={lead} />
                                        ))}
                                      </div>
                                    </SortableContext>
                                  </div>
                                </div>
                              </DroppableStage>
                            ))}
                        </div>
                        
                        <DragOverlay>
                          {activeLead ? (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg opacity-90 rotate-3 transform">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 text-sm truncate">
                                    {activeLead.companyName || activeLead.title || 'Unnamed Company'}
                                  </h4>
                                  <p className="text-xs text-gray-600 mt-1 truncate">
                                    {activeLead.name || activeLead.person_name || 'Unknown Contact'}
                                  </p>
                                  {activeLead.phone && (
                                    <p className="text-xs text-blue-600 mt-1 truncate">
                                      📞 {formatPhoneNumber(activeLead.phone)}
                                  </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                  <span className={`inline-block w-2 h-2 rounded-full ${
                                    activeLead.status === 'open' ? 'bg-green-500' : 'bg-gray-400'
                                  }`}></span>
                                  {activeLead.notes && activeLead.notes.trim() && (
                                    <div title="Has notes">
                                      <StickyNote className="w-3 h-3 text-yellow-500 mt-1" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm">No stages defined for this pipeline</p>
                      <p className="text-xs mt-1">Contact your administrator to add stages</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Workflow className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipeline Assigned</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    You don't have a pipeline assigned to you yet. Contact your administrator to get assigned to a pipeline.
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    {user?.authLevel === 1 ? (
                      <button
                        onClick={() => router.push('/admin/control-panel')}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Workflow className="w-4 h-4" />
                        <span>View All Pipelines</span>
                      </button>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">Contact your administrator to:</p>
                        <ul className="text-sm text-gray-600 text-left">
                          <li>• Get assigned to a pipeline</li>
                          <li>• Access pipeline management</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Help Button - Always visible */}
        <button
          onClick={() => setShowHelpWidget(!showHelpWidget)}
          className={`w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center group ${
            showHelpWidget ? 'scale-95' : ''
          }`}
        >
          <HelpCircle className="w-7 h-7 group-hover:rotate-12 transition-transform duration-200" />
        </button>
        
        {/* Help Widget Modal */}
        {showHelpWidget && (
          <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sales Rep Help</h3>
                    <p className="text-blue-100 text-sm">Get support for any questions</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpWidget(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Under Development Badge */}
              <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-orange-700 font-medium text-sm">Under Development</span>
                </div>
                <p className="text-orange-600 text-sm">
                  This help system is currently being built. Soon you'll be able to send inquiries and get quick feedback!
                </p>
              </div>
              
              {/* Coming Soon Features */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">Coming Soon:</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">Quick Inquiries</h5>
                      <p className="text-gray-600 text-xs">Send questions directly to support team</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">Live Chat</h5>
                      <p className="text-gray-600 text-xs">Get instant responses from support</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">Team Support</h5>
                      <p className="text-gray-600 text-xs">Connect with your sales team</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-900 mb-2">Need Help Now?</h5>
                <p className="text-blue-700 text-sm mb-2">
                  Contact your administrator or reach out to the support team directly.
                </p>
                <div className="flex items-center space-x-2 text-blue-600 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>support@yourcompany.com</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Lead Edit Modal */}
      {showLeadEditModal && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Lead: {editingLead.title}
              </h2>
              <button
                onClick={handleLeadEditCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Company Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={leadEditForm.companyName}
                    onChange={(e) => setLeadEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={leadEditForm.name}
                    onChange={(e) => setLeadEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contact person name"
                  />
                </div>
              </div>
              
              {/* Organization Number (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Organization Number
                </label>
                <input
                  type="text"
                  value={leadEditForm.org_number}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  placeholder="Organization number"
                />
              </div>
              
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={leadEditForm.phone}
                    onChange={(e) => setLeadEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={leadEditForm.email}
                    onChange={(e) => setLeadEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              {/* Address Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={leadEditForm.address}
                  onChange={(e) => setLeadEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full address"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 text-xs">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={leadEditForm.postal_code}
                      onChange={(e) => setLeadEditForm(prev => ({ ...prev, postal_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Enter postal code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 text-xs">
                      Postal Area
                    </label>
                    <input
                      type="text"
                      value={leadEditForm.postal_area}
                      onChange={(e) => setLeadEditForm(prev => ({ ...prev, postal_area: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Enter postal area"
                    />
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={leadEditForm.notes}
                  onChange={(e) => setLeadEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this lead..."
                />
              </div>
              
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div>
                {editingLead?.org_number && (
                  <button
                    onClick={handleContractButton}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Contract</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLeadEditCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeadEditSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Draggable JustCall Dialer */}
            <DraggableDialer
              isOpen={showJustCallDialer}
              phoneNumber={dialerPhoneNumber}
              metadata={dialerMetadata}
              isInCall={isInCall}
              onCallStateChange={setIsInCall}
              onClose={() => {
                setShowJustCallDialer(false);
                setDialerPhoneNumber('');
                setDialerMetadata(null);
                setIsInCall(false);
              }}
            />
    </div>
  );
}