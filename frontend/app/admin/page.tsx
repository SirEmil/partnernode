'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface SmsRecord {
  id: string;
  messageId: string;
  contactNumber: string;
  senderNumber: string;
  originalMessage: string;
  processedMessage: string;
  status: string;
  contractConfirmed: boolean;
  contractConfirmedAt: string | null;
  customerName: string | null;
  companyName: string | null;
  organizationNumber: string | null;
  productName: string | null;
  price: string | null;
  userId: string;
  userEmail: string;
  sentAt: string;
  createdAt: string;
}

export default function AdminSmsRecords() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [smsRecords, setSmsRecords] = useState<SmsRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<SmsRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmationFilter, setConfirmationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sentAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingRecords, setDeletingRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && user.authLevel === 1) {
      fetchSmsRecords();
    } else if (!loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    applyFilters();
  }, [smsRecords, searchTerm, statusFilter, confirmationFilter, dateFilter, userFilter, sortBy, sortOrder]);

  const fetchSmsRecords = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      const response = await fetch(`${API_BASE_URL}/api/sms/records`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch SMS records');
      }

      const data = await response.json();
      setSmsRecords(data.data || []);
    } catch (error: any) {
      console.error('Error fetching SMS records:', error);
      toast.error(`Failed to fetch SMS records: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...smsRecords];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.customerName?.toLowerCase().includes(searchLower) ||
        record.companyName?.toLowerCase().includes(searchLower) ||
        record.contactNumber.includes(searchTerm) ||
        record.processedMessage.toLowerCase().includes(searchLower) ||
        record.userEmail.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Confirmation filter
    if (confirmationFilter !== 'all') {
      filtered = filtered.filter(record => 
        confirmationFilter === 'confirmed' ? record.contractConfirmed : !record.contractConfirmed
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(record => {
        const recordDate = new Date(record.sentAt);
        switch (dateFilter) {
          case 'today':
            return recordDate >= today;
          case 'yesterday':
            return recordDate >= yesterday && recordDate < today;
          case 'week':
            return recordDate >= lastWeek;
          case 'month':
            return recordDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(record => record.userId === userFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof SmsRecord];
      let bValue: any = b[sortBy as keyof SmsRecord];
      
      if (sortBy === 'sentAt' || sortBy === 'createdAt') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue == null) return sortOrder === 'asc' ? 1 : -1;
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredRecords(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getUniqueUsers = () => {
    const users = smsRecords.reduce((acc, record) => {
      if (!acc.find(u => u.id === record.userId)) {
        acc.push({ id: record.userId, email: record.userEmail });
      }
      return acc;
    }, [] as { id: string; email: string }[]);
    return users;
  };

  const handleDeleteSms = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this SMS record? It will be moved to the deleted records collection.')) {
      return;
    }

    try {
      setDeletingRecords(prev => new Set(prev).add(recordId));
      
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/sms/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Remove from local state
        setSmsRecords(prev => prev.filter(record => record.id !== recordId));
        
        toast.success('SMS record deleted successfully', {
          duration: 3000,
          icon: '🗑️'
        });
        
        console.log('SMS deleted:', result);
      } else {
        const errorData = await response.json();
        console.error('Delete SMS Error:', errorData);
        toast.error(errorData.message || errorData.error || 'Failed to delete SMS record');
      }
    } catch (error: any) {
      console.error('Error deleting SMS:', error);
      toast.error(`Failed to delete SMS: ${error.message || 'Network error'}`);
    } finally {
      setDeletingRecords(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
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
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-8 w-px bg-blue-300"></div>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                  <p className="text-blue-100 text-sm">Manage SMS records and system settings</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/control-panel')}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Control Panel</span>
              </button>
            </div>
            
            <div className="text-right">
              <div className="text-blue-100 text-sm">Total Records</div>
              <div className="text-3xl font-bold text-white">{smsRecords.length}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by customer, company, phone, message, or user..."
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

            {/* Filters */}
            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Confirmation Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract</label>
                  <select
                    value={confirmationFilter}
                    onChange={(e) => setConfirmationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Contracts</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>

                {/* User Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Users</option>
                    {getUniqueUsers().map(user => (
                      <option key={user.id} value={user.id}>{user.email}</option>
                    ))}
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
                    <option value="sentAt-desc">Newest First</option>
                    <option value="sentAt-asc">Oldest First</option>
                    <option value="customerName-asc">Customer A-Z</option>
                    <option value="customerName-desc">Customer Z-A</option>
                    <option value="companyName-asc">Company A-Z</option>
                    <option value="companyName-desc">Company Z-A</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredRecords.length} of {smsRecords.length} SMS records
          </p>
        </div>

        {/* SMS Records Cards */}
        <div className="space-y-4">
          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading SMS records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No SMS records found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || statusFilter !== 'all' || confirmationFilter !== 'all' || dateFilter !== 'all' || userFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'SMS records will appear here once users start sending messages'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRecords.map((record) => (
                <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {record.customerName || 'Unknown Customer'}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(record.status)}
                            <span className="text-sm font-medium text-gray-600 capitalize">{record.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{record.contactNumber}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{record.userEmail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(record.sentAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleDeleteSms(record.id)}
                          disabled={deletingRecords.has(record.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          title="Delete SMS record"
                        >
                          {deletingRecords.has(record.id) ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Company Info */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Company</h4>
                        <div className="text-sm text-gray-900">
                          {record.companyName || 'N/A'}
                        </div>
                        {record.organizationNumber && (
                          <div className="text-xs text-gray-500">
                            Org: {record.organizationNumber}
                          </div>
                        )}
                      </div>

                      {/* Contract Status */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Contract Status</h4>
                        <div className="flex items-center space-x-2">
                          {record.contractConfirmed ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Confirmed</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-600">Pending</span>
                            </>
                          )}
                        </div>
                        {record.contractConfirmedAt && (
                          <div className="text-xs text-gray-500">
                            Confirmed: {formatDate(record.contractConfirmedAt)}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Product</h4>
                        <div className="text-sm text-gray-900">
                          {record.productName || 'N/A'}
                        </div>
                        {record.price && (
                          <div className="text-xs text-gray-500">
                            Price: {record.price}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {record.processedMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
