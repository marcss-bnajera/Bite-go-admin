import { Router } from "express";
import {
    addEvento,
    getEventos,
    updateEvento,
    deleteEvento
} from "./gastronomicEvents-controller.js";
import {
    validateRestaurantId,
    validateEventoBody,
    validateEventUpdateDelete
} from "../../middlewares/restaurants-validator.js";

const router = Router();

// GET 
router.get("/:id", validateRestaurantId, getEventos);

// POST 
router.post("/:id", validateEventoBody, addEvento);

// PUT 
router.put("/:restId/:eventoId", validateEventUpdateDelete, updateEvento);

// DELETE 
router.delete("/:restId/:eventoId", deleteEvento);

export default router;