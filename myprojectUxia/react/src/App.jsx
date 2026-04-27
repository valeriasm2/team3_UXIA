// Bypassing cache 1
import { useEffect, useState } from "react"
import { ThemeToggle } from "./components/ThemeToggle"

function App() {
  const [mensaje, setMensaje] = useState(" ")

  useEffect(() => {
    fetch("/api/test")
      .then(res => res.json())
      .then(data => setMensaje(data.mensaje))
  }, [])

  return (
    <div>
      <ThemeToggle />
      <h1>{mensaje}</h1>
    </div>
  )
}

export default App