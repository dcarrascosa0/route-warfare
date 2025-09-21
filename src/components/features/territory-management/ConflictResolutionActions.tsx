import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Crown, 
  Swords, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Shield,
  Target,
  User,
  Clock,
  MessageSquare,
  Send,
  Eye,
  Route,
  MapPin,
  TrendingUp,
  TrendingDown,
  Zap
} from "lucide-react";
import { Territory, TerritoryConflict } from "@/types/territory";
import { toast } from "sonner";

interface ConflictResolutionActionsProps {
  territory: Territory;
  conflicts: TerritoryConflict[];
  isOwned: boolean;
  onResolveConflict?: (conflictId: string, method: string, details?: any) => void;
  onViewRoute?: (routeId: string) => void;
  onRequestMediation?: (conflictId: string, message: string) => void;
  className?: string;
}

interface ResolutionMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  requiresConfirmation: boolean;
  requiresMessage?: boolean;
  availability: 'owner' | 'challenger' | 'both' | 'admin';
}

const ConflictResolutionActions: React.FC<ConflictResolutionActionsProps> = ({
  territory,
  conflicts,
  isOwned,
  onResolveConflict,
  onViewRoute,
  onRequestMediation,
  className = "",
}) => {
  const [selectedConflict, setSelectedConflict] = useState<TerritoryConflict | null>(null);
  const [resolutionMethod, setResolutionMethod] = useState<string>("");
  const [mediationMessage, setMediationMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Available resolution methods
  const resolutionMethods: ResolutionMethod[] = [
    {
      id: 'accept_challenge',
      name: 'Accept Challenge',
      description: 'Accept the competing route and transfer ownership',
      icon: CheckCircle,
      color: 'text-green-600',
      requiresConfirmation: true,
      availability: 'owner'
    },
    {
      id: 'reject_challenge',
      name: 'Reject Challenge',
      description: 'Reject the competing route and maintain ownership',
      icon: XCircle,
      color: 'text-red-600',
      requiresConfirmation: true,
      availability: 'owner'
    },
    {
      id: 'request_mediation',
      name: 'Request Mediation',
      description: 'Request admin mediation for complex disputes',
      icon: MessageSquare,
      color: 'text-blue-600',
      requiresConfirmation: false,
      requiresMessage: true,
      availability: 'both'
    },
    {
      id: 'withdraw_claim',
      name: 'Withdraw Claim',
      description: 'Withdraw your competing claim',
      icon: TrendingDown,
      color: 'text-orange-600',
      requiresConfirmation: true,
      availability: 'challenger'
    },
    {
      id: 'strengthen_claim',
      name: 'Strengthen Claim',
      description: 'Add additional route evidence to support your claim',
      icon: TrendingUp,
      color: 'text-purple-600',
      requiresConfirmation: false,
      availability: 'challenger'
    }
  ];

  // Get available methods for current user
  const getAvailableMethods = (conflict: TerritoryConflict) => {
    const userRole = isOwned ? 'owner' : 'challenger';
    return resolutionMethods.filter(method => 
      method.availability === userRole || method.availability === 'both'
    );
  };

  // Handle resolution action
  const handleResolveConflict = async (conflictId: string, methodId: string, details?: any) => {
    if (!onResolveConflict) return;

    setIsProcessing(true);
    try {
      await onResolveConflict(conflictId, methodId, details);
      toast.success("Conflict resolution action submitted successfully");
      setSelectedConflict(null);
      setResolutionMethod("");
      setMediationMessage("");
    } catch (error) {
      toast.error("Failed to process conflict resolution");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle mediation request
  const handleRequestMediation = async (conflictId: string) => {
    if (!onRequestMediation || !mediationMessage.trim()) return;

    setIsProcessing(true);
    try {
      await onRequestMediation(conflictId, mediationMessage);
      toast.success("Mediation request submitted");
      setMediationMessage("");
      setSelectedConflict(null);
    } catch (error) {
      toast.error("Failed to submit mediation request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Format conflict severity
  const getConflictSeverity = (conflict: TerritoryConflict) => {
    const overlapPercentage = (conflict.overlap_area_sqm / territory.area_sqm) * 100;
    if (overlapPercentage > 75) return { level: 'critical', color: 'bg-red-100 text-red-800' };
    if (overlapPercentage > 50) return { level: 'high', color: 'bg-orange-100 text-orange-800' };
    if (overlapPercentage > 25) return { level: 'medium', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'low', color: 'bg-blue-100 text-blue-800' };
  };

  // Format area
  const formatArea = (areaSqm: number) => {
    if (areaSqm >= 1000000) {
      return `${(areaSqm / 1000000).toFixed(2)} km²`;
    }
    return `${(areaSqm / 1000).toFixed(0)} m²`;
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (conflicts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-muted-foreground">No active conflicts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-orange-500" />
          Conflict Resolution
          <Badge variant="destructive" className="ml-auto">
            {conflicts.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conflicts.map((conflict) => {
          const severity = getConflictSeverity(conflict);
          const availableMethods = getAvailableMethods(conflict);

          return (
            <div key={conflict.id} className="border rounded-lg p-4 space-y-3">
              {/* Conflict header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-sm">Territory Conflict</span>
                    <Badge className={severity.color} variant="secondary">
                      {severity.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Detected {formatTimeAgo(conflict.detected_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewRoute?.(conflict.competing_route_id)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Route
                </Button>
              </div>

              {/* Conflict details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Overlap Area:</span>
                  <div className="font-medium">{formatArea(conflict.overlap_area_sqm)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Challenger:</span>
                  <div className="font-medium">{conflict.challenger_username}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Route Quality:</span>
                  <div className="font-medium">{conflict.route_quality_score}/100</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="font-medium capitalize">{conflict.status}</div>
                </div>
              </div>

              {/* Resolution actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {availableMethods.map((method) => {
                  const IconComponent = method.icon;
                  
                  return (
                    <Dialog key={method.id}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedConflict(conflict);
                            setResolutionMethod(method.id);
                          }}
                        >
                          <IconComponent className={`w-3 h-3 mr-1 ${method.color}`} />
                          {method.name}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <IconComponent className={`w-5 h-5 ${method.color}`} />
                            {method.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>

                          {/* Conflict summary */}
                          <div className="bg-muted rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium text-sm">
                                Territory: {territory.name || `Territory ${territory.id.slice(0, 8)}`}
                              </span>
                            </div>
                            <div className="text-xs space-y-1">
                              <div>Overlap: {formatArea(conflict.overlap_area_sqm)}</div>
                              <div>Challenger: {conflict.challenger_username}</div>
                              <div>Detected: {formatTimeAgo(conflict.detected_at)}</div>
                            </div>
                          </div>

                          {/* Message input for mediation */}
                          {method.requiresMessage && (
                            <div className="space-y-2">
                              <Label htmlFor="mediation-message">Message</Label>
                              <Textarea
                                id="mediation-message"
                                placeholder="Describe the issue and why mediation is needed..."
                                value={mediationMessage}
                                onChange={(e) => setMediationMessage(e.target.value)}
                                rows={3}
                              />
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedConflict(null);
                                setResolutionMethod("");
                                setMediationMessage("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                if (method.requiresMessage) {
                                  handleRequestMediation(conflict.id);
                                } else {
                                  handleResolveConflict(conflict.id, method.id);
                                }
                              }}
                              disabled={isProcessing || (method.requiresMessage && !mediationMessage.trim())}
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              {method.requiresMessage ? 'Send Request' : 'Confirm'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Help text */}
        <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-orange-500" />
            <div>
              <p className="font-medium mb-1">Conflict Resolution Guide:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Accept Challenge:</strong> Transfer ownership to challenger</li>
                <li>• <strong>Reject Challenge:</strong> Maintain current ownership</li>
                <li>• <strong>Request Mediation:</strong> Get admin help for complex disputes</li>
                <li>• <strong>Withdraw/Strengthen:</strong> Modify your competing claim</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConflictResolutionActions;