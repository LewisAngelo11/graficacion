import { useEffect, useState } from "react";
import { File } from "@boxicons/react"
import "./SpecsInfo.css";

interface Rol {
    id_rol: number;
    nombre: string;
}

interface Stakeholder {
    id_stakeholder: number;
    nombre: string;
    area?: string;
}

interface Subproceso {
    id_subproceso: number;
    nombre: string;
    descripcion?: string;
}

interface Proceso {
    id_proceso: number;
    nombre: string;
    descripcion?: string;
    subproceso: Subproceso[];
}

interface Proyecto {
    nombre: string;
    descripcion?: string;
    rol: Rol[];
    stakeholder: Stakeholder[];
    proceso: Proceso[];
}

interface ProjectIdProp {
    projectId: number | null;
}

export default function SpecsInfo({ projectId }: ProjectIdProp) {
    const [project, setProject] = useState<Proyecto | null>(null);
    const [loadingGenerate, setLoadingGenerate] = useState(false);
    const [message, setMessage] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    const handleGenerateSpecs = async () => {
        try {
            setLoadingGenerate(true);
            setMessage("");
            const response = await fetch(`${API_URL}/specs/${projectId}/generar`, {
                    method: "POST"
                }
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            setMessage(data.mensaje);
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setLoadingGenerate(false);
        }
    };

    useEffect(() => {
        const getProjectSpecs = async () => {
            const response = await fetch(`${API_URL}/specs/${projectId}/specs-info`);
            const data = await response.json();
            setProject(data);
        };

        getProjectSpecs();
    }, []);

    if (!project) {
        return (
            <section className="specs-loading">
                <p>Cargando specs del proyecto...</p>
            </section>
        );
    }

    return (
        <section className="specs-container">
            <header className="specs-header">
                <h2>Specs del proyecto</h2>
                <h1>{project.nombre}</h1>
                <p>{project.descripcion}</p>
            </header>
            <div className="specs-card">
                <h3>Roles del Proyecto</h3>
                <ul className="specs-list">
                    {project.rol.map(role => (
                        <li key={role.id_rol}>
                            {role.nombre}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="specs-card">
                <h3>Procesos del Proyecto</h3>
                <div className="process-list">
                    {project.proceso.map(process => (
                        <article
                            key={process.id_proceso}
                            className="process-card"
                        >
                            <div className="process-header">
                                <h4>{process.nombre}</h4>
                                <span>
                                    ID: {process.id_proceso}
                                </span>
                            </div>
                            <p className="process-description">
                                {process.descripcion}
                            </p>
                            <div className="subprocess-section">
                                <h5>Subprocesos</h5>
                                <ul className="subprocess-list">
                                    {process.subproceso.map(subprocess => (
                                        <li
                                            key={subprocess.id_subproceso}
                                            className="subprocess-item"
                                        >
                                            <strong>
                                                {subprocess.nombre}
                                            </strong>
                                            {subprocess.descripcion && (
                                                <p>
                                                    {subprocess.descripcion}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
            <button
                className="button-generate-specs"
                onClick={handleGenerateSpecs}
                disabled={loadingGenerate}
            >
                <File size="sm" />
                {loadingGenerate
                    ? "Generando..."
                    : "Generar Specs"}
            </button>
            {message && (
                <p className="generate-message">
                    {message}
                </p>
            )}
        </section>
    );
}