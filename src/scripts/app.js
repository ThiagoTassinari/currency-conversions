const currencyOneEl = document.querySelector('[data-js="currency-one"]');
const currencyTwoEl = document.querySelector('[data-js="currency-two"]');
const currenciesEl = document.querySelector('[data-js="currencies-container"]');
const convertedValueEl = document.querySelector('[data-js="converted-value"]');
const valuePrecisionEl = document.querySelector('[data-js="conversion-precision"]');
const timesCurrencyOneEl = document.querySelector('[data-js="currency-one-times"]');

const showAlert = err => {
  const div = document.createElement('div');
  const button = document.createElement('button');

  div.textContent = err.message;
  div.classList.add('alert', 'alert-warning', 'alert-dismissible', 'fade', 'show');
  div.setAttribute('role', 'alert');
  button.classList.add('btn-close');
  button.setAttribute('type', 'button');
  button.setAttribute('aria-label', 'Close');

  button.addEventListener('click', () => {
    div.remove();
  })

  div.appendChild(button);
  currenciesEl.insertAdjacentElement('afterend', div);
}

const state = (() => {
  let exchangeRate  = {};

  return {
    getExchangeRate: () => exchangeRate,
    setExchangeRate: newExchangeRate => { 
      if (!newExchangeRate.conversion_rates) {
        showAlert({ message: 'O objeto precisa ter uma propriedade conversion_rates '});
        return 
      }

      exchangeRate = newExchangeRate;
      return exchangeRate;
    }
  }
})()

const getUrl = currency => `https://v6.exchangerate-api.com/v6/6990586d758bdae9890bab2f/latest/${currency}`;

const getErrorMessage = errorType => ({
  "unsupported-code": "A moeda não existe em nosso banco de dados",
  "malformed-request": "O endpoint do seu request precisa seguir a estrutura à seguir: https://v6.exchangerate-api.com/v6/6990586d758bdae9890bab2f/latest/USD",
  "invalid-key": "Sua chave da API não é válida",
  "inactive-account": "Seu endereço de e-mail não foi confirmado",
  "quota-reached": "Sua conta atingiu o número de solicitações permitidas pelo seu plano",
})[errorType] || 'Não foi possível obter as informações.';

const fetchExchangeRate = async url => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Sua conexão falhou. Não foi possível obter as informações.');
    }

    const exchangeRateData = await response.json();
  
    if (exchangeRateData.result === 'error') {
      throw new Error(getErrorMessage(exchangeRateData['error-type']));
    }

    return exchangeRateData;

  } catch (err) {
    showAlert(err);
  }
}

// Exibindo as informações iniciais na tela
const showInitialInfo = exchangeRate => {
  const getOptions = selectedCurrency => Object.keys(exchangeRate.conversion_rates)
  .map(currency => `<option ${currency === selectedCurrency ? 'selected' : ''}>${currency}</option>`)
  .join('')
  
  currencyOneEl.innerHTML = getOptions('USD');
  currencyTwoEl.innerHTML = getOptions('BRL');
  convertedValueEl.textContent = exchangeRate.conversion_rates.BRL.toFixed(2);  // Valor relativo
  valuePrecisionEl.textContent = `1 ${currencyOneEl.value} = ${exchangeRate.conversion_rates.BRL} BRL` // Valor absoluto
}

const init = async () => {

  // Disponibilizei para toda aplicação um objeto que contém os dados obtidos no request  
  const exchangeRate = state.setExchangeRate(await fetchExchangeRate(getUrl('USD')));

  if (exchangeRate && exchangeRate.conversion_rates) {
    showInitialInfo(exchangeRate);
  }
}

const showUpdateRates = exchangeRate => {
  convertedValueEl.textContent = (timesCurrencyOneEl.value * exchangeRate.conversion_rates[currencyTwoEl.value]).toFixed(2);
  valuePrecisionEl.textContent = ` 1 ${currencyOneEl.value} = ${1 * exchangeRate.conversion_rates[currencyTwoEl.value]} ${currencyTwoEl.value} `
}

timesCurrencyOneEl.addEventListener('input', e => {
  const exchangeRate = state.getExchangeRate();
  convertedValueEl.textContent = (e.target.value * exchangeRate.conversion_rates[currencyTwoEl.value]).toFixed(2);
})

currencyTwoEl.addEventListener('input', () => {
  const exchangeRate = state.getExchangeRate()
  showUpdateRates(exchangeRate);
});

currencyOneEl.addEventListener('input', async e => {
  const exchangeRate = state.setExchangeRate(await fetchExchangeRate(getUrl(e.target.value)));
  showUpdateRates(exchangeRate);
})

init();