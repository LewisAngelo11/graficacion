import type { SetStateAction } from "react";
import "./StakeholdersDelete.css";

interface SetSelectedDeleteIdProp {
    idStakeholder: number;
    setSelectedDeleteId: React.Dispatch<SetStateAction<number | null>>;
}

// Prop con un callback para ejecutar un trigger desde "Roles.tsx"
interface OnStakeholderDeleteProp {
    onDeleteStakeholder?: (stakeId: number) => void;
}

export default function StakeholdersDelete({ idStakeholder, setSelectedDeleteId, onDeleteStakeholder }: SetSelectedDeleteIdProp & OnStakeholderDeleteProp) {
    const handleDeleteStakeholder = async () => {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${API_URL}/stakeholders/eliminar/${idStakeholder}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`, // Envía el token
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error("Error al eliminar el stakeholder.");
            }

            alert("¡¡Stakeholder eliminado correctamente!!");
            setSelectedDeleteId(null) // Cierra el modal automáticamente
            if (onDeleteStakeholder) {
                onDeleteStakeholder(idStakeholder);
            }
        } catch (err) {
            console.error("Error en la query: ", err);
        }
    };

    return (
        <div className="alert-delete-stakeholder">
            <h2>¿Estás seguro que quieres eliminar este Stakeholder?</h2>
            <div className="buttons-div-delete">
                <button
                    className="cancel-button-delete-stake"
                    onClick={() => setSelectedDeleteId(null)}
                >
                    Cancelar
                </button>
                <button
                    className="delete-button-stake"
                    onClick={handleDeleteStakeholder}
                >
                    Eliminar
                </button>
            </div>
        </div>
    );
}