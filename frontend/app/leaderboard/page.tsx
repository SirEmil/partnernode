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
  skillLevel: number; // 1-10, affects performance
}

interface DummyUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  skillLevel: number; // 1-10, affects performance
}

// Dummy users with different skill levels
const dummyUsers: DummyUser[] = [
  { id: '1', name: 'Kristoffer Myhre', email: 'kristoffer@company.com', avatar: '👑', skillLevel: 10 },
  { id: '2', name: 'Camilla Solberg', email: 'camilla@company.com', avatar: '🚀', skillLevel: 9 },
  { id: '3', name: 'Henrik Bakken', email: 'henrik@company.com', avatar: '⭐', skillLevel: 8 },
  { id: '4', name: 'Marte Eriksen', email: 'marte@company.com', avatar: '💎', skillLevel: 8 },
  { id: '5', name: 'Andreas Haugen', email: 'andreas@company.com', avatar: '🔥', skillLevel: 7 },
  { id: '6', name: 'Silje Nordby', email: 'silje@company.com', avatar: '⚡', skillLevel: 7 },
  { id: '7', name: 'Thomas Aas', email: 'thomas@company.com', avatar: '🎯', skillLevel: 6 },
  { id: '8', name: 'Ingrid Fossum', email: 'ingrid@company.com', avatar: '🌟', skillLevel: 6 },
  { id: '9', name: 'Erik Nilsen', email: 'erik@company.com', avatar: '💪', skillLevel: 5 },
  { id: '10', name: 'Mia Pedersen', email: 'mia@company.com', avatar: '🎪', skillLevel: 5 }
];

// Pricing tiers
const PRICING_TIERS = [1990, 2990, 3990, 4990, 5990, 6990, 7990, 8990];

// Simple seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

// Generate realistic sales data for a user
function generateUserSales(user: DummyUser, weekNumber: number, year: number): LeaderboardEntry {
  const seed = weekNumber * 1000 + year + parseInt(user.id) * 100;
  const random = new SeededRandom(seed);

  // Skill level affects base performance
  const skillMultiplier = user.skillLevel / 10;
  const baseDeals = Math.floor(random.nextFloat(3, 8) * skillMultiplier);
  const deals = Math.max(1, Math.min(10, baseDeals + random.nextInt(-1, 2)));

  // Generate realistic pricing combinations
  let revenue = 0;
  const dealBreakdown: number[] = [];

  for (let i = 0; i < deals; i++) {
    // Higher skill = more premium deals
    // Skill level determines which tier range to use
    const skillMultiplier = user.skillLevel / 10;
    const tierIndex = Math.floor(random.nextFloat(0, PRICING_TIERS.length) * skillMultiplier);
    const adjustedTierIndex = Math.min(tierIndex, PRICING_TIERS.length - 1);
    
    // Add some randomness but bias towards higher tiers for skilled users
    const randomOffset = random.nextInt(-1, 1);
    const finalTierIndex = Math.max(0, Math.min(PRICING_TIERS.length - 1, adjustedTierIndex + randomOffset));
    
    const tier = PRICING_TIERS[finalTierIndex];
    revenue += tier;
    dealBreakdown.push(tier);
  }

  const avgDealValue = Math.round(revenue / deals);
  
  // Generate change based on skill and randomness
  const change = random.nextFloat(-15, 30) + (user.skillLevel - 5) * 2;
  
  // Generate streak based on skill
  const streak = Math.floor(random.nextFloat(1, 8) * skillMultiplier) + 1;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    deals,
    revenue,
    avgDealValue,
    rank: 0, // Will be set after sorting
    avatar: user.avatar,
    change: Math.round(change * 10) / 10,
    streak,
    skillLevel: user.skillLevel
  };
}

// Get current week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Generate leaderboard data
function generateLeaderboardData(debugWeek: number | null = null): LeaderboardEntry[] {
  const now = new Date();
  const weekNumber = debugWeek !== null ? debugWeek : getWeekNumber(now);
  const year = now.getFullYear();

  // Generate sales for all users
  const allSales = dummyUsers.map(user => generateUserSales(user, weekNumber, year));

  // Sort by revenue (descending) and take top 5
  const topSales = allSales
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

  return topSales;
}

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
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [debugWeek, setDebugWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.authLevel !== 1)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Generate leaderboard data when component mounts or debug week changes
    const data = generateLeaderboardData(debugWeek);
    setLeaderboardData(data);
  }, [debugWeek]);

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
            
            {/* Debug Week Changer */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-sm font-medium text-yellow-800">Debug Week:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDebugWeek(prev => Math.max(1, (prev || 1) - 1))}
                    className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-md hover:bg-yellow-300 transition-colors text-sm font-medium"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-900 rounded-md text-sm font-bold min-w-[60px] text-center">
                    {debugWeek || getWeekNumber(new Date())}
                  </span>
                  <button
                    onClick={() => setDebugWeek(prev => (prev || 1) + 1)}
                    className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-md hover:bg-yellow-300 transition-colors text-sm font-medium"
                  >
                    Next →
                  </button>
                  <button
                    onClick={() => setDebugWeek(null)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Current
                  </button>
                </div>
              </div>
              <p className="text-xs text-yellow-700 text-center mt-1">
                {debugWeek ? `Showing Week ${debugWeek} data` : 'Showing current week data'}
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {formatCurrency(leaderboardData.reduce((sum, entry) => sum + entry.revenue, 0))}
                    </p>
                  </div>
                  <DollarSign className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Deals</p>
                    <p className="text-xl font-bold text-green-600">
                      {leaderboardData.reduce((sum, entry) => sum + entry.deals, 0)}
                    </p>
                  </div>
                  <Target className="w-6 h-6 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Top Sellers</p>
                    <p className="text-xl font-bold text-blue-600">{leaderboardData.length}</p>
                  </div>
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Avg. Deal Value</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(
                        leaderboardData.length > 0 
                          ? Math.round(leaderboardData.reduce((sum, entry) => sum + entry.avgDealValue, 0) / leaderboardData.length)
                          : 0
                      )}
                    </p>
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
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md border border-purple-200">
                      Premium Package
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
