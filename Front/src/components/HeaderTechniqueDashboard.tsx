import { DockLeft } from "@boxicons/react";
import type { SetStateAction } from "react";

interface CollapsedProp {
    collapsed: boolean;
    setCollapsed: React.Dispatch<SetStateAction<boolean>>;
    mobileOpen: boolean;
    setMobileOpen: React.Dispatch<SetStateAction<boolean>>;
}

interface UserInfoProp {
    nombreUsuario: string;
    correoUsuario: string;
}

export default function HeaderTechniqueDashboard({ collapsed, setCollapsed, mobileOpen, setMobileOpen, nombreUsuario, correoUsuario }: CollapsedProp & UserInfoProp) {
    const letterName = nombreUsuario.split("");
    
    return (
        <header className="header">
            <section className="info-user">
                <div className="toggle-button">
                    <button className="button-desktop" onClick={() => setCollapsed(!collapsed)}>
                        <DockLeft />
                    </button>
                    <button className="button-mobile" onClick={() => setMobileOpen(!mobileOpen)}>
                        <DockLeft />
                    </button>
                </div>
                <div className="avatar">
                    <p className="letter-name">{letterName[0]}</p>
                </div>
                <div className="info">
                    <p>¡Hola! {nombreUsuario}</p>
                    <p>{correoUsuario}</p>
                </div>
            </section>
            {/* <section className="options-buttons">
                <button className="button-one"><User pack="filled" /> Mi Perfil</button>
            </section> */}
        </header>
    );
}