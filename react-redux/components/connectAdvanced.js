import hoistStatics from 'hoist-non-react-statics'
import invariant from 'invariant'
import React, {
  useContext,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useReducer
} from 'react'
import { isValidElementType, isContextConsumer } from 'react-is'
import Subscription from '../utils/Subscription'

import { ReactReduxContext } from './Context'
const EMPTY_ARRAY = []
const NO_SUBSCRIPTION_ARRAY = [null, null]

const stringifyComponent = Comp => {
  try {
    return JSON.stringify(Comp)
  } catch (err) {
    return String(Comp)
  }
}

function storeStateUpdatesReducer (state, action) {
  const [, updateCount] = state
  return [action.payload, updateCount + 1]
}

const initStateUpdates = () => [null, 0]

// 在浏览器中使用 useLayoutEffect 在服务器上使用 useEffect
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect

/**
 *
 * @param {*} selectorFactory 返回根据 state，props 和 dispatch 来计算 new props 的 selector function
 */
export default function connectAdvanced (
  // 可以访问 dispatch，因此 selectorFactories 可以将 actionCreator 绑定到其选择器之外以进行优化。
  // 传递给 connectAdvanced 的选项与 displayName 和 WrappedComponent 一起作为第二个参数传递给选择器工厂。
  // selectorFactory 负责入站和出站的所有缓存/存储道具。不要在没有记住两次调用之间的结果的情况下直接使用 connectAdvanced 选择器，否则 Connect 组件将在每种状态或道具更改时重新呈现。
  selectorFactory,
  {
    // HOC 的显示名称
    getDisplayName = name => `ConnectAdvanced(${name})`,
    // 错误消息中显示
    methodName = 'connectAdvanced',

    renderCountProp = undefined,

    // 判断是否订阅 state change
    shouldHandleStateChanges = true,

    storeKey = 'store',
    withRef = false,

    // 使用 forwardRef 来暴露 wrapped component  的ref
    forwardRef = false,
    context = ReactReduxContext,
    ...connectOptions
  } = {}
) {
  const Context = context

  return function wrapWithConnect (WrappedComponent) {
    const wrappedComponentName =
      WrappedComponent.displayName || WrappedComponent.name || 'Component'

    const displayName = getDisplayName(wrappedComponentName)

    const selectorFactoryOptions = {
      ...connectOptions,
      getDisplayName,
      methodName,
      renderCountProp,
      shouldHandleStateChanges,
      storeKey,
      displayName,
      wrappedComponentName,
      WrappedComponent
    }

    const { pure } = connectOptions

    function createChildSelector (store) {
      return selectorFactory(store.dispatch, selectorFactoryOptions)
    }

    // 在 pure 模式下使用 useMemo
    const usePureOnlyMemo = pure ? useMemo : callback => callback()

    // 最终的 Connect 组件
    function ConnectFunction (props) {
      // 从 Connect props 获取 forwardRef 和 wrapperProps
      const [propsContext, forwardedRef, wrapperProps] = useMemo(() => {
        const { forwardedRef, ...wrapperProps } = props
        return [props.context, forwardedRef, wrapperProps]
      }, [props])

      // 最终使用的 Context
      const ContextToUse = useMemo(() => {
        // 可以自定义 propsContext 或仅使用默认 Context
        return propsContext &&
          propsContext.Consumer &&
          isContextConsumer(<propsContext.Consumer />)
          ? propsContext
          : Context
      }, [propsContext, Context])

      // 如果可以 通过 context 检索 Store 和 祖先的 订阅
      const contextValue = useContext(ContextToUse)

      // Store 必须存在于 props 或 context 上
      // 该值判断 Store 是否来自 props
      const didStoreComeFromProps = Boolean(props.store)
      const didStoreComeFromContext =
        Boolean(contextValue) && Boolean(contextValue.store)

      const store = props.store || contextValue.store

      const childPropsSelector = useMemo(() => {
        return createChildSelector(store)
      }, [store])

      const [subscription, notifyNestedSubs] = useMemo(() => {
        if (!shouldHandleStateChanges) return NO_SUBSCRIPTION_ARRAY

        // 订阅的来源取决于 Store 的来源： props / context
        // 组件通过 props 连接 Store 时，不使用 context，反之亦然
        const subscription = new Subscription(
          store,
          didStoreComeFromProps ? null : contextValue.subscription
        )

        // 复制 notifyNestedSubs 以处理在通知循环中间卸载组件的情况，此时 subscription 将为空。 如果将订阅的侦听器逻辑更改为不调用在通知循环中途已取消订阅的侦听器，则可以避免这种情况。
        const notifyNestedSubs = subscription.notifyNestedSubs.bind(
          subscription
        )

        return [subscription, notifyNestedSubs]
      }, [store, didStoreComeFromProps, contextValue])

      // 如有必要，请确定应将哪个{store，subscription}值放入 nested context 中，并记住该值以避免不必要的 context 更新。
      // 设定最终 contextValue
      const overriddenContextValue = useMemo(() => {
        if (didStoreComeFromProps) {
          // 此组件是通过 props 直接订阅 Store 的。
          // 我们不希望后代从该 Store 中读取-传递现有的 context
          return contextValue
        }

        // 否则，请将此组件的订阅实例放入 context 中，以使连接的后代在该组件完成后才更新
        return {
          ...contextValue,
          subscription
        }
      }, [didStoreComeFromProps, contextValue, subscription])

      // 每当 Redux Store 更新导致计算的 child component props 发生更改时（或我们在 mapState 中发现错误），我们都需要强制重新渲染该 wrapper component
      const [
        [previousStateUpdateResult],
        forceComponentUpdateDispatch
      ] = useReducer(storeStateUpdatesReducer, EMPTY_ARRAY, initStateUpdates)

      // 抛出 mapState/mapDispatch errors
      if (previousStateUpdateResult && previousStateUpdateResult.error) {
        throw previousStateUpdateResult.error
      }

      // 设置ref以组合 subscription effect 和 the render logic 之间的值
      const lastChildProps = useRef()
      const lastWrapperProps = useRef(wrapperProps)
      const childPropsFromStoreUpdate = useRef()
      const renderIsScheduled = useRef(false)

      // 组件的 props
      const actualChildProps = usePureOnlyMemo(() => {
        // 这里的棘手逻辑：
        // 此渲染可能是由 Redux Store 更新触发的，该更新产生了新的 child props
        // 但是，在那之后我们可能会得到 new wrapper props
        // 如果我们有 new child props 和相同的 wrapper props，我们知道应该按原样使用 new child props。
        // 但是，如果我们有new wrapper props，那么它们可能会更改 child props，因此我们必须重新计算。
        // 因此，仅当wrapper props与上次相同时，我们才会使用 Store update 的 child props
        if (
          childPropsFromStoreUpdate.current &&
          wrapperProps === lastWrapperProps.current
        ) {
          return childPropsFromStoreUpdate.current
        }

        // TODO: 我们在这里直接在render() 中读取 Store 。 馊主意？
        // 这可能会导致在并行模式下发生不良事件（TM）。
        // 注意，我们这样做是因为在由于 Store update 而导致的_not_渲染上，我们需要最新的 Store state 来确定 child props 应该是什么。
        return childPropsSelector(store.getState(), wrapperProps)
      }, [store, previousStateUpdateResult, wrapperProps])

      useIsomorphicLayoutEffect(() => { // useEffect
        // 捕获用于后续比较的 wrapper props 和 child props
        lastWrapperProps.current = wrapperProps
        lastChildProps.current = actualChildProps
        renderIsScheduled.current = false

        // 如果渲染来自 Store update，请清除该参考并级联订阅者更新
        if (childPropsFromStoreUpdate.current) {
          childPropsFromStoreUpdate.current = null
          notifyNestedSubs()
        }
      })

      // 我们的重新订阅逻辑仅在 Store/subscription 设置更改时运行
      useIsomorphicLayoutEffect(() => {
        // If we're not subscribed to the store, nothing to do here
        if (!shouldHandleStateChanges) return

        // Capture values for checking if and when this component unmounts
        let didUnsubscribe = false
        let lastThrownError = null

        // We'll run this callback every time a store subscription update propagates to this component
        const checkForUpdates = () => {
          if (didUnsubscribe) {
            // Don't run stale listeners.
            // Redux doesn't guarantee unsubscriptions happen until next dispatch.
            return
          }

          const latestStoreState = store.getState()

          let newChildProps, error
          try {
            // Actually run the selector with the most recent store state and wrapper props
            // to determine what the child props should be
            newChildProps = childPropsSelector(
              latestStoreState,
              lastWrapperProps.current
            )
          } catch (e) {
            error = e
            lastThrownError = e
          }

          if (!error) {
            lastThrownError = null
          }

          // If the child props haven't changed, nothing to do here - cascade the subscription update
          if (newChildProps === lastChildProps.current) {
            if (!renderIsScheduled.current) {
              notifyNestedSubs()
            }
          } else {
            // Save references to the new child props.  Note that we track the "child props from store update"
            // as a ref instead of a useState/useReducer because we need a way to determine if that value has
            // been processed.  If this went into useState/useReducer, we couldn't clear out the value without
            // forcing another re-render, which we don't want.
            lastChildProps.current = newChildProps
            childPropsFromStoreUpdate.current = newChildProps
            renderIsScheduled.current = true

            // If the child props _did_ change (or we caught an error), this wrapper component needs to re-render
            forceComponentUpdateDispatch({
              type: 'STORE_UPDATED',
              payload: {
                latestStoreState,
                error
              }
            })
          }
        }

        // Actually subscribe to the nearest connected ancestor (or store)
        subscription.onStateChange = checkForUpdates
        subscription.trySubscribe()

        // Pull data from the store after first render in case the store has
        // changed since we began.
        checkForUpdates()

        const unsubscribeWrapper = () => {
          didUnsubscribe = true
          subscription.tryUnsubscribe()
          subscription.onStateChange = null

          if (lastThrownError) {
            // It's possible that we caught an error due to a bad mapState function, but the
            // parent re-rendered without this component and we're about to unmount.
            // This shouldn't happen as long as we do top-down subscriptions correctly, but
            // if we ever do those wrong, this throw will surface the error in our tests.
            // In that case, throw the error from here so it doesn't get lost.
            throw lastThrownError
          }
        }

        return unsubscribeWrapper
      }, [store, subscription, childPropsSelector])

      // 实际渲染子组件
      const renderedWrappedComponent = useMemo(
        () => <WrappedComponent {...actualChildProps} ref={forwardedRef} />,
        [forwardedRef, WrappedComponent, actualChildProps]
      )

      // 如果React看到的元素引用与上次完全相同，那么它将避免重新呈现该子元素
      // 就像它被包装在 React.memo（）中或从 shouldComponentUpdate 返回 false 一样
      const renderedChild = useMemo(() => {
        // 如果此组件订阅 state change，则需要将其自己的订阅实例向下传递
        // 这意味着呈现相同的 Context 实例，并将不同的值放入上下文中
        if (shouldHandleStateChanges) {
          return (
            <ContextToUse.Provider value={overriddenContextValue}>
              {renderedWrappedComponent}
            </ContextToUse.Provider>
          )
        }

        return renderedWrappedComponent
      }, [ContextToUse, renderedWrappedComponent, overriddenContextValue])

      return renderedChild
    }

    // 在 pure 模式下，仅在 props 改变时触发渲染
    const Connect = pure ? React.memo(ConnectFunction) : ConnectFunction

    Connect.WrappedComponent = WrappedComponent
    Connect.displayName = displayName

    // 如果需要使用 ref 则通过 forwardRef 转发 ref
    if (forwardRef) {
      const forwarded = React.forwardRef(function forwardConnectRef (
        props,
        ref
      ) {
        return <Connect {...props} forwardedRef={ref} />
      })

      forwarded.displayName = displayName
      forwarded.WrappedComponent = WrappedComponent
      return hoistStatics(forwarded, WrappedComponent) // 将组件内的 static 方法拷贝到最终返回的组件上
    }

    return hoistStatics(Connect, WrappedComponent)
  }
}
