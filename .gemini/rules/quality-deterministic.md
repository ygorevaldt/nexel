# Regras de Qualidade — Determinismo, SOLID e Testes

Este documento estabelece as regras de garantia de qualidade de código, padrões de design de engenharia, determinismo de inteligência artificial e a arquitetura das suítes de testes automatizados do ecossistema Nexel.

---

## 1. IA Determinística via Structured Outputs

- Qualquer interação com a API do Google Gemini (seja o Coach IA ou a validação de prints antifraude) DEVE forçar saídas JSON determinísticas.
- **Configuração Obrigatória do `@google/genai`**:
  - Utilizar sempre o modelo `gemini-2.5-flash` (salvo instrução explícita).
  - Configurar obrigatoriamente `responseMimeType: "application/json"` nas opções de geração de conteúdo.
  - Definir e enviar um schema estruturado estrito de propriedades (`responseSchema`) e descrever detalhadamente os campos para evitar desvios lógicos.
  - Realizar o parse e validação dos dados retornados usando Schemas do Zod ou validadores de DTO no NestJS antes de realizar alterações no banco de dados.

---

## 2. Clean Code, SOLID e DRY ao Extremo

Toda a base de código deve ser mantida limpa, organizada e legível por desenvolvedores seniores.

- **Single Responsibility Principle (SRP)**:
  - Cada classe, controller, service, pipe ou componente Angular deve resolver exatamente uma única responsabilidade. Se um serviço cuida da fila e da persistência e da chamada do Gemini, ele deve ser dividido.
- **Open/Closed Principle (OCP)**:
  - Módulos e provedores devem ser abertos para extensão, mas fechados para alteração direta. Comportamentos específicos devem ser estendidos usando polimorfismo ou inversão de controle.
- **Liskov Substitution Principle (LSP)**:
  - As interfaces de serviços exportados devem garantir que implementações alternativas (ex: diferentes motores de IA ou provedores de pagamento) possam ser trocadas sem quebrar o cliente que as consome.
- **Interface Segregation Principle (ISP)**:
  - Evitar interfaces ou DTOs gigantescos e genéricos. Prefira interfaces pequenas, focadas em casos de uso específicos.
- **Dependency Inversion Principle (DIP)**:
  - Depender sempre de abstrações, não de implementações concretas. Injetar provedores por meio de tokens de injeção ou classes abstratas onde for viável.
- **Don't Repeat Yourself (DRY)**:
  - Lógicas de validação comuns, cálculos de pontuação de Free Fire e tratamentos devem ser encapsulados em helpers utilitários puros dentro de `libs/shared/utils`.

---

## 3. Suite de Testes Automatizados com Vitest

O NestJS deve ser inteiramente configurado para executar testes utilizando **Vitest** e **Supertest** ao invés de Jest tradicional, para máxima performance e velocidade de execução no monorepo.

- **Testes Unitários**:
  - Arquivos nomeados `*.spec.ts`.
  - Devem cobrir regras lógicas puras de cálculo, DTOs e funções utilitárias isolando as dependências por meio de Mocks/Spies nativos do Vitest (`vi.mock`, `vi.spyOn`).

- **Testes de Integração**:
  - Testar o comportamento integrado entre Services e as collections do MongoDB Mongoose.
  - Pode-se utilizar o banco de dados em memória (`mongodb-memory-server`) integrado ao ciclo de vida de testes do Vitest para isolar execuções de testes locais sem interferência mútua.

- **Testes End-to-End (E2E)**:
  - Arquivos nomeados `*.e2e-spec.ts`.
  - Utilizam o módulo de testes oficial do NestJS (`TestingModule`) para compilar uma aplicação web virtual e a biblioteca `Supertest` para disparar chamadas HTTP simuladas contra os controllers:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { describe, beforeAll, it, expect } from 'vitest';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth / Profile (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/GET profile/me (Unauthenticated -> 401)', async () => {
    const response = await request(app.getHttpServer())
      .get('/profile/me')
      .expect(401);
      
    expect(response.body.message).toBe('Unauthorized');
  });
});
```
