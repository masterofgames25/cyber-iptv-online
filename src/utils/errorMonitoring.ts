import React, { useState, useEffect } from 'react'

export interface SystemLog {
  id: string
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  component: string
  message: string
  details?: any
  stack?: string
}

export interface PerformanceMetrics {
  timestamp: string
  component: string
  renderTime: number
  memoryUsage?: number
  networkRequests?: number
  errors?: number
}

class ErrorMonitoringService {
  private logs: SystemLog[] = []
  private performanceMetrics: PerformanceMetrics[] = []
  private subscribers: Array<(logs: SystemLog[]) => void> = []
  private performanceSubscribers: Array<(metrics: PerformanceMetrics[]) => void> = []
  private maxLogs = 1000
  private maxMetrics = 500

  constructor() {
    this.setupGlobalErrorHandlers()
    this.setupPerformanceMonitoring()
  }

  private setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        component: 'Global',
        message: event.message,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        stack: event.error?.stack,
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        component: 'Promise',
        message: 'Unhandled Promise Rejection',
        details: event.reason,
      })
    })
  }

  private setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              this.logWarning({
                component: 'Performance',
                message: `Long task detected: ${entry.duration}ms`,
                details: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                },
              })
            }
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('PerformanceObserver not supported')
      }
    }
  }

  logError({
    component,
    message,
    details,
    stack,
  }: {
    component: string
    message: string
    details?: any
    stack?: string
  }) {
    const log: SystemLog = {
      id: `error-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'error',
      component,
      message,
      details,
      stack,
    }
    this.addLog(log)
  }

  logWarning({
    component,
    message,
    details,
  }: {
    component: string
    message: string
    details?: any
  }) {
    const log: SystemLog = {
      id: `warn-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'warn',
      component,
      message,
      details,
    }
    this.addLog(log)
  }

  logInfo({
    component,
    message,
    details,
  }: {
    component: string
    message: string
    details?: any
  }) {
    const log: SystemLog = {
      id: `info-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      component,
      message,
      details,
    }
    this.addLog(log)
  }

  logDebug({
    component,
    message,
    details,
  }: {
    component: string
    message: string
    details?: any
  }) {
    const log: SystemLog = {
      id: `debug-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'debug',
      component,
      message,
      details,
    }
    this.addLog(log)
  }

  private addLog(log: SystemLog) {
    this.logs.unshift(log)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }
    
    // Notify subscribers
    this.subscribers.forEach(callback => callback([...this.logs]))
    
    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${log.level.toUpperCase()}] ${log.component}: ${log.message}`, log.details || '')
    }
  }

  recordPerformanceMetric(metric: Omit<PerformanceMetrics, 'timestamp'>) {
    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: new Date().toISOString(),
    }
    
    this.performanceMetrics.unshift(fullMetric)
    
    // Keep only the most recent metrics
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(0, this.maxMetrics)
    }
    
    // Notify performance subscribers
    this.performanceSubscribers.forEach(callback => callback([...this.performanceMetrics]))
  }

  subscribeToLogs(callback: (logs: SystemLog[]) => void) {
    this.subscribers.push(callback)
    callback([...this.logs]) // Send current logs immediately
    
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  subscribeToPerformanceMetrics(callback: (metrics: PerformanceMetrics[]) => void) {
    this.performanceSubscribers.push(callback)
    callback([...this.performanceMetrics]) // Send current metrics immediately
    
    return () => {
      const index = this.performanceSubscribers.indexOf(callback)
      if (index > -1) {
        this.performanceSubscribers.splice(index, 1)
      }
    }
  }

  getLogs(level?: SystemLog['level']): SystemLog[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  getPerformanceMetrics(component?: string): PerformanceMetrics[] {
    if (component) {
      return this.performanceMetrics.filter(metric => metric.component === component)
    }
    return [...this.performanceMetrics]
  }

  clearLogs() {
    this.logs = []
    this.subscribers.forEach(callback => callback([]))
  }

  clearPerformanceMetrics() {
    this.performanceMetrics = []
    this.performanceSubscribers.forEach(callback => callback([]))
  }

  // Export functionality removed - SQLite handles system logs

  getSystemHealth() {
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    )
    
    const errors = recentLogs.filter(log => log.level === 'error').length
    const warnings = recentLogs.filter(log => log.level === 'warn').length
    
    return {
      status: errors > 0 ? 'error' : warnings > 5 ? 'warning' : 'healthy',
      errors,
      warnings,
      totalLogs: recentLogs.length,
      lastError: recentLogs.find(log => log.level === 'error'),
      lastWarning: recentLogs.find(log => log.level === 'warn'),
    }
  }
}

// Create singleton instance
export const errorMonitoringService = new ErrorMonitoringService()

// React hook for using the error monitoring service
export function useErrorMonitoring() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([])
  const [systemHealth, setSystemHealth] = useState(errorMonitoringService.getSystemHealth())

  useEffect(() => {
    const unsubscribeLogs = errorMonitoringService.subscribeToLogs(setLogs)
    const unsubscribeMetrics = errorMonitoringService.subscribeToPerformanceMetrics(setPerformanceMetrics)
    
    // Update system health periodically
    const healthInterval = setInterval(() => {
      setSystemHealth(errorMonitoringService.getSystemHealth())
    }, 30000) // Every 30 seconds
    
    return () => {
      unsubscribeLogs()
      unsubscribeMetrics()
      clearInterval(healthInterval)
    }
  }, [])

  return {
    logs,
    performanceMetrics,
    systemHealth,
    logError: errorMonitoringService.logError.bind(errorMonitoringService),
    logWarning: errorMonitoringService.logWarning.bind(errorMonitoringService),
    logInfo: errorMonitoringService.logInfo.bind(errorMonitoringService),
    logDebug: errorMonitoringService.logDebug.bind(errorMonitoringService),
    recordPerformanceMetric: errorMonitoringService.recordPerformanceMetric.bind(errorMonitoringService),
    clearLogs: errorMonitoringService.clearLogs.bind(errorMonitoringService),
    clearPerformanceMetrics: errorMonitoringService.clearPerformanceMetrics.bind(errorMonitoringService),
    // Export functionality removed - SQLite handles system logs
  }
}

// Performance monitoring wrapper for React components
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.forwardRef<any, P>((props, ref) => {
    const startTime = performance.now()
    
    useEffect(() => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      errorMonitoringService.recordPerformanceMetric({
        component: componentName,
        renderTime,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : undefined,
      })
    })
    
    return React.createElement(Component, { ...props, ref } as any)
  })
}