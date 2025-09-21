/**
 * Notification sound manager for playing audio feedback on game events.
 * Provides different sounds for different notification types and priorities.
 */

export type NotificationSoundType = 
  | 'territory_claimed'
  | 'territory_attacked' 
  | 'route_completed'
  | 'achievement_unlocked'
  | 'system_announcement'
  | 'default';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  pattern?: number[];
}

const SOUND_CONFIGS: Record<NotificationSoundType, SoundConfig> = {
  territory_claimed: {
    frequency: 800,
    duration: 300,
    volume: 0.3,
    pattern: [200, 100, 200],
  },
  territory_attacked: {
    frequency: 400,
    duration: 500,
    volume: 0.5,
    pattern: [100, 50, 100, 50, 200],
  },
  route_completed: {
    frequency: 600,
    duration: 400,
    volume: 0.4,
    pattern: [150, 75, 150, 75, 300],
  },
  achievement_unlocked: {
    frequency: 1000,
    duration: 600,
    volume: 0.4,
    pattern: [100, 50, 200, 50, 300],
  },
  system_announcement: {
    frequency: 500,
    duration: 200,
    volume: 0.3,
    pattern: [200],
  },
  default: {
    frequency: 600,
    duration: 200,
    volume: 0.3,
    pattern: [200],
  },
};

const PRIORITY_VOLUME_MULTIPLIERS: Record<NotificationPriority, number> = {
  LOW: 0.5,
  NORMAL: 1.0,
  HIGH: 1.3,
  URGENT: 1.6,
};

class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private masterVolume = 1.0;
  
  constructor() {
    // Initialize audio context on first user interaction
    this.initializeAudioContext();
  }
  
  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context on user interaction if suspended
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          this.audioContext?.resume();
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('keydown', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }
  
  /**
   * Play a notification sound based on type and priority
   */
  async playNotificationSound(
    type: NotificationSoundType = 'default',
    priority: NotificationPriority = 'NORMAL'
  ): Promise<void> {
    if (!this.isEnabled || !this.audioContext) {
      return;
    }
    
    try {
      const config = SOUND_CONFIGS[type];
      const volumeMultiplier = PRIORITY_VOLUME_MULTIPLIERS[priority];
      const volume = Math.min(1.0, config.volume * volumeMultiplier * this.masterVolume);
      
      if (config.pattern && config.pattern.length > 1) {
        await this.playPatternSound(config, volume);
      } else {
        await this.playSimpleSound(config, volume);
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }
  
  private async playSimpleSound(config: SoundConfig, volume: number): Promise<void> {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + config.duration / 1000);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + config.duration / 1000);
    
    return new Promise(resolve => {
      oscillator.onended = () => resolve();
    });
  }
  
  private async playPatternSound(config: SoundConfig, volume: number): Promise<void> {
    if (!this.audioContext || !config.pattern) return;
    
    let currentTime = this.audioContext.currentTime;
    
    for (let i = 0; i < config.pattern.length; i++) {
      const duration = config.pattern[i] / 1000;
      
      if (i % 2 === 0) {
        // Play tone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(config.frequency, currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration - 0.01);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);
      }
      // Else: silence (pause)
      
      currentTime += duration;
    }
    
    return new Promise(resolve => {
      setTimeout(resolve, config.pattern!.reduce((sum, duration) => sum + duration, 0));
    });
  }
  
  /**
   * Play a custom sound for testing
   */
  async playTestSound(): Promise<void> {
    await this.playNotificationSound('default', 'NORMAL');
  }
  
  /**
   * Enable or disable notification sounds
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Check if sounds are enabled
   */
  isAudioEnabled(): boolean {
    return this.isEnabled && !!this.audioContext;
  }
  
  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Get current master volume
   */
  getVolume(): number {
    return this.masterVolume;
  }
  
  /**
   * Check if audio context is available and ready
   */
  isAudioContextReady(): boolean {
    return !!this.audioContext && this.audioContext.state === 'running';
  }
  
  /**
   * Resume audio context if suspended
   */
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Global instance
export const notificationSounds = new NotificationSoundManager();

// Convenience functions
export const playTerritoryClaimedSound = (priority: NotificationPriority = 'NORMAL') =>
  notificationSounds.playNotificationSound('territory_claimed', priority);

export const playTerritoryAttackedSound = (priority: NotificationPriority = 'HIGH') =>
  notificationSounds.playNotificationSound('territory_attacked', priority);

export const playRouteCompletedSound = (priority: NotificationPriority = 'NORMAL') =>
  notificationSounds.playNotificationSound('route_completed', priority);

export const playAchievementUnlockedSound = (priority: NotificationPriority = 'HIGH') =>
  notificationSounds.playNotificationSound('achievement_unlocked', priority);

export const playSystemAnnouncementSound = (priority: NotificationPriority = 'NORMAL') =>
  notificationSounds.playNotificationSound('system_announcement', priority);