// Importacion de Router
import { Router } from "express";
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

// GET - Obtener todas las reservaciones
router.get("/", validateReservationParams, getReservations);

// POST - Registrar nueva reservacion
router.post("/", validateCreateReservation, createReservation);

// PUT - Actualizar reservacion por ID
router.put("/:id", validateUpdateReservation, updateReservation);

// DELETE - Cancelar reservacion por ID
router.delete("/:id", deleteReservation);

// Exportar rutas
export default router;