require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Conexion a MySQL en la nube (Aiven) con soporte SSL y Pool
const conexion = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }, // Obligatorio para conectar con Aiven de forma segura
    waitForConnections: true,
    connectionLimit: 10
});

// Ruta principal
app.get('/', (req, res) => {
    res.send('Bienvenido a la tienda de manhwas en la nube');
});

// Consultar categorias
app.get('/categorias', (req, res) => {
    conexion.query('SELECT * FROM categorias', (error, resultados) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(resultados);
    });
});

// Registrar categoria
app.post('/categorias', (req, res) => {
    const { nombre, correo, telefono } = req.body;

    const sql = 'INSERT INTO categorias (nombre, correo, telefono) VALUES (?, ?, ?)';

    conexion.query(sql, [nombre, correo, telefono || null], (error, resultado) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({
            mensaje: 'Registro guardado correctamente',
            id: resultado.insertId
        });
    });
});

// Consultar productos
app.get('/productos', (req, res) => {
    conexion.query('SELECT * FROM productos', (error, resultados) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(resultados);
    });
});

// Registrar producto
app.post('/productos', (req, res) => {
    const { nombre, descripcion, precio, portada, genero, stock } = req.body;

    const sql = 'INSERT INTO productos (nombre, descripcion, precio, portada, genero, stock) VALUES (?, ?, ?, ?, ?, ?)';

    conexion.query(
        sql,
        [nombre, descripcion || null, precio, portada || null, genero || null, stock ?? 0],
        (error, resultado) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.status(201).json({
                mensaje: 'Producto registrado correctamente',
                id: resultado.insertId
            });
        }
    );
});

// Consultar ventas
app.get('/ventas', (req, res) => {
    const sql = 'SELECT ventas.*, categorias.nombre AS categoria, productos.nombre AS producto FROM ventas INNER JOIN categorias ON ventas.categoria_id = categorias.id INNER JOIN productos ON ventas.producto_id = productos.id';

    conexion.query(sql, (error, resultados) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(resultados);
    });
});

// Registrar venta
app.post('/ventas', (req, res) => {
    const { categoria_id, producto_id, cantidad, fecha } = req.body;

    const sql = 'INSERT INTO ventas (categoria_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)';

    conexion.query(
        sql,
        [categoria_id, producto_id, cantidad, fecha],
        (error, resultado) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.status(201).json({
                mensaje: 'Venta registrada correctamente',
                id: resultado.insertId
            });
        }
    );
});

// Actualizar venta (EDITAR)
app.put('/ventas/:id', (req, res) => {
    const { id } = req.params;
    const { categoria_id, producto_id, cantidad, fecha } = req.body;

    const sql = 'UPDATE ventas SET categoria_id = ?, producto_id = ?, cantidad = ?, fecha = ? WHERE id = ?';

    conexion.query(sql, [categoria_id, producto_id, cantidad, fecha, id], (error, resultado) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        res.json({ mensaje: 'Venta actualizada correctamente' });
    });
});

// Eliminar venta (BORRAR)
app.delete('/ventas/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM ventas WHERE id = ?';

    conexion.query(sql, [id], (error, resultado) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        res.json({ mensaje: 'Venta eliminada correctamente' });
    });
});

// Iniciar servidor
app.listen(PUERTO, () => {
    console.log('Servidor ejecutandose en el puerto ' + PUERTO);
});

