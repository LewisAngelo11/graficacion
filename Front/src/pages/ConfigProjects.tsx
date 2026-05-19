import { useNavigate, useParams } from "react-router";
import { useEffect, useState, type SetStateAction } from "react";
import { DashboardAlt, ArrowLeftStroke, Calendar, Pencil, Community, Workflow, ArrowOutLeftSquareHalf } from "@boxicons/react";
import ResumeProject from "../components/ConfigProjectsComponents/ResumeProject";
import EditProject from "../Modals/ModalChildrens/ProjectsModals/EditProject";
import Process from "../components/ProcessesComponents/Processes";
import ModalCreate from "../Modals/ModalCreate";
import HeaderConfigProject from "../components/HeaderConfigProject";
import consultOneProject from "../services/consultOneProject";
import { type Proyecto } from "../Types/Proyectos";
import "./ConfigProjects.css"
import Roles from "../components/RolesComponents/Roles";
import { createContext } from 'react';
import FlowticCard from "../components/ConfigProjectsComponents/FlowticDiagramsCard";

type OptionsProjects = "Roles" | "Procesos";

// Se crea contexto para preservar el id del proyecto en todos los componentes hijos
export const ProjectIdContext = createContext<number | null>(null);

export default function ConfigProjects() {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    // Estado que maneja la apertura de el modal para editar el proyecto
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [option, setOption] = useState<OptionsProjects>("Roles");
    const [project, setProject] = useState<Proyecto | null>(null);
    const [projectStatus, setProjectStatus] = useState<string>("");
    // State para cambiar el valor del contexto del id del proyecto
    const [projectId, setProjectId] = useState<number | null>(null);
    const [nombreUsuario, setNombreUsuario] = useState<string>("");
    const [correoUsuario, setCorreoUsuario] = useState<string>("");

    // Con el hook "useParams" obtenemos el id pasado en la ruta desde el componente Project
    const { id_project } = useParams();

    // Objeto que guarda las clases CSS del estatus de los proyectos, para dar estilos en la interfaz
    const statusClasses: Record<string, string> = {
        "Planificación": "planificacion",
        "En Progreso": "en-progreso",
        "Completado": "completado",
        "Cancelado": "cancelado"
    };

    const API_URL = import.meta.env.VITE_API_URL;

    // Función que asigna la clase de CSS dinámicamente dependiendo del estatus del proyecto
    const checkStatus = (estatus: string) => {
        return statusClasses[estatus] || "planificacion"
    };

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

    const getProject = async () => {
        try {
            if (!id_project) throw new Error("No se proporcionó un id de proyecto para la petición.");
            if (!token) throw new Error("El token no fue proporcionado");

            // Obtiene la info del proyecto seleccionado por su id
            const dataProject = await consultOneProject(id_project, token);
            console.log(dataProject);
            if (!dataProject) {
                navigate("/login");
                throw new Error("No se pudo obtener la información del proyecto");
            }

            const dateClean = dataProject.fecha_inicio.split("T")[0];
            setProject({
                id_proyecto: dataProject.id_proyecto,
                nombre: dataProject.nombre,
                descripcion: dataProject.descripcion,
                fecha_inicio: dateClean,
                estatus: dataProject.estatus,
                rol: dataProject.rol,
                proceso: dataProject.proceso
            });

            setProjectId(dataProject.id_proyecto);
            setProjectStatus(dataProject.estatus);
        } catch (err) {
            console.error(err);
            alert("Error al obtener el proyecto");
        }
    }

    const totalRoles = project?.rol.length ?? 0;
    const totalProcesos = project?.proceso.length ?? 0;
    const totalStakeholders = project?.rol.reduce((acc, r) => acc + r.stakeholder.length, 0);
    const totalSubprocesos = project?.proceso.reduce((acc, p) => acc + p.subproceso.length, 0);

    useEffect(() => {
        getProject();
        getInfoUser();
    }, []);

    return (
        <main className={`configurate-container ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
            <ProjectSideBar
                option={option}
                setOption={setOption}
                totalProcesos={totalProcesos}
                totalRoles={totalRoles}
                totalSubprocesos={totalSubprocesos ?? 0}
                totalStakeholders={totalStakeholders ?? 0}
            />
            {mobileOpen && <div
                className="backdrop"
                onClick={() => setMobileOpen(!mobileOpen)}
            />}
            <section className="configurate-body">
                <HeaderConfigProject
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                    nombreUsuario={nombreUsuario}
                    correoUsuario={correoUsuario}
                />
                <section className="config-content">
                    <header className="configurate-header">
                        <div className="section-header">
                            <div className="data-project">
                                <div className="principal-info">
                                    <button
                                        className="button-go-back"
                                        onClick={() => navigate("/dashboard")}
                                    >
                                        <ArrowLeftStroke />
                                    </button>
                                    <div>
                                        <h1>{project?.nombre}</h1>
                                        <p>{project?.descripcion}</p>
                                    </div>
                                </div>
                                <dl className="secundary-info">
                                    <div className="state-project">
                                        <dt>Estado:</dt>
                                        <dd className={`status-project ${checkStatus(projectStatus)}`}>{project?.estatus}</dd>
                                    </div>
                                    <div className="date-project">
                                        <dt>
                                            <Calendar size="xs" />
                                            Creado el
                                        </dt>
                                        <dd>{project?.fecha_inicio}</dd>
                                    </div>
                                </dl>
                            </div>
                            <button
                                className="button-edit-project"
                                onClick={() => setOpenEditModal(true)}
                            >
                                <Pencil size="xs" /> Editar
                            </button>
                        </div>
                    </header>
                    <ResumeProject
                        totalProcesos={totalProcesos}
                        totalRoles={totalRoles}
                        totalStakeholders={totalStakeholders ?? 0}
                        totalSubprocesos={totalSubprocesos ?? 0}
                    />
                    <div className="buttons-menu">
                        <button
                            className={`button-menu ${option === "Roles" ? "selected" : ""}`}
                            onClick={() => setOption("Roles")}
                        >
                            Roles y Stakeholders
                        </button>
                        <button
                            onClick={() => setOption("Procesos")}
                            className={`button-menu ${option === "Procesos" ? "selected" : ""}`}
                        >
                            Procesos
                        </button>
                    </div>
                    {option === "Roles" && projectId !== null && (
                        <ProjectIdContext value={projectId}>
                            <Roles />
                        </ProjectIdContext>
                    )}
                    {option === "Procesos" && projectId !== null && (
                        <ProjectIdContext value={projectId}>
                            <Process />
                        </ProjectIdContext>
                    )}
                </section>
            </section>
            {openEditModal && <ModalCreate
                children={
                    <EditProject
                        proyecto={project}
                        setProyecto={setProject}
                        setOpenEditModal={setOpenEditModal}
                    />
                } setOpen={setOpenEditModal} />}
        </main>
    );
}

// Props para pasar el estado de la opción selecionada en la config del proyecto "Roles y Stakeholders" o "Procesos" al sidebar
interface OptionsProjectsProp {
    option: OptionsProjects;
    setOption: React.Dispatch<SetStateAction<OptionsProjects>>
}

interface EntitiesProjectProp {
    totalRoles: number;
    totalProcesos: number;
    totalStakeholders: number;
    totalSubprocesos: number;
}

function ProjectSideBar({ option, setOption, totalRoles, totalProcesos, totalStakeholders, totalSubprocesos }: OptionsProjectsProp & EntitiesProjectProp) {
    const navigate = useNavigate();

    const logOut = () => {
        localStorage.removeItem("token");
        navigate("/login");
    }

    return (
        <aside className="sidebar">
            <header className="header-sidebar">
                <h2>FLOWTIC</h2>
            </header>
            <div className="button-container">
                <button
                    className="button-dashboard"
                    onClick={() => navigate(-1)}
                >
                    <DashboardAlt /> Dashboard
                </button>
            </div>
            <section className="resume-sidebar">
                <h3>Resumen</h3>
                <dl className="resume-list">
                    <dt>
                        <div className="icon-roles"></div>
                        Roles
                    </dt>
                    <dd>{totalRoles}</dd>

                    <dt>
                        <div className="icon-stakeholders"></div>
                        Stakeholders
                    </dt>
                    <dd>{totalStakeholders}</dd>

                    <dt>
                        <div className="icon-procesos"></div>
                        Procesos
                    </dt>
                    <dd>{totalProcesos}</dd>

                    <dt>
                        <div className="icon-subprocesos"></div>
                        Subprocesos
                    </dt>
                    <dd>{totalSubprocesos}</dd>
                </dl>
            </section>
            <section className="sidebar-buttons-menu">
                <button
                    className={`sidebar-button-menu ${option === "Roles" ? 'option-selected' : ''}`}
                    onClick={() => setOption("Roles")}
                >
                    <Community size="xs" /> Roles y Stakeholders
                </button>
                <button
                    className={`sidebar-button-menu ${option === "Procesos" ? 'option-selected' : ''}`}
                    onClick={() => setOption("Procesos")}
                >
                    <Workflow size="xs" /> Procesos
                </button>
            </section>
            <FlowticCard />
            <div className="container-button-logout-sidebar">
                <button onClick={logOut} className="button-logout-sidebar">
                    <ArrowOutLeftSquareHalf size="xs"/>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}