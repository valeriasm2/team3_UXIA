// Bypassing cache 1
import { useEffect, useState } from "react";

function App() {
  const [mensaje, setMensaje] = useState(" ");

  useEffect(() => {
    fetch("/api/test")
      .then((res) => res.json())
      .then((data) => setMensaje(data.missatge));
  }, []);

  return (
    <div>
      <h1>{mensaje}</h1>
    </div>
  );
}

export default App;
