import jwt from "jsonwebtoken";
import User from "../src/users/users-model.js";

export const validateJWT = async (req, res, next) => {
    const authHeader = req.header("Authorization") || req.header("authorization");

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "No hay token en la petición"
        });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : authHeader.trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token vacío"
        });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("[validateJWT] JWT_SECRET no está configurado en las variables de entorno");
        return res.status(500).json({
            success: false,
            message: "Configuración de autenticación inválida en el servidor"
        });
    }

    try {
        const decoded = jwt.verify(token, secret, {
            algorithms: ["HS256"],
            issuer: process.env.JWT_ISSUER || "BiteGoAuthService",
            audience: process.env.JWT_AUDIENCE || "BiteGoServices"
        });

        // El claim "role" del .NET se proyecta al campo "rol" esperado por el resto del código
        req.user = {
            uid: decoded.sub,
            rol: decoded.role,
            jti: decoded.jti,
            iat: decoded.iat,
            exp: decoded.exp
        };

        // Enriquecer con id_restaurante desde la DB (el token .NET no lo incluye)
        if (decoded.sub) {
            const dbUser = await User.findOne({ auth_id: decoded.sub }).select("id_restaurante").lean();
            if (dbUser) req.user.id_restaurante = dbUser.id_restaurante;
        }

        next();
    } catch (err) {
        console.warn(`[validateJWT] Token inválido: ${err.message}`);
        return res.status(401).json({
            success: false,
            message: "Token no válido o expirado"
        });
    }
};