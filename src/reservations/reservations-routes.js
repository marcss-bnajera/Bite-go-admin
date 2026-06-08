// Importacion de Router
import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { hasRole } from "../../middlewares/validate-roles.js";
// Importacion de controladores
import {
    getReservations,
    createReservation,
    updateReservation,
    deleteReservation
} from "./reservations-controller.js";
import {
    validateCreateReservation,
    validateUpdateReservation,
    validateReservationParams
} from "../../middlewares/reservations-validator.js";

const router = Router();
const auth = [validateJWT, hasRole('SuperAdmin', 'Admin_Restaurante')];

// GET - Obtener todas las reservaciones
router.get("/", auth, validateReservationParams, getReservations);

// POST - Registrar nueva reservacion
router.post("/", auth, validateCreateReservation, createReservation);

// PUT - Actualizar reservacion por ID
router.put("/:id", auth, validateUpdateReservation, updateReservation);

// DELETE - Cancelar reservacion por ID
router.delete("/:id", auth, deleteReservation);

// Exportar rutas
export default router;