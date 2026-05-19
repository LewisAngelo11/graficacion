import type { SetStateAction } from "react";
import "./RolesDelete.css";

interface RolesDeleteProps {
    idRol: number;
    setSelectedDeleteId: React.Dispatch<SetStateAction<number | null>>;
    onDeleteRol: (id: number) => void;
}

export default function RolesDelete({ idRol, setSelectedDeleteId, onDeleteRol }: RolesDeleteProps) {
    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${API_URL}/roles/eliminar/${idRol}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_rol: idRol })
            });

            if (!response.ok) {
                throw new Error("Error al eliminar el rol.");
            }

            alert("¡Rol eliminado correctamente!");
            setSelectedDeleteId(null);
            onDeleteRol(idRol);
        } catch (err) {
            console.error("Error al eliminar rol: ", err);
        }
    };

    return (
        <div className="alert-delete-modal">
            <h2>¿Estás seguro que quieres eliminar este Rol?</h2>
            <div className="buttons-div-delete">
                <button
                    className="cancel-button-delete"
                    onClick={() => setSelectedDeleteId(null)}
                >
                    Cancelar
                </button>
                <button
                    className="delete-button-confirm"
                    onClick={handleDelete}
                >
                    Eliminar
                </button>
            </div>
        </div>
    );
}
