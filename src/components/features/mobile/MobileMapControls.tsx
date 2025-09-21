import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Minimize,
  Navigation, 
  MapPin, 
  Layers, 
  Eye, 
  EyeOff,
  Compass,
  Target,
  Settings,
  Smartphone,
  Vibrate,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Crosshair,
  Move3D,
  RotateCw
} from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface MapControlsState {
  showTraffic: boolean;
  showSatellite: boolean;
  showTerrain: boolean;
  showLabels: boolean;
  nightMode: boolean;
  followUser: boolean;
  autoRotate: boolean;
  showCompass: boolean;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  zoomLevel: number;
  tilt: number;
  bearing: number;
}

interface MobileMapControlsProps {
  className?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onToggleFullscreen?: () => void;
  onCenterOnUser?: () => void;
  onSettingsChange?: (settings: Partial<MapControlsState>) => void;
  isFullscreen?: boolean;
  showAdvancedControls?: boolean;
  compact?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'floating';
}

const MobileMapControls: React.FC<MobileMapControlsProps> = ({
  className = "",
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleFullscreen,
  onCenterOnUser,
  onSettingsChange,
  isFullscreen = false,
  showAdvancedControls = false,
  compact = false,
  position = 'top-right'
}) => {
  const { isMobile } = useResponsive();
  
  const [controlsState, setControlsState] = useState<MapControlsState>({
    showTraffic: false,
    showSatellite: false,
    showTerrain: false,
    showLabels: true,
    nightMode: false,
    followUser: true,
    autoRotate: false,
    showCompass: true,
    vibrationEnabled: true,
    soundEnabled: false,
    zoomLevel: 13,
    tilt: 0,
    bearing: 0
  });

  const [showSettings, setShowSettings] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Update control state
  const updateSetting = useCallback(<K extends keyof MapControlsState>(
    key: K, 
    value: MapControlsState[K]
  ) => {
    const newState = { ...controlsState, [key]: value };
    setControlsState(newState);
    onSettingsChange?.({ [key]: value });
  }, [controlsState, onSettingsChange]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(20, controlsState.zoomLevel + 1);
    updateSetting('zoomLevel', newZoom);
    onZoomIn?.();
  }, [controlsState.zoomLevel, updateSetting, onZoomIn]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(1, controlsState.zoomLevel - 1);
    updateSetting('zoomLevel', newZoom);
    onZoomOut?.();
  }, [controlsState.zoomLevel, updateSetting, onZoomOut]);

  // Handle reset view
  const handleResetView = useCallback(() => {
    updateSetting('bearing', 0);
    updateSetting('tilt', 0);
    updateSetting('zoomLevel', 13);
    onResetView?.();
  }, [updateSetting, onResetView]);

  // Handle user location tracking
  const handleCenterOnUser = useCallback(() => {
    setIsTracking(true);
    updateSetting('followUser', true);
    onCenterOnUser?.();
    
    // Provide haptic feedback if enabled
    if (controlsState.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => setIsTracking(false), 1000);
  }, [controlsState.vibrationEnabled, updateSetting, onCenterOnUser]);

  // Get position classes
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-[1000]';
    
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'floating':
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  // Basic control buttons
  const BasicControls = () => (
    <div className={cn(
      'flex flex-col gap-2',
      compact ? 'gap-1' : 'gap-2'
    )}>
      {/* Zoom Controls */}
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          onClick={handleZoomIn}
          disabled={controlsState.zoomLevel >= 20}
        >
          <ZoomIn className={cn('w-4 h-4', compact && 'w-3 h-3')} />
        </Button>
        
        {!compact && (
          <div className="text-xs text-center py-1 bg-background/90 backdrop-blur-sm rounded border">
            {controlsState.zoomLevel}
          </div>
        )}
        
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          onClick={handleZoomOut}
          disabled={controlsState.zoomLevel <= 1}
        >
          <ZoomOut className={cn('w-4 h-4', compact && 'w-3 h-3')} />
        </Button>
      </div>

      {/* Location & Reset Controls */}
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn(
            'bg-background/90 backdrop-blur-sm shadow-lg',
            isTracking && 'bg-blue-100 border-blue-300',
            controlsState.followUser && 'bg-blue-50 border-blue-200'
          )}
          onClick={handleCenterOnUser}
        >
          <Navigation className={cn(
            'w-4 h-4', 
            compact && 'w-3 h-3',
            isTracking && 'animate-pulse'
          )} />
        </Button>
        
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          onClick={handleResetView}
        >
          <RotateCcw className={cn('w-4 h-4', compact && 'w-3 h-3')} />
        </Button>
      </div>

      {/* Fullscreen & Settings */}
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className={cn('w-4 h-4', compact && 'w-3 h-3')} />
          ) : (
            <Maximize className={cn('w-4 h-4', compact && 'w-3 h-3')} />
          )}
        </Button>
        
        {showAdvancedControls && (
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            className={cn(
              'bg-background/90 backdrop-blur-sm shadow-lg',
              showSettings && 'bg-orange-50 border-orange-200'
            )}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className={cn('w-4 h-4', compact && 'w-3 h-3')} />
          </Button>
        )}
      </div>
    </div>
  );

  // Advanced settings panel
  const AdvancedSettings = () => (
    <Card className="w-80 bg-background/95 backdrop-blur-md shadow-xl border-orange-200">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Map Settings
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(false)}
          >
            ×
          </Button>
        </div>

        {/* Layer Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Map Layers
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Traffic</span>
              <Switch 
                checked={controlsState.showTraffic}
                onCheckedChange={(checked) => updateSetting('showTraffic', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Satellite View</span>
              <Switch 
                checked={controlsState.showSatellite}
                onCheckedChange={(checked) => updateSetting('showSatellite', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Terrain</span>
              <Switch 
                checked={controlsState.showTerrain}
                onCheckedChange={(checked) => updateSetting('showTerrain', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Labels</span>
              <Switch 
                checked={controlsState.showLabels}
                onCheckedChange={(checked) => updateSetting('showLabels', checked)}
              />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            {controlsState.nightMode ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            Display
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Night Mode</span>
              <Switch 
                checked={controlsState.nightMode}
                onCheckedChange={(checked) => updateSetting('nightMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Compass</span>
              <Switch 
                checked={controlsState.showCompass}
                onCheckedChange={(checked) => updateSetting('showCompass', checked)}
              />
            </div>
          </div>
        </div>

        {/* Navigation Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Compass className="w-3 h-3" />
            Navigation
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Follow User</span>
              <Switch 
                checked={controlsState.followUser}
                onCheckedChange={(checked) => updateSetting('followUser', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto Rotate</span>
              <Switch 
                checked={controlsState.autoRotate}
                onCheckedChange={(checked) => updateSetting('autoRotate', checked)}
              />
            </div>
          </div>
        </div>

        {/* Feedback Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Feedback</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="w-3 h-3" />
                <span className="text-sm">Vibration</span>
              </div>
              <Switch 
                checked={controlsState.vibrationEnabled}
                onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {controlsState.soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span className="text-sm">Sound</span>
              </div>
              <Switch 
                checked={controlsState.soundEnabled}
                onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              />
            </div>
          </div>
        </div>

        {/* Advanced Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Move3D className="w-3 h-3" />
            Advanced
          </h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Map Tilt</span>
                <span>{controlsState.tilt}°</span>
              </div>
              <Slider
                value={[controlsState.tilt]}
                onValueChange={([value]) => updateSetting('tilt', value)}
                min={0}
                max={60}
                step={5}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Map Bearing</span>
                <span>{controlsState.bearing}°</span>
              </div>
              <Slider
                value={[controlsState.bearing]}
                onValueChange={([value]) => updateSetting('bearing', value)}
                min={0}
                max={360}
                step={15}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="pt-3 border-t">
          <div className="flex flex-wrap gap-2">
            {controlsState.followUser && (
              <Badge variant="secondary" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                Following
              </Badge>
            )}
            {controlsState.autoRotate && (
              <Badge variant="secondary" className="text-xs">
                <RotateCw className="w-3 h-3 mr-1" />
                Auto Rotate
              </Badge>
            )}
            {controlsState.nightMode && (
              <Badge variant="secondary" className="text-xs">
                <Moon className="w-3 h-3 mr-1" />
                Night Mode
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn(getPositionClasses(), className)}>
      <div className="flex gap-4">
        <BasicControls />
        
        {showSettings && showAdvancedControls && (
          <AdvancedSettings />
        )}
      </div>
    </div>
  );
};

export default MobileMapControls;