import { Plus, Trash } from "@boxicons/react";
import "./HistoriasUsuarioForm.css";
import type { estatusTecnica } from "../../Types/Techniques";
import { useState, useEffect } from "react";

export interface CriterioAceptacion {
    id_criterio: number;
    texto: string;
}

interface TecnicaProps {
    tecnica: any;
    estatus: estatusTecnica;
}

export default function HistoriasUsuarioForm({ tecnica, estatus }: TecnicaProps) {
    const [tituloHistoria, setTituloHistoria] = useState("");
    const [como, setComo] = useState("");
    const [quiero, setQuiero] = useState("");
    const [paraQue, setParaQue] = useState("");
    const [prioridad, setPrioridad] = useState("Alta");
    const [storyPoints, setStoryPoints] = useState("");
    console.log(estatus);

    const [criteriosList, setCriteriosList] = useState<CriterioAceptacion[]>([]);

    const token = localStorage.getItem("token");
    const API_URL = import.meta.env.VITE_API_URL;

    // Función para agregar un nuevo criterio a la historia
    const agregarCriterio = () => {
        const nuevoId = criteriosList.length > 0 ? Math.max(...criteriosList.map(c => c.id_criterio)) + 1 : 1;
        setCriteriosList(prev => [...prev, { id_criterio: nuevoId, texto: "" }]);
    };

    // Función para eliminar un criterio de la lista
    const eliminarCriterio = (id: number) => {
        setCriteriosList(prev => prev.filter(c => c.id_criterio !== id));
    };

    const getHistoriaUsuario = async () => {
        try {
            const response = await fetch(
                `${API_URL}/historiasUsuario/${tecnica.historiaUsuarioData.id_historia_usario}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Error al obtener la historia de usuario");
            }

            const data = await response.json();
            
            // Cargar los datos en los estados
            setTituloHistoria(data.titulo || "");
            setComo(data.autor || "");
            setQuiero(data.objetivo || "");
            setParaQue(data.proposito || "");
            
            // Cargar criterios de aceptación
            if (data.criterio_aceptacion && data.criterio_aceptacion.length > 0) {
                const criteriosMapeados = data.criterio_aceptacion.map((c: any) => ({
                    id_criterio: c.id_criterio,
                    texto: c.descripcion
                }));
                setCriteriosList(criteriosMapeados);
            }
        } catch (err) {
            console.error("Error en la petición:", err);
        }
    };

    useEffect(() => {
        getHistoriaUsuario();
    }, []);

    const handleSubmit = async () => {
        const body = {
            titulo: tituloHistoria,
            autor: como,
            objetivo: quiero,
            proposito: paraQue,
            id_tecnica: tecnica.id,
            estatus: estatus,
            criterios_aceptacion: criteriosList.map(c => ({
                texto: c.texto,
                descripcion: c.texto
            }))
        };

        try {
            const response = await fetch(
                `${API_URL}/historiasUsuario/actualizar_historia/${tecnica.historiaUsuarioData.id_historia_usario}`,
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
                throw new Error(`Error al actualizar la historia de usuario: ${response}`);
            }

            const data = await response.json();
            console.log("Historia actualizada:", data);
            
            // Opcional: Mostrar mensaje de éxito o recargar datos
            await getHistoriaUsuario();
        } catch (error) {
            console.error("Error al guardar:", error);
        }
    };

    return (
        <form action={handleSubmit}>
            <section className="historia-usuario-section">
                <header className="header-historia-section">
                    <h2>Historia de Usuario</h2>
                </header>

                <div className="input-container full-width">
                    <label htmlFor="titulo-historia">Título de la Historia</label>
                    <input
                        id="titulo-historia"
                        type="text"
                        placeholder="Ingrese el título para esta historia de usuario"
                        value={tituloHistoria}
                        onChange={(e) => setTituloHistoria(e.target.value)}
                    />
                </div>

                <div className="input-container full-width">
                    <label htmlFor="como">Como...</label>
                    <input
                        id="como"
                        type="text"
                        placeholder="Ingrese el rol para esta historia"
                        value={como}
                        onChange={(e) => setComo(e.target.value)}
                    />
                </div>

                <div className="input-container full-width textarea-container">
                    <label htmlFor="quiero">Quiero...</label>
                    <textarea
                        id="quiero"
                        placeholder="Ingrese la necesidad del usuario"
                        value={quiero}
                        onChange={(e) => setQuiero(e.target.value)}
                    />
                </div>

                <div className="input-container full-width textarea-container">
                    <label htmlFor="para-que">Para que...</label>
                    <textarea
                        id="para-que"
                        placeholder="Ingrese el beneficio de la historia"
                        value={paraQue}
                        onChange={(e) => setParaQue(e.target.value)}
                    />
                </div>

                <div className="info-row">
                    <div className="input-container">
                        <label htmlFor="prioridad">Prioridad</label>
                        <select
                            id="prioridad"
                            value={prioridad}
                            onChange={(e) => setPrioridad(e.target.value)}
                        >
                            <option value="Alta">Alta</option>
                            <option value="Media">Media</option>
                            <option value="Baja">Baja</option>
                        </select>
                    </div>
                    <div className="input-container">
                        <label htmlFor="story-points">Story Points (Opcional)</label>
                        <input
                            id="story-points"
                            type="number"
                            placeholder="5"
                            value={storyPoints}
                            onChange={(e) => setStoryPoints(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <section className="criterios-aceptacion-section">
                <header className="header-criterios-section">
                    <h2>Criterios de Aceptación</h2>
                    <button
                        type="button"
                        className="button-add-criterio"
                        onClick={agregarCriterio}
                    >
                        <Plus />
                        Agregar Criterio
                    </button>
                </header>
                <div className="criterios-items">
                    {criteriosList.length === 0 && (
                        <div className="no-criterios">No hay criterios de aceptación. Agrega el primero.</div>
                    )}
                    {criteriosList.map((criterio, index) => (
                        <article key={criterio.id_criterio} className="criterio-card">
                            <div className="numero-criterio">{index + 1}</div>
                            <div className="contenido-criterio">
                                <input
                                    type="text"
                                    placeholder="Descripción del criterio..."
                                    value={criterio.texto}
                                    onChange={(e) => {
                                        const nuevos = criteriosList.map(item =>
                                            item.id_criterio === criterio.id_criterio
                                                ? { ...item, texto: e.target.value }
                                                : item
                                        );
                                        setCriteriosList(nuevos);
                                    }}
                                />
                                <button
                                    type="button"
                                    className="button-delete-criterio"
                                    onClick={() => eliminarCriterio(criterio.id_criterio)}
                                >
                                    <Trash fill="#ff1c1cff" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
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
