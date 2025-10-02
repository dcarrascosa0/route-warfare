import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Crown,
  Medal,
  User,
  Route,
  Target,
  MapPin,
  Zap,
  Award,
  Flame,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaderboardPlayer {
  rank: number;
  name: string;
  score: number;
  totalArea: string;
  zones: number;
  routes: number;
  winRate: string;
  level: number;
  distance: string;
  xp: number;
  achievements: number;
  streak: number;
  prestige: number;
  title?: string;
  trend: "up" | "down" | "stable";
  rankChange?: number;
  badge: string | null;
  isCurrentUser: boolean;
  userId?: string;
  avatar?: string;
  lastActive?: string;
}

interface LeaderboardEntryProps {
  player: LeaderboardPlayer;
  category: "territory" | "routes" | "xp" | "level" | "achievements" | "streak" | "distance";
  showTrend?: boolean;
  showStats?: boolean;
  compact?: boolean;
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

export const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({
  player,
  category,
  showTrend = true,
  showStats = true,
  compact = false,
  onPlayerClick,
  className = ""
}) => {
  const getRankIcon = (rank: number, badge: string | null) => {
    if (badge === "Crown") return <Crown className="w-6 h-6 text-yellow-500" />;
    if (badge === "Trophy") return <Trophy className="w-6 h-6 text-gray-400" />;
    if (badge === "Medal") return <Medal className="w-6 h-6 text-amber-600" />;

    // Special styling for top 3 ranks
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;

    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getTrendIcon = (trend: string, rankChange?: number) => {
    if (trend === "up") {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          {rankChange && <span className="text-xs">+{rankChange}</span>}
        </div>
      );
    }
    if (trend === "down") {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="w-4 h-4" />
          {rankChange && <span className="text-xs">-{rankChange}</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <Minus className="w-4 h-4" />
        <span className="text-xs">0</span>
      </div>
    );
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-300";
    if (rank === 3) return "bg-amber-100 text-amber-800 border-amber-300";
    if (rank <= 10) return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-muted text-muted-foreground";
  };

  const getCategoryValue = () => {
    switch (category) {
      case "territory":
        return player.totalArea;
      case "routes":
        return player.routes.toString();

      case "xp":
        return `${player.xp.toLocaleString()} XP`;
      case "level":
        return `Level ${player.level}`;
      case "achievements":
        return `${player.achievements} achievements`;
      case "streak":
        return `${player.streak} days`;
      case "distance":
        return player.distance;
      default:
        return player.score.toString();
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case "territory":
        return <MapPin className="w-4 h-4" />;
      case "routes":
        return <Route className="w-4 h-4" />;

      case "xp":
        return <Zap className="w-4 h-4" />;
      case "level":
        return <Crown className="w-4 h-4" />;
      case "achievements":
        return <Award className="w-4 h-4" />;
      case "streak":
        return <Flame className="w-4 h-4" />;
      case "distance":
        return <Target className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const handleClick = () => {
    if (onPlayerClick && player.userId) {
      onPlayerClick(player.userId);
    }
  };

  const EntryContent = () => (
    <div
      className={cn(
        "h-[72px] flex items-center p-4 rounded-lg border transition-all duration-200",
        player.isCurrentUser
          ? "bg-primary/5 border-primary/20 shadow-sm"
          : "hover:bg-muted/50 hover:shadow-sm",
        compact && "h-[60px] p-3",
        onPlayerClick && "cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {/* Left Section - Rank, Avatar, Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Rank */}
          <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
            {getRankIcon(player.rank, player.badge)}
          </div>

          {/* Avatar */}
          <Avatar className={compact ? "h-8 w-8" : "h-9 w-9 flex-shrink-0"}>
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} />
            ) : (
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            )}
          </Avatar>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold truncate",
              compact ? "text-sm" : "text-base",
              player.isCurrentUser && "text-primary"
            )}>
              {player.name}
            </h3>
            {/* Badges and submetrics on subline */}
            <div className="flex items-center gap-2 mt-1">
              {player.isCurrentUser && (
                <Badge variant="secondary" className="text-xs opacity-70">
                  You
                </Badge>
              )}
              <Badge variant="outline" className="text-xs opacity-60">
                Level {player.level}
              </Badge>
              {showStats && !compact && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{player.zones} zone{player.zones !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{player.totalArea}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Right Section - Primary Metric in Large Type */}
      <div className="text-right flex-shrink-0">
          <div className={cn(
            "font-bold text-foreground",
            compact ? "text-xl" : "text-3xl",
            player.isCurrentUser && "text-primary"
          )}>
            {getCategoryValue()}
          </div>
          {showTrend && (
            <div className="flex items-center justify-end mt-1">
              {getTrendIcon(player.trend, player.rankChange)}
            </div>
          )}
        </div>



      {/* Compact stats for mobile */}
      {showStats && compact && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{player.zones}z</span>
          <span>•</span>
          <span>{player.routes}r</span>
          <span>•</span>
          <Badge variant="outline" className="text-xs opacity-60">
            L{player.level}
          </Badge>
        </div>
      )}
    </div>
  );

  // If userId is provided and onPlayerClick is not, wrap in Link
  if (player.userId && !onPlayerClick) {
    return (
      <Link to={`/profile/${player.userId}`} className="block">
        <EntryContent />
      </Link>
    );
  }

  return <EntryContent />;
};

export default LeaderboardEntry;