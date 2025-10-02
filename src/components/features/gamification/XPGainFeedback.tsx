/**
 * XP gain feedback and visual effects
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, Star, Target, Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPGainEvent {
    id: string;
    amount: number;
    source: string;
    multiplier?: number;
    bonus?: boolean;
    timestamp: number;
}

interface XPGainFeedbackProps {
    events: XPGainEvent[];
    onEventComplete?: (eventId: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
    className?: string;
}

export const XPGainFeedback: React.FC<XPGainFeedbackProps> = ({
    events,
    onEventComplete,
    position = 'top-right',
    className
}) => {
    const [visibleEvents, setVisibleEvents] = useState<XPGainEvent[]>([]);

    useEffect(() => {
        // Add new events to visible list
        const newEvents = events.filter(
            event => !visibleEvents.some(visible => visible.id === event.id)
        );

        if (newEvents.length > 0) {
            setVisibleEvents(prev => [...prev, ...newEvents]);
        }
    }, [events, visibleEvents]);

    const handleEventComplete = (eventId: string) => {
        setVisibleEvents(prev => prev.filter(event => event.id !== eventId));
        onEventComplete?.(eventId);
    };

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            case 'center':
                return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
            default:
                return 'top-4 right-4';
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source.toLowerCase()) {
            case 'route_complete':
            case 'route':
                return <Target className="w-4 h-4" />;
            case 'territory_claim':
            case 'territory':
                return <Trophy className="w-4 h-4" />;
            case 'achievement':
                return <Star className="w-4 h-4" />;
            case 'streak':
            case 'streak_bonus':
                return <Flame className="w-4 h-4" />;
            case 'challenge':
                return <Zap className="w-4 h-4" />;
            default:
                return <Plus className="w-4 h-4" />;
        }
    };

    const getSourceColor = (source: string, bonus?: boolean) => {
        if (bonus) return 'from-yellow-400 to-orange-500';

        switch (source.toLowerCase()) {
            case 'route_complete':
            case 'route':
                return 'from-blue-400 to-blue-600';
            case 'territory_claim':
            case 'territory':
                return 'from-purple-400 to-purple-600';
            case 'achievement':
                return 'from-yellow-400 to-yellow-600';
            case 'streak':
            case 'streak_bonus':
                return 'from-orange-400 to-red-500';
            case 'challenge':
                return 'from-green-400 to-green-600';
            default:
                return 'from-gray-400 to-gray-600';
        }
    };

    const formatSource = (source: string) => {
        return source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className={cn(
            'fixed z-40 pointer-events-none',
            getPositionClasses(),
            className
        )}>
            <div className="space-y-2">
                <AnimatePresence>
                    {visibleEvents.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{
                                opacity: 0,
                                scale: 0.5,
                                x: position.includes('right') ? 50 : -50,
                                y: 0
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                x: 0,
                                y: 0
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.8,
                                y: -20
                            }}
                            transition={{
                                duration: 0.4,
                                delay: index * 0.1,
                                ease: "easeOut"
                            }}
                            onAnimationComplete={() => {
                                // Auto-remove after 3 seconds when animation completes
                                setTimeout(() => {
                                    handleEventComplete(event.id);
                                }, 3000);
                            }}
                            className="relative"
                        >
                            {/* Main XP gain display */}
                            <div className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm',
                                'bg-gradient-to-r text-white font-semibold text-sm',
                                getSourceColor(event.source, event.bonus)
                            )}>
                                {/* Source icon */}
                                <div className="flex-shrink-0">
                                    {getSourceIcon(event.source)}
                                </div>

                                {/* XP amount */}
                                <div className="flex items-center gap-1">
                                    <span className="text-lg font-bold">
                                        +{event.amount.toLocaleString()}
                                    </span>
                                    <span className="text-xs opacity-90">XP</span>
                                </div>

                                {/* Multiplier indicator */}
                                {event.multiplier && event.multiplier > 1 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs">
                                        <Zap className="w-3 h-3" />
                                        <span>{event.multiplier}x</span>
                                    </div>
                                )}

                                {/* Bonus indicator */}
                                {event.bonus && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-400/20 rounded-full text-xs">
                                        <Star className="w-3 h-3" />
                                        <span>BONUS</span>
                                    </div>
                                )}
                            </div>

                            {/* Source label */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-center mt-1"
                            >
                                <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
                                    {formatSource(event.source)}
                                </span>
                            </motion.div>

                            {/* Sparkle effects */}
                            {event.bonus && (
                                <>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                                            initial={{
                                                x: '50%',
                                                y: '50%',
                                                scale: 0,
                                                opacity: 0
                                            }}
                                            animate={{
                                                x: `${50 + (Math.random() - 0.5) * 100}%`,
                                                y: `${50 + (Math.random() - 0.5) * 100}%`,
                                                scale: [0, 1, 0],
                                                opacity: [0, 1, 0]
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                delay: 0.3 + Math.random() * 0.5,
                                                ease: "easeOut"
                                            }}
                                        />
                                    ))}
                                </>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Hook for managing XP gain events
export const useXPGainFeedback = () => {
    const [events, setEvents] = useState<XPGainEvent[]>([]);

    const addXPGain = (
        amount: number,
        source: string,
        options?: {
            multiplier?: number;
            bonus?: boolean;
        }
    ) => {
        const event: XPGainEvent = {
            id: `xp-${Date.now()}-${Math.random()}`,
            amount,
            source,
            multiplier: options?.multiplier,
            bonus: options?.bonus,
            timestamp: Date.now()
        };

        setEvents(prev => [...prev, event]);
    };

    const removeEvent = (eventId: string) => {
        setEvents(prev => prev.filter(event => event.id !== eventId));
    };

    const clearEvents = () => {
        setEvents([]);
    };

    return {
        events,
        addXPGain,
        removeEvent,
        clearEvents
    };
};

// Floating XP number component for individual gains
interface FloatingXPProps {
    amount: number;
    x: number;
    y: number;
    onComplete?: () => void;
    color?: string;
}

export const FloatingXP: React.FC<FloatingXPProps> = ({
    amount,
    x,
    y,
    onComplete,
    color = 'text-blue-500'
}) => {
    return (
        <motion.div
            initial={{
                x,
                y,
                opacity: 1,
                scale: 0.8
            }}
            animate={{
                x: x + (Math.random() - 0.5) * 50,
                y: y - 60,
                opacity: 0,
                scale: 1.2
            }}
            transition={{
                duration: 1.5,
                ease: "easeOut"
            }}
            onAnimationComplete={onComplete}
            className={cn(
                'fixed pointer-events-none z-50 font-bold text-lg',
                color
            )}
            style={{ left: x, top: y }}
        >
            +{amount} XP
        </motion.div>
    );
};