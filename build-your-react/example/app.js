import Neact from '../neact'

const App = (props) => {
  return (
    <div>
      {/* <input onInput={updateValue} value={value} /> */}
      <h2>Hello {props.name}</h2>
    </div>
  )
}

Neact.render(<App name="world"/>, document.getElementById('app'))
