document.addEventListener('DOMContentLoaded', init);
const inputLocalidade = document.querySelector('#localidade');
const api_key = '6393825c10a114d8599998f569b64a57';
const mensagemErro = document.querySelector('#mensagem-erro');
document.querySelector('#buscar').addEventListener('click', buscarClima);

async function init() {
    try {
        const posicao = await getLocalizacao();
        const { latitude, longitude } = posicao.coords;

        const urlConsulta = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&appid=${api_key}`;

        const dadosApi = await fetch(urlConsulta);
        const dadosLocalidade = await dadosApi.json();
        inputLocalidade.value = dadosLocalidade[0].name;
    } catch (error) {
        throw new Error('Erro ao obter dados da localização.');
    }
}

function getLocalizacao() {
    return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        } else {
            reject('Geolocalização não suportada pelo navegador.');
        }
    });
}

function mostrarErro(mensagem) {
    mensagemErro.textContent = mensagem;
}

async function buscarClima() {
    const cidade = inputLocalidade.value;
    if (cidade.trim() === '') {
        mostrarErro('Localidade não informada!');
        inputLocalidade.focus();
        return;
    }

    try {
        const coordsUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cidade}&appid=${api_key}`;
        const coordsResponse = await fetch(coordsUrl);

        if (!coordsResponse.ok) {
            throw new Error('Erro ao obter informações de coordenadas.');
        }

        const dadosCoords = await coordsResponse.json();
        const { lat, lon } = dadosCoords[0];
        const localidade = `${dadosCoords[0].name} - ${dadosCoords[0].state} - ${dadosCoords[0].country}`;

        const climaUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&appid=${api_key}`;
        const climaResponse = await fetch(climaUrl);
        const dadosClima = await climaResponse.json();

        mostrarClimaAtual(dadosClima.current, localidade);
        mostrarProximasHoras(dadosClima.hourly);
        mostrarProximosDias(dadosClima.daily.slice(1, 6));
    } catch (error) {
        mostrarErro('Localidade não encontrada');
    }
}

function mostrarClimaAtual(dados, localidade) {
    const dataAtual = new Date(dados.dt * 1000);
    const dia = dataAtual.getDate();
    const mes = dataAtual.getMonth() + 1;
    const ano = dataAtual.getFullYear();
    const hora = dataAtual.getHours();
    const minuto = dataAtual.getMinutes();

    document.querySelector('#temperatura').textContent = `${dados.temp.toFixed(0)}°C`;
    document.querySelector('#cidade').textContent = localidade;
    document.querySelector('#hora-consulta').textContent = `${fixZero(dia)}/${fixZero(mes)}/${fixZero(ano)} - ${fixZero(hora)}:${fixZero(minuto)}`;
}

function fixZero(time) {
    return time < 10 ? '0' + time : time;
}

function mostrarProximasHoras(proximasHoras) {
    let dadosExibir = '';
    proximasHoras.map(hour => {
        const data = new Date(hour.dt * 1000);
        dadosExibir += `
            <div class="proximas-horas-item">
                <p>${fixZero(data.getHours())}:${fixZero(data.getMinutes())}</p>
                <p>${hour.temp.toFixed(0)}°C</p>
            </div>
        `;
    });
    document.querySelector('#proximas-horas').innerHTML = dadosExibir;
}

function mostrarProximosDias(proximosDias) {
    const dadosPrevisao = proximosDias.map(dia => {
        return {
            date: new Date(dia.dt * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            temp_min: dia.temp.min.toFixed(0),
            temp_max: dia.temp.max.toFixed(0),
        };
    });
    let dadosExibir = '';
    dadosPrevisao.map(dia => {
        dadosExibir += `
            <div class="proximo-dia">
                <p class="data-previsao">${dia.date}</p>
                <p><i class="fas fa-thermometer-full"></i> ${dia.temp_max}°C</p>
                <p><i class="fas fa-thermometer-empty"></i> ${dia.temp_min}°C</p>
            </div>
        `;
    });
    document.querySelector('#proximos-dias').innerHTML = dadosExibir;
}
