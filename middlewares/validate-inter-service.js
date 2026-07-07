'use strict'

/**
 * Middleware para proteger rutas de comunicación entre servicios.
 * Valida que el header X-Internal-Secret coincida con la variable de entorno.
 * Solo accesible desde la red interna de Docker.
 */
export const validateInterService = (req, res, next) => {
    const secret = req.headers['x-internal-secret'];

    if (!secret || secret !== process.env.INTER_SERVICE_SECRET) {
        return res.status(403).json({
            success: false,
            message: "Acceso no autorizado a ruta inter-service"
        });
    }

    next();
};
