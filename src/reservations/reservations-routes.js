// Importacion de Router
import { Router } from "express";
import { hasRole } from "../../middlewares/validate-roles.js";
// Importacion de controladores
import {
    getReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    checkInReservation,
    getTablesAvailability
} from "./reservations-controller.js";
import {
    validateCreateReservation,
    validateUpdateReservation,
    validateReservationParams
} from "../../middlewares/reservations-validator.js";

const router = Router();
const auth = [hasRole('SuperAdmin', 'Admin_Restaurante')];

// GET - Disponibilidad de mesas (antes de /:id para evitar conflicto)
router.get("/tables-availability", auth, getTablesAvailability);

// GET - Obtener todas las reservaciones
router.get("/", auth, validateReservationParams, getReservations);

// POST - Registrar nueva reservacion
router.post("/", auth, validateCreateReservation, createReservation);

// PUT - Actualizar reservacion por ID
router.put("/:id", auth, validateUpdateReservation, updateReservation);

// DELETE - Cancelar reservacion por ID
router.delete("/:id", auth, deleteReservation);

// PUT - Registrar asistencia (check-in)
router.put("/:id/check-in", auth, checkInReservation);

// Exportar rutas
export default router;
