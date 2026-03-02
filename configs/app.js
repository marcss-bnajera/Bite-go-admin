`use strict`;
// Importaciones
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { corsOptions } from "./cors-configuration.js";
import helmet from "helmet";
import { helmetConfiguration } from "./helmet-configuration.js";
import { requestLimit } from "../middlewares/request-limit.js";
import usersRoutes from "../src/users/users-routes.js";
import restaurantsRoutes from "../src/restaurants/restaurants-routes.js";
import gastronomicEventsRoutes from "../src/gastronomicEvents/gastronomicEvents-routes.js";
import tablesRoutes from "../src/tables/tables-routes.js";
import productsRoutes from "../src/products/products-routes.js";
import ordersRoutes from "../src/orders/orders-routes.js";
import itemsRoutes from "../src/items/items-routes.js";
import recipesRoutes from "../src/recipes/recipes-routes.js";
import suppliesInventoryRoutes from "../src/suppliesInventory/suppliesInventory-routes.js";
import reservationsRoutes from "../src/reservations/reservations-routes.js";

const BASE_URL = '/bite-and-go/v1';

// Rutas
import { dbConnection } from './db.js';

const middlewares = (app) => {
    app.use(helmet(helmetConfiguration));
    app.use(cors(corsOptions));
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(requestLimit);
    app.use(morgan("dev"));
}

//Integracion de todas las rutas
const routes = (app) => {
    app.use(`${BASE_URL}/users`, usersRoutes);
    app.use(`${BASE_URL}/restaurants`, restaurantsRoutes);
    app.use(`${BASE_URL}/reservations`, reservationsRoutes);
    app.use(`${BASE_URL}/gastronomicEvents`, gastronomicEventsRoutes);
    app.use(`${BASE_URL}/tables`, tablesRoutes);
    app.use(`${BASE_URL}/products`, productsRoutes);
    app.use(`${BASE_URL}/suppliesInventory`, suppliesInventoryRoutes);
    app.use(`${BASE_URL}/orders`, ordersRoutes);
    app.use(`${BASE_URL}/items`, itemsRoutes);
    app.use(`${BASE_URL}/recipes`, recipesRoutes);
}

// funcion para iniciar el servidor
const initServer = async (app) => {
    // Crear la instancia de la aplicacion
    app = express();
    const PORT = process.env.PORT || 3001;

    try {
        //Configuracion de los middlewares (Mi aplicaion)
        dbConnection();
        middlewares(app);
        routes(app);


        app.listen(PORT, () => {
            console.log(`Servidor iniciado en el puerto ${PORT}`);
            console.log(`URL BASE: http://localhost:${PORT}${BASE_URL}`);
        });

        // Primera ruta
        app.get(`${BASE_URL}/prueba`, (req, res) => {
            res.status(200).json(
                {
                    status: 'ok',
                    service: 'Bite&Go Admin',
                    version: '1.0.0'
                }
            );
        });

    } catch (error) {

        console.log(error);

    }
}

export { initServer };