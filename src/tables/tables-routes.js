import { Router } from "express";
import {
    addMesa,
    getMesas,
    updateMesa,
    deleteMesa
} from "./tables-controller.js";

const router = Router();

// GET 
router.get("/:id", getMesas);

// POST 
router.post("/:id", addMesa);

// PUT 
router.put("/:restId/:mesaId", updateMesa);

// DELETE 
router.delete("/:restId/:mesaId", deleteMesa);

export default router;