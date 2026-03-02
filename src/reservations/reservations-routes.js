// Importacion de Router
import { Router } from "express";
// Importacion de controladores
import {
    getReservations,
    createReservation,
    updateReservation,
    deleteReservation
} from "./reservations-controller.js";

const router = Router();

// GET - Obtener todas las reservaciones
router.get("/", getReservations);

// POST - Registrar nueva reservacion
router.post("/", createReservation);

// PUT - Actualizar reservacion por ID
router.put("/:id", updateReservation);

// DELETE - Cancelar reservacion por ID
router.delete("/:id", deleteReservation);

// Exportar rutas
export default router;