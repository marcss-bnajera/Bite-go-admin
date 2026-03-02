import { Router } from "express";
import {
    addEvento,
    getEventos,
    updateEvento,
    deleteEvento
} from "./gastronomicEvents-controller.js";

const router = Router();

// GET 
router.get("/:id", getEventos);

// POST 
router.post("/:id", addEvento);

// PUT 
router.put("/:restId/:eventoId", updateEvento);

// DELETE 
router.delete("/:restId/:eventoId", deleteEvento);

export default router;