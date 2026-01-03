import {useEffect, useState } from "react"; 
export default function Catalogo() {
  const [marcas, setMarcas] = useState([]);
  const [medidas, setMedidas] = useState([]);
  const [marcaSel, setMarcaSel] = useState("");
  const [medidaSel, setMedidaSel] = useState("");
  useEffect(() => {
   fetch("/api/catalogo/filtros")
     .then((res) => res.json())
     .then((data) => {  
        setMarcas(data.marcas || []);
        setMedidas(data.medidas || []);
     })
  .catch((err) => {
    console.error("Error fetching filters:", err);
  });
  }, []);
  return (
    <main className="container main catalogo">
      <aside className="filters">
        <h2>Filtros</h2>
        <small>marcas: {marcas.length} | medidas: {medidas.length}</small>
        <small>seleccion: {marcaSel || "—"} | {medidaSel || "—"}</small>
        <form>
          <label htmlFor="marca">Marca:</label>
          <select 
          id="marca"
            value={marcaSel}
            onChange={(e) => setMarcaSel(e.target.value)}
            >
      { marcas.map((marca) => (
            <option key={marca} value={marca}>{marca}</option>
      ))}      
          </select> 

          <label htmlFor="medida">Medida:</label>
          <select 
          id="medida"
            value={medidaSel}
            onChange={(e) => setMedidaSel(e.target.value)}
            >
            <option value="">Todas</option>
      { medidas.map((medida) => (
            <option key={medida} value={medida}>{medida}</option>
      ))}      
          </select>


          <button type="button">Aplicar Filtros</button>
        </form>
      </aside>

      <section className="results"> 
        resultados
      </section>
    </main>
  );  
}
