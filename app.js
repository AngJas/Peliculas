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

    await sequelize.authenticate();

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


app.get("/peliculas", async (req, res) => {

    const peliculas = await Pelicula.findAll();

    res.json(peliculas);

});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});