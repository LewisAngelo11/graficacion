import { Plus, Trash } from "@boxicons/react";
import "./EntrevistaForm.css";
import { useEffect, useState } from "react";
import type { PreguntaEntrevista } from "../../Types/PreguntasEntrevistas";
import type { estatusTecnica } from "../../Types/Techniques";
import type { Rol } from "../../Types/Roles";
import { useParams } from "react-router";

interface TecnicaProps {
    tecnica: any;
    estatus: estatusTecnica;
}


export default function EntrevistaForm({ tecnica, estatus }: TecnicaProps) {
    const { id_project } = useParams();
    const [preguntasEntrevista, setPreguntasEntrevista] = useState<PreguntaEntrevista[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    // State para controlar los roles seleccionados
    const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null);
    const [idStakeholder, setIdStakeholder] = useState<number | null>(null);
    const [fecha, setFecha] = useState("");
    const [duracion, setDuracion] = useState("");
    const [notas, setNotas] = useState("");


    // Obtener stakeholders del rol seleccionado
    const stakeholdersDelRol = rolSeleccionado
        ? roles.find(r => r.id_rol === rolSeleccionado)?.stakeholder || [] : [];

    // Función para agregar una pregunta a la lista
    const agregarPreguntaVacia = () => {
        const nuevoId = preguntasEntrevista.length > 0 ? Math.max(...preguntasEntrevista.map(p => p.id_pregunta)) + 1 : 1;

        // Body para crear la nueva pregunta vacía
        const nuevaPregunta: PreguntaEntrevista = {
            id_pregunta: nuevoId,
            pregunta: "",
            respuesta: "",
            id_entrevista: 0
        };

        setPreguntasEntrevista(prev => [...prev, nuevaPregunta]);
    };

    // Función que elimina la pregunta de la lista
    const eliminarPregunta = (idPregunta: number) => {
        // Filtra las preguntas exepto la que se eliminó y con el map, renumera las preguntas
        const preguntasFiltradas = preguntasEntrevista.filter(p => p.id_pregunta !== idPregunta);
        setPreguntasEntrevista(preguntasFiltradas);
    };

    const token = localStorage.getItem("token");
    const API_URL = import.meta.env.VITE_API_URL;

    const getRolesAndStakehodlers = async () => {
        try {
            const response = await fetch(`${API_URL}/roles/proyecto/${id_project}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error("Error al obtener los roles y stakeholders.");
            }

            const data = await response.json();
            setRoles(data);
        } catch (err) {

        }
    };

    const handleSubmit = async () => {
        const body = {
            id_stakeholder: idStakeholder,
            fecha_entrevista: fecha,
            duracion: duracion,
            pregunta_entrevista: preguntasEntrevista,
            notas: notas,
            id_tecnica: tecnica.id,
            estatus: estatus
        };

        try {
            const response = await fetch(`${API_URL}/entrevistas/actualizar_entrevista/${tecnica.entrevistaData.id_entrevista}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                }
            );

            if (!response.ok) {
                throw new Error("Error al actualizar la entrevista");
            }

            const data = await response.json();
            console.log(data);
        } catch (err) {
            console.error(err);
        }
    }

    const getEntrevista = async () => {
        try {
            const response = await fetch(`${API_URL}/entrevistas/${tecnica.entrevistaData.id_entrevista}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Error al obtener la técnica de Observación");
            }

            const data = await response.json();
            console.log(data);
            setRolSeleccionado(data.stakeholder.id_rol);
            setIdStakeholder(data.id_stakeholder);
            setFecha(data.fecha_entrevista ? data.fecha_entrevista.split("T")[0] : "");
            setDuracion(String(data.duracion || ""));
            setNotas(String(data.notas || ""));
            setPreguntasEntrevista(data.pregunta_entrevista);
        } catch (err) {
            console.error("Error en la petición:", err);
        }
    }

    useEffect(() => {
        getRolesAndStakehodlers();
        getEntrevista();
    }, []);

    return (
        <form action={handleSubmit}>
            <section className="entrevista-informacion-section">
                <header className="header-entrevista-section">
                    <h2>Información de la Entrevista</h2>
                </header>
                <div className="entrevistado-div">
                    <div className="rol-container">
                        <label htmlFor="roles-select">Rol</label>
                        <select
                            name="roles"
                            id="roles-select"
                            value={rolSeleccionado || ""}
                            onChange={(e) => setRolSeleccionado(Number(e.target.value))}
                        >
                            <option value="">-- Selecciona un rol --</option>
                            {roles.length > 0 && roles.map(r => (
                                <option key={r.id_rol} value={r.id_rol}>
                                    {r.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="entrevistado-container">
                        <label htmlFor="entrevistado">Entrevistado</label>
                        <select
                            name="entrevistado"
                            id="entrevistado"
                            value={idStakeholder || ""}
                            onChange={(e) => setIdStakeholder(Number(e.target.value))}
                        >
                            <option value="">-- Selecciona un entrevistado --</option>
                            {stakeholdersDelRol.length > 0 ? (
                                stakeholdersDelRol.map(s => (
                                    <option key={s.id_stakeholder} value={s.id_stakeholder}>
                                        {s.nombre}
                                    </option>
                                ))
                            ) : (rolSeleccionado && <option value="">--No hay Stakeholders--</option>)}
                        </select>
                    </div>
                </div>
                <div className="info-entrevista-div">
                    <div className="fecha-container">
                        <label htmlFor="fechaEntrevista">Fecha</label>
                        <input
                            type="date" 
                            id="fechaEntrevista"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                        />
                    </div>
                    <div className="duracion-container">
                        <label htmlFor="duracion">Duración (minutos)</label>
                        <input
                            type="number"
                            id="duracion"
                            placeholder="Ej: 45"
                            min={0}
                            value={duracion}
                            onChange={(e) => setDuracion(e.target.value)}
                        />
                    </div>
                </div>
            </section>
            {/* Sección de preguntas de la entrevista */}
            <section className="preguntas-entrevista-section">
                <header className="header-preguntas-section">
                    <h2>Preguntas y Respuestas</h2>
                    <button
                        type="button"
                        className="button-add-question"
                        onClick={agregarPreguntaVacia}
                    >
                        <Plus />
                        Agregar Pregunta
                    </button>
                </header>
                <div className="preguntas-entrevista-list">
                    {preguntasEntrevista.length === 0 && (
                        <div className="no-question-added">No hay preguntas aún. Agrega la primera</div>
                    )}
                    {preguntasEntrevista.map((p, index) => (
                        <article
                            key={p.id_pregunta}
                            className="pregunta-entrevista-card"
                        >
                            <div className="numero-pregunta">{index + 1}</div>
                            <div className="textareas-pregunta">
                                <label htmlFor="pregunta">Pregunta</label>
                                <textarea
                                    name="pregunta-entrevista"
                                    id="pregunta"
                                    placeholder="Ingrese la pregunta planteada"
                                    value={p.pregunta}
                                    onChange={(e) => {
                                        const nuevas = preguntasEntrevista.map(item =>
                                            item.id_pregunta === p.id_pregunta
                                                ? { ...item, pregunta: e.target.value }
                                                : item
                                        );
                                        setPreguntasEntrevista(nuevas);
                                    }}
                                />

                                <label htmlFor="respuesta">Respuesta</label>
                                <textarea
                                    name="respuesta-pregunta-entrevista"
                                    id="respuesta"
                                    placeholder="Ingrese la respuesta de la pregunta planteada"
                                    value={p.respuesta}
                                    onChange={(e) => {
                                        const nuevas = preguntasEntrevista.map(item =>
                                            item.id_pregunta === p.id_pregunta
                                                ? { ...item, respuesta: e.target.value }
                                                : item
                                        );
                                        setPreguntasEntrevista(nuevas);
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                className="button-delete-question"
                                onClick={() => eliminarPregunta(p.id_pregunta)}
                            >
                                <Trash fill="#ff1c1cff" />
                            </button>
                        </article>
                    ))}
                </div>
            </section>
            {/* Sección de notas */}
            <section className="notas-entrevista">
                <h2>Notas Adicionales</h2>
                <textarea
                    name="notas-adicionales"
                    id="notas-entrevista"
                    placeholder="Agrega observaciones, conclusiones o información relevante"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                />
            </section>
            <div className="buttons-techniques-section">
                <button className="button-cancel-changes">Cancelar Cambios</button>
                <button
                    className="button-confirm-changes"
                    type="submit"
                >
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
}