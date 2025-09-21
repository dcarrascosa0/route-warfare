import React from 'react';
import { toast } from 'sonner';
import {
  Shield,
  Swords,
  Crown,
  AlertTriangle,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Territory, TerritoryEvent } from '@/types/territory';

interface TerritoryNotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showActions?: boolean;
}

export class TerritoryNotificationManager {
  private static instance: TerritoryNotificationManager;
  private userId: string | null = null;

  private constructor() {
    this.userId = localStorage.getItem('user_id');
  }

  public static getInstance(): TerritoryNotificationManager {
    if (!TerritoryNotificationManager.instance) {
      TerritoryNotificationManager.instance = new TerritoryNotificationManager();
    }
    return TerritoryNotificationManager.instance;
  }

  public setUserId(userId: string | null) {
    this.userId = userId;
  }

  public showTerritoryNotification(
    event: TerritoryEvent,
    options: TerritoryNotificationOptions = {}
  ) {
    const { territory, type, user_id, username } = event;
    const { duration = 5000, showActions = true } = options;
    
    const isOwned = territory.owner_id === this.userId;
    const isUserAction = user_id === this.userId;
    const territoryName = territory.name || `Territory ${territory.id.slice(0, 8)}`;
    const actorName = username || (isUserAction ? 'You' : 'Someone');

    switch (type) {
      case 'territory_claimed':
        this.showClaimedNotification(territory, territoryName, actorName, isOwned, isUserAction, duration, showActions);
        break;
      
      case 'territory_attacked':
        this.showAttackedNotification(territory, territoryName, actorName, isOwned, isUserAction, duration, showActions);
        break;
      
      case 'territory_contested':
        this.showContestedNotification(territory, territoryName, actorName, isOwned, isUserAction, duration, showActions);
        break;
      
      case 'territory_lost':
        this.showLostNotification(territory, territoryName, actorName, isOwned, isUserAction, duration, showActions);
        break;
      
      default:
        console.warn('Unknown territory event type:', type);
    }
  }

  private showClaimedNotification(
    territory: Territory,
    territoryName: string,
    actorName: string,
    isOwned: boolean,
    isUserAction: boolean,
    duration: number,
    showActions: boolean
  ) {
    if (isUserAction) {
      toast.success('Territory Claimed!', {
        description: `You successfully claimed ${territoryName}`,
        duration,
        icon: <Crown className="w-4 h-4" />,
        action: showActions ? {
          label: 'View',
          onClick: () => this.navigateToTerritory(territory.id),
        } : undefined,
      });
    } else if (isOwned) {
      // This shouldn't happen in normal flow, but handle it
      toast.info('Territory Updated', {
        description: `${territoryName} ownership has been updated`,
        duration,
        icon: <Shield className="w-4 h-4" />,
      });
    } else {
      toast.info('New Territory Claimed', {
        description: `${actorName} claimed ${territoryName}`,
        duration,
        icon: <Crown className="w-4 h-4" />,
        action: showActions ? {
          label: 'Challenge',
          onClick: () => this.challengeTerritory(territory.id),
        } : undefined,
      });
    }
  }

  private showAttackedNotification(
    territory: Territory,
    territoryName: string,
    actorName: string,
    isOwned: boolean,
    isUserAction: boolean,
    duration: number,
    showActions: boolean
  ) {
    if (isOwned && !isUserAction) {
      toast.error('Territory Under Attack!', {
        description: `${actorName} is attacking ${territoryName}`,
        duration,
        icon: <Swords className="w-4 h-4" />,
        action: showActions ? {
          label: 'Defend',
          onClick: () => this.defendTerritory(territory.id),
        } : undefined,
      });
    } else if (isUserAction) {
      toast.info('Attack Initiated', {
        description: `You are attacking ${territoryName}`,
        duration,
        icon: <Swords className="w-4 h-4" />,
      });
    } else {
      toast.info('Territory Battle', {
        description: `${territoryName} is under attack`,
        duration,
        icon: <Swords className="w-4 h-4" />,
        action: showActions ? {
          label: 'Join',
          onClick: () => this.joinBattle(territory.id),
        } : undefined,
      });
    }
  }

  private showContestedNotification(
    territory: Territory,
    territoryName: string,
    actorName: string,
    isOwned: boolean,
    isUserAction: boolean,
    duration: number,
    showActions: boolean
  ) {
    if (isOwned && !isUserAction) {
      toast.warning('Territory Contested', {
        description: `${territoryName} is being challenged by multiple players`,
        duration,
        icon: <AlertTriangle className="w-4 h-4" />,
        action: showActions ? {
          label: 'Defend',
          onClick: () => this.defendTerritory(territory.id),
        } : undefined,
      });
    } else {
      toast.info('Territory Contested', {
        description: `${territoryName} is now being contested`,
        duration,
        icon: <AlertTriangle className="w-4 h-4" />,
        action: showActions ? {
          label: 'Join Battle',
          onClick: () => this.joinBattle(territory.id),
        } : undefined,
      });
    }
  }

  private showLostNotification(
    territory: Territory,
    territoryName: string,
    actorName: string,
    isOwned: boolean,
    isUserAction: boolean,
    duration: number,
    showActions: boolean
  ) {
    if (isUserAction) {
      // User lost their own territory
      toast.error('Territory Lost', {
        description: `You lost control of ${territoryName}`,
        duration,
        icon: <Shield className="w-4 h-4" />,
        action: showActions ? {
          label: 'Reclaim',
          onClick: () => this.reclaimTerritory(territory.id),
        } : undefined,
      });
    } else {
      toast.info('Territory Changed Hands', {
        description: `${territoryName} has a new owner`,
        duration,
        icon: <TrendingUp className="w-4 h-4" />,
      });
    }
  }

  private navigateToTerritory(territoryId: string) {
    // Navigate to territory page or focus on territory
    console.log('Navigate to territory:', territoryId);
    // This could dispatch an event or call a callback
    window.dispatchEvent(new CustomEvent('focusTerritory', { detail: { territoryId } }));
  }

  private challengeTerritory(territoryId: string) {
    console.log('Challenge territory:', territoryId);
    toast.info('Challenge Mode', {
      description: 'Plan a route around this territory to contest it',
    });
  }

  private defendTerritory(territoryId: string) {
    console.log('Defend territory:', territoryId);
    toast.info('Defense Mode', {
      description: 'Create a route to reinforce your territory',
    });
  }

  private joinBattle(territoryId: string) {
    console.log('Join battle for territory:', territoryId);
    toast.info('Joining Battle', {
      description: 'Complete a route to join the contest',
    });
  }

  private reclaimTerritory(territoryId: string) {
    console.log('Reclaim territory:', territoryId);
    toast.info('Reclaim Mode', {
      description: 'Plan a route to reclaim your lost territory',
    });
  }
}

// Hook for using territory notifications
export const useTerritoryNotifications = () => {
  const manager = TerritoryNotificationManager.getInstance();
  
  React.useEffect(() => {
    const userId = localStorage.getItem('user_id');
    manager.setUserId(userId);
  }, [manager]);

  return {
    showNotification: (event: TerritoryEvent, options?: TerritoryNotificationOptions) => 
      manager.showTerritoryNotification(event, options),
  };
};

export default TerritoryNotificationManager;