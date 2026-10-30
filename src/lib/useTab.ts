import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useTab(defaultTab = '') {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || defaultTab
  const setTab = useCallback((next: string) => {
    const p = new URLSearchParams(params)
    if (next === defaultTab) p.delete('tab')
    else p.set('tab', next)
    setParams(p, { replace: true })
  }, [params, setParams, defaultTab])
  return { tab, setTab, params, setParams }
}
