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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-yellow-400 mr-3" />
              <h1 className="text-4xl font-bold text-white">Sales Leaderboard</h1>
            </div>
            <p className="text-xl text-blue-200 mb-6">
              🏆 Top performers this month - Keep crushing those goals! 🚀
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-yellow-400">{formatCurrency(16010000)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm font-medium">Total Closes</p>
                    <p className="text-2xl font-bold text-green-400">272</p>
                  </div>
                  <Target className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Active Sellers</p>
                    <p className="text-2xl font-bold text-blue-400">8</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Avg. Revenue</p>
                    <p className="text-2xl font-bold text-purple-400">{formatCurrency(2001250)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {leaderboardData.map((entry, index) => (
            <div
              key={entry.id}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                entry.rank <= 3
                  ? 'bg-gradient-to-r from-white/10 to-white/5 border-white/20 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {/* Background glow for top 3 */}
              {entry.rank <= 3 && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-transparent to-yellow-400/10 opacity-50" />
              )}
              
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  {/* Rank and Avatar */}
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadge(entry.rank)}`}>
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{entry.avatar}</div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{entry.name}</h3>
                        <p className="text-blue-200 text-sm">{entry.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-8">
                    {/* Closes */}
                    <div className="text-center">
                      <div className="flex items-center space-x-2 mb-1">
                        <Target className="w-5 h-5 text-green-400" />
                        <span className="text-2xl font-bold text-white">{entry.closes}</span>
                      </div>
                      <p className="text-green-300 text-sm font-medium">Closes</p>
                    </div>

                    {/* Revenue */}
                    <div className="text-center">
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                        <span className="text-2xl font-bold text-white">{formatCurrency(entry.revenue)}</span>
                      </div>
                      <p className="text-yellow-300 text-sm font-medium">Revenue</p>
                    </div>

                    {/* Change */}
                    <div className="text-center">
                      <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp className={`w-5 h-5 ${entry.change >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                        <span className={`text-2xl font-bold ${entry.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.change >= 0 ? '+' : ''}{entry.change}%
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm font-medium">Change</p>
                    </div>

                    {/* Streak */}
                    <div className="text-center">
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-5 h-5 text-orange-400" />
                        <span className="text-2xl font-bold text-white">{entry.streak}</span>
                      </div>
                      <p className="text-orange-300 text-sm font-medium">Day Streak</p>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 text-sm font-medium">Products Sold:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.products.map((product, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 text-sm rounded-full border border-purple-400/30"
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
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 border border-indigo-400/30">
            <h2 className="text-2xl font-bold text-white mb-4">🎯 Keep Pushing Forward!</h2>
            <p className="text-indigo-200 text-lg mb-6">
              Every close counts, every deal matters. You're building something amazing! 💪
            </p>
            <div className="flex justify-center space-x-4">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">Champions Rise</span>
              </div>
              <div className="flex items-center space-x-2 text-green-400">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Growth Mindset</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-400">
                <Zap className="w-5 h-5" />
                <span className="font-medium">Unstoppable Energy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
