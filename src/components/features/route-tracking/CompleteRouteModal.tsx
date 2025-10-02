import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, RefreshCw, Shield, Trophy } from 'lucide-react';
import { CompleteRouteResponse } from '@/lib/api/types/routes';
import { Coordinate } from '@/lib/api/types/common';
import { TerritoryClaimingStatus } from '../territory/TerritoryClaimingStatus';
import { RouteCompletionMap } from './RouteCompletionMap';
import { RouteCompletionRewards } from './RouteCompletionRewards';

interface CompleteRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isCompleting?: boolean;
  completionResult?: CompleteRouteResponse | null;
  completionError?: string | null;
  onRetry?: () => void;
  coordinates?: Coordinate[];
}

export const CompleteRouteModal: React.FC<CompleteRouteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isCompleting = false,
  completionResult = null,
  completionError = null,
  onRetry,
  coordinates = []
}) => {
  const [routeName, setRouteName] = useState('');
  const [completionProgress, setCompletionProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Simulate completion progress when completing
  useEffect(() => {
    if (isCompleting) {
      setCompletionProgress(0);
      setCurrentStep('Saving route data...');
      
      const progressSteps = [
        { progress: 25, step: 'Saving route data...' },
        { progress: 50, step: 'Calculating statistics...' },
        { progress: 75, step: 'Processing territory claim...' },
        { progress: 90, step: 'Finalizing completion...' }
      ];

      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          const { progress, step } = progressSteps[stepIndex];
          setCompletionProgress(progress);
          setCurrentStep(step);
          stepIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isCompleting]);

  // Reset progress when completion finishes
  useEffect(() => {
    if (!isCompleting && (completionResult || completionError)) {
      setCompletionProgress(100);
      setCurrentStep(completionResult ? 'Route completed successfully!' : 'Completion failed');
    }
  }, [isCompleting, completionResult, completionError]);

  const handleConfirm = () => {
    if (routeName.trim()) {
      setRetryAttempts(0);
      onConfirm(routeName.trim());
    }
  };

  const handleClose = () => {
    setRouteName('');
    setCompletionProgress(0);
    setCurrentStep('');
    setRetryAttempts(0);
    onClose();
  };

  const handleRetry = () => {
    setRetryAttempts(prev => prev + 1);
    if (onRetry) {
      onRetry();
    } else if (routeName.trim()) {
      onConfirm(routeName.trim());
    }
  };

  const renderGamificationRewards = () => {
    if (!completionResult?.gamification) return null;

    return (
      <div className="mt-4">
        <RouteCompletionRewards 
          gamificationResults={completionResult.gamification}
        />
      </div>
    );
  };

  const renderTerritoryStatus = () => {
    if (!completionResult) return null;

    const { territory_claim_status, territory_claim, territory_conflicts, conflict_resolution, territory_claim_reason } = completionResult;

    if (!territory_claim_status) return null;

    return (
      <div className="mt-4">
        <TerritoryClaimingStatus
          status={territory_claim_status}
          reason={territory_claim_reason}
          territoryResult={territory_claim}
          conflicts={territory_conflicts}
          conflictResolution={conflict_resolution}
          gamificationResults={completionResult.gamification}
        />
        
        {/* Territory claiming retry button for failed claims */}
        {(territory_claim_status === 'failed' || territory_claim_status === 'error') && (
          <div className="mt-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              Territory claiming failed. You can retry claiming territory for this route.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isCompleting}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry Territory
            </Button>
          </div>
        )}
        
        {/* Show retry attempts if any */}
        {retryAttempts > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Retry attempts: {retryAttempts}
          </div>
        )}
      </div>
    );
  };

  const renderCompletionProgress = () => {
    if (!isCompleting) return null;

    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500 animate-spin" />
          <span className="text-sm font-medium text-gray-700">Completing Route</span>
        </div>
        
        <div className="space-y-2">
          <Progress value={completionProgress} className="w-full" />
          <div className="text-xs text-gray-600 flex items-center gap-1">
            {completionProgress < 100 && <Clock className="h-3 w-3 animate-spin" />}
            {currentStep}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div className={completionProgress >= 25 ? "text-green-600" : "text-gray-400"}>
            {completionProgress >= 25 ? "✓" : "○"} Saving route data
          </div>
          <div className={completionProgress >= 50 ? "text-green-600" : "text-gray-400"}>
            {completionProgress >= 50 ? "✓" : "○"} Calculating statistics
          </div>
          <div className={completionProgress >= 75 ? "text-green-600" : "text-gray-400"}>
            {completionProgress >= 75 ? "✓" : "○"} Processing territory claim
          </div>
          <div className={completionProgress >= 90 ? "text-green-600" : "text-gray-400"}>
            {completionProgress >= 90 ? "✓" : "○"} Finalizing completion
          </div>
        </div>

        {/* Show territory claiming status during processing */}
        <div className="border-t pt-3">
          <TerritoryClaimingStatus
            status="processing"
            showProgress={true}
            progressValue={Math.max(0, completionProgress - 25)} // Territory processing starts after 25%
          />
        </div>
      </div>
    );
  };

  const renderCompletionError = () => {
    if (!completionError) return null;

    const isTerritoryError = completionError.toLowerCase().includes('territory');

    return (
      <Alert className="mt-4 bg-red-50 border-red-200">
        <XCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-sm text-red-700 space-y-2">
          <div>{completionError}</div>
          
          {isTerritoryError && (
            <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
              <div className="font-medium mb-1">Territory Claiming Issue:</div>
              <div>The route was saved successfully, but territory claiming encountered an error. You can retry territory claiming without affecting your saved route.</div>
            </div>
          )}
          
          {retryAttempts > 0 && (
            <div className="text-xs text-gray-600">
              Failed attempts: {retryAttempts}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const isFormDisabled = isCompleting || !!completionResult;
  const showRetryButton = completionError && !isCompleting;
  const showCloseButton = completionResult || completionError;
  const hasSuccessfulCompletion = completionResult && !completionError;
  const hasTerritorySuccess = completionResult?.territory_claim_status === 'success';
  const hasTerritoryFailure = completionResult?.territory_claim_status === 'failed' || 
                             completionResult?.territory_claim_status === 'error';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasSuccessfulCompletion && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {completionError && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {isCompleting && (
              <Clock className="h-5 w-5 text-blue-500 animate-spin" />
            )}
            {completionResult ? 'Route Completed' : 'Complete Route'}
          </DialogTitle>
          
          {/* Show gamification rewards indicator in header */}
          {completionResult?.gamification && (
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <Trophy className="h-4 w-4" />
              +{completionResult.gamification.route_completion.xp_gained} XP earned
              {completionResult.gamification.route_completion.level_up && (
                <span className="ml-1 text-purple-600">• Level up!</span>
              )}
            </div>
          )}
          
          {/* Show territory success indicator in header */}
          {hasTerritorySuccess && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Shield className="h-4 w-4" />
              Territory claimed successfully
            </div>
          )}
          
          {/* Show territory failure indicator in header */}
          {hasTerritoryFailure && (
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <Shield className="h-4 w-4" />
              Route saved, territory claiming needs attention
            </div>
          )}
        </DialogHeader>

        <div className="flex gap-4 h-[500px]">
          {/* Map Section */}
          <div className="flex-1 h-full">
            <RouteCompletionMap 
              coordinates={coordinates}
              completionResult={completionResult}
              className="rounded-lg"
            />
          </div>

          {/* Form Section */}
          <div className="w-80 space-y-4 overflow-y-auto">
            <div>
              <Input
                placeholder="Enter route name"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            {renderCompletionProgress()}
            {renderGamificationRewards()}
            {renderTerritoryStatus()}
            {renderCompletionError()}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {showCloseButton ? (
            <div className="flex gap-2 w-full">
              <Button onClick={handleClose} className="flex-1">
                {hasSuccessfulCompletion ? 'Done' : 'Close'}
              </Button>
              
              {/* Show territory retry button in footer for failed territory claims */}
              {hasTerritoryFailure && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isCompleting}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry Territory
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isCompleting}>
                Cancel
              </Button>
              {showRetryButton ? (
                <Button onClick={handleRetry} disabled={!routeName.trim()}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              ) : (
                <Button onClick={handleConfirm} disabled={!routeName.trim() || isCompleting}>
                  {isCompleting ? (
                    <>
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    'Complete Route'
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
