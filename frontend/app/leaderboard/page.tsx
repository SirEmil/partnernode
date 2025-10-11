'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Star,
  Crown,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  deals: number;
  revenue: number;
  avgDealValue: number;
  rank: number;
  avatar: string;
  change: number; // percentage change from previous week
  streak: number; // consecutive weeks
}

const dummyData: LeaderboardEntry[] = [
  {
    id: '1',
    name: 'Kristoffer Myhre',
    email: 'kristoffer@company.com',
    deals: 5,
    revenue: 33960, // 3x7990 + 1x6990 + 1x2990 = 23970 + 6990 + 2990 = 33960
    avgDealValue: 6792,
    rank: 1,
    avatar: '👑',
    change: 25.3,
    streak: 4
  },
  {
    id: '2',
    name: 'Camilla Solberg',
    email: 'camilla@company.com',
    deals: 4,
    revenue: 28960, // 3x7990 + 1x6990 = 23970 + 6990 = 28960
    avgDealValue: 7240,
    rank: 2,
    avatar: '🚀',
    change: 18.7,
    streak: 3
  },
  {
    id: '3',
    name: 'Henrik Bakken',
    email: 'henrik@company.com',
    deals: 4,
    revenue: 24980, // 2x7990 + 1x6990 + 1x2990 = 15980 + 6990 + 2990 = 24980
    avgDealValue: 6245,
    rank: 3,
    avatar: '⭐',
    change: 12.4,
    streak: 5
  },
  {
    id: '4',
    name: 'Marte Eriksen',
    email: 'marte@company.com',
    deals: 3,
    revenue: 20970, // 2x7990 + 1x6990 = 15980 + 6990 = 20970
    avgDealValue: 6990,
    rank: 4,
    avatar: '💎',
    change: 8.9,
    streak: 2
  },
  {
    id: '5',
    name: 'Andreas Haugen',
    email: 'andreas@company.com',
    deals: 3,
    revenue: 18980, // 1x7990 + 1x6990 + 1x2990 = 7990 + 6990 + 2990 = 18980
    avgDealValue: 6327,
    rank: 5,
    avatar: '🔥',
    change: 5.2,
    streak: 3
  },
  {
    id: '6',
    name: 'Silje Nordby',
    email: 'silje@company.com',
    deals: 3,
    revenue: 14980, // 1x7990 + 1x6990 = 7990 + 6990 = 14980
    avgDealValue: 4993,
    rank: 6,
    avatar: '⚡',
    change: 2.1,
    streak: 1
  },
  {
    id: '7',
    name: 'Thomas Aas',
    email: 'thomas@company.com',
    deals: 2,
    revenue: 10980, // 1x7990 + 1x2990 = 7990 + 2990 = 10980
    avgDealValue: 5490,
    rank: 7,
    avatar: '🎯',
    change: -3.4,
    streak: 2
  },
  {
    id: '8',
    name: 'Ingrid Fossum',
    email: 'ingrid@company.com',
    deals: 2,
    revenue: 9980, // 1x6990 + 1x2990 = 6990 + 2990 = 9980
    avgDealValue: 4990,
    rank: 8,
    avatar: '🌟',
    change: -8.7,
    streak: 1
  }
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-500" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />;
    case 3:
      return <Award className="w-6 h-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  }
};

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    case 2:
      return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    case 3:
      return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
    default:
      return 'bg-gradient-to-r from-blue-500 to-blue-700 text-white';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Leaderboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(dummyData);

  useEffect(() => {
    if (!loading && (!user || user.authLevel !== 1)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || user.authLevel !== 1) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8 text-yellow-500 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">Google Profiles Sales</h1>
            </div>
            <p className="text-lg text-gray-600 mb-4">
              🏆 Last week's top performers - Keep closing those deals! 🚀
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-yellow-600">{formatCurrency(163790)}</p>
                  </div>
                  <DollarSign className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Deals</p>
                    <p className="text-xl font-bold text-green-600">26</p>
                  </div>
                  <Target className="w-6 h-6 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Sellers</p>
                    <p className="text-xl font-bold text-blue-600">8</p>
                  </div>
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Avg. Deal Value</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(6300)}</p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-3">
          {leaderboardData.map((entry, index) => (
            <div
              key={entry.id}
              className={`group relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md ${
                entry.rank <= 3
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  {/* Rank and Avatar */}
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getRankBadge(entry.rank)}`}>
                      {entry.rank <= 3 ? (
                        getRankIcon(entry.rank)
                      ) : (
                        <span className="text-sm font-bold">#{entry.rank}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-xl">{entry.avatar}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{entry.name}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-8">
                    {/* Deals */}
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="text-lg font-bold text-gray-900">{entry.deals}</span>
                      </div>
                      <p className="text-green-600 text-xs font-medium">Deals</p>
                    </div>

                    {/* Revenue */}
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-yellow-500" />
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(entry.revenue)}</span>
                      </div>
                      <p className="text-yellow-600 text-xs font-medium">Revenue</p>
                    </div>

                    {/* Avg Deal Value */}
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(entry.avgDealValue)}</span>
                      </div>
                      <p className="text-blue-600 text-xs font-medium">Avg Deal</p>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Star className="w-3 h-3 text-purple-500" />
                    <span className="text-purple-600 text-xs font-medium">Products Sold:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md border border-green-200">
                      Standard Google
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md border border-blue-200">
                      Katalog opprydding
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Motivational Footer */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-3">🎯 Keep Pushing Forward!</h2>
            <p className="text-gray-600 mb-4">
              Every close counts, every deal matters. You're building something amazing! 💪
            </p>
            <div className="flex justify-center space-x-6">
              <div className="flex items-center space-x-2 text-yellow-600">
                <Trophy className="w-4 h-4" />
                <span className="font-medium text-sm">Champions Rise</span>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium text-sm">Growth Mindset</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <Zap className="w-4 h-4" />
                <span className="font-medium text-sm">Unstoppable Energy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
