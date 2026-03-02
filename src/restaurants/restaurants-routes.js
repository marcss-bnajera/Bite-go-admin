import { Router } from "express";
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant
} from "./restaurants-controller.js";

const router = Router();

// GET 
router.get("/", getRestaurants);

// POST 
router.post("/", createRestaurant);

// PUT 
router.put("/:id", updateRestaurant);

// DELETE 
router.delete("/:id", deleteRestaurant);

export default router;