import "./Dashboard.css";
import HeaderDashboard from "../components/HeaderDashboard"
import Projects from "../components/ProjectsComponents/Projects";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardAlt, FolderMinus, ArrowOutLeftSquareHalf } from "@boxicons/react";
import consultAllProjects from "../services/consultAllProjects";
import { counterStatusProjects } from "../utils/counterStatusProjects";
import type { Proyecto } from "../Types/Proyectos";
import type { Rol } from "../Types/Roles";


export default function Dashboard() {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const [projects, setProjects] = useState<Proyecto[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [nombreUsuario, setNombreUsuario] = useState<string>("");
    const [correoUsuario, setCorreoUsuario] = useState<string>("");

    // Valores derivados de projects para mostrar el conteo en el sidebar
    const totalProyectos = projects.length;
    const contadorEstatus = counterStatusProjects(projects);
    const planificacion = contadorEstatus["Planificación"] ?? 0;
    const progreso = contadorEstatus["En Progreso"] ?? 0;
    const completado = contadorEstatus["Completado"] ?? 0;
    const cancelado = contadorEstatus["Cancelado"] ?? 0;

    const API_URL = import.meta.env.VITE_API_URL;

    const token = localStorage.getItem("token");
    if (!token) {
        navigate("/");
    }

    const getInfoUser = async () => {
        const token = localStorage.getItem("token")
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

    const getProjects = async () => {
        try {
            const data = await consultAllProjects(token);
            setProjects(data); // Guarda los proyectos consultados en el estado
        } catch (err) {
            console.error("Error en la query: ", err)
            navigate("/");
        }
    };

    const getRoles = async () => {
        try {
            const response = await fetch(`${API_URL}/roles/lista-roles`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Error en la consulta de roles");
            }

            const data = await response.json();
            setRoles(data); // Guarda los roles consultados en el estado
        } catch (err) {
            console.error("Error en la query: ", err)
            navigate("/");
        }
    };

    // Valor derivado de roles para mostrar el conteo total de stakeholders
    const totalStakeholders = roles.map(r => r.stakeholder).flat().length;

    useEffect(() => {
        getInfoUser();
        getProjects();
        getRoles();
    }, []);

    console.log(roles);

    return (
        <main className={`panel-control ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
            <DashboardSidebar 
                totalProyectos={totalProyectos}
                planificacion={planificacion}
                progreso={progreso}
                completado={completado}
                cancelado={cancelado}
                projects={projects}
            />
            {mobileOpen && <div 
                    className="backdrop"
                    onClick={() => setMobileOpen(!mobileOpen)}
                />}
            <section className="dashboard-main">
                <HeaderDashboard
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                    nombreUsuario={nombreUsuario}
                    correoUsuario={correoUsuario}
                />
                <Projects
                    projects={projects}
                    setProjects={setProjects}
                    roles={roles} 
                    totalStakeholders={totalStakeholders}
                />
            </section>
        </main>
    );
}

// Props para el contador de los estatus de los proyectos
interface ContadorEstatusProp {
    totalProyectos: number;
    planificacion: number;
    progreso: number;
    completado: number;
    cancelado: number;
}

interface ProjectsListProp {
    projects: Proyecto[];
}

function DashboardSidebar({totalProyectos, planificacion, progreso, completado, cancelado, projects}: ContadorEstatusProp & ProjectsListProp) {
    const navigate = useNavigate();

    const handleNavigation = (id_proyecto: number) => {
        navigate(`/config-projects/${id_proyecto}`)
    }

    const logOut = () => {
        localStorage.removeItem("token");
        navigate("/login");
    }

    return (
        <aside className="dashboard-sidebar">
            <header className="header-sidebar">
                <h2>FLOWTIC</h2>
            </header>
            <div className="button-container">
                <button className="dashboard-sidebar-button"><DashboardAlt /> Dashboard</button>
            </div>
            <section className="resume-sidebar">
                <h3>Resumen</h3>
                <dl className="resume-list">
                    <dt className="all-projects">Total Proyectos</dt>
                    <dd className="count-all-projects">{totalProyectos}</dd>

                    <dt>
                        <div className="icon-planning"></div>
                        Planificación
                    </dt>
                    <dd>{planificacion}</dd>

                    <dt>
                        <div className="icon-progress"></div>
                        En Progreso
                    </dt>
                    <dd>{progreso}</dd>

                    <dt>
                        <div className="icon-complete"></div>
                        Completados
                    </dt>
                    <dd>{completado}</dd>

                    <dt>
                        <div className="icon-cancel"></div>
                        Cancelados
                    </dt>
                    <dd>{cancelado}</dd>
                </dl>
            </section>
            <section className="last-projects-list">
                <h3 className="last-projects-title">Últimos Proyectos</h3>
                {projects.map(p => (
                    <button
                        key={p.id_proyecto}
                        className="button-last-proyect"
                        onClick={() => handleNavigation(p.id_proyecto)}><FolderMinus size="xs"/> {p.nombre}</button>
                ))}
            </section>
            <div className="container-button-logout-sidebar">
                <button onClick={logOut} className="button-logout-sidebar">
                    <ArrowOutLeftSquareHalf size="xs"/>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}