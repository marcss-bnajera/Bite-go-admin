/**
 * Migracion: inicializa tiene_sucursales en restaurantes que no lo tengan definido.
 * Backward compatible — los restaurantes existentes sin este campo funcionan como antes.
 *
 * Uso (desde Bite-go-admin):
 *   cd Bite-go-admin && node scripts/migrate-sucursales.js
 *
 * Requiere: mongoose (disponible en Bite-go-admin)
 */
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || process.env.URL_MONGODB || "mongodb://localhost:27017/BiteGoDB";

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`Conectado a ${MONGO_URI}`);

        const db = mongoose.connection.db;
        const result = await db.collection("restaurants").updateMany(
            { tiene_sucursales: { $exists: false } },
            { $set: { tiene_sucursales: false } }
        );

        console.log(`Restaurantes actualizados: ${result.modifiedCount}`);
    } catch (err) {
        console.error("Error en migracion:", err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
