import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, ExternalLink } from 'lucide-react';

interface LeaderboardPreviewEntry {
  rank: number;
  username: string;
  score: number;
  user_id: string;
}

interface LeaderboardPreviewProps {
  title: string;
  entries: LeaderboardPreviewEntry[];
  isLoading?: boolean;
  error?: Error | null;
  category: 'territory' | 'routes';
  formatScore?: (score: number) => string;
  className?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const defaultFormatScore = (score: number, category: string) => {
  switch (category) {
    case 'territory':
      return `${score.toFixed(2)} km²`;
    case 'routes':
      return `${Math.round(score)} routes`;

    default:
      return score.toString();
  }
};

export const LeaderboardPreview: React.FC<LeaderboardPreviewProps> = ({
  title,
  entries,
  isLoading = false,
  error = null,
  category,
  formatScore,
  className = ''
}) => {
  const scoreFormatter = formatScore || ((score: number) => defaultFormatScore(score, category));

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <p className="text-sm">Failed to load leaderboard</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/leaderboard">
                View Full Leaderboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-lg">{title}</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/leaderboard" className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              View All
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="w-24 h-4" />
                </div>
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.slice(0, 3).map((entry) => (
              <div
                key={entry.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-6 h-6">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">
                    {entry.username}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">
                    {scoreFormatter(entry.score)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No leaderboard data available</p>
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/leaderboard" className="flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4" />
              View Full Leaderboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardPreview;