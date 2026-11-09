# 🛡️ SEC-CONTROL: Plataforma de Controle Administrativo e Quadro de Trabalho Semanal (QTS)

Repositório oficial da **2ª Entrega do Projeto Integrador** (Prova de Conceito Funcional - PoC) apresentado ao **Centro Universitário Senac**.

## 👥 Integrantes do Grupo
- **Flavia Rodrigues Moraes Biagioni**
- **Felipe Carnevale Vianna Pereira**
- **Leonardo Guardiola Vargas**
- **Matheus Reis Silva**
- **Miryam da Silva Souza**

---

## 🎯 Sobre o Projeto e a Prova de Conceito (PoC)
O **SEC-CONTROL** mitiga ineficiências na comunicação e atrasos operacionais em organizações com estruturas hierárquicas rígidas, substituindo controles físicos por uma plataforma administrativa centralizada (Web) e um aplicativo móvel integrado para agentes em campo.

Nesta **Prova de Conceito (PoC)**, validamos a jornada integrada entre:
1. **Gestor Carlos (Web):** Publicação de missões no Quadro de Trabalho Semanal (QTS) e monitoramento em tempo real.
2. **Operador Rafael (Mobile):** Recebimento da missão no smartphone, visualização das instruções táticas e confirmação de cumprimento em campo (`Concluir Tarefa`).
3. **Trilha de Auditoria Imutável:** Cada criação ou conclusão gera automaticamente um log persistente com hash criptográfico **SHA-256**, garantindo a conformidade com a Governança de TI.

---

## 🛠️ Tecnologias Utilizadas
- **Backend:** Node.js + Express (API RESTful)
- **Banco de Dados:** SQLite3 (`seccontrol.db` gerado automaticamente)
- **Segurança e Auditoria:** Módulo nativo `crypto` (Hashes SHA-256)
- **Frontend (Web + Simulador Mobile):** HTML5, CSS3, Bootstrap 5 e JavaScript (Fetch API)

---

## 🚀 Instruções de Execução (Passo a Passo)

### Pré-requisitos
- Ter o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado na máquina.

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU-USUARIO/sec-control-poc.git
cd sec-control-poc
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Iniciar o servidor
```bash
npm start
```

### 4. Acessar a aplicação
Abra o navegador e acesse:
```text
http://localhost:3000
```
