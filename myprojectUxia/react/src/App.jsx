import "./App.css"
import { useEffect, useState } from "react"


function App() {
  const [exposiciones, setExposiciones] = useState([])
  const [expoActual, setExpoActual] = useState(null)
  const [items, setItems] = useState([])
  const [indiceItem, setIndiceItem] = useState(0)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarExposiciones()
  }, [])

  const cargarExposiciones = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/expos")
      const data = await response.json()
      setExposiciones(data)
      if (data.length > 0) {
        await seleccionarExpo(data[0])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const seleccionarExpo = async (expo) => {
    try {
      setLoading(true)
      setExpoActual(expo)
      setIndiceItem(0)
      setItemSeleccionado(null)
      
      const response = await fetch(`http://127.0.0.1:8000/api/items?expo_id=${expo.id}`)
      const itemsData = await response.json()
      setItems(itemsData)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const verDetalleItem = async (item) => {
    try {
      setLoading(true)
      const response = await fetch(`http://127.0.0.1:8000/api/imatges?item_id=${item.id}`)
      const imagenes = await response.json()
      
      setItemSeleccionado({
        ...item,
        todas_imagenes: imagenes
      })
    } catch (error) {
      console.error("Error cargando imágenes:", error)
    } finally {
      setLoading(false)
    }
  }

  const cerrarDetalle = () => {
    setItemSeleccionado(null)
  }

  const siguienteExpo = () => {
    const indexActual = exposiciones.findIndex(e => e.id === expoActual.id)
    const siguienteIndex = (indexActual + 1) % exposiciones.length
    seleccionarExpo(exposiciones[siguienteIndex])
  }

  const anteriorExpo = () => {
    const indexActual = exposiciones.findIndex(e => e.id === expoActual.id)
    const anteriorIndex = (indexActual - 1 + exposiciones.length) % exposiciones.length
    seleccionarExpo(exposiciones[anteriorIndex])
  }

  const siguienteItem = () => {
    setIndiceItem((indiceItem + 1) % items.length)
  }

  const anteriorItem = () => {
    setIndiceItem((indiceItem - 1 + items.length) % items.length)
  }

  if (loading) return <div className="loading">Cargando...</div>
  if (exposiciones.length === 0) return <div>No hay exposiciones</div>
  if (!expoActual) return <div>Selecciona una exposición</div>

  const itemActual = items[indiceItem]

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <header className="header">
        <h1>UXIA</h1>
        <p>Assistint Intel·ligent d'Exposicions</p>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        
        {/* Selector de Expos*/}
        <div className="expo-selector">
          <button className="nav-expo-btn" onClick={anteriorExpo}>◀◀</button>
          <h1 className="expo-titulo">{expoActual.nombre}</h1>
          <button className="nav-expo-btn" onClick={siguienteExpo}>▶▶</button>
          <p className="expo-info">
            {expoActual.lugar} | {expoActual.fecha_inicio} - {expoActual.fecha_fin}
          </p>
        </div>

        {/* Carrousel de Items */}
{items.length > 0 ? (
  <>
    <div className="carrousel-container">
      <div 
        className="carrousel-item"
        onClick={() => verDetalleItem(itemActual)}
      >
        {itemActual.imagen && (
          <img 
            src={`http://127.0.0.1:8000${itemActual.imagen}`}
            alt={itemActual.nombre}
            className="item-imagen"
          />
        )}
        <h2 className="item-nombre">{itemActual.nombre}</h2>
        <p className="item-descripcion">{itemActual.descripcion}</p>
        <p className="item-contador">
          Item {indiceItem + 1} de {items.length}
        </p>
        <p className="item-click-hint"> Haz click para ver todas las imágenes </p>
      </div>
      
      {/* Contenedor de las dos flechas juntas */}
      <div className="carrousel-nav">
        <button className="nav-item-btn" onClick={anteriorItem}>◀</button>
        <button className="nav-item-btn" onClick={siguienteItem}>▶</button>
      </div>
    </div>
    <p className="expo-contador">
      Exposición {exposiciones.findIndex(e => e.id === expoActual.id) + 1} de {exposiciones.length}
    </p>
  </>
) : (
  <p>Esta exposición no tiene items</p>
)}
      </main>

      {/* FOOTER */}
      <Footer />

      {/* MODAL DE DETALLE */}
      {itemSeleccionado && (
        <div className="modal-overlay" onClick={cerrarDetalle}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={cerrarDetalle}>✕</button>
            
            <h2 className="modal-titulo">{itemSeleccionado.nombre}</h2>
            <p className="modal-descripcion">{itemSeleccionado.descripcion}</p>
            
            <h3 className="modal-subtitulo">
              Todas las imágenes ({itemSeleccionado.todas_imagenes?.length || 0})
            </h3>
            
            {itemSeleccionado.todas_imagenes && itemSeleccionado.todas_imagenes.length > 0 ? (
              <div className="imagenes-grid">
                {itemSeleccionado.todas_imagenes.map((img) => (
                  <div key={img.id} className="imagen-card">
                    <img 
                      src={`http://127.0.0.1:8000${img.imagen}`}
                      alt="Imagen del item"
                      className="imagen-grid-img"
                    />
                    {img.es_destacada && <span className="destacada-badge">★ Destacada</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay imágenes disponibles para este item</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// COMPONENTE FOOTER
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logos">
        <a 
          href="https://sites.google.com/xtec.cat/proyectos-de-innovacion/inicio" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <img 
            src="/logos/tothom.png"
            alt="Generalitat de Catalunya - InnovaFP"
            className="footer-logo"
          />
        </a>

        <a 
          href="https://www.boe.es/boe/dias/2023/09/01/pdfs/BOE-B-2023-24805.pdf" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <img 
            src="/logos/ministerio.png"
            alt="Ministerio de Educación y Formación Profesional - InnovaFP"
            className="footer-logo"
          />
        </a>
      </div>
      
      <p className="footer-texto">
        Proyecto financiado por el programa InnovaFP
      </p>
    </footer>
  )
}

export default App