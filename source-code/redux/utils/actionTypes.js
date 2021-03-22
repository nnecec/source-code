/**
 * 这是Redux保留的私有 action
 * 对于任何未知的 actions ，必须返回当前的 state
 * 如果当前 state 未定义，必须返回 state 初始值
 * 不要在代码中直接引用这些 action types
 */

const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split('')
    .join('.')

const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
}

export default ActionTypes
