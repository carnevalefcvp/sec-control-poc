const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicialização do Banco de Dados SQLite
const db = new sqlite3.Database('./seccontrol.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite (seccontrol.db).');
  }
});

// Função auxiliar para gerar Hash SHA-256 de Auditoria Imutável
function gerarHashAuditoria(usuario, acao, detalhes, timestamp) {
  const payload = `${usuario}|${acao}|${detalhes}|${timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16).toUpperCase();
}

// Criação das tabelas e carga inicial das Personas (Carlos e Rafael)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cargo TEXT NOT NULL,
      perfil TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS qts_missoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao_tatica TEXT NOT NULL,
      local TEXT NOT NULL,
      horario_turno TEXT NOT NULL,
      operador_nome TEXT NOT NULL,
      status TEXT DEFAULT 'PENDENTE',
      criado_em TEXT NOT NULL,
      concluido_em TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_nome TEXT NOT NULL,
      perfil TEXT NOT NULL,
      acao TEXT NOT NULL,
      detalhes TEXT NOT NULL,
      hash_integridade TEXT NOT NULL,
      data_hora TEXT NOT NULL
    )
  `);

  // Verifica se já existem dados iniciais
  db.get('SELECT COUNT(*) as total FROM qts_missoes', (err, row) => {
    if (row && row.total === 0) {
      const agora = new Date().toLocaleString('pt-BR');
      const detalhesSeed = 'Missão inicial QTS: Ronda Perimetral Setor Norte atribuída a Rafael';
      const hashSeed = gerarHashAuditoria('Carlos (Supervisor)', 'CRIACAO_MISSAO', detalhesSeed, agora);

      db.run(
        `INSERT INTO qts_missoes (titulo, descricao_tatica, local, horario_turno, operador_nome, status, criado_em)
         VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
        [
          'Ronda Perimetral e Inspeção de Portões',
          'Verificar trancas eletrônicas dos portões G1 a G4 e reportar anomalias no perímetro norte.',
          'Base Central - Setor Norte (Manaus/AM)',
          'Segunda-feira | 08:00 às 12:00',
          'Rafael (Agente Operacional)',
          agora
        ]
      );

      db.run(
        `INSERT INTO logs_auditoria (usuario_nome, perfil, acao, detalhes, hash_integridade, data_hora)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Carlos (Supervisor)', 'GESTOR_WEB', 'CRIACAO_MISSAO', detalhesSeed, hashSeed, agora]
      );
    }
  });
});

// Endpoint 1: Buscar missões do QTS e Logs de Auditoria
app.get('/api/dados', (req, res) => {
  db.all('SELECT * FROM qts_missoes ORDER BY id DESC', [], (err, missoes) => {
    if (err) return res.status(500).json({ erro: err.message });

    db.all('SELECT * FROM logs_auditoria ORDER BY id DESC', [], (err2, logs) => {
      if (err2) return res.status(500).json({ erro: err2.message });
      res.json({ missoes, logs });
    });
  });
});

// Endpoint 2: Criar nova missão no QTS (Jornada de Carlos - Gestor Web)
app.post('/api/missoes', (req, res) => {
  const { titulo, descricao_tatica, local, horario_turno, operador_nome } = req.body;

  if (!titulo || !descricao_tatica || !local || !horario_turno || !operador_nome) {
    return res.status(400).json({ erro: 'Todos os campos da escala QTS são obrigatórios.' });
  }

  const agora = new Date().toLocaleString('pt-BR');
  const sqlMissao = `
    INSERT INTO qts_missoes (titulo, descricao_tatica, local, horario_turno, operador_nome, status, criado_em)
    VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)
  `;

  db.run(sqlMissao, [titulo, descricao_tatica, local, horario_turno, operador_nome, agora], function (err) {
    if (err) return res.status(500).json({ erro: err.message });

    const missaoId = this.lastID;
    const detalhesLog = `QTS #${missaoId} ("${titulo}") atribuído para ${operador_nome} no turno [${horario_turno}]`;
    const hash = gerarHashAuditoria('Carlos (Supervisor)', 'CRIACAO_MISSAO', detalhesLog, agora);

    const sqlLog = `
      INSERT INTO logs_auditoria (usuario_nome, perfil, acao, detalhes, hash_integridade, data_hora)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(sqlLog, ['Carlos (Supervisor)', 'GESTOR_WEB', 'CRIACAO_MISSAO', detalhesLog, hash, agora], (errLog) => {
      if (errLog) return res.status(500).json({ erro: errLog.message });
      res.status(201).json({ mensagem: 'Missão cadastrada e auditada com sucesso!', id: missaoId });
    });
  });
});

// Endpoint 3: Concluir missão em campo (Jornada de Rafael - Operador Mobile)
app.patch('/api/missoes/:id/concluir', (req, res) => {
  const { id } = req.params;
  const agora = new Date().toLocaleString('pt-BR');

  db.get('SELECT * FROM qts_missoes WHERE id = ?', [id], (err, missao) => {
    if (err || !missao) return res.status(404).json({ erro: 'Missão não encontrada.' });
    if (missao.status === 'CONCLUIDA') return res.status(400).json({ erro: 'Missão já foi concluída.' });

    db.run(
      `UPDATE qts_missoes SET status = 'CONCLUIDA', concluido_em = ? WHERE id = ?`,
      [agora, id],
      (errUpdate) => {
        if (errUpdate) return res.status(500).json({ erro: errUpdate.message });

        const detalhesLog = `Execução confirmada em campo para QTS #${id} ("${missao.titulo}") via App Mobile`;
        const hash = gerarHashAuditoria(missao.operador_nome, 'CONCLUSAO_MISSAO', detalhesLog, agora);

        db.run(
          `INSERT INTO logs_auditoria (usuario_nome, perfil, acao, detalhes, hash_integridade, data_hora)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [missao.operador_nome, 'OPERADOR_MOBILE', 'CONCLUSAO_MISSAO', detalhesLog, hash, agora],
          (errLog) => {
            if (errLog) return res.status(500).json({ erro: errLog.message });
            res.json({ mensagem: 'Tarefa concluída e sincronizada com sucesso!' });
          }
        );
      }
    );
  });
});

app.listen(PORT, () => {
  console.log(`Servidor SEC-CONTROL rodando em http://localhost:${PORT}`);
});
