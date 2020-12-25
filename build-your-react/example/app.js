import Neact from '../neact'

const App = (props) => {
  const [state, setState] = Neact.useState(1)
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state}
    </h1>
  )
}

Neact.render(<App />, document.getElementById('app'))
