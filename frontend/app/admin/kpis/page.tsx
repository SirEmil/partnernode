'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Phone,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';

interface CallLog {
  id: string;
  justcallCallId: string;
  fromNumber: string;
  toNumber: string;
  callDirection: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  callDuration?: number; // From webhook
  userId: string;
  leadId?: string;
  leadName?: string;
  leadCompany?: string;
  agentId?: number;
  agentName?: string;
  agentEmail?: string;
  costIncurred: number;
  recordingUrl?: string;
  callQuality?: string;
  disposition?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    webhookData?: any;
    source?: string;
    callInfo?: any;
    callDuration?: any;
  };
}

interface UserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  totalDuration: number;
  averageDuration: number;
  totalCost: number;
  averageCost: number;
  successRate: number;
  callsThisWeek: number;
  callsThisMonth: number;
  lastCallDate?: Date;
}

interface OverallStats {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  totalDuration: number;
  averageDuration: number;
  totalCost: number;
  averageCost: number;
  successRate: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  activeUsers: number;
}

export default function AdminKPIs() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today'); // 'today', '7', '30', '90', '365', 'all'
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.authLevel === 1) {
      fetchData();
    } else if (!loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (callLogs.length > 0 && users.length > 0) {
      calculateStats();
    }
  }, [callLogs, users, dateRange]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Authentication token missing');
        return;
      }

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
      
      // Fetch call logs and users in parallel
      const [callLogsResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/calls/call-logs/all?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (callLogsResponse.ok) {
        const callLogsData = await callLogsResponse.json();
        console.log('📊 Full call logs response:', callLogsData);
        console.log('📊 Call logs fetched:', callLogsData.data?.length || 0, 'logs');
        console.log('📊 Sample call log:', callLogsData.data?.[0]);
        console.log('📊 Setting call logs to:', callLogsData.data || []);
        setCallLogs(callLogsData.data || []);
      } else {
        console.error('Failed to fetch call logs:', callLogsResponse.status);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('👥 Full users response:', usersData);
        // Filter to only show active users (not disabled in Firebase Auth)
        const activeUsers = (usersData.users || []).filter((user: any) => !user.disabled);
        console.log('👥 Active users:', activeUsers.length, 'out of', usersData.users?.length || 0, 'total');
        console.log('👥 Setting users to:', activeUsers);
        setUsers(activeUsers);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setDataLoading(false);
    }
  };

  const calculateStats = () => {
    console.log('🧮 Starting calculateStats...');
    console.log('🧮 Current callLogs:', callLogs.length);
    console.log('🧮 Current users:', users.length);
    console.log('🧮 Current dateRange:', dateRange);
    
    // Handle different date range options
    let cutoffDate: Date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateRange === 'today') {
      cutoffDate = new Date(today);
    } else if (dateRange === 'all') {
      cutoffDate = new Date(0); // Beginning of time
    } else {
      const days = parseInt(dateRange);
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
    }
    
    console.log('🧮 Cutoff date:', cutoffDate.toISOString());

    // Filter call logs by date range and convert timestamps
    console.log('🔍 Processing', callLogs.length, 'call logs');
    console.log('🔍 Sample call log:', callLogs[0]);
    
    const filteredCalls = callLogs.filter(call => {
      console.log('🔍 Processing call:', call.id, 'startTime:', call.startTime, 'type:', typeof call.startTime);
      
      let callDate: Date;
      try {
        if (call.startTime instanceof Date) {
          callDate = call.startTime;
        } else if (typeof call.startTime === 'object' && call.startTime && ('_seconds' in call.startTime || 'seconds' in call.startTime)) {
          // Handle Firestore timestamp format (both _seconds and seconds)
          const seconds = (call.startTime as any)._seconds || (call.startTime as any).seconds;
          callDate = new Date(seconds * 1000);
        } else {
          callDate = new Date(call.startTime);
        }
        
        // Check if the date is valid
        if (isNaN(callDate.getTime())) {
          console.warn('⚠️ Invalid startTime for call:', call.id, call.startTime);
          return false; // Skip invalid dates
        }
        
        console.log('📅 Valid call date:', callDate.toISOString(), 'vs cutoff:', cutoffDate.toISOString());
        const include = callDate >= cutoffDate;
        console.log('📅 Include call:', include);
        return include;
      } catch (error) {
        console.warn('⚠️ Error parsing startTime for call:', call.id, call.startTime, error);
        return false; // Skip calls with invalid dates
      }
    }).map(call => {
      // Safely convert timestamps with error handling
      const safeConvertDate = (dateValue: any): Date | undefined => {
        if (!dateValue) return undefined;
        try {
          if (dateValue instanceof Date) {
            return dateValue;
          } else if (typeof dateValue === 'object' && dateValue && ('_seconds' in dateValue || 'seconds' in dateValue)) {
            // Handle Firestore timestamp format (both _seconds and seconds)
            const seconds = (dateValue as any)._seconds || (dateValue as any).seconds;
            return new Date(seconds * 1000);
          } else {
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? undefined : date;
          }
        } catch {
          return undefined;
        }
      };

      return {
        ...call,
        startTime: safeConvertDate(call.startTime) || new Date(),
        endTime: safeConvertDate(call.endTime),
        createdAt: safeConvertDate(call.createdAt) || new Date(),
        updatedAt: safeConvertDate(call.updatedAt) || new Date(),
        // Use callDuration from webhook if available, otherwise use duration
        duration: call.callDuration || call.duration || 0,
        // Ensure costIncurred is a number
        costIncurred: typeof call.costIncurred === 'number' ? call.costIncurred : 0
      };
    });

    // Calculate overall stats
    const totalCalls = filteredCalls.length;
    const completedCalls = filteredCalls.filter(call => call.status === 'completed').length;
    const failedCalls = filteredCalls.filter(call => call.status === 'failed').length;
    const totalDuration = filteredCalls.reduce((sum, call) => sum + call.duration, 0);
    const totalCost = filteredCalls.reduce((sum, call) => sum + call.costIncurred, 0);
    const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    console.log('📊 Calculating stats for:', filteredCalls.length, 'filtered calls');
    console.log('📊 Sample filtered call:', filteredCalls[0]);
    console.log('📊 Total cost from calls:', totalCost);
    console.log('📊 Total duration from calls:', totalDuration);
    console.log('📊 Date range filter:', dateRange, 'cutoff:', cutoffDate.toISOString());
    console.log('📊 Raw call logs count:', callLogs.length);

    // Calculate daily/weekly/monthly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const callsToday = callLogs.filter(call => {
      try {
        let callDate: Date;
        if (call.startTime instanceof Date) {
          callDate = call.startTime;
        } else if (typeof call.startTime === 'object' && call.startTime && ('_seconds' in call.startTime || 'seconds' in call.startTime)) {
          const seconds = (call.startTime as any)._seconds || (call.startTime as any).seconds;
          callDate = new Date(seconds * 1000);
        } else {
          callDate = new Date(call.startTime);
        }
        return !isNaN(callDate.getTime()) && callDate >= today;
      } catch {
        return false;
      }
    }).length;

    const callsThisWeek = callLogs.filter(call => {
      try {
        let callDate: Date;
        if (call.startTime instanceof Date) {
          callDate = call.startTime;
        } else if (typeof call.startTime === 'object' && call.startTime && ('_seconds' in call.startTime || 'seconds' in call.startTime)) {
          const seconds = (call.startTime as any)._seconds || (call.startTime as any).seconds;
          callDate = new Date(seconds * 1000);
        } else {
          callDate = new Date(call.startTime);
        }
        return !isNaN(callDate.getTime()) && callDate >= weekAgo;
      } catch {
        return false;
      }
    }).length;

    const callsThisMonth = callLogs.filter(call => {
      try {
        let callDate: Date;
        if (call.startTime instanceof Date) {
          callDate = call.startTime;
        } else if (typeof call.startTime === 'object' && call.startTime && ('_seconds' in call.startTime || 'seconds' in call.startTime)) {
          const seconds = (call.startTime as any)._seconds || (call.startTime as any).seconds;
          callDate = new Date(seconds * 1000);
        } else {
          callDate = new Date(call.startTime);
        }
        return !isNaN(callDate.getTime()) && callDate >= monthAgo;
      } catch {
        return false;
      }
    }).length;

    const activeUsers = new Set(filteredCalls.map(call => call.userId)).size;

    setOverallStats({
      totalCalls,
      completedCalls,
      failedCalls,
      totalDuration,
      averageDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
      totalCost,
      averageCost: totalCalls > 0 ? totalCost / totalCalls : 0,
      successRate,
      callsToday,
      callsThisWeek,
      callsThisMonth,
      activeUsers
    });

    // Calculate user-specific stats
    const userStatsMap = new Map<string, UserStats>();

    // Initialize all users (including those with no calls)
    users.forEach(user => {
      console.log('👤 Initializing user:', {
        uid: user.uid,
        email: user.email,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.displayName || 'Unknown'
      });
      userStatsMap.set(user.uid, {
        userId: user.uid,
        userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.displayName || 'Unknown',
        userEmail: user.email,
        totalCalls: 0,
        completedCalls: 0,
        failedCalls: 0,
        totalDuration: 0,
        averageDuration: 0,
        totalCost: 0,
        averageCost: 0,
        successRate: 0,
        callsThisWeek: 0,
        callsThisMonth: 0,
        lastCallDate: undefined
      });
    });

    // Calculate stats for each user
    filteredCalls.forEach(call => {
      console.log('📞 Processing call for userId:', call.userId, 'agentId:', call.agentId, 'agentEmail:', call.agentEmail);
      let userStat = userStatsMap.get(call.userId);
      
      // If no user found by userId, try to find by agent email
      if (!userStat && call.agentEmail) {
        console.log('🔍 Trying to find user by agent email:', call.agentEmail);
        const userByEmail = users.find(user => user.email === call.agentEmail);
        if (userByEmail) {
          console.log('✅ Found user by email:', userByEmail.uid);
          userStat = userStatsMap.get(userByEmail.uid);
        }
      }
      
      if (userStat) {
        console.log('✅ Found user stat for:', call.userId);
        userStat.totalCalls++;
        if (call.status === 'completed') userStat.completedCalls++;
        if (call.status === 'failed') userStat.failedCalls++;
        userStat.totalDuration += call.duration;
        userStat.totalCost += call.costIncurred;

        // Weekly and monthly stats
        if (call.startTime >= weekAgo) userStat.callsThisWeek++;
        if (call.startTime >= monthAgo) userStat.callsThisMonth++;

        // Update last call date
        if (!userStat.lastCallDate || call.startTime > userStat.lastCallDate) {
          userStat.lastCallDate = call.startTime;
        }
      } else {
        console.log('❌ No user stat found for userId:', call.userId);
        console.log('Available user IDs:', Array.from(userStatsMap.keys()));
        console.log('Available user emails:', users.map(u => u.email));
      }
    });

    // Calculate averages and success rates
    userStatsMap.forEach(userStat => {
      if (userStat.totalCalls > 0) {
        userStat.averageDuration = userStat.totalDuration / userStat.totalCalls;
        userStat.averageCost = userStat.totalCost / userStat.totalCalls;
        userStat.successRate = (userStat.completedCalls / userStat.totalCalls) * 100;
      }
    });

    // Convert to array and sort by total calls (users with calls first, then alphabetically)
    const userStatsArray = Array.from(userStatsMap.values())
      .sort((a, b) => {
        // First sort by total calls (descending)
        if (b.totalCalls !== a.totalCalls) {
          return b.totalCalls - a.totalCalls;
        }
        // Then sort alphabetically by name
        return a.userName.localeCompare(b.userName);
      });

    setUserStats(userStatsArray);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Call KPIs</h1>
                  <p className="text-sm text-gray-600">Track call performance and team metrics</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Date Range</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Time Period:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        )}

        {/* User Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Active Team Members</h3>
              <p className="text-sm text-gray-600">Performance summary for active team members</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.length}</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userStats.filter(user => user.totalCalls > 0).length}
                </div>
                <div className="text-sm text-gray-500">Users with Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {userStats.filter(user => user.totalCalls === 0).length}
                </div>
                <div className="text-sm text-gray-500">Users without Calls</div>
              </div>
            </div>
          </div>
        </div>
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.totalCalls}</p>
                </div>
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">{overallStats.callsToday} today</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">{overallStats.callsThisWeek} this week</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.successRate.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">{overallStats.completedCalls} completed</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-red-600">{overallStats.failedCalls} failed</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(Math.round(overallStats.averageDuration))}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Total: {formatDuration(overallStats.totalDuration)}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(overallStats.totalCost)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Avg: {formatCurrency(overallStats.averageCost)} per call</span>
              </div>
            </div>
          </div>
        )}

        {/* User Performance Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Team Performance</h3>
            <p className="text-sm text-gray-600">Individual call statistics and performance metrics for active team members</p>
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading performance data...</p>
            </div>
          ) : userStats.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-2">
                No users are registered in the system
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">This Week</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Call</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userStats.map((userStat) => (
                    <tr key={userStat.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userStat.userName}</div>
                            <div className="text-sm text-gray-500">{userStat.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{userStat.totalCalls}</div>
                        {userStat.totalCalls > 0 ? (
                          <div className="text-xs text-gray-500">
                            {userStat.completedCalls} completed, {userStat.failedCalls} failed
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">No calls made</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userStat.totalCalls > 0 ? (
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{userStat.successRate.toFixed(1)}%</div>
                            <div className={`ml-2 w-2 h-2 rounded-full ${
                              userStat.successRate >= 80 ? 'bg-green-500' :
                              userStat.successRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userStat.totalCalls > 0 ? (
                          <>
                            <div className="text-sm text-gray-900">{formatDuration(Math.round(userStat.averageDuration))}</div>
                            <div className="text-xs text-gray-500">Total: {formatDuration(userStat.totalDuration)}</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userStat.totalCalls > 0 ? (
                          <>
                            <div className="text-sm text-gray-900">{formatCurrency(userStat.totalCost)}</div>
                            <div className="text-xs text-gray-500">Avg: {formatCurrency(userStat.averageCost)}</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{userStat.callsThisWeek}</div>
                        <div className="text-xs text-gray-500">{userStat.callsThisMonth} this month</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userStat.lastCallDate ? userStat.lastCallDate.toLocaleDateString('no-NO') : 'Never'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {userStat.lastCallDate ? userStat.lastCallDate.toLocaleTimeString('no-NO', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : ''}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
