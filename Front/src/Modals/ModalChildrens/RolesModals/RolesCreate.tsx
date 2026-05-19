import { useContext, useState, type SetStateAction } from "react";
import { ProjectIdContext } from "../../../pages/ConfigProjects";
import "./RolesCreate.css";
import type { Rol } from "../../../Types/Roles";

type estatusRol = "A" | "I" | "E";

interface Form {
    nombre: string;
    descripcion: string;
    estatus: estatusRol;
}

interface SetCreateRoleProp {
    setCreateRole: React.Dispatch<SetStateAction<boolean>>;
}

interface SetRoleProp {
    setRoles: React.Dispatch<SetStateAction<Rol[]>>;
}

export default function RolesCreate({setCreateRole, setRoles}: SetCreateRoleProp & SetRoleProp) {
    const projectId = useContext(ProjectIdContext); // Acceder al contexto del proyecto seleccionado
    // Formulario para crear el rol
    const [form, setForm] = useState<Form>({
        nombre: "",
        descripcion: "",
        estatus: "A"
    });

    // Maneja los cambios del formulario
    const handleChangeFormCreateRole = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    }

    const createRole = async () => {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL;
        // Body para hacer el post
        const bodyCreate = {
            nombre: form.nombre,
            descripcion: form.descripcion,
            estatus: form.estatus,
            id_proyecto: projectId
        };

        try {
            const response = await fetch(`${API_URL}/roles/crear-rol`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`, // Envía el token
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyCreate)
            });

            if (!response.ok) {
                throw new Error("No se pudo crear el rol");
            }

            const data = await response.json();
            setCreateRole(false);
            setRoles(prev => [...prev, data]);
        } catch (err) {
            console.error("Error en la petición:", err);
        }
    }

    return (
        <section className="create-role">
            <header>
                <h3>Crear Rol</h3>
            </header>
            <form action={createRole} className="form-role">
                <div className="input-name">
                    <label htmlFor="name-role">Nombre</label>
                    <input
                        type="text"
                        id="name-role"
                        name="nombre"
                        placeholder="Ingrese el nombre"
                        value={form.nombre}
                        onChange={handleChangeFormCreateRole}/>
                </div>
                <div className="input-description">
                    <label htmlFor="role-description">Descripción</label>
                    <textarea
                        name="descripcion"
                        id="role-description"
                        placeholder="Breve descripción de lo que representa"
                        value={form.descripcion}
                        onChange={handleChangeFormCreateRole}/>
                </div>
                <div className="input-status">
                    <label htmlFor="select-status">Estatus</label>
                    <select
                        name="estatus" 
                        id="select-status"
                        value={form.estatus}
                        onChange={handleChangeFormCreateRole}>
                        <option value="Activo">Activo</option>
                    </select>
                </div>
                <button>Crear Rol</button>
            </form>
        </section>
    );
}