export default function Catalogo() {
  return (
    <main className="container main catalogo">
      <aside className="filters">
        <h2>Filtros</h2>
        <form>
          <label htmlFor="marca">Marca:</label>
          <select id="marca">
            <option value="">Todas</option>
            <option value="Michelin">Michelin</option>
            <option value="Goodyear">Goodyear</option>
            <option value="Tornel">Tornel</option>
            <option value="Pirelli">Pirelli</option>
            <option value="Bridgestone">Bridgestone</option>
          </select>

          <label htmlFor="medida">Medida:</label>
          <select id="medida">
            <option value="">Todas</option>
            <option value="205/55R16">205/55R16</option>
            <option value="225/45R17">225/45R17</option>
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
