const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

// const SECRET_KEY = process.env.SECRET_KEY;

// if (process.env.NODE_ENV === 'production' && !SECRET_KEY) {
//     console.error('FATAL: SECRET_KEY must be set in production (process.env.SECRET_KEY)');
//     process.exit(1);
// }

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

const sequelize = new Sequelize(process.env.DATABASE_URL, connectionOptions);

const Pelicula = sequelize.define("Pelicula", {
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    director: DataTypes.STRING,
    anio: DataTypes.INTEGER
});

const Usuario = sequelize.define("Usuario", {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

app.get("/peliculas", async (req, res) => {

    const peliculas = await Pelicula.findAll();

    res.json(peliculas);

});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});