import { useReducer } from 'react'

function useState (initialState) {
  const reducer = (state, action) => {
    return typeof action === 'function' ? action(state) : action
  }
  const [state, dispatch] = useReducer(reducer, initialState)
  return [state, dispatch]
}
