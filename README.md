## Esse projeto se trata de uma api-restfull para controle de dieta com as seguintes funcionalidades:

1. Cria um usuário;
2. Identifica o usuário entre as requisições;
3. Registra uma refeição com nome, descrição, data e hora e se estava dentro ou não da dieta;
4. O usuário poder consultar, editar e deletar todas as refeições registradas por ele e apenas por ele;
5. O usuário pode consultar suas melhores e piores refeições, além da melhor sequência de refeições;
6. O usuário somente pode realizar as requisições descritas acima, se e somente se estiver logado na aplicação.

#### Para a criação da aplicação utilizei o query builder "knex", para auxiliar nas querys e o framework fastify para subir o servidor.
#### Também utilizei alguns frameworks para validação como bcrypt - para encriptação de senha, e o zod, para validação dos tipos de dados.


    "knex": "node --no-warnings --loader tsx ./node_modules/.bin/knex"
