const conexion = require('./conexion');

const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const connectionOptions = {
    dialect: 'postgres',
    protocol: 'postgres'
};

if (process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true') {
    connectionOptions.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    };
}

// const sequelize = new Sequelize(process.env.DATABASE_URL, connectionOptions);

const Pelicula = conexion.define("Pelicula", {
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    director: DataTypes.STRING,
    anio: DataTypes.INTEGER
});

app.get("/peliculas", async (req, res) => {

    const peliculas = await Pelicula.findAll();

    res.json(peliculas);

});

// Create new pelicula
app.post("/peliculas", async (req, res) => {
    try {
        const { titulo, director, anio } = req.body;
        if (!titulo) return res.status(400).json({ error: "Campo 'titulo' requerido" });
        const nueva = await Pelicula.create({ titulo, director, anio });
        return res.status(201).json(nueva);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Replace pelicula (PUT)
app.put("/peliculas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, director, anio } = req.body;
        if (!titulo) return res.status(400).json({ error: "Campo 'titulo' requerido" });
        const pelicula = await Pelicula.findByPk(id);
        if (!pelicula) return res.status(404).json({ error: "Película no encontrada" });
        pelicula.titulo = titulo;
        pelicula.director = director;
        pelicula.anio = anio;
        await pelicula.save();
        return res.json(pelicula);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Partial update (PATCH)
app.patch("/peliculas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const pelicula = await Pelicula.findByPk(id);
        if (!pelicula) return res.status(404).json({ error: "Película no encontrada" });
        await pelicula.update(updates);
        return res.json(pelicula);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Delete pelicula
app.delete("/peliculas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const pelicula = await Pelicula.findByPk(id);
        if (!pelicula) return res.status(404).json({ error: "Película no encontrada" });
        await pelicula.destroy();
        return res.status(204).send();
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;

app.get("/", async (req, res) => {
    res.send("¡Bienvenido a la API de Películas!");
});

async function iniciarServidor() {
    try {
        await conexion.authenticate();
        console.log('Conexión exitosa a PostgreSQL');

        await conexion.sync();
        console.log('Tablas sincronizadas');

        app.listen(PORT, () => {
            console.log(`Servidor en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

iniciarServidor();