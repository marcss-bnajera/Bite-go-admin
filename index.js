// Importaciones
import dotenv from "dotenv";
import { initServer } from "./configs/app.js";

dotenv.config();


// errores no capturados
process.on('uncaughtException', (error) => {
    console.log(error);
    process.exit(1);
});

// promesas rechazadas o no manejadas
process.on('unhandledRejection', (reason, promise) => {
    console.log(reason, promise);
    process.exit(1);
});

//Iniciar el servidor
console.log("Iniciando Bite&Go...");
initServer();

