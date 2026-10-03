import SnakeGame from './components/SnakeGame'

export default function App() {
  return (
    <main className="app">
      <h1 className="title">
        Snake<span className="title__dot">.</span>
      </h1>
      <SnakeGame />
    </main>
  )
}