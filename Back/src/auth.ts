import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; 
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyToken } from './middleware/auth.middleware';

dotenv.config();

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const secret = process.env.JWT_SECRET || 'Secret-Object';

        // Buscamos si existe el correo
        const usuario = await prisma.usuario.findFirst({
            where: { email: email },
        });

        if (!usuario) {
            return res
            .status(404)
            .json({ message: "No hay usuario con ese correo" });
        }
        
        //compara la contraseña que escribe el usuario con la encriptada que esta en la BD
        const compareHashPassword = await bcrypt.compare(password, usuario.password_hash);
        
        if (!compareHashPassword) {
            return res.status(401).json({ message: "La contraseña es incorrecta"});
        }

        // Se crea el token
        const token = jwt.sign(
            { id: usuario.id_usuario }, 
            secret,
            { expiresIn: '1h' }
        );

        // Mandamos el token y los datos
        res.json({ 
            message: 'Inicio de sesion exitoso', 
            token, 
            user: usuario 
        });

    } catch (error) {
        console.log(error);
        res.status(500).json('Hubo un error al iniciar sesion');
    }
});

//Ruta para registrar usuarios
router.post('/register', async (req: Request, res: Response) => {
    try {

        const { nombre, apellido_paterno, apellido_materno, email, password } = req.body;
        
        //  Array de errores para validacion para contraseña
        const errorValidaciones: string[] = [];
        //  Validaciones 
        if (password && password.length < 8) {
            errorValidaciones.push("La contraseña debe tener al menos 8 caracteres")
        }
        if (password && !/[A-Z]/.test(password)) {
            errorValidaciones.push("La contraseña debe de contener almenos una mayuscula")
        }
        if (password && !/[0-9]/.test(password)) {
            errorValidaciones.push("La contraseña debe de contener almenos un numero")
        }

        // Si hay errores regresar los errores de validacion detectados:
        if (errorValidaciones.length > 0) {
            return res.status(400).json({
                message: "Errores en la validacion",
                errors: errorValidaciones
            })
        }

        // una vez ya pasadas las pruebas de validacion encriptar la contraseña para guardarla en la bd 
        const saltRounds = 10;
        const passwordHashed = await bcrypt.hash(password, saltRounds);

        const usuarioNuevo = await prisma.usuario.create({
            data: {
                nombre: nombre, 
                apellido_paterno: apellido_paterno,
                apellido_materno: apellido_materno,
                email: email,
                password_hash: passwordHashed,
                estatus: "A"
            }
        })

        res.status(200).json({
            Message: "Usuario creado exitosamente", usuarioNuevo
        });

    } catch (error) {
        console.log(error);
        res.status(500).json('Hubo un error al crear el usuario')
    }
});

router.get('/info', verifyToken, async (req: any, res: Response) => {
    try {
        const idUsuario = req.usuario.id;
        console.log(idUsuario);
        const usuario = await prisma.usuario.findUnique({
            where: {
                id_usuario: Number(idUsuario)
            }
        });

        if (!usuario) {
            res.status(400).json({ message: "El usuario no existe" });
        }

        res.status(200).json(usuario)
    } catch (error) {
        console.error("Hubo un error al obtener el usuario:", error);
        res.status(500).json({ message: "Hubo un error interno al obrtener la info del usuario." });
    }
}) 

export default router;