'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  X,
  Workflow,
  GripVertical,
  Database,
  Zap,
  BarChart3,
  ArrowRight,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Users,
  TrendingUp,
  Activity,
  Upload,
  Download,
  FileText,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { pipelinesAPI, Pipeline as APIPipeline } from '../../../lib/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  items: PipelineItem[];
  stages: PipelineStage[];
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PipelineItem {
  id: string;
  name: string;
  description: string;
  order: number;
  type: 'sms' | 'email' | 'call' | 'task';
  config: any;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRecord {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  authLevel: number;
}

interface Customer {
  id: string;
  [key: string]: any;
  createdAt: Date;
  updatedAt: Date;
}

interface Lead {
  id: string;
  [key: string]: any;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadDatabase {
  id: string;
  name: string;
  description: string;
  type: 'leads' | 'sales';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  leadCount?: number;
}

// Cool Electrical Icon Component
const CoolElectricalIcon = ({ className }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg">
        {/* Electrical background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-red-400 rounded-full animate-pulse opacity-60"></div>
        
        {/* Automation circuit with electrical flow */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Circuit nodes */}
          <div className="absolute -left-2 -top-1 w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute -right-2 -top-1 w-1 h-1 bg-orange-300 rounded-full animate-pulse delay-200"></div>
          <div className="absolute -left-2 -bottom-1 w-1 h-1 bg-red-300 rounded-full animate-pulse delay-400"></div>
          <div className="absolute -right-2 -bottom-1 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-600"></div>
          
          {/* Main lightning bolt */}
          <Zap className="w-6 h-6 text-white drop-shadow-lg" />
          
          {/* Electrical current flow */}
          <div className="absolute inset-0">
            {/* Current flowing through circuit */}
            <div className="absolute -left-1 -top-0.5 w-0.5 h-0.5 bg-yellow-200 rounded-full animate-ping"></div>
            <div className="absolute -top-1 left-0 w-0.5 h-0.5 bg-orange-200 rounded-full animate-ping delay-100"></div>
            <div className="absolute -right-1 -top-0.5 w-0.5 h-0.5 bg-red-200 rounded-full animate-ping delay-200"></div>
            <div className="absolute -right-0.5 -bottom-1 w-0.5 h-0.5 bg-yellow-200 rounded-full animate-ping delay-300"></div>
            <div className="absolute -bottom-1 right-0 w-0.5 h-0.5 bg-orange-200 rounded-full animate-ping delay-400"></div>
            <div className="absolute -left-0.5 -bottom-1 w-0.5 h-0.5 bg-red-200 rounded-full animate-ping delay-500"></div>
          </div>
        </div>
        
        {/* Electrical discharge pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute w-4 h-4 bg-yellow-200/40 rounded-full animate-ping delay-300"></div>
        </div>
        
        {/* Electrical shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>
    </div>
  );
};

// Cool Pipelines Icon Component
const CoolPipelinesIcon = ({ className }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg">
        {/* Pipeline background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse opacity-60"></div>
        
        {/* Pipeline stages with flowing data */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Stage 1 */}
          <div className="absolute -left-3 top-0 w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
          {/* Stage 2 */}
          <div className="absolute -top-3 left-0 w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-300"></div>
          {/* Stage 3 */}
          <div className="absolute -right-3 top-0 w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-600"></div>
          {/* Stage 4 */}
          <div className="absolute -bottom-3 right-0 w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-900"></div>
          {/* Stage 5 */}
          <div className="absolute -left-3 bottom-0 w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-1200"></div>
          
          {/* Main workflow icon */}
          <Workflow className="w-6 h-6 text-white drop-shadow-lg" />
          
          {/* Data flow particles moving between stages */}
          <div className="absolute inset-0">
            {/* Flow from stage 1 to 2 */}
            <div className="absolute -left-2 top-1 w-1 h-1 bg-blue-200 rounded-full animate-ping"></div>
            {/* Flow from stage 2 to 3 */}
            <div className="absolute -top-2 right-1 w-1 h-1 bg-indigo-200 rounded-full animate-ping delay-200"></div>
            {/* Flow from stage 3 to 4 */}
            <div className="absolute -right-2 bottom-1 w-1 h-1 bg-purple-200 rounded-full animate-ping delay-400"></div>
            {/* Flow from stage 4 to 5 */}
            <div className="absolute -bottom-2 left-1 w-1 h-1 bg-blue-200 rounded-full animate-ping delay-600"></div>
            {/* Flow from stage 5 to 1 */}
            <div className="absolute -left-1 -bottom-1 w-1 h-1 bg-indigo-200 rounded-full animate-ping delay-800"></div>
          </div>
        </div>
        
        {/* Center processing pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute w-4 h-4 bg-blue-200/40 rounded-full animate-ping delay-300"></div>
        </div>
        
        {/* Pipeline shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>
    </div>
  );
};

// Cool Database Icon Component
const CoolDatabaseIcon = ({ className }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg">
        {/* Database background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full animate-pulse opacity-60"></div>
        
        {/* Database with data layers */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Data layers/stacks */}
          <div className="absolute -top-2 left-0 w-3 h-1 bg-emerald-300 rounded animate-pulse"></div>
          <div className="absolute -top-1 left-0 w-3 h-1 bg-teal-300 rounded animate-pulse delay-200"></div>
          <div className="absolute top-0 left-0 w-3 h-1 bg-cyan-300 rounded animate-pulse delay-400"></div>
          
          {/* Main database icon */}
          <Database className="w-6 h-6 text-white drop-shadow-lg" />
          
          {/* Data retrieval arrows */}
          <div className="absolute inset-0">
            {/* Upward data retrieval */}
            <div className="absolute -top-1 left-1 w-0.5 h-0.5 bg-emerald-200 rounded-full animate-ping"></div>
            <div className="absolute -top-2 left-2 w-0.5 h-0.5 bg-teal-200 rounded-full animate-ping delay-100"></div>
            <div className="absolute -top-3 left-1 w-0.5 h-0.5 bg-cyan-200 rounded-full animate-ping delay-200"></div>
            
            {/* Downward data storage */}
            <div className="absolute -bottom-1 right-1 w-0.5 h-0.5 bg-emerald-200 rounded-full animate-ping delay-300"></div>
            <div className="absolute -bottom-2 right-2 w-0.5 h-0.5 bg-teal-200 rounded-full animate-ping delay-400"></div>
            <div className="absolute -bottom-3 right-1 w-0.5 h-0.5 bg-cyan-200 rounded-full animate-ping delay-500"></div>
          </div>
        </div>
        
        {/* Database activity pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute w-4 h-4 bg-emerald-200/40 rounded-full animate-ping delay-300"></div>
        </div>
        
        {/* Data shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>
    </div>
  );
};

// Cool Leads Icon Component
const CoolLeadsIcon = ({ className }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg">
        {/* Leads background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full animate-pulse opacity-60"></div>
        
        {/* Chart with growing bars */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Chart bars growing upward */}
          <div className="absolute -left-2 -bottom-1 w-1 h-2 bg-orange-300 rounded-t animate-pulse"></div>
          <div className="absolute -left-1 -bottom-1 w-1 h-3 bg-red-300 rounded-t animate-pulse delay-200"></div>
          <div className="absolute left-0 -bottom-1 w-1 h-4 bg-pink-300 rounded-t animate-pulse delay-400"></div>
          <div className="absolute left-1 -bottom-1 w-1 h-3 bg-orange-300 rounded-t animate-pulse delay-600"></div>
          <div className="absolute left-2 -bottom-1 w-1 h-2 bg-red-300 rounded-t animate-pulse delay-800"></div>
          
          {/* Main chart icon */}
          <BarChart3 className="w-6 h-6 text-white drop-shadow-lg" />
          
          {/* Growth indicators */}
          <div className="absolute inset-0">
            {/* Upward trending arrows */}
            <div className="absolute -top-1 -left-1 w-0.5 h-0.5 bg-orange-200 rounded-full animate-ping"></div>
            <div className="absolute -top-2 -left-0.5 w-0.5 h-0.5 bg-red-200 rounded-full animate-ping delay-100"></div>
            <div className="absolute -top-3 -left-1 w-0.5 h-0.5 bg-pink-200 rounded-full animate-ping delay-200"></div>
            
            {/* Rightward trending arrows */}
            <div className="absolute -right-1 -top-1 w-0.5 h-0.5 bg-orange-200 rounded-full animate-ping delay-300"></div>
            <div className="absolute -right-2 -top-0.5 w-0.5 h-0.5 bg-red-200 rounded-full animate-ping delay-400"></div>
            <div className="absolute -right-3 -top-1 w-0.5 h-0.5 bg-pink-200 rounded-full animate-ping delay-500"></div>
          </div>
        </div>
        
        {/* Growth pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute w-4 h-4 bg-orange-200/40 rounded-full animate-ping delay-300"></div>
        </div>
        
        {/* Growth shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>
    </div>
  );
};

// Animated Automation Icon Component
const AnimatedAutomationIcon = ({ className }: { className?: string }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: Play, color: 'text-blue-500', bg: 'bg-blue-100' },
    { icon: ArrowRight, color: 'text-purple-500', bg: 'bg-purple-100' },
    { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100' },
    { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    { icon: RotateCcw, color: 'text-indigo-500', bg: 'bg-indigo-100' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Background circle with gradient and glow effect */}
      <div className="w-full h-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg">
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full animate-pulse opacity-50"></div>
        
        {/* Rotating background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full animate-ping"></div>
          <div className="absolute top-4 right-3 w-1 h-1 bg-white rounded-full animate-ping delay-200"></div>
          <div className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-white rounded-full animate-ping delay-500"></div>
          <div className="absolute bottom-2 right-2 w-1 h-1 bg-white rounded-full animate-ping delay-700"></div>
        </div>
        
        {/* Main automation steps with enhanced animations */}
        <div className="relative z-10 flex items-center justify-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isPrevious = index < currentStep;
            const isNext = index === (currentStep + 1) % steps.length;
            
            return (
              <div
                key={index}
                className={`absolute transition-all duration-500 ${
                  isActive 
                    ? 'scale-150 opacity-100 z-20' 
                    : isPrevious 
                      ? 'scale-110 opacity-70 z-10' 
                      : isNext
                        ? 'scale-90 opacity-50 z-5'
                        : 'scale-75 opacity-30 z-0'
                }`}
                style={{
                  transform: `rotate(${index * 72}deg) translateY(-14px) rotate(-${index * 72}deg)`,
                }}
              >
                <div className={`w-6 h-6 rounded-full ${step.bg} flex items-center justify-center shadow-lg ${
                  isActive ? 'animate-bounce shadow-xl' : ''
                }`}>
                  <Icon className={`w-3 h-3 ${step.color} ${isActive ? 'animate-spin' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Center pulse effect with multiple rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-white/20 rounded-full animate-ping"></div>
          <div className="absolute w-6 h-6 bg-white/30 rounded-full animate-ping delay-300"></div>
          <div className="absolute w-4 h-4 bg-white/40 rounded-full animate-ping delay-600"></div>
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>
    </div>
  );
};

export default function ControlPanelPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [databases, setDatabases] = useState<LeadDatabase[]>([]);
  const [filteredPipelines, setFilteredPipelines] = useState<Pipeline[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Leads pagination and search state
  const [leadsSearchTerm, setLeadsSearchTerm] = useState('');
  const [leadsCurrentPage, setLeadsCurrentPage] = useState(1);
  const LEADS_PER_PAGE = 50;
  
  // Bulk selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Lead edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Lead>>({});
  
  // Pipeline assignment modal state
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  
  // Bulk assignment control panel state
  const [filterPrefix, setFilterPrefix] = useState<string>('');
  const [filterLastCallMonths, setFilterLastCallMonths] = useState<number | null>(null);
  const [pipelineForAssignment, setPipelineForAssignment] = useState<string>('');
  const [stageForAssignment, setStageForAssignment] = useState<string>('');
  
  // Bulk selection functions
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };
  
  const toggleSelectAll = () => {
    const filteredLeads = leads.filter(lead => {
      if (!leadsSearchTerm) return true;
      const searchLower = leadsSearchTerm.toLowerCase();
      return (
        (lead.title || '').toLowerCase().includes(searchLower) ||
        (lead.name || '').toLowerCase().includes(searchLower) ||
        (lead.customerName || '').toLowerCase().includes(searchLower) ||
        (lead.companyName || '').toLowerCase().includes(searchLower) ||
        (lead.orgName || '').toLowerCase().includes(searchLower) ||
        (lead.personName || '').toLowerCase().includes(searchLower) ||
        (lead.contactName || '').toLowerCase().includes(searchLower) ||
        (lead.email || '').toLowerCase().includes(searchLower) ||
        (lead.phone || '').toLowerCase().includes(searchLower)
      );
    });
    
    const startIndex = (leadsCurrentPage - 1) * LEADS_PER_PAGE;
    const endIndex = startIndex + LEADS_PER_PAGE;
    const currentPageLeads = filteredLeads.slice(startIndex, endIndex);
    
    const currentPageLeadIds = currentPageLeads.map(lead => lead.id);
    const allCurrentPageSelected = currentPageLeadIds.every(id => selectedLeads.has(id));
    
    if (allCurrentPageSelected) {
      // Deselect all current page leads
      setSelectedLeads(prev => {
        const newSet = new Set(prev);
        currentPageLeadIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all current page leads
      setSelectedLeads(prev => {
        const newSet = new Set(prev);
        currentPageLeadIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };
  
  const clearSelection = () => {
    setSelectedLeads(new Set());
  };
  
  const handleBulkAction = (action: string) => {
    const selectedLeadIds = Array.from(selectedLeads);
    console.log(`Bulk action "${action}" on leads:`, selectedLeadIds);
    
    if (action === 'assign-pipeline') {
      setShowPipelineModal(true);
    } else if (action === 'export') {
      // TODO: Implement export functionality
      alert(`Export would be performed on ${selectedLeadIds.length} leads`);
    } else if (action === 'delete') {
      // TODO: Implement delete functionality
      alert(`Delete would be performed on ${selectedLeadIds.length} leads`);
    }
  };
  
  // Lead edit functions
  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditFormData({
      id: lead.id,
      title: lead.title,
      name: lead.name,
      customerName: lead.customerName,
      companyName: lead.companyName,
      orgName: lead.orgName,
      personName: lead.personName,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      value: lead.value,
      formattedValue: lead.formattedValue,
      source: lead.source,
      ownerName: lead.ownerName,
      active_in_pipeline: lead.active_in_pipeline,
      createdAt: lead.createdAt,
      importedAt: lead.importedAt
    });
    setShowEditModal(true);
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingLead(null);
    setEditFormData({});
  };
  
  // Pipeline assignment functions
  const handlePipelineAssignment = async () => {
    if (!selectedPipelineId) {
      alert('Please select a pipeline');
      return;
    }
    
    if (!selectedStageId) {
      alert('Please select a stage');
      return;
    }
    
    const selectedLeadIds = Array.from(selectedLeads);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to assign pipelines');
        return;
      }

      console.log('Assigning pipeline:', selectedPipelineId, 'stage:', selectedStageId, 'to leads:', selectedLeadIds);
      console.log('Lead IDs type check:', selectedLeadIds.map(id => ({ id, type: typeof id, length: id?.length })));
      console.log('Full lead objects for selected leads:', leads.filter(lead => selectedLeadIds.includes(lead.id)));

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // First, add leads to pipeline as items
      const pipelineItemsBody = {
        leadIds: selectedLeadIds,
        stageId: selectedStageId
      };
      
      console.log('Adding leads to pipeline:', pipelineItemsBody);
      console.log('Pipeline leads API URL:', `${API_BASE_URL}/api/pipelines/${selectedPipelineId}/leads`);
      
      const pipelineResponse = await fetch(`${API_BASE_URL}/api/pipelines/${selectedPipelineId}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pipelineItemsBody)
      });

      if (!pipelineResponse.ok) {
        const errorData = await pipelineResponse.json();
        console.error('Failed to add leads to pipeline:', errorData);
        alert(`Failed to add leads to pipeline: ${errorData.message || errorData.error || 'Unknown error'}`);
        return;
      }

      // Then update the leads with pipeline and stage info
      const leadsUpdateBody = {
          leadIds: selectedLeadIds,
          updates: {
          active_in_pipeline: selectedPipelineId,
          current_stage: selectedStageId
        }
      };
      
      console.log('Updating leads:', leadsUpdateBody);
      console.log('Leads update API URL:', `${API_BASE_URL}/api/leads-collection/bulk-update`);
      
      const response = await fetch(`${API_BASE_URL}/api/leads-collection/bulk-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leadsUpdateBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Pipeline assignment successful:', result);
        
        // Refresh the leads list
        await fetchData();
        
        // Clear selection and close modal
        setSelectedLeads(new Set());
        setShowPipelineModal(false);
        setSelectedPipelineId('');
        setSelectedStageId('');
        
        alert(`Successfully added ${selectedLeadIds.length} leads to pipeline and stage!`);
      } else {
        const errorData = await response.json();
        console.error('Failed to assign pipeline - Response status:', response.status);
        console.error('Failed to assign pipeline - Error data:', errorData);
        console.error('Failed to assign pipeline - Response headers:', response.headers);
        
        if (errorData.notFound && errorData.notFound.length > 0) {
          alert(`Failed to assign pipeline: Some leads not found (${errorData.notFound.length} out of ${selectedLeadIds.length}). Please refresh the page and try again.`);
        } else {
          alert(`Failed to assign pipeline: ${errorData.message || errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Failed to assign pipeline:', error);
      alert('Failed to assign pipeline. Please try again.');
    }
  };

  const closePipelineModal = () => {
    setShowPipelineModal(false);
    setSelectedPipelineId('');
    setSelectedStageId('');
  };
  
  const handleEditSubmit = async () => {
    if (!editingLead) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to update leads');
        return;
      }

      console.log('Updating lead:', editingLead.id, 'with data:', editFormData);

      // Check if lead is being removed from pipeline or moved to different pipeline
      const originalPipeline = editingLead.active_in_pipeline;
      const newPipeline = editFormData.active_in_pipeline;
      
      if (originalPipeline && originalPipeline !== newPipeline) {
        console.log('Lead being moved/removed from pipeline:', originalPipeline, 'to:', newPipeline);
        
        // Remove from original pipeline items
        const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
        const removeResponse = await fetch(`${API_BASE_URL}/api/pipelines/${originalPipeline}/leads`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            leadIds: [editingLead.id]
          })
        });

        if (!removeResponse.ok) {
          const errorData = await removeResponse.json();
          console.error('Failed to remove lead from pipeline:', errorData);
          alert(`Failed to remove lead from pipeline: ${errorData.message || 'Unknown error'}`);
          return;
        }

        console.log('Successfully removed lead from original pipeline items');
      }

      const response = await fetch(`/api/leads-collection/${editingLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Lead updated successfully:', result);
        
        // Refresh the leads list to show updated data
        await fetchData();
        
        alert('Lead updated successfully!');
        closeEditModal();
      } else {
        const errorData = await response.json();
        console.error('Failed to update lead:', errorData);
        alert(`Failed to update lead: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
      alert('Failed to update lead. Please try again.');
    }
  };
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [showCreateDatabaseModal, setShowCreateDatabaseModal] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState<LeadDatabase | null>(null);
  const [databaseFormData, setDatabaseFormData] = useState<{
    name: string;
    description: string;
    type: 'leads' | 'sales';
  }>({
    name: '',
    description: '',
    type: 'leads'
  });
  const [showStagesModal, setShowStagesModal] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [showPipelineViewModal, setShowPipelineViewModal] = useState(false);
  const [viewingPipeline, setViewingPipeline] = useState<Pipeline | null>(null);
  const [pipelineViewLeads, setPipelineViewLeads] = useState<{[stageId: string]: Lead[]}>({});
  const [localStages, setLocalStages] = useState<PipelineStage[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [selectedSection, setSelectedSection] = useState<'pipelines' | 'databases' | 'automations' | 'leads' | 'custom-fields'>('pipelines');
  const [stageFormData, setStageFormData] = useState({
    name: '',
    isRequired: false,
    order: 0
  });

  // Import/Export state
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [csvRowCount, setCsvRowCount] = useState(0);

  // Lead field management state
  const [leadFields, setLeadFields] = useState<any[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [fieldFormData, setFieldFormData] = useState<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options: string[];
  }>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    options: []
  });
  const [fieldMapping, setFieldMapping] = useState<{[key: string]: string}>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local stages when pipeline is selected
  useEffect(() => {
    if (selectedPipeline) {
      setLocalStages(selectedPipeline.stages);
    }
  }, [selectedPipeline]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignedRepId: ''
  });

  useEffect(() => {
    if (user && user.authLevel === 1) {
      fetchData();
    } else if (!loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    applyFilters();
  }, [pipelines, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Fetch pipelines, users, customers, leads, and databases in parallel
      const [pipelinesResponse, usersResponse, customersResponse, leadsResponse, databasesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/pipelines`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/leads-collection`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/databases`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (pipelinesResponse.ok) {
        const pipelinesData = await pipelinesResponse.json();
        setPipelines(pipelinesData.pipelines || []);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData.customers || []);
      }

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        console.log('Leads data received:', leadsData);
        console.log('Sample lead structure:', leadsData.leads?.[0]);
        console.log('Sample lead IDs:', leadsData.leads?.slice(0, 3).map((lead: any) => ({ id: lead.id, length: lead.id?.length })));
        setLeads(leadsData.leads || []);
      }

      if (databasesResponse.ok) {
        const databasesData = await databasesResponse.json();
        setDatabases(databasesData.databases || []);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(`Failed to fetch data: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  // Also fetch lead fields when data loads
  useEffect(() => {
    if (user && user.authLevel === 1) {
      fetchLeadFields();
    }
  }, [user]);

  const applyFilters = () => {
    let filtered = [...pipelines];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pipeline => 
        pipeline.name.toLowerCase().includes(searchLower) ||
        pipeline.description.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pipeline => {
        if (statusFilter === 'active') return pipeline.isActive;
        if (statusFilter === 'inactive') return !pipeline.isActive;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPipelines(filtered);
  };

  const handleCreatePipeline = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/pipelines`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Pipeline created successfully!');
        setShowCreateModal(false);
        setFormData({ name: '', description: '', assignedRepId: '' });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create pipeline');
      }
    } catch (error: any) {
      console.error('Error creating pipeline:', error);
      toast.error(`Error creating pipeline: ${error.message || 'Network error'}`);
    }
  };

  const handleUpdatePipeline = async () => {
    if (!editingPipeline) return;

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/pipelines/${editingPipeline.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Pipeline updated successfully!');
        setEditingPipeline(null);
        setFormData({ name: '', description: '', assignedRepId: '' });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update pipeline');
      }
    } catch (error: any) {
      console.error('Error updating pipeline:', error);
      toast.error(`Error updating pipeline: ${error.message || 'Network error'}`);
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;
    
    setPipelineToDelete(pipeline);
    setDeleteConfirmationInput('');
    setShowDeleteConfirmModal(true);
  };

  const confirmDeletePipeline = async () => {
    if (!pipelineToDelete) return;
    
    const expectedCount = pipelineToDelete.items.length;
    const inputCount = parseInt(deleteConfirmationInput);
    
    if (isNaN(inputCount) || inputCount !== expectedCount) {
      toast.error(`Please enter the correct number of items: ${expectedCount}`);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/pipelines/${pipelineToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Pipeline deleted successfully!');
        setShowDeleteConfirmModal(false);
        setPipelineToDelete(null);
        setDeleteConfirmationInput('');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete pipeline');
      }
    } catch (error: any) {
      console.error('Error deleting pipeline:', error);
      toast.error(`Error deleting pipeline: ${error.message || 'Network error'}`);
    }
  };

  // Database CRUD functions
  const handleCreateDatabase = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/databases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(databaseFormData),
      });

      if (response.ok) {
        toast.success('Database created successfully!');
        setShowCreateDatabaseModal(false);
        setDatabaseFormData({ name: '', description: '', type: 'leads' });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create database');
      }
    } catch (error: any) {
      console.error('Error creating database:', error);
      toast.error(`Error creating database: ${error.message || 'Network error'}`);
    }
  };

  const handleUpdateDatabase = async () => {
    if (!editingDatabase) return;

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Only send description (name and type cannot be changed)
      const response = await fetch(`${API_BASE_URL}/api/databases/${editingDatabase.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: databaseFormData.description }),
      });

      if (response.ok) {
        toast.success('Database updated successfully!');
        setEditingDatabase(null);
        setDatabaseFormData({ name: '', description: '', type: 'leads' });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update database');
      }
    } catch (error: any) {
      console.error('Error updating database:', error);
      toast.error(`Error updating database: ${error.message || 'Network error'}`);
    }
  };

  const handleDeleteDatabase = async (databaseId: string) => {
    if (!confirm('Are you sure you want to delete this database? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/databases/${databaseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Database deleted successfully!');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete database');
      }
    } catch (error: any) {
      console.error('Error deleting database:', error);
      toast.error(`Error deleting database: ${error.message || 'Network error'}`);
    }
  };

  const handleEditDatabase = (database: LeadDatabase) => {
    setEditingDatabase(database);
    setDatabaseFormData({
      name: database.name,
      description: database.description,
      type: database.type
    });
    setShowCreateDatabaseModal(true);
  };

  const fetchPipelineLeads = async (pipeline: Pipeline) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Fetch pipeline items
      const response = await fetch(`${API_BASE_URL}/api/pipelines/${pipeline.id}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const itemsByStage = result.itemsByStage || {};
        
        // Convert pipeline items to Lead format
        const leadsByStage: {[stageId: string]: Lead[]} = {};
        
        pipeline.stages.forEach(stage => {
          leadsByStage[stage.id] = [];
        });

        // Fetch full lead data for each pipeline item
        const allLeadIds = result.items.map((item: any) => item.leadId);
        
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
            
            // Create a map of leadId to lead data
            const leadsMap = new Map();
            leadsData.leads.forEach((lead: any) => {
              leadsMap.set(lead.id, lead);
            });

            Object.entries(itemsByStage).forEach(([stageId, items]) => {
              leadsByStage[stageId] = (items as any[]).map((item: any) => {
                const fullLeadData = leadsMap.get(item.leadId);
                
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
                  createdAt: fullLeadData?.createdAt || new Date().toISOString(),
                  updatedAt: fullLeadData?.updatedAt || new Date().toISOString()
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
                createdAt: new Date(),
                updatedAt: new Date()
              } as Lead));
            });
          }
        } else {
          // No items to process
          pipeline.stages.forEach(stage => {
            leadsByStage[stage.id] = [];
          });
        }

        setPipelineViewLeads(leadsByStage);
      }
    } catch (error) {
      console.error('Error fetching pipeline leads:', error);
      toast.error('Failed to load pipeline leads');
    }
  };

  const getAssignedRepName = (pipeline: Pipeline) => {
    const rep = users.find(user => user.uid === pipeline.assignedRepId);
    if (rep) {
      return rep.firstName && rep.lastName 
        ? `${rep.firstName} ${rep.lastName}`
        : rep.displayName || rep.email;
    }
    return pipeline.assignedRepEmail;
  };

  const handleCreateStage = async () => {
    if (!selectedPipeline) return;

    const newStage: PipelineStage = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      name: stageFormData.name.trim(),
      isRequired: stageFormData.isRequired,
      order: localStages.length + 1, // Auto-assign next order
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to local state immediately for instant UI update
    setLocalStages(prev => [...prev, newStage]);
    setStageFormData({ name: '', isRequired: false, order: 0 });

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/pipelines/${selectedPipeline.id}/stages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newStage.name,
          isRequired: newStage.isRequired,
          order: newStage.order
        }),
      });

      if (response.ok) {
        toast.success('Stage created successfully!');
        fetchData(); // Refresh to get the real ID from server
      } else {
        // Remove from local state if API call failed
        setLocalStages(prev => prev.filter(stage => stage.id !== newStage.id));
        const error = await response.json();
        toast.error(error.message || 'Failed to create stage');
      }
    } catch (error: any) {
      // Remove from local state if API call failed
      setLocalStages(prev => prev.filter(stage => stage.id !== newStage.id));
      console.error('Error creating stage:', error);
      toast.error(`Error creating stage: ${error.message || 'Network error'}`);
    }
  };

  const handleUpdateStage = async () => {
    if (!editingStage || !selectedPipeline) return;

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/pipelines/${selectedPipeline.id}/stages/${editingStage.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stageFormData),
      });

      if (response.ok) {
        toast.success('Stage updated successfully!');
        setEditingStage(null);
        setStageFormData({ name: '', isRequired: false, order: 0 });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update stage');
      }
    } catch (error: any) {
      console.error('Error updating stage:', error);
      toast.error(`Error updating stage: ${error.message || 'Network error'}`);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!selectedPipeline) return;
    
    if (!confirm('Are you sure you want to delete this stage?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/pipelines/${selectedPipeline.id}/stages/${stageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Stage deleted successfully!');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete stage');
      }
    } catch (error: any) {
      console.error('Error deleting stage:', error);
      toast.error(`Error deleting stage: ${error.message || 'Network error'}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Don't allow drag operations if there are temp stages
      if (localStages.some(stage => stage.id.startsWith('temp-'))) {
        toast.error('Please wait for stage creation to complete before reordering');
        return;
      }

      const oldIndex = localStages.findIndex(stage => stage.id === active.id);
      const newIndex = localStages.findIndex(stage => stage.id === over.id);

      const newStages = arrayMove(localStages, oldIndex, newIndex);
      
      // Update local state immediately
      setLocalStages(newStages);

      // Update orders in backend
      try {
        const token = localStorage.getItem('authToken');
        const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
        
        // Filter out temp stages and only update real stages
        const realStages = newStages.filter(stage => !stage.id.startsWith('temp-'));
        const updatePromises = realStages.map((stage) => {
          const newOrder = newStages.findIndex(s => s.id === stage.id) + 1;
          return fetch(`${API_BASE_URL}/api/pipelines/${selectedPipeline?.id}/stages/${stage.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order: newOrder }),
          });
        });

        await Promise.all(updatePromises);
        toast.success('Stage order updated!');
      } catch (error: any) {
        console.error('Error updating stage order:', error);
        toast.error('Failed to update stage order');
        // Revert local state on error
        setLocalStages(selectedPipeline?.stages || []);
      }
    }
  };

  // Sortable Stage Item Component
  const SortableStageItem = ({ stage, index }: { stage: PipelineStage; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: stage.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
      >
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
              {index + 1}
            </div>
            <div>
              <div className="font-medium text-gray-900">{stage.name}</div>
              {stage.isRequired && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                  Required
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingStage(stage);
              setStageFormData({
                name: stage.name,
                isRequired: stage.isRequired,
                order: stage.order
              });
            }}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            title="Edit stage"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteStage(stage.id)}
            className="text-red-600 hover:text-red-900 transition-colors"
            title="Delete stage"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    const d = new Date(date);
    
    // Check if the date is valid
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    
    return d.toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  // Import/Export functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      toast.error('Please upload a CSV file');
      return;
    }

    setImportFile(file);
    
    // Parse CSV file
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Count total rows (excluding header)
      const totalRows = lines.slice(1).filter(line => line.trim() !== '').length;
      setCsvRowCount(totalRows);
      
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      }).filter(obj => Object.values(obj).some(v => v !== ''));

      setImportPreview(preview);
      
      // Initialize field mapping with empty values
      const initialMapping: {[key: string]: string} = {};
      headers.forEach(header => {
        initialMapping[header] = '';
      });
      setFieldMapping(initialMapping);
    };
    reader.readAsText(file);
  };

  const handleImportLeads = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('fieldMapping', JSON.stringify(fieldMapping));

      const response = await fetch(`${API_BASE_URL}/api/leads-collection/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully imported ${result.count} leads!`);
        setShowImportExportModal(false);
        setImportFile(null);
        setImportPreview([]);
        setFieldMapping({});
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to import leads');
      }
    } catch (error: any) {
      console.error('Error importing leads:', error);
      toast.error(`Error importing leads: ${error.message || 'Network error'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExportLeads = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

      const response = await fetch(`${API_BASE_URL}/api/leads-collection/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Leads exported successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to export leads');
      }
    } catch (error: any) {
      console.error('Error exporting leads:', error);
      toast.error(`Error exporting leads: ${error.message || 'Network error'}`);
    }
  };

  const handleMigrateLeads = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

      const response = await fetch(`${API_BASE_URL}/api/leads-collection/migrate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Leads migrated successfully!');
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to migrate leads');
      }
    } catch (error: any) {
      console.error('Error migrating leads:', error);
      toast.error(`Error migrating leads: ${error.message || 'Network error'}`);
    }
  };

  // Lead field management functions
  const fetchLeadFields = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

      const response = await fetch(`${API_BASE_URL}/api/lead-fields`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeadFields(data.fields || []);
      }
    } catch (error: any) {
      console.error('Error fetching lead fields:', error);
    }
  };

  const handleSaveField = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

      const url = editingField 
        ? `${API_BASE_URL}/api/lead-fields/${editingField.id}`
        : `${API_BASE_URL}/api/lead-fields`;
      
      const method = editingField ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldFormData),
      });

      if (response.ok) {
        toast.success(`Field ${editingField ? 'updated' : 'created'} successfully!`);
        setShowFieldModal(false);
        setEditingField(null);
        setFieldFormData({ name: '', label: '', type: 'text', required: false, options: [] });
        fetchLeadFields();
      } else {
        const error = await response.json();
        toast.error(error.message || `Failed to ${editingField ? 'update' : 'create'} field`);
      }
    } catch (error: any) {
      console.error('Error saving field:', error);
      toast.error(`Error saving field: ${error.message || 'Network error'}`);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

      const response = await fetch(`${API_BASE_URL}/api/lead-fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Field deleted successfully!');
        fetchLeadFields();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete field');
      }
    } catch (error: any) {
      console.error('Error deleting field:', error);
      toast.error(`Error deleting field: ${error.message || 'Network error'}`);
    }
  };

  const handleEditField = (field: any) => {
    setEditingField(field);
    setFieldFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options || []
    });
    setShowFieldModal(true);
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

  if (user?.authLevel !== 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Admin access required.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Admin</span>
              </button>
              <div className="h-8 w-px bg-blue-300"></div>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Control Panel</h1>
                  <p className="text-blue-100 text-sm">Manage pipelines and user assignments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Section Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Pipelines Section */}
          <div 
            onClick={() => setSelectedSection('pipelines')}
            className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              selectedSection === 'pipelines' 
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg' 
                : 'bg-white border border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedSection === 'pipelines' 
                  ? 'bg-white/20' 
                  : 'bg-blue-100'
              }`}>
                <CoolPipelinesIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  selectedSection === 'pipelines' 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Pipelines
                </h3>
                <p className={`text-sm ${
                  selectedSection === 'pipelines' 
                    ? 'text-blue-100' 
                    : 'text-gray-600'
                }`}>
                  Manage sales workflows
                </p>
              </div>
            </div>
            {selectedSection === 'pipelines' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Databases Section */}
          <div 
            onClick={() => setSelectedSection('databases')}
            className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              selectedSection === 'databases' 
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg' 
                : 'bg-white border border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedSection === 'databases' 
                  ? 'bg-white/20' 
                  : 'bg-emerald-100'
              }`}>
                <CoolDatabaseIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  selectedSection === 'databases' 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Databases
                </h3>
                <p className={`text-sm ${
                  selectedSection === 'databases' 
                    ? 'text-emerald-100' 
                    : 'text-gray-600'
                }`}>
                  Create and manage lead databases
                </p>
              </div>
            </div>
            {selectedSection === 'databases' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Automations Section */}
          <div 
            onClick={() => setSelectedSection('automations')}
            className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              selectedSection === 'automations' 
                ? 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg' 
                : 'bg-white border border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedSection === 'automations' 
                  ? 'bg-white/20' 
                  : 'bg-purple-100'
              }`}>
                <CoolElectricalIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  selectedSection === 'automations' 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Automations
                </h3>
                <p className={`text-sm ${
                  selectedSection === 'automations' 
                    ? 'text-purple-100' 
                    : 'text-gray-600'
                }`}>
                  Automated workflows
                </p>
              </div>
            </div>
            {selectedSection === 'automations' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Leads Section */}
          <div 
            onClick={() => setSelectedSection('leads')}
            className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              selectedSection === 'leads' 
                ? 'bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg' 
                : 'bg-white border border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedSection === 'leads' 
                  ? 'bg-white/20' 
                  : 'bg-orange-100'
              }`}>
                <CoolLeadsIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  selectedSection === 'leads' 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Leads
                </h3>
                <p className={`text-sm ${
                  selectedSection === 'leads' 
                    ? 'text-orange-100' 
                    : 'text-gray-600'
                }`}>
                  Lead management
                </p>
              </div>
            </div>
            {selectedSection === 'leads' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Custom Fields Section */}
          <div 
            onClick={() => setSelectedSection('custom-fields')}
            className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              selectedSection === 'custom-fields' 
                ? 'bg-gradient-to-br from-gray-600 to-gray-800 shadow-lg' 
                : 'bg-white border border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedSection === 'custom-fields' 
                  ? 'bg-white/20' 
                  : 'bg-gray-100'
              }`}>
                <Settings className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  selectedSection === 'custom-fields' 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Custom Fields
                </h3>
                <p className={`text-sm ${
                  selectedSection === 'custom-fields' 
                    ? 'text-gray-100' 
                    : 'text-gray-600'
                }`}>
                  Lead field configuration
                </p>
              </div>
            </div>
            {selectedSection === 'custom-fields' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 w-full">
          {selectedSection === 'pipelines' && (
            <div className="p-8">
              {/* Pipeline Header with Create Button */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Pipeline Management</h2>
                  <p className="text-gray-600">Manage your sales pipelines and workflows</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create Pipeline</span>
                </button>
              </div>
            </div>
          )}

          {selectedSection === 'databases' && (
            <div className="p-8">
              {/* Database Header with Create Button */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Management</h2>
                  <p className="text-gray-600">Create and manage databases for organizing your leads</p>
                </div>
                <button
                  onClick={() => {
                    setEditingDatabase(null);
                    setDatabaseFormData({ name: '', description: '', type: 'leads' });
                    setShowCreateDatabaseModal(true);
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create Database</span>
                </button>
              </div>

              {/* Database Cards */}
              {dataLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading databases...</p>
                </div>
              ) : databases.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No databases yet</h3>
                  <p className="text-gray-500 mb-4">Create your first database to start organizing leads</p>
                  <button
                    onClick={() => {
                      setEditingDatabase(null);
                      setDatabaseFormData({ name: '', description: '', type: 'leads' });
                      setShowCreateDatabaseModal(true);
                    }}
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Database</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {databases.map((database) => (
                    <div key={database.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-emerald-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {database.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              database.type === 'leads' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {database.type === 'leads' ? 'Leads' : 'Sales'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {database.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Created</span>
                          <span className="text-gray-900 font-medium">{formatDate(database.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-500">Type</span>
                          <span className="text-gray-900 font-medium capitalize">{database.type} Database</span>
                        </div>
                        {database.leadCount !== undefined && (
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-gray-500">Leads</span>
                            <span className="text-emerald-600 font-semibold">{database.leadCount}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditDatabase(database)}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        {/* Database deletion disabled for now */}
                        {/* <button
                          onClick={() => handleDeleteDatabase(database.id)}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSection === 'automations' && (
            <div className="p-8">
              <div className="text-center py-12">
                {/* Large animated automation icon */}
                <div className="mb-8 flex justify-center">
                  <AnimatedAutomationIcon className="w-24 h-24" />
                </div>
                
                {/* Main Content Box with Shiny Background */}
                <div className="relative max-w-4xl mx-auto mb-8">
                  {/* Shiny Background Container */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-1 shadow-2xl">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-bounce"></div>
                    
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse"></div>
                    
                    {/* Main Content */}
                    <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-inner">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 animate-pulse">
                        Automations
                      </h2>
                      <p className="text-gray-700 mb-6 text-lg">Set up automated workflows and processes</p>
                      
                      {/* Under Development Badge */}
                      <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 mb-8 shadow-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                          <span className="text-purple-700 font-medium">Under Development</span>
                        </div>
                      </div>
                      
                      {/* Feature Preview Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/90">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Play className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Trigger Actions</h3>
                          <p className="text-sm text-gray-600">Automatically start workflows based on customer actions</p>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/90">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 animate-bounce delay-200">
                            <ArrowRight className="w-6 h-6 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Sequential Steps</h3>
                          <p className="text-sm text-gray-600">Chain multiple actions in automated sequences</p>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/90">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4 animate-bounce delay-500">
                            <Clock className="w-6 h-6 text-orange-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Scheduled Tasks</h3>
                          <p className="text-sm text-gray-600">Run automations at specific times or intervals</p>
                        </div>
                      </div>
                      
                      {/* Coming Soon Message */}
                      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-lg">
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">Coming Soon</h3>
                        <p className="text-purple-700">
                          We're building powerful automation tools that will help you streamline your sales process. 
                          Stay tuned for updates!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedSection === 'leads' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Lead Management</h2>
                  <p className="text-gray-600">Track and manage your sales leads</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportLeads}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-medium">Export</span>
                  </button>
                  <button
                    onClick={() => setShowImportExportModal(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="font-medium">Import</span>
                  </button>
                </div>
              </div>

              {dataLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No leads found</p>
                  <p className="text-sm text-gray-400 mt-2">Lead data will appear here when available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Leads List */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Leads List</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-gray-600">
                            {(() => {
                              const filtered = leads.filter(lead => {
                                if (!leadsSearchTerm) return true;
                                const searchLower = leadsSearchTerm.toLowerCase();
                                return (
                                  (lead.title || '').toLowerCase().includes(searchLower) ||
                                  (lead.name || '').toLowerCase().includes(searchLower) ||
                                  (lead.customerName || '').toLowerCase().includes(searchLower) ||
                                  (lead.companyName || '').toLowerCase().includes(searchLower) ||
                                  (lead.orgName || '').toLowerCase().includes(searchLower) ||
                                  (lead.personName || '').toLowerCase().includes(searchLower) ||
                                  (lead.contactName || '').toLowerCase().includes(searchLower) ||
                                  (lead.email || '').toLowerCase().includes(searchLower) ||
                                  (lead.phone || '').toLowerCase().includes(searchLower)
                                );
                              });
                              return filtered.length;
                            })()}
                            {' '}of {leads.length} leads
                          </span>
                        </div>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search leads by name, company, contact, email, phone..."
                          value={leadsSearchTerm}
                          onChange={(e) => {
                            setLeadsSearchTerm(e.target.value);
                            setLeadsCurrentPage(1); // Reset to first page on search
                          }}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                        />
                        {leadsSearchTerm && (
                          <button
                            onClick={() => {
                              setLeadsSearchTerm('');
                              setLeadsCurrentPage(1);
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              <input
                                type="checkbox"
                                checked={(() => {
                                  const filteredLeads = leads.filter(lead => {
                                    if (!leadsSearchTerm) return true;
                                    const searchLower = leadsSearchTerm.toLowerCase();
                                    return (
                                      (lead.title || '').toLowerCase().includes(searchLower) ||
                                      (lead.name || '').toLowerCase().includes(searchLower) ||
                                      (lead.customerName || '').toLowerCase().includes(searchLower) ||
                                      (lead.companyName || '').toLowerCase().includes(searchLower) ||
                                      (lead.orgName || '').toLowerCase().includes(searchLower) ||
                                      (lead.personName || '').toLowerCase().includes(searchLower) ||
                                      (lead.contactName || '').toLowerCase().includes(searchLower) ||
                                      (lead.email || '').toLowerCase().includes(searchLower) ||
                                      (lead.phone || '').toLowerCase().includes(searchLower)
                                    );
                                  });
                                  
                                  const startIndex = (leadsCurrentPage - 1) * LEADS_PER_PAGE;
                                  const endIndex = startIndex + LEADS_PER_PAGE;
                                  const currentPageLeads = filteredLeads.slice(startIndex, endIndex);
                                  
                                  return currentPageLeads.length > 0 && currentPageLeads.every(lead => selectedLeads.has(lead.id));
                                })()}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-60">
                              Lead
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                              Prefix
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                              Company
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                              Contact
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Value
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                              Created
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Source
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                              Pipeline
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            // Filter leads based on search term
                            const filteredLeads = leads.filter(lead => {
                              if (!leadsSearchTerm) return true;
                              const searchLower = leadsSearchTerm.toLowerCase();
                              return (
                                (lead.title || '').toLowerCase().includes(searchLower) ||
                                (lead.name || '').toLowerCase().includes(searchLower) ||
                                (lead.customerName || '').toLowerCase().includes(searchLower) ||
                                (lead.companyName || '').toLowerCase().includes(searchLower) ||
                                (lead.orgName || '').toLowerCase().includes(searchLower) ||
                                (lead.personName || '').toLowerCase().includes(searchLower) ||
                                (lead.contactName || '').toLowerCase().includes(searchLower) ||
                                (lead.email || '').toLowerCase().includes(searchLower) ||
                                (lead.phone || '').toLowerCase().includes(searchLower)
                              );
                            });
                            
                            // Calculate pagination
                            const startIndex = (leadsCurrentPage - 1) * LEADS_PER_PAGE;
                            const endIndex = startIndex + LEADS_PER_PAGE;
                            const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
                            
                            return paginatedLeads.map((lead, index) => (
                            <tr key={lead.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${selectedLeads.has(lead.id) ? 'bg-orange-50' : ''}`}>
                              {/* Checkbox */}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedLeads.has(lead.id)}
                                  onChange={() => toggleLeadSelection(lead.id)}
                                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                />
                              </td>
                              
                              {/* Lead Name */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                                    {(lead.title || lead.name || lead.customerName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                                      {lead.title || lead.name || lead.customerName || 'Unnamed Lead'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">
                                      ID: {lead.id || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Prefix */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {lead.prefix ? (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                    {lead.prefix}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                              
                              {/* Company */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900 truncate max-w-40">
                                  {lead.companyName || lead.orgName || 'No company'}
                                </div>
                                {lead.email && (
                                  <div className="text-xs text-gray-500 truncate max-w-40">
                                    {lead.email}
                                  </div>
                                )}
                              </td>
                              
                              {/* Contact */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900 truncate max-w-40">
                                  {lead.personName || lead.contactName || 'No contact'}
                                </div>
                                {lead.phone && (
                                  <div className="text-xs text-gray-500 truncate max-w-40">
                                    {lead.phone}
                                  </div>
                                )}
                              </td>
                              
                              {/* Status */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                  lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                                  lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                                  lead.status === 'proposal' ? 'bg-purple-100 text-purple-800' :
                                  lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                                  lead.status === 'closed-won' ? 'bg-emerald-100 text-emerald-800' :
                                  lead.status === 'closed-lost' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {lead.status || 'new'}
                                </span>
                              </td>
                              
                              {/* Value */}
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {lead.value ? (
                                  <div className="font-medium">
                                    {lead.formattedValue || lead.value}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No value</span>
                                )}
                              </td>
                              
                              {/* Created Date */}
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <div>{formatDate(lead.createdAt)}</div>
                                {lead.importedAt && (
                                  <div className="text-xs text-gray-400">
                                    Imported: {formatDate(lead.importedAt)}
                                  </div>
                                )}
                              </td>
                              
                              {/* Source */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    lead.source === 'csv_import' ? 'bg-blue-100 text-blue-800' :
                                    lead.source === 'pipedrive' ? 'bg-green-100 text-green-800' :
                                    lead.source === 'manual' ? 'bg-gray-100 text-gray-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {lead.source || 'Unknown'}
                                  </span>
                                </div>
                                {lead.ownerName && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Owner: {lead.ownerName}
                                  </div>
                                )}
                              </td>
                              
                              {/* Pipeline */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  {lead.active_in_pipeline ? (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs text-gray-900 font-medium truncate max-w-32">
                                        {pipelines.find(p => p.id === lead.active_in_pipeline)?.name || lead.active_in_pipeline}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                      <span className="text-xs text-gray-500">Available</span>
                                    </div>
                                  )}
                                </div>
                                {lead.active_in_pipeline && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    ID: {lead.active_in_pipeline.slice(-8)}
                                  </div>
                                )}
                              </td>
                              
                              {/* Actions */}
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openEditModal(lead)}
                                    className="text-orange-600 hover:text-orange-900 transition-colors"
                                    title="Edit Lead"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => console.log('View lead:', lead.id)}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                    title="View Details"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => console.log('Delete lead:', lead.id)}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                    title="Delete Lead"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Bulk Actions Bar */}
                    {selectedLeads.size > 0 && (
                      <div className="px-6 py-4 bg-orange-50 border-t border-orange-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-orange-800">
                              {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
                            </span>
                            <button
                              onClick={clearSelection}
                              className="text-sm text-orange-600 hover:text-orange-800 transition-colors"
                            >
                              Clear selection
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleBulkAction('export')}
                              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Export</span>
                            </button>
                            
                            <button
                              onClick={() => handleBulkAction('assign-pipeline')}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>Assign Pipeline</span>
                            </button>
                            
                            <button
                              onClick={() => handleBulkAction('delete')}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Footer with Pagination */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      {(() => {
                        const filteredLeads = leads.filter(lead => {
                          if (!leadsSearchTerm) return true;
                          const searchLower = leadsSearchTerm.toLowerCase();
                          return (
                            (lead.title || '').toLowerCase().includes(searchLower) ||
                            (lead.name || '').toLowerCase().includes(searchLower) ||
                            (lead.customerName || '').toLowerCase().includes(searchLower) ||
                            (lead.companyName || '').toLowerCase().includes(searchLower) ||
                            (lead.orgName || '').toLowerCase().includes(searchLower) ||
                            (lead.personName || '').toLowerCase().includes(searchLower) ||
                            (lead.contactName || '').toLowerCase().includes(searchLower) ||
                            (lead.email || '').toLowerCase().includes(searchLower) ||
                            (lead.phone || '').toLowerCase().includes(searchLower)
                          );
                        });
                        
                        const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
                        const startIndex = (leadsCurrentPage - 1) * LEADS_PER_PAGE;
                        const endIndex = Math.min(startIndex + LEADS_PER_PAGE, filteredLeads.length);
                        
                        return (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {endIndex} of {filteredLeads.length} leads
                                {leadsSearchTerm && <span className="ml-2 text-orange-600 font-medium">(filtered from {leads.length} total)</span>}
                                {selectedLeads.size > 0 && <span className="ml-2 text-orange-600 font-medium">• {selectedLeads.size} selected</span>}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>CSV Import</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Pipedrive</span>
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                <span>Manual</span>
                              </div>
                            </div>
                            
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => setLeadsCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={leadsCurrentPage === 1}
                                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Previous
                                </button>
                                
                                {/* Page Numbers */}
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                      pageNum = i + 1;
                                    } else if (leadsCurrentPage <= 3) {
                                      pageNum = i + 1;
                                    } else if (leadsCurrentPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i;
                                    } else {
                                      pageNum = leadsCurrentPage - 2 + i;
                                    }
                                    
                                    return (
                                      <button
                                        key={pageNum}
                                        onClick={() => setLeadsCurrentPage(pageNum)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                          pageNum === leadsCurrentPage
                                            ? 'bg-orange-600 text-white'
                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    );
                                  })}
                                  
                                  {totalPages > 5 && leadsCurrentPage < totalPages - 2 && (
                                    <>
                                      <span className="px-2 text-gray-500">...</span>
                                      <button
                                        onClick={() => setLeadsCurrentPage(totalPages)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                      >
                                        {totalPages}
                                      </button>
                                    </>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => setLeadsCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={leadsCurrentPage === totalPages}
                                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Bulk Assignment Control Panel */}
                    {selectedSection === 'leads' && (
                      <div className="border-t mt-6">
                        <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-2 mb-4">
                            <Workflow className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Bulk Pipeline Assignment</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Pipeline Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Pipeline
                              </label>
                              <select
                                value={pipelineForAssignment}
                                onChange={(e) => {
                                  setPipelineForAssignment(e.target.value);
                                  setStageForAssignment(''); // Reset stage when pipeline changes
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                              >
                                <option value="">Choose a pipeline...</option>
                                {pipelines.map((pipeline) => (
                                  <option key={pipeline.id} value={pipeline.id}>
                                    {pipeline.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Stage Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Stage
                              </label>
                              <select
                                value={stageForAssignment}
                                onChange={(e) => setStageForAssignment(e.target.value)}
                                disabled={!pipelineForAssignment}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                              >
                                <option value="">Choose a stage...</option>
                                {pipelines
                                  .find(p => p.id === pipelineForAssignment)
                                  ?.stages.map((stage) => (
                                    <option key={stage.id} value={stage.id}>
                                      {stage.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                          
                          {/* Filter Options */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Prefix Filter */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Prefix (optional)
                              </label>
                              <input
                                type="text"
                                value={filterPrefix}
                                onChange={(e) => setFilterPrefix(e.target.value)}
                                placeholder="e.g. pl or we"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                              />
                            </div>
                            
                            {/* Last Call Filter */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Not Called in Last (months)
                              </label>
                              <select
                                value={filterLastCallMonths || ''}
                                onChange={(e) => setFilterLastCallMonths(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                              >
                                <option value="">No filter</option>
                                <option value="1">1 month</option>
                                <option value="2">2 months</option>
                                <option value="3">3 months</option>
                                <option value="6">6 months</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Selection Controls */}
                          <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg border border-purple-300 mb-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-purple-900">
                                {selectedLeads.size > 0 ? `${selectedLeads.size} lead${selectedLeads.size !== 1 ? 's' : ''} selected` : 'No leads selected'}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                // Filter leads based on criteria - only leads NOT in a pipeline
                                let filteredLeads = leads.filter(l => !l.active_in_pipeline || l.active_in_pipeline === '');
                                
                                if (filterPrefix) {
                                  filteredLeads = filteredLeads.filter(l => l.prefix === filterPrefix);
                                }
                                
                                if (filterLastCallMonths) {
                                  const cutoffDate = new Date();
                                  cutoffDate.setMonth(cutoffDate.getMonth() - filterLastCallMonths);
                                  filteredLeads = filteredLeads.filter(l => {
                                    if (!l.lastActivityAt) return true; // No activity = match
                                    return new Date(l.lastActivityAt) < cutoffDate;
                                  });
                                }
                                
                                // Limit to 50 leads
                                const limitedLeads = filteredLeads.slice(0, 50);
                                setSelectedLeads(new Set(limitedLeads.map(l => l.id)));
                                toast.success(`Selected ${limitedLeads.length} leads (excluding leads already in pipeline)`);
                              }}
                              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Apply Filters & Select (max 50)
                            </button>
                          </div>
                          
                          {/* Selected Leads Preview */}
                          {selectedLeads.size > 0 && (
                            <div className="mb-4">
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                  Preview: {selectedLeads.size} leads to be assigned
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                  {Array.from(selectedLeads).slice(0, 10).map((leadId, index) => {
                                    const lead = leads.find(l => l.id === leadId);
                                    if (!lead) return null;
                                    return (
                                      <div key={leadId} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">{lead.title || lead.name || 'No title'}</p>
                                          {(lead.companyName || lead.orgName) && (
                                            <p className="text-xs text-gray-500">{lead.companyName || lead.orgName}</p>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => {
                                            const newSet = new Set(selectedLeads);
                                            newSet.delete(leadId);
                                            setSelectedLeads(newSet);
                                          }}
                                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                                {selectedLeads.size > 10 && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    ... and {selectedLeads.size - 10} more leads
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Assignment Button */}
                          <button
                            onClick={async () => {
                              if (!pipelineForAssignment || !stageForAssignment || selectedLeads.size === 0) {
                                toast.error('Please select a pipeline, stage, and at least one lead');
                                return;
                              }
                              
                              if (selectedLeads.size < 5) {
                                toast.error('Please select at least 5 leads');
                                return;
                              }
                              
                              if (selectedLeads.size > 50) {
                                toast.error('Please select no more than 50 leads');
                                return;
                              }
                              
                              toast.loading(`Assigning ${selectedLeads.size} leads...`);
                              
                              try {
                                const token = localStorage.getItem('authToken');
                                if (!token) {
                                  toast.error('Authentication token missing');
                                  return;
                                }
                                
                                const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
                                
                                // Call the bulk assignment endpoint
                                const leadIdsArray = Array.from(selectedLeads);
                                const response = await fetch(`${API_BASE_URL}/api/pipelines/${pipelineForAssignment}/leads`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({
                                    leadIds: leadIdsArray,
                                    stageId: stageForAssignment
                                  })
                                });
                                
                                if (!response.ok) {
                                  const errorData = await response.json();
                                  throw new Error(errorData.message || 'Failed to assign leads');
                                }
                                
                                const result = await response.json();
                                toast.dismiss();
                                toast.success(`Successfully assigned ${selectedLeads.size} leads to pipeline!`);
                                
                                // Reset state
                                setSelectedLeads(new Set());
                                setPipelineForAssignment('');
                                setStageForAssignment('');
                                setFilterPrefix('');
                                setFilterLastCallMonths(null);
                                
                                // Refresh leads to show updated pipeline assignment
                                window.location.reload();
                              } catch (error: any) {
                                toast.dismiss();
                                toast.error(error.message || 'Failed to assign leads');
                                console.error(error);
                              }
                            }}
                            disabled={!pipelineForAssignment || !stageForAssignment || selectedLeads.size === 0 || selectedLeads.size < 5}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                          >
                            Assign {selectedLeads.size > 0 ? `${selectedLeads.size} ` : ''}Leads to Pipeline
                          </button>
                          
                          {/* Info */}
                          <p className="text-xs text-gray-500 mt-3 text-center">
                            Select 5-50 leads to assign them to a pipeline and stage
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search and Filters */}
        {selectedSection === 'pipelines' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search pipelines by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order as 'asc' | 'desc');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pipelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pipelines...</p>
            </div>
          ) : filteredPipelines.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pipelines found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first pipeline to get started'
                }
              </p>
            </div>
          ) : (
            filteredPipelines.map((pipeline) => (
              <div key={pipeline.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
                        {pipeline.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {pipeline.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(pipeline.isActive)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {pipeline.items.length}
                      </div>
                      <div className="text-xs text-gray-500">Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {pipeline.stages.length}
                      </div>
                      <div className="text-xs text-gray-500">Stages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {getAssignedRepName(pipeline)}
                      </div>
                      <div className="text-xs text-gray-500">Assigned Rep</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          setViewingPipeline(pipeline);
                          setShowPipelineViewModal(true);
                          await fetchPipelineLeads(pipeline);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        title="View pipeline board"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPipeline(pipeline);
                          setShowStagesModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 transition-colors"
                        title="Manage stages"
                      >
                        <Workflow className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPipeline(pipeline);
                          setFormData({
                            name: pipeline.name,
                            description: pipeline.description,
                            assignedRepId: pipeline.assignedRepId
                          });
                        }}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Edit pipeline"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePipeline(pipeline.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete pipeline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(pipeline.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

            {/* Results Summary */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {filteredPipelines.length} of {pipelines.length} pipelines
              </p>
            </div>
          </>
        )}

        {selectedSection === 'custom-fields' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Custom Lead Fields</h2>
                <p className="text-gray-600">Configure custom fields for your leads</p>
              </div>
              <button
                onClick={() => {
                  setEditingField(null);
                  setFieldFormData({ name: '', label: '', type: 'text', required: false, options: [] });
                  setShowFieldModal(true);
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Add Field</span>
              </button>
            </div>

            {dataLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading fields...</p>
              </div>
            ) : leadFields.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No lead fields configured</p>
                <p className="text-sm text-gray-400 mt-2">Create custom fields to organize your lead data</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* System Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Fields (Added by Default)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    These fields are automatically available for all leads and cannot be modified. 
                    They are included in every CSV import and appear in the field mapping dropdown.
                    The "Active in Pipeline" field tracks which pipeline each lead is currently assigned to.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {leadFields.filter(field => field.isSystemField).map((field) => (
                      <div key={field.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-blue-900">{field.label}</h4>
                              <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                                {field.type}
                              </span>
                              <span className="px-2 py-0.5 text-xs rounded bg-blue-200 text-blue-800">
                                Default Field
                              </span>
                            </div>
                            <p className="text-sm text-blue-700">Field name: <code className="bg-blue-100 px-1 rounded">{field.name}</code></p>
                            {field.options && field.options.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-blue-600">Options: </span>
                                <span className="text-xs text-blue-700">{field.options.join(', ')}</span>
                              </div>
                            )}
                            <div className="mt-2 text-xs text-blue-600">
                              ✓ Automatically included in CSV imports
                            </div>
                            {field.name === 'active_in_pipeline' && (
                              <div className="mt-1 text-xs text-blue-600">
                                ✓ Tracks which pipeline the lead is currently assigned to
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Fields</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Additional fields you can create and customize for your leads. 
                    These are separate from the default fields above and can be edited or deleted.
                  </p>
                  {leadFields.filter(field => !field.isSystemField).length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No custom fields created yet</p>
                      <p className="text-xs text-gray-400 mt-1">Create your first custom field to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {leadFields.filter(field => !field.isSystemField).map((field) => (
                        <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{field.label}</h4>
                                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                                  {field.type}
                                </span>
                                {field.required && (
                                  <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">
                                    Required
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">Field name: <code className="bg-gray-100 px-1 rounded">{field.name}</code></p>
                              {field.options && field.options.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs text-gray-500">Options: </span>
                                  <span className="text-xs text-gray-700">{field.options.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditField(field)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteField(field.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Pipeline Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create New Pipeline
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pipeline Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter pipeline name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter pipeline description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Rep
                </label>
                <select
                  value={formData.assignedRepId}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedRepId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a rep</option>
                  {users.map(user => (
                    <option key={user.uid} value={user.uid}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.displayName || user.email
                      } {user.authLevel === 1 ? '(Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', description: '', assignedRepId: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePipeline}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Create Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pipeline Modal */}
      {editingPipeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Pipeline: {editingPipeline.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pipeline Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter pipeline name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter pipeline description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Rep
                </label>
                <select
                  value={formData.assignedRepId}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedRepId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a rep</option>
                  {users.map(user => (
                    <option key={user.uid} value={user.uid}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.displayName || user.email
                      } {user.authLevel === 1 ? '(Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingPipeline(null);
                  setFormData({ name: '', description: '', assignedRepId: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePipeline}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Update Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Database Modal */}
      {showCreateDatabaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingDatabase ? `Edit Database: ${editingDatabase.name}` : 'Create New Database'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  value={databaseFormData.name}
                  onChange={(e) => setDatabaseFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter database name"
                  disabled={!!editingDatabase}
                />
                {editingDatabase && (
                  <p className="text-xs text-gray-500 mt-1">Database name cannot be changed</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Type *
                </label>
                <select
                  value={databaseFormData.type}
                  onChange={(e) => setDatabaseFormData(prev => ({ ...prev, type: e.target.value as 'leads' | 'sales' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={!!editingDatabase}
                >
                  <option value="leads">Leads Database</option>
                  <option value="sales">Sales Database</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {editingDatabase 
                    ? 'Database type cannot be changed' 
                    : databaseFormData.type === 'leads' 
                      ? 'For managing potential customers and prospects' 
                      : 'For tracking active sales and closed deals'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={databaseFormData.description}
                  onChange={(e) => setDatabaseFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter database description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDatabaseModal(false);
                  setEditingDatabase(null);
                  setDatabaseFormData({ name: '', description: '', type: 'leads' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingDatabase ? handleUpdateDatabase : handleCreateDatabase}
                disabled={!databaseFormData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {editingDatabase ? 'Update Database' : 'Create Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stages Management Modal */}
      {showStagesModal && selectedPipeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Manage Stages: {selectedPipeline.name}
              </h3>
              <button
                onClick={() => {
                  setShowStagesModal(false);
                  setSelectedPipeline(null);
                  setEditingStage(null);
                  setStageFormData({ name: '', isRequired: false, order: 0 });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Add Stage Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                {editingStage ? 'Edit Stage' : 'Add New Stage'}
              </h4>
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage Name
                  </label>
                  <input
                    type="text"
                    value={stageFormData.name}
                    onChange={(e) => setStageFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter stage name"
                    autoFocus
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={stageFormData.order}
                    onChange={(e) => setStageFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={stageFormData.isRequired}
                    onChange={(e) => setStageFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900">
                    Required
                  </label>
                </div>
                <button
                  onClick={editingStage ? handleUpdateStage : handleCreateStage}
                  disabled={!stageFormData.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  {editingStage ? 'Update' : 'Add'}
                </button>
                {editingStage && (
                  <button
                    onClick={() => {
                      setEditingStage(null);
                      setStageFormData({ name: '', isRequired: false, order: 0 });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Stages List */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-900">Pipeline Stages</h4>
              {localStages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No stages created yet</p>
                  <p className="text-sm">Add your first stage above</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localStages.map(stage => stage.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {localStages.map((stage, index) => (
                        <SortableStageItem key={stage.id} stage={stage} index={index} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && pipelineToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Delete Pipeline
              </h3>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setPipelineToDelete(null);
                  setDeleteConfirmationInput('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Warning: This action cannot be undone
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>You are about to delete the pipeline:</p>
                      <p className="font-medium">"{pipelineToDelete.name}"</p>
                      <p className="mt-2">
                        This pipeline contains <strong>{pipelineToDelete.items.length} items</strong> and <strong>{pipelineToDelete.stages.length} stages</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To confirm deletion, enter the number of items in this pipeline:
                </label>
                <input
                  type="number"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={`Enter ${pipelineToDelete.items.length}`}
                  autoFocus
                />
                <p className="mt-1 text-sm text-gray-500">
                  Expected: {pipelineToDelete.items.length} items
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setPipelineToDelete(null);
                  setDeleteConfirmationInput('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePipeline}
                disabled={deleteConfirmationInput === ''}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Delete Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {showImportExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Import & Export Leads</h3>
                    <p className="text-blue-100 text-sm">Manage your lead data with CSV files</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowImportExportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                    setFieldMapping({});
                    setCsvRowCount(0);
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 max-h-[calc(95vh-120px)] overflow-y-auto">
              {/* File Upload Section */}
              <div className="mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Import Leads</h4>
                      <p className="text-sm text-gray-600">Upload CSV file to add new leads</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select CSV File
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 cursor-pointer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Click to upload CSV file</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Supported format: CSV files with headers
                      </p>
                    </div>

                    {/* CSV Info */}
                    {csvRowCount > 0 && (
                      <div className="bg-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-900">CSV File Loaded</h5>
                            <p className="text-sm text-blue-700">
                              Found <span className="font-semibold">{csvRowCount}</span> leads to import
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className={`grid gap-8 ${Object.keys(importPreview[0] || {}).length > 6 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {/* Field Mapping Section */}
                {importPreview.length > 0 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <Settings className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Field Mapping</h4>
                          <p className="text-sm text-gray-600">Map CSV columns to your lead fields</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-3 max-h-96 overflow-y-auto bg-white rounded-xl border border-gray-200 p-4">
                          {Object.keys(importPreview[0] || {}).map((csvHeader) => (
                            <div key={csvHeader} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-sm font-medium text-gray-700">{csvHeader}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400">→</span>
                                <select
                                  value={fieldMapping[csvHeader] || ''}
                                  onChange={(e) => setFieldMapping({...fieldMapping, [csvHeader]: e.target.value})}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                >
                                  <option value="">Skip this field</option>
                                  {leadFields.map((field) => (
                                    <option key={field.id} value={field.name}>
                                      {field.label}
                                    </option>
                                  ))}
                                  <option value={csvHeader}>Use original: {csvHeader}</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Import Button */}
                        <div className="pt-4">
                          <button
                            onClick={handleImportLeads}
                            disabled={!importFile || importing}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                          >
                            {importing ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="font-medium">Importing {csvRowCount} Leads...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5" />
                                <span className="font-medium">Import {csvRowCount} Leads</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview and Export Section */}
                <div className="space-y-6">
                  {/* Data Preview */}
                  {importPreview.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Data Preview</h4>
                          <p className="text-sm text-gray-600">First 5 rows of your CSV data</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(importPreview[0] || {}).map((header) => (
                                  <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {importPreview.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900">
                                      {String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Export Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Download className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Export Leads</h4>
                        <p className="text-sm text-gray-600">Download all leads as CSV file</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">CSV Export</h5>
                            <p className="text-sm text-gray-600">Includes all lead data and custom fields</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            <span>All lead information</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            <span>Custom field data</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            <span>Import metadata</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleExportLeads}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                      >
                        <Download className="w-5 h-5" />
                        <span className="font-medium">Export All Leads</span>
                      </button>
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Import Tips</h4>
                        <p className="text-sm text-gray-600">Best practices for CSV imports</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-gray-900">File Format</p>
                          <p>Use CSV files with headers in the first row</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-gray-900">Field Mapping</p>
                          <p>Map CSV columns to your configured lead fields</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-gray-900">Data Quality</p>
                          <p>Clean your data before importing for best results</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingField ? 'Edit Field' : 'Create New Field'}
              </h3>
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setEditingField(null);
                  setFieldFormData({ name: '', label: '', type: 'text', required: false, options: [] });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name (used in database)
                </label>
                <input
                  type="text"
                  value={fieldFormData.name}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., phone_number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label (displayed to users)
                </label>
                <input
                  type="text"
                  value={fieldFormData.label}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Phone Number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={fieldFormData.type}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select (Dropdown)</option>
                  <option value="textarea">Text Area</option>
                </select>
              </div>

              {fieldFormData.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={fieldFormData.options.join(', ')}
                    onChange={(e) => setFieldFormData(prev => ({ 
                      ...prev, 
                      options: e.target.value.split(',').map(o => o.trim()).filter(o => o !== '')
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., New, Contacted, Qualified"
                  />
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={fieldFormData.required}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, required: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
                  Required field
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setEditingField(null);
                  setFieldFormData({ name: '', label: '', type: 'text', required: false, options: [] });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveField}
                disabled={!fieldFormData.name || !fieldFormData.label}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {editingField ? 'Update' : 'Create'} Field
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Lead Edit Modal */}
      {showEditModal && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {(editingLead.title || editingLead.name || editingLead.customerName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Lead</h2>
                    <p className="text-sm text-gray-600">Update lead information and details</p>
                  </div>
                </div>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lead Name</label>
                      <input
                        type="text"
                        value={editFormData.name || editFormData.title || editFormData.customerName || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter lead name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={editFormData.companyName || editFormData.orgName || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                      <input
                        type="text"
                        value={editFormData.personName || editFormData.contactName || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, personName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={editFormData.phone || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                      <input
                        type="text"
                        value={editFormData.ownerName || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter owner name"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={editFormData.status || 'new'}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed-won">Closed Won</option>
                        <option value="closed-lost">Closed Lost</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                      <input
                        type="number"
                        value={editFormData.value || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter deal value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                      <select
                        value={editFormData.source || 'manual'}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, source: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="manual">Manual</option>
                        <option value="csv_import">CSV Import</option>
                        <option value="pipedrive">Pipedrive</option>
                        <option value="website">Website</option>
                        <option value="referral">Referral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pipeline</label>
                      <select
                        value={editFormData.active_in_pipeline || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, active_in_pipeline: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">No Pipeline</option>
                        {pipelines.map(pipeline => (
                          <option key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Pipeline Assignment Modal */}
      {showPipelineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Pipeline to {selectedLeads.size} Lead{selectedLeads.size !== 1 ? 's' : ''}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pipeline
                </label>
                <select
                  value={selectedPipelineId}
                  onChange={(e) => setSelectedPipelineId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a pipeline...</option>
                  {pipelines.filter(pipeline => pipeline.isActive).map(pipeline => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name} - {pipeline.description}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedPipelineId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Stage
                  </label>
                  <select
                    value={selectedStageId}
                    onChange={(e) => setSelectedStageId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a stage...</option>
                    {pipelines.find(p => p.id === selectedPipelineId)?.stages?.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name} {stage.isRequired && '(Required)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {selectedPipelineId && selectedStageId && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Pipeline:</strong> {pipelines.find(p => p.id === selectedPipelineId)?.name}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Selected Stage:</strong> {pipelines.find(p => p.id === selectedPipelineId)?.stages?.find(s => s.id === selectedStageId)?.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    This will assign the selected pipeline and stage to {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={closePipelineModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePipelineAssignment}
                disabled={!selectedPipelineId || !selectedStageId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                Assign Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline View Modal */}
      {showPipelineViewModal && viewingPipeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{viewingPipeline.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{viewingPipeline.description}</p>
              </div>
              <button
                onClick={() => {
                  setShowPipelineViewModal(false);
                  setViewingPipeline(null);
                  setPipelineViewLeads({});
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Pipeline Board */}
            <div className="flex-1 overflow-auto p-6">
              {/* Pipeline Items Section */}
              {(() => {
                // Filter to only show actual workflow items (with valid types)
                const workflowItems = viewingPipeline.items?.filter(item => 
                  item.type && ['sms', 'email', 'call', 'task'].includes(item.type)
                ) || [];
                
                return workflowItems.length > 0 && (
                  <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Workflow className="w-5 h-5 mr-2 text-purple-600" />
                      Pipeline Workflow Items
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {workflowItems
                        .sort((a, b) => a.order - b.order)
                        .map((item, index) => (
                        <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                {item.order}
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                item.type === 'sms' ? 'bg-green-100 text-green-700' :
                                item.type === 'email' ? 'bg-blue-100 text-blue-700' :
                                item.type === 'call' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.type ? item.type.toUpperCase() : 'TASK'}
                              </div>
                            </div>
                            {item.isRequired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                Required
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{item.name}</h4>
                          {item.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        ))}
                    </div>
                  </div>
                );
              })()}

              {/* Stages and Leads Section */}
              {viewingPipeline.stages.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Pipeline Stages & Leads
                  </h3>
                  <div className={`grid gap-4 h-full ${
                    viewingPipeline.stages.length === 1 ? 'grid-cols-1' :
                    viewingPipeline.stages.length === 2 ? 'grid-cols-2' :
                    viewingPipeline.stages.length === 3 ? 'grid-cols-3' :
                    viewingPipeline.stages.length === 4 ? 'grid-cols-4' :
                    viewingPipeline.stages.length === 5 ? 'grid-cols-5' :
                    'grid-cols-6'
                  }`}>
                  {viewingPipeline.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage) => (
                      <div key={stage.id} className="bg-gray-50 rounded-lg border border-gray-200 h-full flex flex-col">
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
                                {pipelineViewLeads[stage.id]?.length || 0}
                              </span>
                              {stage.isRequired && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stage Content - Leads */}
                        <div className="flex-1 overflow-y-auto p-3">
                          <div className="space-y-2">
                            {(pipelineViewLeads[stage.id] || []).map((lead) => {
                              const formattedPhone = lead.phone || '';
                              return (
                                <div
                                  key={lead.id}
                                  className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
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
                                    <div className="flex-shrink-0 ml-2">
                                      <span className={`inline-block w-2 h-2 rounded-full ${
                                        lead.status === 'open' ? 'bg-green-500' : 'bg-gray-400'
                                      }`}></span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {(pipelineViewLeads[stage.id]?.length === 0) && (
                              <div className="text-center py-8 text-gray-400 text-sm">
                                No leads in this stage
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No stages configured for this pipeline</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
