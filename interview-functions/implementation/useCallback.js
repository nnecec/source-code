import { useRef, useEffect, useMemo } from 'react'

function useCallback (callback, deps) {
  const savedCallback = useRef()

  useEffect(() => {
    savedCallback.current = callback
  })

  return useMemo(() => (...args) => (0, savedCallback.current)(...args), deps)
}
