import "./CreateNewTechnique.css";
import { X, Plus } from "@boxicons/react";
import { useState } from "react";
import { useParams } from "react-router";

interface CreateNewTechniqueProps {
    onClose: () => void;
}

export default function CreateNewTechnique({ onClose }: CreateNewTechniqueProps) {
    const { id_subproceso } = useParams();
    const [techniqueType, setTechniqueType] = useState("");
    const [techniqueName, setTechniqueName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!techniqueType || !techniqueName) return;

        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem("token");

        let endpoint = "";

        if (techniqueType === "observacion") {
            endpoint = `${API_URL}/observaciones/${id_subproceso}`;
        } else if (techniqueType === "historiasUsuario") {
            endpoint = `${API_URL}/historiasUsuario/crear_historia/${id_subproceso}`;
        } else if (techniqueType === "entrevista") {
            endpoint = `${API_URL}/entrevistas/crear_entrevista/${id_subproceso}`;
        } else if (techniqueType === "focusGroup") {
            endpoint = `${API_URL}/focusGroup/${id_subproceso}`;
        } else if (techniqueType === "cuestionario") {
            endpoint = `${API_URL}/cuestionarios/${id_subproceso}`;
        } else if (techniqueType === "documentos") {
            endpoint = `${API_URL}/documentos/${id_subproceso}`;
        } else if (techniqueType === "seguimientoTransacional") {
            endpoint = `${API_URL}/seguimiento/${id_subproceso}`;
        } else {
            alert("Endpoint no implementado para esta técnica aún.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    titulo: techniqueName,
                    descripcion: description
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al crear la técnica");
            }

            alert("Técnica creada exitosamente");
            onClose(); // Cerrar el modal o vista de creación
            // Aqui seria ideal recargar las tecnicas, pero eso se maneja desde el padre usualmente.
            window.location.reload(); // Recarga simple para mostrar la nueva tecnica
        } catch (error: any) {
            console.error("Error al crear técnica:", error);
            alert("Ocurrió un error al crear la técnica: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="create-technique-page">
            <header className="create-technique-header">
                <h1>Nueva Técnica de Recolección</h1>
                <p>Registra una nueva técnica para recolectar requerimientos</p>
            </header>
            <form onSubmit={handleSubmit} className="create-technique-form">
                <label htmlFor="techniqueType">Tipo de Técnica *</label>
                <select
                    id="techniqueType"
                    name="techniqueType"
                    value={techniqueType}
                    onChange={(e) => setTechniqueType(e.target.value)}
                    required
                >
                    <option value="">Selecciona un tipo de técnica</option>
                    <option value="entrevista">Entrevista</option>
                    <option value="cuestionario">Cuestionario</option>
                    <option value="observacion">Observación</option>
                    <option value="focusGroup">Focus Group</option>
                    <option value="historiasUsuario">Historias de Usuario</option>
                    <option value="documentos">Documentos</option>
                    <option value="seguimientoTransacional">Seguimiento Transacional</option>
                </select>

                <label htmlFor="techniqueName">Nombre de la Técnica *</label>
                <input
                    type="text"
                    id="techniqueName"
                    name="techniqueName"
                    placeholder="Ingresa el nombre de la técnica"
                    value={techniqueName}
                    onChange={(e) => setTechniqueName(e.target.value)}
                    required
                />

                <label htmlFor="description">Descripción (Opcional)</label>
                <textarea
                    id="description"
                    name="description"
                    placeholder="Ingresa una descripción breve de esta técnica"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="button-group">
                    <button
                        type="button"
                        className="cancel-button-technique"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <X size="xs" />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="create-button-technique"
                        disabled={loading}
                    >
                        <Plus size="xs" />
                        {loading ? "Creando..." : "Crear Técnica"}
                    </button>
                </div>
            </form>
        </section>
    );
}