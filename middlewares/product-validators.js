import { body, param, validationResult } from "express-validator";

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const msg = errors.array().map(e => e.msg).join(", ");
        return res.status(400).json({ success: false, message: msg, errors: errors.array() });
    }
    next();
};

export const createProductValidator = [
    body("id_restaurante").isMongoId().withMessage("El ID del restaurante no es válido"),
    body("nombre").notEmpty().withMessage("El nombre del producto es obligatorio").trim(),
    body("precio").isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
    body("categoria").isMongoId().withMessage("El ID de la categoría no es válido"),

    body("receta").optional({ values: "falsy" }).isArray().withMessage("La receta debe ser un arreglo de insumos"),
    body("receta.*.nombre_insumo").if(body("receta").isArray({ min: 1 })).notEmpty().withMessage("Cada insumo debe tener un nombre"),
    body("receta.*.cantidad_requerida").if(body("receta").isArray({ min: 1 })).isFloat({ min: 0 }).withMessage("La cantidad del insumo debe ser positiva"),

    body("variaciones").optional({ values: "falsy" }).isArray().withMessage("Las variaciones deben ser un arreglo"),
    body("variaciones.*.nombre").if(body("variaciones").isArray({ min: 1 })).notEmpty().withMessage("El nombre de la variación es obligatorio"),
    body("variaciones.*.precio_adicional").optional().isFloat({ min: 0 }).withMessage("El precio adicional no puede ser negativo"),
    body("variaciones.*.afecta_inventario").optional().isBoolean().withMessage("Afecta inventario debe ser booleano"),
    body("variaciones.*.cantidad_insumo").optional().isFloat({ min: 0 }).withMessage("La cantidad de insumo debe ser positiva"),

    validarCampos
];

export const updateProductValidator = [
    param("id").isMongoId().withMessage("ID de producto no válido"),
    body("precio").optional().isFloat({ min: 0 }).withMessage("El precio debe ser positivo"),
    body("categoria").optional().isMongoId().withMessage("El ID de la categoría no es válido"),
    body("variaciones").optional().isArray().withMessage("Las variaciones deben ser un arreglo"),
    validarCampos
];