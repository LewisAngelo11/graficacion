import { useNavigate, useParams } from "react-router";
import "./TechniquesDashboard.css";
import { ArrowLeftStroke, Plus, BookOpen, Dashboard, FileDetail, CheckCircle, Clock, Trash, Calendar } from "@boxicons/react/index";
import React, { useEffect, useState, type JSX } from "react";
import type { TipoTecnica, Tecnica, estatusTecnica } from "../Types/Techniques";
import HeaderTechniqueDashboard from "../components/HeaderTechniqueDashboard";
import CreateNewTechnique from "../components/TechniquesDashboardComponents/CreateNewTechnique";
import { filterTechniques } from "../utils/filterTechniques";
import { asignarIconoTecnica } from "../utils/assingTechniques";
import FormTechnique from "../components/TechniquesForms/FormTechnique";
import EntrevistaForm from "../components/TechniquesForms/EntrevistaForm";
import ObservacionForm from "../components/TechniquesForms/ObservacionForm";
import HistoriasUsuarioForm from "../components/TechniquesForms/HistoriasUsuarioForm";
import DocumentoForm from "../components/TechniquesForms/DocumentoForm";
import CuestionarioForm from "../components/TechniquesForms/CuestionarioForm";
import SeguimientoForm from "../components/TechniquesForms/SeguimientoForm";
import FocusGroupForm from "../components/TechniquesForms/FocusGroupForm";

// Mock Data
export const tecnicasCatalogo: TipoTecnica[] = [
    { id: 1, nombre: "Entrevista" },
    { id: 2, nombre: "Cuestionario" },
    { id: 3, nombre: "Focus Group" },
    { id: 4, nombre: "Observación" },
    { id: 5, nombre: "Historia de Usuario" },
    { id: 6, nombre: "Documentos" },
    { id: 7, nombre: "Seguimiento Transacional" }
]

// ... imports y types
type SelectedTecnique = "Vista General" | "Entrevista" | "Observación" | "Historia de Usuario" | "Focus Group" | "Documentos" | "Seguimiento Transacional" | "Cuestionario";

const statusDictionary: Record<estatusTecnica, string> = {
    "Completada": "green",
    "En Progreso": "blue",
    "Planificada": "gray",
    "Eliminada": "red"
};

const iconStatusDictionary: Record<estatusTecnica, JSX.Element> = {
    "Completada": <CheckCircle fill="#4caf50" />,
    "En Progreso": <Clock fill="#2196f3" />,
    "Planificada": <Calendar fill="#9e9e9e" />,
    "Eliminada": <Trash fill="#f44336" />
}

const convertStringToTypeTecnique = (type: string) => {
    const tipo = tecnicasCatalogo.find(t => t.nombre === type)?.nombre ?? "Vista General";
    return tipo as SelectedTecnique;
}

