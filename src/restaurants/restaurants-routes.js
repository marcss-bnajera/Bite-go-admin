import { Router } from "express";
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addTable
} from "./restaurants-controller.js";

const router = Router();

router.get("/", getRestaurants);
router.post("/", createRestaurant);
router.put("/:id", updateRestaurant);
router.delete("/:id", deleteRestaurant);

router.post("/:id/add-table", addTable);

export default router;