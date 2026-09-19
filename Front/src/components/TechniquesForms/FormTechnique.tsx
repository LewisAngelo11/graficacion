import type { TipoTecnica, estatusTecnica } from "../../Types/Techniques";
import "./FormTechnique.css";

interface TypeTechniqueProp {
    children: React.ReactNode;
    tipoTecnica: TipoTecnica;
    tecnica: any;
    estatus: estatusTecnica;
    setEstatus: React.Dispatch<React.SetStateAction<estatusTecnica>>;
}

export default function FormTechnique({ tipoTecnica, tecnica, children, estatus, setEstatus }: TypeTechniqueProp) {
    const ultimaActualizacion = tecnica.ultima_actualizacion?.split("T")[0];
    console.log(tecnica);
    return(
        <section className="form-technique">
            <header className="form-header-technique">
                <h1>{tecnica.titulo}</h1>
                <p>{tecnica.descripcion}</p>
            </header>
            <section className="principal-info-technique">
                <div className="technique-type">
                    <dt>Tipo de técnica</dt>
                    <dd>{tipoTecnica.nombre}</dd>
                </div>
                <div className="technique-status">
                    <label>Estatus</label>
                    <select
                        value={estatus}
                        onChange={(e) => setEstatus(e.target.value as estatusTecnica)}
                    >
                        <option value="Planificada">Planificada</option>
                        <option value="En Progreso">En Progreso</option>
                        <option value="Completada">Completada</option>
                        <option value="Eliminada">Cancelada</option>
                    </select>
                </div>
                <div className="last-update-technique">
                    <dt>Última Actualización</dt>
                    <dd>{ultimaActualizacion ? ultimaActualizacion : "Sin actualización"}</dd>
                </div>
            </section>
            {children}
        </section>
    )
}