export default function TechniquesDashboard() {
    const { id_subproceso } = useParams();
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const [addTechnique, setAddTechnique] = useState<boolean>(false);
    const [selectedTechnique, setSelectedTechnique] = useState<SelectedTecnique>("Vista General");
    const [selectedTechniqueData, setSelectedTechniqueData] = useState<Tecnica | null>(null);
    const [nombreUsuario, setNombreUsuario] = useState<string>("");
    const [correoUsuario, setCorreoUsuario] = useState<string>("");

    // Estado para las técnicas
    const [techniques, setTechniques] = useState<Tecnica[]>([]);

    const tecnicasFiltradas = filterTechniques(techniques);
    const navigate = useNavigate();

    const [subprocess, setSubprocess] = useState({
        nombre: "",
        descripcion: ""
    });

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    const getInfoUser = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/info`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Hubo un error al consultar la info del usuario");
            }

            const data = await response.json();
            setNombreUsuario(data.nombre);
            setCorreoUsuario(data.email);
        } catch (err: any) {
            console.error("Error en la petición", err.message);
        }
    }

    const getSubprocesoAndTechniques = async () => {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL;

        try {
            // Fetch Subproceso
            const response = await fetch(`${API_URL}/procesos/subproceso/${id_subproceso}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                navigate("/login");
                throw new Error("Error al obtener el subproceso");
            }

            const data = await response.json();
            setSubprocess({
                nombre: data.nombre,
                descripcion: data.descripcion
            });

            // Fetch Tecnicas
            const responseTec = await fetch(`${API_URL}/tecnicas/subproceso/${id_subproceso}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            if (!responseTec.ok) {
                throw new Error("Error al obtener las técnicas");
            }

            const dataTec = await responseTec.json();

            // Mapear los datos de BD al formato esperado por el frontend
            const mappedTechniques: Tecnica[] = dataTec.map((t: any) => ({
                id: t.id_tecnica,
                titulo: t.titulo,
                descripcion: t.descripcion || "",
                tipo: {
                    id: t.tecnica_recoleccion_catalogo?.id_tecnica_catalogo || 0,
                    nombre: t.tecnica_recoleccion_catalogo?.nombre || "Desconocida"
                },
                // Mapeo simple de estatus, ajusta según tu lógica real
                estatus: t.estatus === "A" ? "En Progreso" : "Completada",
                entrevistaData: t.entrevista?.[0] || null,
                observacionData: t.observacion?.[0] || null,
                historiaUsuarioData: t.historia_usuario?.[0] || null,
                focusGroupData: t.focus_group?.[0] || null,
                cuestionarioData: t.cuestionario?.[0] || null,
                documentoData: t.analisis_documento?.[0] || null,
                seguimientoData: t.seguimiento_transaccional?.[0] || null,
            }));

            setTechniques(mappedTechniques);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        getSubprocesoAndTechniques();
        getInfoUser();
    }, [addTechnique]); // Recargar técnicas si addTechnique cambia (por ejemplo al cerrar el modal)}

    console.log(techniques)

    return (
        <main className={`techniques-dashboard-page ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
            <TechniquesSidebar
                subprocessName={subprocess.nombre}
                subprocessDescription={subprocess.descripcion}
                techniques={techniques}
                addTechnique={addTechnique}
                setAddTechnique={setAddTechnique}
                selectedTechnique={selectedTechnique}
                setSelectedTechnique={setSelectedTechnique}
                setSelectedTechniqueData={setSelectedTechniqueData}
            />
            {mobileOpen && (
                <div
                    className="backdrop"
                    onClick={() => setMobileOpen(!mobileOpen)}
                />
            )}
            <section className="techniques-main-content">
                <HeaderTechniqueDashboard
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                    nombreUsuario={nombreUsuario}
                    correoUsuario={correoUsuario}
                />
                {!addTechnique && selectedTechnique === "Vista General" && (
                    <section className="techniques-container">
                        <header className="techniques-header">
                            <div className="header-info-buttons-container">
                                <div className="header-content">
                                    <h1>Técnicas de Recolección</h1>
                                    <p>Gestiona todas las técnicas para recolectar requerimientos del subproceso.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAddTechnique(true)}
                                className="add-technique-button"
                            >
                                <Plus size="sm" />
                                Nueva Técnica
                            </button>
                        </header>
                        <section className="techniques-content">
                            {/* Si no hay técnicas, muestra esto */}
                            {techniques.length === 0 && (
                                <div className="none-technique-container">
                                    <BookOpen size="xl" fill="#6c6c6c" />
                                    <h2>No hay técnicas registradas</h2>
                                    <p>Comienza agregando una técnica de recolección de requerimientos</p>
                                    <button
                                        onClick={() => setAddTechnique(true)}
                                        className="add-first-technique-button"
                                    >
                                        <Plus size="xs" />
                                        Agregar Nueva Técnica
                                    </button>
                                </div>
                            )}
                            {/* Si hay técnicas, mostrarlas dinámicamente y categorizarlas por tipos */}
                            {Object.entries(tecnicasFiltradas).map(([tipo, tecnicas]) => (
                                <section key={tipo} className="technique-type">
                                    <header>
                                        {asignarIconoTecnica(tipo)}
                                        <h3>{tipo}</h3>
                                    </header>
                                    <div className="techniques-list-grid">
                                        {tecnicas.map(technique => (
                                            <article
                                                key={technique.id}
                                                className="technique-card"
                                                onClick={() => {
                                                    setSelectedTechnique(convertStringToTypeTecnique(tipo));
                                                    setSelectedTechniqueData(technique);
                                                }}>
                                                <header className="technique-card-header">
                                                    <h4>{technique.titulo}</h4>
                                                    <span>{technique.estatus}</span>
                                                </header>
                                                <p>{technique.descripcion}</p>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </section>
                    </section>
                )}
                {selectedTechnique === "Entrevista" && selectedTechniqueData && (
                    <FormTechnique
                        tipoTecnica={tecnicasCatalogo[0]}
                        tecnica={selectedTechniqueData}
                        children={<EntrevistaForm tecnica={selectedTechniqueData} />}
                    />
                )}
                {selectedTechnique === "Focus Group" && selectedTechniqueData && (
                    <FormTechnique
                        tipoTecnica={tecnicasCatalogo[2]}
                        tecnica={selectedTechniqueData}
                        children={<FocusGroupForm tecnica={selectedTechniqueData} />}
                    />
                )}
                {selectedTechnique === "Observación" && selectedTechniqueData && (
                    <FormTechnique
                        tipoTecnica={tecnicasCatalogo[3]}
                        tecnica={selectedTechniqueData}
                        children={<ObservacionForm tecnica={selectedTechniqueData} />}
                    />
                )}
                {selectedTechnique === "Historia de Usuario" && selectedTechniqueData && (
                    <FormTechnique
                        tipoTecnica={tecnicasCatalogo[4]}
                        tecnica={selectedTechniqueData}
                        children={<HistoriasUsuarioForm tecnica={selectedTechniqueData} />}
                    />
                )}
                {selectedTechnique === "Documentos" && selectedTechniqueData && (
                    <FormTechnique
                        tipoTecnica={tecnicasCatalogo[5]}
                        tecnica={selectedTechniqueData}
                        children={<DocumentoForm tecnica={selectedTechniqueData} />}
                    />
                )}
                {selectedTechnique === "Cuestionario" && selectedTechniqueData && (
                    <FormTechnique
                        tipoTecnica={tecnicasCatalogo[1]}
                        tecnica={selectedTechniqueData}
                        children={<CuestionarioForm tecnica={selectedTechniqueData} />}
                    />
                )}
                {selectedTechnique === "Seguimiento Transacional" && selectedTechniqueData && (
                    <FormTechnique
                        tipoTecnica={tecnicasCatalogo[6]}
                        tecnica={selectedTechniqueData}
                        children={<SeguimientoForm tecnica={selectedTechniqueData} />}
                    />
                )}
                {addTechnique && (<CreateNewTechnique onClose={() => setAddTechnique(false)} />)}
            </section>
        </main>
    );
}

interface SubprocessSidebarProps {
    subprocessName: string;
    subprocessDescription: string;
}

interface SetAddTechniqueProp {
    addTechnique: boolean;
    setAddTechnique: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SetSelectedTechnoqueProp {
    techniques: Tecnica[];
    selectedTechnique: SelectedTecnique;
    setSelectedTechnique: React.Dispatch<React.SetStateAction<SelectedTecnique>>;
    setSelectedTechniqueData: React.Dispatch<React.SetStateAction<Tecnica | null>>;
}

function TechniquesSidebar({
    subprocessName, subprocessDescription,
    addTechnique, setAddTechnique,
    techniques, setSelectedTechnique, setSelectedTechniqueData }: SubprocessSidebarProps & SetAddTechniqueProp & SetSelectedTechnoqueProp) {
    const navigate = useNavigate();

    // Mock data
    const totalTecnicas = 0;
    const tecnicasCompletadas = 0;
    const tecnicasEnProgreso = 0;
    const tecnicasPlanificadas = 0;

    // Función para asignar el color según el estatus
    const asignarColorEstatus = (estatus: estatusTecnica) => {
        return statusDictionary[estatus];
    }

    const asignarIconoEstatus = (estatus: estatusTecnica) => {
        return iconStatusDictionary[estatus];
    }

    return (
        <aside className="techniques-sidebar">
            <header className="header-techniques-sidebar">
                <button
                    onClick={() => navigate(-1)}
                    className="back-button"
                >
                    <ArrowLeftStroke />
                    Volver al Proyecto
                </button>
                <div className="subprocess-info-techniques">
                    <span>Subproceso: </span>
                    <h2>{subprocessName}</h2>
                    <small>{subprocessDescription}</small>
                </div>
            </header>
            <section className="resume-techniques-sidebar">
                <div className="resume-item">
                    <small>Técnicas Totales</small>
                    <p>{totalTecnicas}</p>
                </div>
                <div className="resume-item">
                    <small>Técnicas Completadas</small>
                    <p>{tecnicasCompletadas}</p>
                </div>
                <div className="resume-item">
                    <small>Técnicas en Progreso</small>
                    <p>{tecnicasEnProgreso}</p>
                </div>
                <div className="resume-item">
                    <small>Técnicas Planificadas</small>
                    <p>{tecnicasPlanificadas}</p>
                </div>
            </section>
            <section className="general-view-techniques-sidebar">
                <button
                    className="general-view-button"
                    onClick={() => setSelectedTechnique("Vista General")}
                >
                    <Dashboard size="xs" />
                    Vista General
                </button>
                <section className="techniques-list">
                    <header className="header-techniques-list">
                        <span>TÉCNICAS ({totalTecnicas})</span>
                        {techniques.length > 0 && (
                            <button className="add-technique-button-sidebar"><Plus size="xs" /></button>
                        )}
                    </header>
                    {techniques.length === 0 && (
                        <div className="none-technique">
                            <FileDetail size="lg" fill="#cdcdcd" />
                            <span>No hay técnicas aún</span>
                            {!addTechnique && (
                                <button
                                    className="add-technique-button-list"
                                    onClick={() => setAddTechnique(true)}
                                >
                                    <Plus size="xs" />
                                    Agregar Técnica
                                </button>
                            )}
                        </div>
                    )}
                    {techniques.length > 0 && (
                        <div className="technique-sidebar-list">
                            {techniques.map(tecnica => (
                                <div
                                    key={tecnica.id}
                                    className="technique-item-sidebar"
                                    onClick={() => {
                                        setSelectedTechnique(convertStringToTypeTecnique(tecnica.tipo.nombre));
                                        setSelectedTechniqueData(tecnica);
                                    }}>
                                    <div className="technique-item-content">
                                        {asignarIconoTecnica(tecnica.tipo.nombre)}
                                        <div>
                                            <span>{tecnica.titulo}</span>
                                            <small>{tecnica.tipo.nombre}</small>
                                        </div>
                                    </div>
                                    <div className={`status-icon ${asignarColorEstatus(tecnica.estatus)}`}>
                                        {asignarIconoEstatus(tecnica.estatus)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </section>
        </aside>
    );
}