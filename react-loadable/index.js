"use strict";
const React = require("react");
const PropTypes = require("prop-types");

const ALL_INITIALIZERS = [];
const READY_INITIALIZERS = [];

function isWebpackReady(getModuleIds) {
  if (typeof __webpack_modules__ !== "object") {
    return false;
  }

  return getModuleIds().every(moduleId => {
    return (
      typeof moduleId !== "undefined" &&
      typeof __webpack_modules__[moduleId] !== "undefined"
    );
  });
}

function load(loader) {
  let promise = loader(); // 执行 () => import('./my-component') 获取 promise (import https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/import#%E5%8A%A8%E6%80%81import)

  let state = {
    loading: true, // 状态 loading
    loaded: null,
    error: null
  };

  state.promise = promise // 处理 import promise
    .then(loaded => {
      state.loading = false;
      state.loaded = loaded;
      return loaded;
    })
    .catch(err => {
      state.loading = false;
      state.error = err;
      throw err;
    });

  return state;
}

function loadMap(obj) {
  let state = {
    loading: false,
    loaded: {},
    error: null
  };

  let promises = [];

  try {
    Object.keys(obj).forEach(key => {
      let result = load(obj[key]);

      if (!result.loading) {
        state.loaded[key] = result.loaded;
        state.error = result.error;
      } else {
        state.loading = true;
      }

      promises.push(result.promise);

      result.promise
        .then(res => {
          state.loaded[key] = res;
        })
        .catch(err => {
          state.error = err;
        });
    });
  } catch (err) {
    state.error = err;
  }

  state.promise = Promise.all(promises)
    .then(res => {
      state.loading = false;
      return res;
    })
    .catch(err => {
      state.loading = false;
      throw err;
    });

  return state;
}

function resolve(obj) {
  return obj && obj.__esModule ? obj.default : obj;
}

function render(loaded, props) {
  return React.createElement(resolve(loaded), props);
}

// 返回一个组件 组件中会获取 import(xx) ，根据 import 的状态显示 delay loading 等状态
function createLoadableComponent(loadFn, options) {
  if (!options.loading) { // loading 配置项
    throw new Error("react-loadable requires a `loading` component");
  }

  let opts = Object.assign(
    {
      loader: null,
      loading: null,
      delay: 200,
      timeout: null,
      render: render,
      webpack: null,
      modules: null
    },
    options
  );

  let res = null;

  function init() {
    if (!res) {
      res = loadFn(opts.loader); // 
    }
    return res.promise;
  }

  ALL_INITIALIZERS.push(init);

  if (typeof opts.webpack === "function") {
    READY_INITIALIZERS.push(() => {
      if (isWebpackReady(opts.webpack)) {
        return init();
      }
    });
  }

  return class LoadableComponent extends React.Component {
    constructor(props) {
      super(props);
      init();

      this.state = {
        error: res.error,
        pastDelay: false,
        timedOut: false,
        loading: res.loading,
        loaded: res.loaded
      };
    }

    static contextTypes = {
      loadable: PropTypes.shape({
        report: PropTypes.func.isRequired
      })
    };

    // 直接 import 组件
    static preload() {
      return init();
    }

    componentWillMount() {
      this._mounted = true; // 标记是否 mount LoadableComponent
      this._loadModule(); // 加载 import 的 module
    }

    // 加载 import 组件
    _loadModule() {
      if (this.context.loadable && Array.isArray(opts.modules)) {
        opts.modules.forEach(moduleName => {
          this.context.loadable.report(moduleName);
        });
      }

      // 没有 loading 报错
      if (!res.loading) {
        return;
      }

      // 如果有 delay 则在 delay 时间之后 设置 pastDelay 为 true
      if (typeof opts.delay === "number") {
        if (opts.delay === 0) {
          this.setState({ pastDelay: true });
        } else {
          this._delay = setTimeout(() => {
            this.setState({ pastDelay: true });
          }, opts.delay);
        }
      }

      // 如果有 timeout 则在 timeout 之后设置 timeout 为 true
      if (typeof opts.timeout === "number") {
        this._timeout = setTimeout(() => {
          this.setState({ timedOut: true });
        }, opts.timeout);
      }

      let update = () => {
        if (!this._mounted) {
          return;
        }

        this.setState({
          error: res.error,
          loaded: res.loaded,
          loading: res.loading
        });

        this._clearTimeouts();
      };

      // 根据 import 进度更新显示状态
      res.promise
        .then(() => {
          update();
        })
        .catch(err => {
          update();
        });
    }

    componentWillUnmount() {
      this._mounted = false;
      this._clearTimeouts();
    }

    _clearTimeouts() {
      clearTimeout(this._delay);
      clearTimeout(this._timeout);
    }

    // 重新加载
    retry = () => {
      this.setState({ error: null, loading: true, timedOut: false });
      res = loadFn(opts.loader);
      this._loadModule();
    };

    render() {
      // 显示 loading
      if (this.state.loading || this.state.error) {
        return React.createElement(opts.loading, {
          isLoading: this.state.loading,
          pastDelay: this.state.pastDelay,
          timedOut: this.state.timedOut,
          error: this.state.error,
          retry: this.retry
        });
      } else if (this.state.loaded) { // 使用 render 方法渲染加载完成的组件
        return opts.render(this.state.loaded, this.props);
      } else {
        return null;
      }
    }
  };
}

// Loadable({
//   loader: () => import('./my-component'),
//   loading: Loading,
// });
function Loadable(opts) {
  return createLoadableComponent(load, opts);
}

function LoadableMap(opts) {
  if (typeof opts.render !== "function") {
    throw new Error("LoadableMap requires a `render(loaded, props)` function");
  }

  return createLoadableComponent(loadMap, opts);
}

Loadable.Map = LoadableMap;

class Capture extends React.Component {
  static propTypes = {
    report: PropTypes.func.isRequired
  };

  static childContextTypes = {
    loadable: PropTypes.shape({
      report: PropTypes.func.isRequired
    }).isRequired
  };

  getChildContext() {
    return {
      loadable: {
        report: this.props.report
      }
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

Loadable.Capture = Capture;

function flushInitializers(initializers) {
  let promises = [];

  while (initializers.length) {
    let init = initializers.pop();
    promises.push(init());
  }

  return Promise.all(promises).then(() => {
    if (initializers.length) {
      return flushInitializers(initializers);
    }
  });
}

Loadable.preloadAll = () => {
  return new Promise((resolve, reject) => {
    flushInitializers(ALL_INITIALIZERS).then(resolve, reject);
  });
};

Loadable.preloadReady = () => {
  return new Promise((resolve, reject) => {
    // We always will resolve, errors should be handled within loading UIs.
    flushInitializers(READY_INITIALIZERS).then(resolve, resolve);
  });
};

module.exports = Loadable;
