import { useRef, useEffect } from 'react'

function useInterval (callback, delay) {
  const savedCallback = useRef()

  useEffect(() => {
    savedCallback.current = callback
  })

  useEffect(() => {
    const fn = savedCallback.current
    const timer = setInterval(() => {
      fn()
    }, delay)
    return () => {
      clearInterval(timer)
    }
  }, [delay])
}
