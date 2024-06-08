const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

const pool = new Pool({
    user: 'marmontDB',
    host: 'localhost',
    database: 'marmontDB',
    password: 'marmontDB',
    port: 5432,
});

app.post('/documents', (req, res) => {
    const { documentName, beschreibung, category, language, dokument } = req.body;

    pool.query(
        'INSERT INTO dokumente (name, beschreibung, category, language, dokument) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [documentName, beschreibung, category, language, Buffer.from(dokument, 'base64')],
        (error, results) => {
            if (error) {
                console.error('Fehler beim Einfügen in die Datenbank:', error);
                res.status(500).send('Es ist ein Fehler aufgetreten.');
            } else {
                const insertedDocument = results.rows[0];
                res.json(insertedDocument);
            }
        }
    );
});

app.get('/documents', (req, res) => {
    pool.query('SELECT * FROM dokumente WHERE status > 0', (error, results) => {
        if (error) {
            console.error('Fehler beim Abrufen der Dokumente aus der Datenbank:', error);
            res.status(500).send('Es ist ein Fehler aufgetreten.');
        } else {
            res.json(results.rows);
        }
    });
});

app.get('/documents/:id', (req, res) => {
    const documentId = req.params.id;

    pool.query(
        'SELECT * FROM dokumente WHERE id = $1 AND status > 0',
        [documentId],
        (error, results) => {
            if (error) {
                console.error('Fehler beim Abrufen des Dokuments:', error);
                res.status(500).send('Es ist ein Fehler aufgetreten.');
            } else if (results.rows.length === 0) {
                res.status(404).send('Dokument nicht gefunden.');
            } else {
                const document = results.rows[0];
                document.dokument = document.dokument.toString('base64');
                res.json(document);
            }
        }
    );
});

app.put('/documents/:id', (req, res) => {
    const documentId = req.params.id;
    const { name, beschreibung, category, language } = req.body;

    pool.query(
        'UPDATE dokumente SET name = $1, beschreibung = $2, category = $3, language = $4, version = version + 1, mdate = CURRENT_TIMESTAMP WHERE id = $5 AND status > 0 RETURNING *',
        [name, beschreibung, category, language, documentId],
        (error, results) => {
            if (error) {
                console.error('Fehler beim Aktualisieren des Dokuments:', error);
                res.status(500).send('Es ist ein Fehler aufgetreten.');
            } else if (results.rows.length === 0) {
                res.status(404).send('Dokument nicht gefunden.');
            } else {
                const updatedDocument = results.rows[0];
                res.json(updatedDocument);
            }
        }
    );
});

app.delete('/documents/:id', (req, res) => {
    const documentId = req.params.id;

    pool.query(
        'UPDATE dokumente SET status = 0 WHERE id = $1 AND status > 0',
        [documentId],
        (error, results) => {
            if (error) {
                console.error('Fehler beim Löschen des Dokuments:', error);
                res.status(500).send('Es ist ein Fehler aufgetreten.');
            } else if (results.rowCount === 0) {
                res.status(404).send('Dokument nicht gefunden.');
            } else {
                res.sendStatus(200);
            }
        }
    );
});

app.listen(3000, () => {
    console.log('Server läuft auf Port 3000');
});