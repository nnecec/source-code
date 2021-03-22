# minipack

首先将 entry 传入，`createGraph`方法根据`entry path`构建文件之间的依赖关系。`createGraph`方法可以理解为`构建文件依赖图`的方法。

> createAsset(filename)

这是一个公共方法，获取文件的路径，并解析返回文件转化后的代码和依赖文件路径。

在获取文件路径`filename`后，将其传入`createAsset`。

首先，通过`fs.readFileSync`以`utf-8`的格式获取文件内容。

通过`babylon.parse`将之前读取到的代码内容转化为 AST 树。(`sourceType`参数是为了支持`import/export`语法)

然后初始化一个数组`dependencies`用于储存依赖文件。

通过`babel-traverse`遍历 AST 树，并在检查到`import`依赖时，将该`filename`依赖的资源路径储存到`dependencies`中。

然后，为该文件初始化一个独特的`id`，并使用`babel-core`中的`transformFromAst`方法根据`preset`设置将 AST 语法转化为最终的 code 代码。

最后返回一个对象，对象中储存了:

```javascript
{
    id, // id
    filename, // 路径
    dependencies, // 文件内的 import 依赖
    code, // 文件最终转化成的代码
}
```

> createGraph(entryPath)

首先通过`createAssets`方法获取`entry path`的 `mainAsset`。

使用`queue`参数储存项目文件的 asset 集合。

遍历该集合，并循环 `mainAsset` 的`dependencies`生成依赖的`asset`加入到`queue`中。这样只要有新的`asset`加入到`queue`中，就代表一直有新的`import`依赖导入，所以就需要一直读取`asset`。

直达遍历结束，最终返回从入口文件开始包含每个模块的`queue`，即最终的依赖图。

> bundle(graph)

`bundle`方法接受生成的`graph`参数。`graph`包含 `entry path`及其关联的所有依赖信息。

首先，循环`graph`，将其中的每个`asset`生成对应模块。格式使用`模块的id`作为`key`和一个数组作为`value`。

数组的第一个值是用函数包装的每个模块的代码（模块应该被限定作用域）。

第二个值是用`stringify`解析模块及其依赖之间的关系(也就是上文的 asset.mapping)。解析后的对象看起来像这样: `{'./relative/path': 1}`。因为模块的被转换后会通过相对路径来调用`require()`。当调用这个函数时，我们应该能够知道依赖图中的哪个模块对应于该模块的相对路径。

将循环依次储存到`modules`变量中。

然后，实现自调函数`result`，并将上面生成的`modules`传入函数。

函数通过`模块id`访问到`modules`中的模块对象，通过解构获取数组的第一个值`fn`和第二个值`mapping`对象。最后会返回`exports`对象。

（当调用模块代码时，即会调用模块内部的代码，并通过`require`加载依赖的文件。初始化会`require(0)`来加载入口文件，然后继续查找关系链`asset.mapping`加载依赖的所有模块）

最后返回`result`。

## origin repository

[ronami/minipack](https://github.com/ronami/minipack)
