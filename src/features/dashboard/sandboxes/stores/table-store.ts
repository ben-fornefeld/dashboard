'use client'

import { createHashStorage } from '@/lib/utils/store'
import {
  OnChangeFn,
  RowPinningState,
  SortingState,
} from '@tanstack/react-table'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { StartedAtFilter } from '../table-filters'
import { trackTableInteraction } from '../table-config'

export const sandboxesPollingIntervals = [
  { value: 0, label: 'Off' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
]

type SandboxesPollingInterval =
  (typeof sandboxesPollingIntervals)[number]['value']

interface SandboxTableState {
  // Page state
  pollingInterval: SandboxesPollingInterval

  // Table state
  sorting: SortingState
  globalFilter: string
  rowPinning: RowPinningState

  // Filter state
  startedAtFilter: StartedAtFilter
  templateIds: string[]
  cpuCount: number | undefined
  memoryMB: number | undefined
}

interface SandboxTableActions {
  // Table actions
  setSorting: OnChangeFn<SortingState>
  setGlobalFilter: OnChangeFn<string>
  setRowPinning: OnChangeFn<RowPinningState>

  // Filter actions
  setStartedAtFilter: (filter: StartedAtFilter) => void
  setTemplateIds: (ids: string[]) => void
  setCpuCount: (count: number | undefined) => void
  setMemoryMB: (mb: number | undefined) => void
  resetFilters: () => void

  // Page actions
  setPollingInterval: (interval: SandboxesPollingInterval) => void
}

type Store = SandboxTableState & SandboxTableActions

const initialState: SandboxTableState = {
  // Page state
  pollingInterval: sandboxesPollingIntervals[3]!.value,

  // Table state
  sorting: [],
  globalFilter: '',
  rowPinning: {},

  // Filter state
  startedAtFilter: undefined,
  templateIds: [],
  cpuCount: undefined,
  memoryMB: undefined,
}

export const useSandboxTableStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,
      // Table actions
      setSorting: (sorting) => {
        set((state) => ({
          ...state,
          sorting:
            typeof sorting === 'function' ? sorting(state.sorting) : sorting,
        }))
        trackTableInteraction('sorted', {
          column_count: (typeof sorting === 'function'
            ? sorting(get().sorting)
            : sorting
          ).length,
        })
      },

      setGlobalFilter: (globalFilter) => {
        set((state) => {
          const newGlobalFilter =
            typeof globalFilter === 'function'
              ? globalFilter(state.globalFilter)
              : globalFilter

          if (newGlobalFilter !== state.globalFilter) {
            trackTableInteraction('searched', {
              has_query: Boolean(newGlobalFilter),
              query: newGlobalFilter,
            })
          }

          return {
            ...state,
            globalFilter: newGlobalFilter,
          }
        })
      },

      setRowPinning: (rowPinning) => {
        set((state) => ({
          ...state,
          rowPinning:
            typeof rowPinning === 'function'
              ? rowPinning(state.rowPinning)
              : rowPinning,
        }))
        trackTableInteraction('pinned row', {
          pin_count: Object.keys(
            typeof rowPinning === 'function'
              ? rowPinning(get().rowPinning)
              : rowPinning
          ).length,
        })
      },

      // Filter actions
      setStartedAtFilter: (startedAtFilter) => {
        set({ startedAtFilter })
        trackTableInteraction('filtered', {
          type: 'started_at',
          value: startedAtFilter,
        })
      },

      setTemplateIds: (templateIds) => {
        set({ templateIds })
        trackTableInteraction('filtered', {
          type: 'template',
          count: templateIds.length,
        })
      },

      setCpuCount: (cpuCount) => {
        set({ cpuCount })
        trackTableInteraction('filtered', {
          type: 'cpu',
          value: cpuCount,
        })
      },

      setMemoryMB: (memoryMB) => {
        set({ memoryMB })
        trackTableInteraction('filtered', {
          type: 'memory',
          value: memoryMB,
        })
      },

      resetFilters: () => {
        set({
          startedAtFilter: initialState.startedAtFilter,
          templateIds: initialState.templateIds,
          cpuCount: initialState.cpuCount,
          memoryMB: initialState.memoryMB,
          globalFilter: initialState.globalFilter,
        })
        trackTableInteraction('reset filters')
      },

      // Page actions
      setPollingInterval: (pollingInterval) => {
        set({ pollingInterval })
        trackTableInteraction('changed polling interval', {
          interval: pollingInterval,
        })
      },
    }),
    {
      name: 'state',
      storage: createJSONStorage(() =>
        createHashStorage<SandboxTableState>(initialState)
      ),
    }
  )
)
