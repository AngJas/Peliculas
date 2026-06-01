const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const SECRET_KEY = "mi_clave_super_secreta";

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite"
});

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

function verificarToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: "Token requerido"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, SECRET_KEY);

        req.usuario = decoded;

        next();

    } catch (error) {

        return res.status(403).json({
            error: "Token inválido"
        });

    }
}

(async () => {

    await sequelize.sync();

    const totalPeliculas = await Pelicula.count();

    if (totalPeliculas === 0) {

        await Pelicula.bulkCreate([
            {
                titulo: "Interstellar",
                director: "Christopher Nolan",
                anio: 2014
            },
            {
                titulo: "Titanic",
                director: "James Cameron",
                anio: 1997
            }
        ]);

    }

    const totalUsuarios = await Usuario.count();

    if (totalUsuarios === 0) {

        const passwordHash = await bcrypt.hash("123456", 10);

        await Usuario.create({
            username: "admin",
            password: passwordHash
        });

        console.log("Usuario creado:");
        console.log("admin / 123456");
    }

})();

app.post("/login", async (req, res) => {

    const { username, password } = req.body;

    const usuario = await Usuario.findOne({
        where: { username }
    });

    if (!usuario) {
        return res.status(401).json({
            error: "Usuario incorrecto"
        });
    }

    const passwordCorrecta = await bcrypt.compare(
        password,
        usuario.password
    );

    if (!passwordCorrecta) {
        return res.status(401).json({
            error: "Contraseña incorrecta"
        });
    }

    const token = jwt.sign(
        {
            id: usuario.id,
            username: usuario.username
        },
        SECRET_KEY,
        {
            expiresIn: "1h"
        }
    );

    res.json({
        token
    });

});


app.get("/peliculas", verificarToken, async (req, res) => {

    const peliculas = await Pelicula.findAll();

    res.json(peliculas);

});

app.listen(3000, () => {
    console.log("Servidor en http://localhost:3000");
});