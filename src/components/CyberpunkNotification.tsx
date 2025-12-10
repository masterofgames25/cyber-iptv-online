
import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number;
}


interface CyberpunkNotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
  onRead: (id: string) => void;
  inList?: boolean;
}

const notificationConfig = {
  success: {
    icon: CheckCircleIcon,
    color: '#00FF00',
    glowColor: 'rgba(0, 255, 0, 0.3)',
    borderColor: 'rgba(0, 255, 0, 0.5)',
    bgColor: 'rgba(0, 255, 0, 0.1)',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    color: '#FFAA00',
    glowColor: 'rgba(255, 170, 0, 0.3)',
    borderColor: 'rgba(255, 170, 0, 0.5)',
    bgColor: 'rgba(255, 170, 0, 0.1)',
  },
  error: {
    icon: XMarkIcon,
    color: '#FF0040',
    glowColor: 'rgba(255, 0, 64, 0.3)',
    borderColor: 'rgba(255, 0, 64, 0.5)',
    bgColor: 'rgba(255, 0, 64, 0.1)',
  },
  info: {
    icon: InformationCircleIcon,
    color: '#00FFFF',
    glowColor: 'rgba(0, 255, 255, 0.3)',
    borderColor: 'rgba(0, 255, 255, 0.5)',
    bgColor: 'rgba(0, 255, 255, 0.1)',
  },
  system: {
    icon: SparklesIcon,
    color: '#FF00FF',
    glowColor: 'rgba(255, 0, 255, 0.3)',
    borderColor: 'rgba(255, 0, 255, 0.5)',
    bgColor: 'rgba(255, 0, 255, 0.1)',
  }
};

export const CyberpunkNotification = React.forwardRef<HTMLDivElement, CyberpunkNotificationProps>(({
  notification,
  onClose,
  onRead,
  inList = false
}, ref) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  useEffect(() => {
    if (!inList && notification.autoClose && notification.duration) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (notification.duration! / 100));
          if (newProgress <= 0) {
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification.autoClose, notification.duration, inList]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    if (notification.action) {
      notification.action.onClick();
    }
  };

  const getPriorityAnimation = () => {
    if (inList) return {}; // No continuous animation in list to avoid clutter
    switch (notification.priority) {
      case 'critical':
        return {
          scale: [1, 1.05, 1],
          transition: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' as const }
        };
      case 'high':
        return {
          boxShadow: [
            `0 0 20px ${config.glowColor}`,
            `0 0 40px ${config.glowColor}`,
            `0 0 20px ${config.glowColor}`
          ],
          transition: { duration: 1, repeat: Infinity }
        };
      default:
        return {};
    }
  };

  // Animation variants for list vs toast
  const variants = {
    initial: inList ? { opacity: 0, x: -20 } : { opacity: 0, x: 400, scale: 0.8 },
    animate: inList
      ? { opacity: 1, x: 0, scale: 1 }
      : { opacity: 1, x: 0, scale: 1, ...getPriorityAnimation() },
    exit: inList ? { opacity: 0, height: 0, marginBottom: 0 } : { opacity: 0, x: 400, scale: 0.8 }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={ref}
          layout={inList} // Enable layout animation for list reordering
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, type: 'spring' }}
          className={`
            relative mb-4 p-4 rounded-xl border backdrop-blur-sm
            ${notification.read ? 'opacity-80' : ''}
            ${inList ? 'mb-2' : 'mb-4'}
          `}
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
            boxShadow: inList ? 'none' : `0 0 20px ${config.glowColor}`
          }}
          onClick={handleClick}
        >

          {/* Progress bar for auto-close */}
          {notification.autoClose && (
            <div className="absolute top-0 left-0 h-1 bg-white/20 rounded-t-xl overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: config.color }}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}

          {/* Priority indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: config.color }}>
            {notification.priority === 'critical' && (
              <motion.div
                className="absolute inset-0"
                style={{ backgroundColor: config.color }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>

          <div className="flex items-start gap-3">
            {/* Icon */}
            <motion.div
              className="flex-shrink-0 p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
              animate={{
                rotate: notification.type === 'system' ? [0, 360] : 0,
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: notification.type === 'system' ? 2 : 0.5,
                repeat: notification.type === 'system' ? Infinity : 0
              }}
            >
              <Icon className="w-6 h-6" style={{ color: config.color }} />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white truncate">
                  {notification.title}
                </h4>
                <div className="flex items-center gap-2">
                  {/* Priority badge */}
                  <span className={`
                    px-2 py-1 text-xs rounded-full border
                    ${notification.priority === 'critical' ? 'bg-red-500/20 border-red-500 text-red-400' : ''}
                    ${notification.priority === 'high' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : ''}
                    ${notification.priority === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : ''}
                    ${notification.priority === 'low' ? 'bg-green-500/20 border-green-500 text-green-400' : ''}
                  `}>
                    {notification.priority.toUpperCase()}
                  </span>

                  {/* Close button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-white" />
                  </motion.button>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                {notification.message}
              </p>

              {/* Action button */}
              {notification.action && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1 text-xs rounded-lg border transition-all"
                  style={{
                    borderColor: config.color,
                    color: config.color,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = config.color;
                    (e.target as HTMLButtonElement).style.color = 'black';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                    (e.target as HTMLButtonElement).style.color = config.color;
                  }}
                >
                  {notification.action.label}
                </motion.button>
              )}

              {/* Timestamp */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {notification.timestamp.toLocaleTimeString('pt-BR')}
                </span>
                {!notification.read && (
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CyberpunkNotification.displayName = 'CyberpunkNotification';

// Notification Context
interface CyberpunkNotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const CyberpunkNotificationContext = React.createContext<CyberpunkNotificationContextType | undefined>(undefined);


export const CyberpunkNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      const now = Date.now();
      const duplicate = prev.some(n =>
        n.type === newNotification.type &&
        n.title === newNotification.title &&
        n.message === newNotification.message &&
        now - n.timestamp.getTime() < 5000
      );
      return duplicate ? prev : [newNotification, ...prev];
    });
  };


  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  return (
    <CyberpunkNotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      clearAll,
      markAllAsRead,
      unreadCount: notifications.filter(n => !n.read).length
    }}>
      {children}
    </CyberpunkNotificationContext.Provider>
  );
};

// Notification System Hook
export const useCyberpunkNotification = () => {
  const context = React.useContext(CyberpunkNotificationContext);
  if (context === undefined) {
    throw new Error('useCyberpunkNotification must be used within a CyberpunkNotificationProvider');
  }
  return context;
};