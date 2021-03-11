
function el (type, props, children) {
  const config = {
    type,
    props,
    children
  }
  return new El(config)
}

class El {
  constructor (config) {
    this.config = config
  }

  render () {
    const { type, props, children } = this.config
    const ele = document.createElement(type)

    for (const attr in props) {
      ele.setAttribute(attr, props[attr])
    }

    if (Array.isArray(children)) {
      for (const child of children) {
        if (child instanceof El) {
          ele.appendChild(child.render())
        } else {
          ele.appendChild(document.createTextNode(child))
        }
      }
    }
    return ele
  }
}

const ul = el('ul', { id: 'list' }, [
  el('li', { class: 'item' }, ['Item 1']),
  el('li', { class: 'item' }, ['Item 2']),
  el('li', { class: 'item' }, ['Item 3'])
])
const ulRoot = ul.render()
document.body.appendChild(ulRoot)

// <ul id='list'>
//   <li class='item'>Item 1</li>
//   <li class='item'>Item 2</li>
//   <li class='item'>Item 3</li>
// </ul>

console.log(ulRoot)
