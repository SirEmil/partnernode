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
  closes: number;
  revenue: number;
  products: string[];
  rank: number;
  avatar: string;
  change: number; // percentage change
  streak: number; // consecutive days
}

const dummyData: LeaderboardEntry[] = [
  {
    id: '1',
    name: 'Alexander Hansen',
    email: 'alexander@company.com',
    closes: 47,
    revenue: 2840000,
    products: ['Premium Package', 'Enterprise Solution', 'Basic Plan'],
    rank: 1,
    avatar: '👑',
    change: 23.5,
    streak: 12
  },
  {
    id: '2',
    name: 'Emma Johansen',
    email: 'emma@company.com',
    closes: 42,
    revenue: 2650000,
    products: ['Premium Package', 'Basic Plan', 'Starter Kit'],
    rank: 2,
    avatar: '🚀',
    change: 18.2,
    streak: 8
  },
  {
    id: '3',
    name: 'Lars Andersen',
    email: 'lars@company.com',
    closes: 38,
    revenue: 2320000,
    products: ['Enterprise Solution', 'Premium Package'],
    rank: 3,
    avatar: '⭐',
    change: 15.7,
    streak: 15
  },
  {
    id: '4',
    name: 'Sofia Larsen',
    email: 'sofia@company.com',
    closes: 35,
    revenue: 1980000,
    products: ['Basic Plan', 'Starter Kit', 'Premium Package'],
    rank: 4,
    avatar: '💎',
    change: 12.3,
    streak: 6
  },
  {
    id: '5',
    name: 'Magnus Olsen',
    email: 'magnus@company.com',
    closes: 32,
    revenue: 1870000,
    products: ['Enterprise Solution', 'Basic Plan'],
    rank: 5,
    avatar: '🔥',
    change: 8.9,
    streak: 9
  },
  {
    id: '6',
    name: 'Ingrid Berg',
    email: 'ingrid@company.com',
    closes: 29,
    revenue: 1650000,
    products: ['Premium Package', 'Starter Kit'],
    rank: 6,
    avatar: '⚡',
    change: 5.4,
    streak: 4
  },
  {
    id: '7',
    name: 'Erik Nilsen',
    email: 'erik@company.com',
    closes: 26,
    revenue: 1420000,
    products: ['Basic Plan', 'Premium Package'],
    rank: 7,
    avatar: '🎯',
    change: 2.1,
    streak: 7
  },
  {
    id: '8',
    name: 'Mia Pedersen',
    email: 'mia@company.com',
    closes: 23,
    revenue: 1280000,
    products: ['Starter Kit', 'Basic Plan'],
    rank: 8,
    avatar: '🌟',
    change: -1.2,
    streak: 3
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
              <h1 className="text-3xl font-bold text-gray-900">Sales Leaderboard</h1>
            </div>
            <p className="text-lg text-gray-600 mb-4">
              🏆 Top performers this month - Keep crushing those goals! 🚀
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-yellow-600">{formatCurrency(16010000)}</p>
                  </div>
                  <DollarSign className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Closes</p>
                    <p className="text-xl font-bold text-green-600">272</p>
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
                    <p className="text-gray-600 text-sm font-medium">Avg. Revenue</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(2001250)}</p>
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
                        <p className="text-gray-500 text-xs">{entry.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-6">
                    {/* Closes */}
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="text-lg font-bold text-gray-900">{entry.closes}</span>
                      </div>
                      <p className="text-green-600 text-xs font-medium">Closes</p>
                    </div>

                    {/* Revenue */}
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-yellow-500" />
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(entry.revenue)}</span>
                      </div>
                      <p className="text-yellow-600 text-xs font-medium">Revenue</p>
                    </div>

                    {/* Change */}
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className={`w-4 h-4 ${entry.change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-lg font-bold ${entry.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.change >= 0 ? '+' : ''}{entry.change}%
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs font-medium">Change</p>
                    </div>

                    {/* Streak */}
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <span className="text-lg font-bold text-gray-900">{entry.streak}</span>
                      </div>
                      <p className="text-orange-600 text-xs font-medium">Streak</p>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Star className="w-3 h-3 text-purple-500" />
                    <span className="text-purple-600 text-xs font-medium">Products:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {entry.products.map((product, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md border border-purple-200"
                      >
                        {product}
                      </span>
                    ))}
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
