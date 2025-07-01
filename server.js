const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // .verbose() para mensagens de erro mais detalhadas
const cors = require('cors');
const path = require('path'); // Módulo path para lidar com caminhos de arquivos

const app = express();
const PORT = process.env.PORT || 3000; // Porta onde o servidor vai rodar

// Middleware
app.use(cors()); // Permite requisições de diferentes origens (ex: seu frontend)
app.use(express.json()); // Para o Express entender requisições com corpo em JSON (para POST e PUT)
app.use(express.urlencoded({ extended: true })); // Para entender dados de formulários tradicionais

// Caminho para o banco de dados SQLite
// Assume que server.js está na raiz e o BD está em 'database/adopet.db'
const DB_PATH = path.join(__dirname, 'database', 'adopet.db');

// Conectar ao banco de dados SQLite
let db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite 'adopet.db'");
        // Cria a tabela se ela não existir (opcional, já criamos com DB Browser)
        // db.run(`CREATE TABLE IF NOT EXISTS animais (...)`, (err) => { ... });
    }
});

// --- ROTAS DA API PARA O CRUD DE ANIMAIS ---

// Rota para servir arquivos estáticos (HTML, CSS, JS do frontend, imagens)
// Isso permite que você acesse seu site em http://localhost:3000/index.html
app.use(express.static(path.join(__dirname, '/'))); // Serve arquivos da raiz do projeto
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));


// READ ALL (Listar todos os animais) - GET /api/animais
app.get('/api/animais', (req, res) => {
    const sql = "SELECT * FROM animais ORDER BY nome";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows); // Retorna a lista de animais como JSON
    });
});

// READ ONE (Buscar um animal pelo ID) - GET /api/animais/:id
app.get('/api/animais/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM animais WHERE id = ?";
    db.get(sql, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ message: "Animal não encontrado." });
        }
    });
});

// CREATE (Adicionar novo animal) - POST /api/animais
app.post('/api/animais', (req, res) => {
    const { nome, especie, sexo, porte, idade, estado, cidade, img, descricao } = req.body;
    // Validação básica
    if (!nome || !especie) {
        return res.status(400).json({ error: "Nome e espécie são obrigatórios." });
    }

    const sql = `INSERT INTO animais (nome, especie, sexo, porte, idade, estado, cidade, img, descricao) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [nome, especie, sexo, porte, parseInt(idade) || null, estado, cidade, img, descricao];

    db.run(sql, params, function(err) { // Usar function() para ter acesso ao 'this'
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ 
            message: "Animal adicionado com sucesso!",
            id: this.lastID // Retorna o ID do animal inserido
        });
    });
});

// UPDATE (Atualizar animal existente) - PUT /api/animais/:id
app.put('/api/animais/:id', (req, res) => {
    const id = req.params.id;
    const { nome, especie, sexo, porte, idade, estado, cidade, img, descricao } = req.body;

    if (!nome || !especie) {
        return res.status(400).json({ error: "Nome e espécie são obrigatórios." });
    }
    
    const sql = `UPDATE animais SET 
                    nome = ?, especie = ?, sexo = ?, porte = ?, idade = ?, 
                    estado = ?, cidade = ?, img = ?, descricao = ?
                 WHERE id = ?`;
    const params = [nome, especie, sexo, porte, parseInt(idade) || null, estado, cidade, img, descricao, id];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "Animal não encontrado para atualização." });
        } else {
            res.json({ message: "Animal atualizado com sucesso!" });
        }
    });
});

// DELETE (Remover animal) - DELETE /api/animais/:id
app.delete('/api/animais/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM animais WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "Animal não encontrado para exclusão." });
        } else {
            res.json({ message: "Animal excluído com sucesso!" });
        }
    });
});


// Rota padrão para servir o index.html (opcional, mas bom para acesso direto a /)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor Adopet rodando na porta ${PORT}`);
    console.log(`Acesse o site em: http://localhost:${PORT}`);
    console.log(`Painel Admin: http://localhost:${PORT}/admin.html`);
});

// Fechar a conexão com o banco de dados quando o servidor for encerrado (importante!)
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Conexão com o banco de dados SQLite fechada.');
        process.exit(0);
    });
});