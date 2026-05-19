import React, { useEffect, useState, useContext, type SetStateAction } from "react";
import { ProjectIdContext } from "../../pages/ConfigProjects";
import type { Rol } from "../../Types/Roles";
import Modal from "../../Modals/Modal";
import StakeholdersCreate from "../../Modals/ModalChildrens/StakeholdersModals/StakeholdersCreate";
import RolesCreate from "../../Modals/ModalChildrens/RolesModals/RolesCreate";
import RolesEdit from "../../Modals/ModalChildrens/RolesModals/RolesEdit";
import RolesDelete from "../../Modals/ModalChildrens/RolesModals/RolesDelete";
import { Plus, Edit, UserPlus, Trash } from "@boxicons/react";
import StakeholderList from "../StakeholdersComponents/StakeholdersList";
import ModalCreate from "../../Modals/ModalCreate";
import "./Roles.css";

export default function Roles() {
    const projectId = useContext(ProjectIdContext); // Acceder al contexto del proyecto seleccionado
    const [createRole, setCreateRole] = useState<boolean>(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [roles, setRoles] = useState<Rol[]>([]); // Guarda los roles obtenidos del back
    const [idRol, setIdRol] = useState<number>(0);
    // Este state se encarga de abrir el modal para eliminar el rol seleccionado, por su ID
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);

    // Trigger específico por rol (objeto con rolId como key)
    const [refreshTriggers, setRefreshTriggers] = useState<Record<number, number>>({});

    // Esto extrae el rol en base al id seleccionado para pasarlo como prop
    const roleEditar = roles.find(r => r.id_rol === selectedId);

    // Función que actualiza el rol en la UI, para reflejar los cambios directamente
    const handleUpdateRole = (updateRole: Rol) => {
        setRoles(roles.map(r =>
            r.id_rol === updateRole.id_rol ? updateRole : r
        ));
    };

    // Función que se llama cuando se crea un stakeholder
    const handleStakeholderCreate = (rolId: number) => {
        setRefreshTriggers(prev => ({
            ...prev,
            [rolId]: (prev[rolId] || 0) + 1 // Solo incrementa el trigger de ESE rol
        }));
    };

    // Función que actualiza la lista de roles cuando se elimina un rol
    const handleDeleteRole = (id: number) => {
        setRoles(roles.filter(r => r.id_rol !== id));
    };

    const getAllRoles = async () => {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${API_URL}/roles/proyecto/${projectId}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`, // Envía el token
                    'Content-Type': 'application/json'
                }
            });

            if (!response) {
                throw new Error("No se pudo conseguir los roles", response);
            }

            const data = await response.json();
            console.log(data);
            setRoles(data.filter((r: Rol) => r.estatus !== 'E'));
        } catch (err) {
            console.error("Error al conseguir los roles de este proyecto.", err);
        }
    }

    useEffect(() => {
        getAllRoles();
    }, []);

    // Botón para mostrar el formulario de crear un nuevo stakeholder
    const AddRole = () => {
        return (
            <button
                onClick={() => setCreateRole(true)}
                className="button-add-role"
            >
                <Plus size="xs" /> Agregar Rol
            </button>
        )
    }

    return (
        <section className="roles">
            <header className="roles-header">
                <h2>Roles y Stakeholders</h2>
                <AddRole />
            </header>

            {createRole &&
                <ModalCreate
                    children={
                        <RolesCreate
                            setCreateRole={setCreateRole}
                            setRoles={setRoles}
                        />
                    }
                    setOpen={setCreateRole} />
            }
            <div className="roles-list">
                {roles.map(r => (
                    <Role
                        key={r.id_rol}
                        id={r.id_rol}
                        nombre={r.nombre}
                        descripcion={r.descripcion}
                        estatus={r.estatus}
                        totalStakeholders={r.stakeholder?.length !== undefined ? r.stakeholder?.length : 0}
                        selectedId={selectedId}
                        setSelectedId={setSelectedId}
                        setOpenModal={setOpenModal}
                        setIdRol={setIdRol}
                        refreshTrigger={refreshTriggers[r.id_rol] || 0}
                        setSelectedDeleteId={setSelectedDeleteId}
                    />
                ))}
            </div>
            {selectedDeleteId !== null &&
                <ModalCreate
                    children={
                        <RolesDelete
                            idRol={selectedDeleteId}
                            setSelectedDeleteId={setSelectedDeleteId}
                            onDeleteRol={handleDeleteRole}
                        />
                    }
                    setOpen={() => setSelectedDeleteId(null)}
                />
            }
            {selectedId !== null &&
                <Modal
                    children={
                        <RolesEdit
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
                            roleEditar={roleEditar}
                            onUpdateRole={handleUpdateRole}
                        />
                    }
                    setSelectedId={setSelectedId}
                />
            }
            {openModal &&
                <ModalCreate
                    children={
                        <StakeholdersCreate
                            idRol={idRol}
                            setOpenModal={setOpenModal}
                            onStakeholderCreated={handleStakeholderCreate}
                        />
                    }
                    setOpen={setOpenModal}
                />
            }
        </section>
    )
}

// Este prop es para abrir el modal para editar un stakeholder
interface SelectedIdProp {
    selectedId: number | null;
    setSelectedId: React.Dispatch<SetStateAction<number | null>>;
}

// Prop para pasar el setter del estado para abrir el modal de crear stakeholder
interface OpenModalCreateStakeholderProp {
    setOpenModal: React.Dispatch<SetStateAction<boolean>>;
}

// Prop que pasa el setter para indicar desde que rol se agregará el stakeholder
interface SetIdRol {
    setIdRol: React.Dispatch<SetStateAction<number>>;
}

interface RolesProp {
    id: number;
    nombre: string;
    descripcion: string;
    estatus: string;
    totalStakeholders: number;
    refreshTrigger?: number;
    setSelectedDeleteId: React.Dispatch<SetStateAction<number | null>>;
}

function Role({
    id,
    nombre,
    descripcion,
    totalStakeholders,
    setSelectedId,
    setOpenModal,
    setIdRol,
    refreshTrigger = 0,
    setSelectedDeleteId
}: RolesProp & SelectedIdProp & OpenModalCreateStakeholderProp & SetIdRol) {
    // Esta función cambia dos states, para indicar que se debe abrir el modal y para pasar el id del rol con props
    const handleCreateStakeholder = () => {
        setOpenModal(true); // Pone en true el estado para abrir el modal de crear un stakeholder
        setIdRol(id); // Cambia el estado al id del rol actual para pasarlo por props al modal
    };

    return (
        <article className="role">
            <header className="role-header">
                <div className="role-info">
                    <h3>{nombre}</h3>
                    <p>{descripcion}</p>
                </div>
                <div className="role-actions">
                    <button
                        className="button-edit-role"
                        onClick={() => setSelectedId(id)}
                    >
                        <Edit />
                    </button>
                    <button className="button-delete-role" onClick={() => setSelectedDeleteId(id)}>
                        <Trash fill="#e10303ff" />
                    </button>
                </div>
            </header>
            <section className="role-body">
                <header className="header-role-body">
                    <span>{`${totalStakeholders} ${totalStakeholders === 1 ? 'stakeholder' : 'stakeholders'}`}</span>
                    <button
                        className="add-stakeholder"
                        onClick={handleCreateStakeholder}
                    >
                        <UserPlus size="xs" />
                        Agregar Stakeholders
                    </button>
                </header>
                <hr />
                <StakeholderList
                    idRole={id}
                    key={`${id}-${refreshTrigger}`} // Solo cambia cuando ESE rol cambia
                />
            </section>
        </article>
    )
}