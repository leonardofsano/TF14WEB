import axios from "axios";
import CliTable3 from "cli-table3";

export default {

    name: 'get-alunos',
    description: 'obter alunos',
    arguments: {
        seconds: "number",
    },

    handle: async function () {
        /**
         * No ./docker-compose.yml, nas linhas 55/56, dei o nome "web_host" para o host do container nginx.
         * Se você rodar o cli fora da rede do docker, você pode usar "localhost:8080" para acessar o nginx.
         * Caso contrário, voce deve chamar o nginx pelo nome do host do container na porta 80
         */
        const host = (process.env.IS_CONTAINER) ? ("web_host:80") : ("localhost:8080");
        const baseUrl = `http://${host}`;


        /**
         * URLSearchParams é usado para gerenciar o request body dados no formato x-www-form-urlencoded.
         */        const data = new URLSearchParams();
        data.append('email', 'admin@admin.com');
        data.append('senha', '123456');

        try {
            // Primeira etapa: login para obter o token JWT
            const loginResponse = await axios.post(`${baseUrl}/login`, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const token = loginResponse.data.token;
            console.log('Token obtido com sucesso!\n');

            // Configuração da tabela CLI
            const table = new CliTable3({
                head: ['Nome', 'Matérias'],
                colWidths: [30, 50],
                style: {
                    head: ['cyan'],
                    border: ['gray']
                }
            });

            // Parâmetros para paginação
            let offset = 0;
            const limit = 10;
            let hasMore = true;

            // Loop para buscar todos os alunos
            while (hasMore) {
                const alunosResponse = await axios.get(`${baseUrl}/api/alunos`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    params: {
                        limit,
                        offset
                    }
                });

                const { rows, next } = alunosResponse.data;

                // Processar cada aluno e adicionar à tabela
                rows.forEach(aluno => {
                    const materiasList = aluno.materias.map(materia => materia.nome).join(',\n');
                    table.push([aluno.nome, materiasList]);
                });

                // Verificar se há mais páginas para buscar
                if (next === null) {
                    hasMore = false;
                } else {
                    offset = next;
                    process.stdout.write('Carregando mais alunos...\r');
                }
            }

            console.log('\nListagem de Alunos e suas Matérias:');
            console.log(table.toString());
            console.log('\nTotal de registros processados:', offset + limit);

        } catch (error) {
            console.error('Erro:', error.response?.data?.error || error.message);
            if (error.response?.status === 401) {
                console.error('Erro de autenticação. Verifique suas credenciais.');
            }
            process.exit(1);
        }
    }
}