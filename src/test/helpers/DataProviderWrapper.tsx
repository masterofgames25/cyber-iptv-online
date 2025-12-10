import React from 'react'
import { DataProvider } from '../../context/DataContext'

export function DataContextProviderWrapper({ children }: { children: React.ReactNode }) {
  return <DataProvider>{children}</DataProvider>
}