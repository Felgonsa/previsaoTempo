const chave = ""; // sua chave da API

// Ao carregar a página, mostra o histórico salvo
window.onload = function () {
    mostrarHistorico();
};

// Função principal que busca o clima
async function buscarClima() {
    const cidadeInput = document.getElementById("cidade").value; // pega o valor digitado no input

    const dadosCidade = await buscarCidade(cidadeInput); // busca informações da cidade
    if (!dadosCidade) return; // se deu erro ou cidade não encontrada, para aqui

    const { nomeCidade, estado, pais, lat, lon } = dadosCidade; // desestrutura os dados

    await previsao(lat, lon); // chama a função que mostra a previsão para os próximos dias

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${nomeCidade}&appid=${chave}&units=metric&lang=pt_br`; // URL para buscar o clima atual

    try {
        const resposta = await fetch(url); // faz a requisição
        const dados = await resposta.json(); // converte os dados para JSON

        // Se a cidade não foi encontrada
        if (dados.cod === "404") {
            document.getElementById("resultado").innerHTML = "Cidade não encontrada.";
            return;
        }

        // Extrai as informações do clima
        const temp = dados.main.temp;
        const descricao = dados.weather[0].description;
        const icone = dados.weather[0].icon;
        const imagem = `https://openweathermap.org/img/wn/${icone}@2x.png`;
        const horario = calcHorario(dados.timezone);
        const max = dados.main.temp_max;
        const min = dados.main.temp_min;

        // Exibe o resultado no HTML
        document.getElementById("resultado").innerHTML = `
            <h4>${estado} - ${pais}</h4>
            <h2>${nomeCidade.toUpperCase()}</h2>
            <h4>Horario:${horario}</h4>
            <p><strong>Temperatura:</strong> ${temp}°C</p>
            <p><strong>Clima:</strong> ${descricao}</p>
            <p><strong>Temperatura Máxima:</strong> ${Math.round(max)}°C</p>
            <p><strong>Temperatura Mínima:</strong> ${Math.round(min)}°C</p>
            <img src="${imagem}" alt="Ícone do clima"></img> 
        `;

        // Atualiza o histórico no localStorage
        let historico = JSON.parse(localStorage.getItem("historico")) || [];
        if (!historico.includes(nomeCidade)) {
            historico.push(nomeCidade);
            localStorage.setItem("historico", JSON.stringify(historico));
        }

        mostrarHistorico(nomeCidade); // atualiza a exibição do histórico
    } catch (erro) {
        // Em caso de erro
        console.error("Erro ao buscar o clima:", erro);
        document.getElementById("resultado").innerHTML = "Erro ao buscar dados.";
    }
}

// Calcula o horário local com base no timezone da API
function calcHorario(timezone) {
    const agoraUTC = new Date(Date.now() + new Date().getTimezoneOffset() * 60000);
    const horarioLocal = new Date(agoraUTC.getTime() + timezone * 1000);
    const horaFormatada = horarioLocal.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return horaFormatada;
}

// Mostra a previsão para os próximos dias
async function previsao(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${chave}`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        const previsoesPorDia = {}; // objeto que agrupa por dia

        // Agrupa as previsões por data
        dados.list.forEach(previsao => {
            const data = previsao.dt_txt.split(" ")[0];
            const temp = previsao.main.temp;
            const descricao = previsao.weather[0].description;

            if (!previsoesPorDia[data]) {
                previsoesPorDia[data] = {
                    temps: [],
                    descricoes: []
                };
            }

            previsoesPorDia[data].temps.push(temp);
            previsoesPorDia[data].descricoes.push(descricao);
        });

        // Gera HTML com previsões dos próximos 3 dias
        let previsaoHTML = "<h3>Previsão para os próximos dias:</h3>";
        const dias = Object.keys(previsoesPorDia).slice(1, 4); // pula o dia atual

        dias.forEach(dia => {
            const temps = previsoesPorDia[dia].temps;
            const descricoes = previsoesPorDia[dia].descricoes;

            const min = Math.min(...temps);
            const max = Math.max(...temps);

            // pega a descrição mais comum do dia
            const descMaisComum = descricoes.sort((a, b) =>
                descricoes.filter(v => v === a).length - descricoes.filter(v => v === b).length
            ).pop();

            previsaoHTML += `
            <p><strong>${formatarData(dia)}:</strong> ${descMaisComum} | Mín: ${Math.round(min)}°C | Máx: ${Math.round(max)}°C</p>
        `;
        });

        document.getElementById("previsao").innerHTML = previsaoHTML;

    } catch (error) {
        // Se der erro, não faz nada (pode ser melhorado com uma mensagem)
    }
}

// Formata a data do padrão ISO para dd/mm/aaaa
function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
}

// Busca dados da cidade (geolocalização) a partir do nome
async function buscarCidade(cidade) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${cidade}&limit=1&appid=${chave}`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.length === 0) {
            document.getElementById("resultado").innerHTML = "Cidade não encontrada.";
            return;
        }

        const nomeCidade = dados[0].name;
        const estado = dados[0].state || "Não disponível";
        const pais = dados[0].country;
        const lat = dados[0].lat;
        const lon = dados[0].lon;

        return { nomeCidade, estado, pais, lat, lon }; // retorna objeto com dados
    } catch (erro) {
        console.log("Erro:", erro);
        document.getElementById("resultado").innerHTML = "Erro ao buscar cidade.";
    }
}

// Limpa o histórico salvo no localStorage
function limparHistorico() {
    const div = document.getElementById("listaHistorico");  
    localStorage.removeItem("historico");
    div.innerHTML = "<p>Nenhuma cidade pesquisada ainda.</p>";
    return;
}

// Função usada ao clicar em uma cidade do histórico
function buscarThis(elemento) {
    const cidade = elemento.innerHTML; // pega o nome da cidade
    const cidadeInput = document.getElementById("cidade"); // campo de input
    cidadeInput.value = cidade; // coloca o nome da cidade no input
    buscarClima(); // chama a função principal
}

// Mostra a lista de cidades pesquisadas
function mostrarHistorico(cidade) {
    const div = document.getElementById("listaHistorico");
    const historico = JSON.parse(localStorage.getItem("historico")) || [];

    if (historico.length === 0) {
        div.innerHTML = "<p>Nenhuma cidade pesquisada ainda.</p>";
        return;
    }

    div.innerHTML = ""; // limpa a div

    // adiciona cada cidade como item clicável
    historico.forEach(cidade => {
        div.innerHTML += `<li onclick="buscarThis(this)" id="cidadeHistorico">${cidade}</li>`;
    });
}
