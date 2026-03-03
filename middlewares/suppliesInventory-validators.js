import { body, param, validationResult } from "express-validator";

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

export const createInsumoValidator = [
    body("id_restaurante").isMongoId().withMessage("ID de restaurante inválido"),
    body("nombre_insumo").notEmpty().withMessage("El nombre del insumo es obligatorio").trim(),
    body("stock_actual").isNumeric().withMessage("El stock actual debe ser un número"),
    body("stock_minimo").isNumeric().withMessage("El stock mínimo debe ser un número"),
    validarCampos
];

export const adjustStockValidator = [
    param("id").isMongoId().withMessage("ID de insumo inválido"),
    body("cantidad").isNumeric().withMessage("La cantidad a ajustar debe ser un número"),
    validarCampos
];

export const deleteInsumoValidator = [
    param("id").isMongoId().withMessage("ID de insumo inválido"),
    validarCampos
];