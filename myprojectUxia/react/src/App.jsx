import { useState, useEffect } from "react";
import IdentificaItem from "./IdentificaItem";

function App() {
  const [mensaje, setMensaje] = useState(" ");

  useEffect(() => {
    fetch("/api/test")
      .then((res) => res.json())
      .then((data) => setMensaje(data.missatge));
  }, []);

  return (
    <div id="center">
      <h1>{mensaje}</h1>
      <IdentificaItem />
    </div>
  );
}

export default App;
