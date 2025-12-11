import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import {
  CyberpunkNotification,
  useCyberpunkNotification,
  Notification,
  NotificationType
} from './CyberpunkNotification';

interface NotificationCenterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

export const CyberpunkNotificationCenter: React.FC<NotificationCenterProps> = ({
  position = 'top-right'
}) => {
  const {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    markAllAsRead,
    unreadCount
  } = useCyberpunkNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'alerts'>('all');

  const positionClasses = {
    'top-right': 'top-24 right-6 md:top-6',
    'top-left': 'top-24 left-6 md:top-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const trayPositionClasses = {
    'top-right': 'top-36 right-6 md:top-20',
    'top-left': 'top-36 left-6 md:top-20',
    'bottom-right': 'bottom-20 right-6',
    'bottom-left': 'bottom-20 left-6',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-16'
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'system':
        return notification.type === 'system' || notification.type === 'info';
      case 'alerts':
        return notification.type === 'warning' || notification.type === 'error';
      default:
        return true;
    }
  });

  // Disable simulated notifications: show only real alerts triggered pelo sistema
  useEffect(() => {
    return () => { };
  }, []);

  const getFilterColor = (filterType: typeof filter) => {
    switch (filterType) {
      case 'all': return '#00FFFF';
      case 'unread': return '#FF00FF';
      case 'system': return '#00FF00';
      case 'alerts': return '#FFAA00';
      default: return '#00FFFF';
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <motion.div
        className={`fixed z-50 ${positionClasses[position]}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 rounded-full cyber-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <BellIcon className="w-6 h-6 text-cyan-400" />

          {/* Notification Count Badge */}
          {unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
              initial={{ scale: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                scale: { duration: 0.3 },
                rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}

          {/* Pulse animation for unread notifications */}
          {unreadCount > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 0, 64, 0.3) 0%, transparent 70%)'
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Notification Tray */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed z-40 ${trayPositionClasses[position]} w-96 max-h-96`}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', damping: 20 }}
          >

            {/* Header */}
            <div className="glass rounded-t-xl p-4 border-b border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold neon-text">Central de Notificações</h3>
                <div className="flex items-center gap-2">
                  {/* Close Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 p-1 bg-black/20 rounded-lg">
                {(['all', 'unread', 'system', 'alerts'] as const).map((filterType) => (
                  <motion.button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`flex-1 px-3 py-2 text-xs rounded-md transition-all ${filter === filterType
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      boxShadow: filter === filterType ? `0 0 10px ${getFilterColor(filterType)}50` : 'none'
                    }}
                  >
                    {filterType === 'all' && 'Todas'}
                    {filterType === 'unread' && 'Não lidas'}
                    {filterType === 'system' && 'Sistema'}
                    {filterType === 'alerts' && 'Alertas'}

                    {/* Count badges */}
                    {filterType === 'unread' && unreadCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={markAllAsRead}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all"
                  disabled={unreadCount === 0}
                >
                  <CheckIcon className="w-3 h-3 inline mr-1" />
                  Marcar todas como lidas
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAll}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                  disabled={notifications.length === 0}
                >
                  <TrashIcon className="w-3 h-3 inline mr-1" />
                  Limpar tudo
                </motion.button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="glass rounded-b-xl max-h-64 overflow-y-auto custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {filter === 'unread' ? 'Nenhuma notificação não lida' :
                      filter === 'system' ? 'Nenhuma notificação de sistema' :
                        filter === 'alerts' ? 'Nenhum alerta' :
                          'Nenhuma notificação'}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <AnimatePresence mode='popLayout'>
                    {filteredNotifications.map((notification) => (
                      <CyberpunkNotification
                        key={notification.id}
                        notification={{ ...notification, autoClose: false }} // Disable autoClose in list view
                        onClose={removeNotification}
                        onRead={markAsRead}
                        inList={true}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Real-time notification system hook
export const useRealTimeNotifications = () => {
  const { addNotification } = useCyberpunkNotification();

  const notifySystemUpdate = React.useCallback((message: string) => {
    addNotification({
      type: 'system',
      title: '🔄 Atualização do Sistema',
      message,
      priority: 'low',
      read: false,
      autoClose: true,
      duration: 4000
    });
  }, [addNotification]);

  const notifyPaymentReceived = React.useCallback((clientName: string, amount: number) => {
    addNotification({
      type: 'success',
      title: '💰 Pagamento Recebido',
      message: `Pagamento de R$ ${amount.toFixed(2)} recebido de ${clientName}`,
      priority: 'medium',
      read: false,
      autoClose: true,
      duration: 6000
    });
  }, [addNotification]);

  const notifySubscriptionExpiring = React.useCallback((clientName: string, days: number) => {
    addNotification({
      type: 'warning',
      title: '⏰ Assinatura Próxima do Vencimento',
      message: `A assinatura de ${clientName} vence em ${days} dias`,
      priority: days <= 3 ? 'high' : 'medium',
      read: false,
      autoClose: false
    });
  }, [addNotification]);

  const notifyError = React.useCallback((error: string, action?: () => void) => {
    addNotification({
      type: 'error',
      title: '❌ Erro no Sistema',
      message: error,
      priority: 'critical',
      read: false,
      autoClose: false,
      action: action ? {
        label: 'Tentar Novamente',
        onClick: action
      } : undefined
    });
  }, [addNotification]);

  const notifyNewLead = React.useCallback((leadName: string, source: string) => {
    addNotification({
      type: 'info',
      title: '🎯 Novo Lead Cadastrado',
      message: `${leadName} cadastrado via ${source}`,
      priority: 'medium',
      read: false,
      autoClose: true,
      duration: 5000
    });
  }, [addNotification]);

  return {
    notifySystemUpdate,
    notifyPaymentReceived,
    notifySubscriptionExpiring,
    notifyError,
    notifyNewLead
  };
};