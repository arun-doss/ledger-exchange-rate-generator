import Freecurrencyapi from '@everapi/freecurrencyapi-js';
import { readFile, appendFile } from 'fs/promises';
import {format as formatDate} from 'date-fns';
import { NseIndia } from  "stock-nse-india";

// const FreecurrencyapiJS = require('@everapi/freecurrencyapi-js');
// const Freecurrencyapi = FreecurrencyapiJS.Freecurrencyapi;

// const FS = require("fs/promises");
// const readFile = FS.readFile;
// const appendFile = FS.appendFile;

// const DateFns = require("date-fns");
// const format = DateFns.format;


class ExchangeCurrency {
    constructor(exchangeJson, decimalCount, freeCurrencyApiKey) {
        this.sourceCurrency = exchangeJson.sourceCurrency;
        this.baseCurrency = exchangeJson.baseCurrency;
        this.decimalCount = decimalCount;
        if(exchangeJson.standardUSDRate !== undefined) {
            this.standardUSDRate = exchangeJson.standardUSDRate;
            this.isStandardRateAgainstUSD = true;
        } else {
            this.standardUSDRate = "NA";
            this.isStandardRateAgainstUSD = false;
        };
        this.freeCurrencyApiKey = freeCurrencyApiKey;
    }
}

class StockAndFundIndiaParams {
    constructor(mfParamsJson, decimalCount) {
        this.fundNickName = mfParamsJson.fundNickName,
        this.fundMfApiId = mfParamsJson.fundMfApiId,
        this.decimalCount = decimalCount,
        this.baseCurrency = mfParamsJson.baseCurrency
    }
}

let getCurrentyExchangeRate = (exchangeCurrency) => {  
    return new Promise((resolve)=>{
        const freecurrencyapi = new Freecurrencyapi(exchangeCurrency.freeCurrencyApiKey);
        freecurrencyapi.latest({
            base_currency: exchangeCurrency.isStandardRateAgainstUSD?"USD":exchangeCurrency.sourceCurrency,
            currencies: exchangeCurrency.baseCurrency
        }).then(response => {
            let rate = response.data[exchangeCurrency.baseCurrency]
            if(exchangeCurrency.isStandardRateAgainstUSD) {
                rate = rate / exchangeCurrency.standardUSDRate;
            }
            resolve(rate.toFixed(exchangeCurrency.decimalCount));
        });
    });
};

let mfToIndia = (mutualFundIndia) => {
    return new Promise((resolve) => {
        fetch(`https://api.mfapi.in/mf/${mutualFundIndia.fundMfApiId}/latest`).then(response => {
            response.json().then((responseJson) => {
                resolve(Number(responseJson.data[0].nav).toFixed(mutualFundIndia.decimalCount));
            });

        })
    });
};

let stockToINR = (stockIndia) => {
    return new Promise((resolve) => {
        const  nseIndia = new  NseIndia();
        nseIndia.getEquityDetails(stockIndia.fundMfApiId).then(details  => {
            resolve(details.priceInfo.lastPrice.toFixed(stockIndia.decimalCount));
        })
    });
    
}

class Config {
    constructor(configObj) {
        this.ledgerExchangeFile = configObj.LedgerExchangeFile;
        this.freeCurrencyApiKey = configObj.FreeCurrencyApiKey;
        this.decimalCount = configObj.DecimalCount;
        this.exchangeCurrencies = [];
        configObj.ExchangeCurrencies.forEach(singleExchangeCurrencyObj => {
            let singleExchangeCurrency = new ExchangeCurrency(singleExchangeCurrencyObj, this.decimalCount, this.freeCurrencyApiKey);
            this.exchangeCurrencies.push(singleExchangeCurrency);
        });
        this.mutualFundsIndia = [];
        configObj.MutualFundsIndia.forEach(singleMutualFundIndiaObj => {
            let singleMutualFundIndia = new StockAndFundIndiaParams(singleMutualFundIndiaObj, this.decimalCount);
            this.mutualFundsIndia.push(singleMutualFundIndia);
        });
        this.stocksIndia = [];
        configObj.StocksIndia.forEach((singleStockIndiaObj) => {
            let singleStockIndia = new StockAndFundIndiaParams(singleStockIndiaObj, this.decimalCount);
            this.stocksIndia.push(singleStockIndia);
        });
    }
}

class PrintParams {
    constructor(printParamsObj) {
        this.outputFilePath = printParamsObj.outputFilePath;
        this.commodityName = printParamsObj.commodityName;
        this.commodityPrice = printParamsObj.commodityPrice;
        this.baseCurrency = printParamsObj.baseCurrency;
    }
}

function printLedgerExchangeRow (printParams) {
    let currentDate = new Date();
    let date = formatDate(currentDate, "yyyy/MM/dd");
    let time = formatDate(currentDate, "HH:mm:ss");
    appendFile(printParams.outputFilePath, `\nP ${date} ${time} ${printParams.commodityName} ${printParams.commodityPrice} ${printParams.baseCurrency}`);
}

async function getConfig(configFilePath){
    let data = JSON.parse(await readFile(configFilePath, "utf8"));
    let config = new Config(data);
    return config;
}

async function main() {
    const config = await getConfig("./config.json");
    config.exchangeCurrencies.forEach( async (exchangeCurrency)=>{
        let amount = await getCurrentyExchangeRate(exchangeCurrency);
        let printParamsObj = {
            outputFilePath: config.ledgerExchangeFile,
            commodityName: exchangeCurrency.sourceCurrency,
            baseCurrency: exchangeCurrency.baseCurrency,
            commodityPrice: amount
        }
        let printParams = new PrintParams(printParamsObj);
        printLedgerExchangeRow(printParams);
    });

    config.mutualFundsIndia.forEach(async (mutualFundIndia) => {
        let mfRate = await mfToIndia(mutualFundIndia);
        let printParamsObj = {
            outputFilePath: config.ledgerExchangeFile,
            commodityName: mutualFundIndia.fundNickName,
            baseCurrency: mutualFundIndia.baseCurrency,
            commodityPrice: mfRate
        }
        let printParams = new PrintParams(printParamsObj);
        printLedgerExchangeRow(printParams);
    });

    config.stocksIndia.forEach(async (stockIndia) => {
        let stockRate = await stockToINR(stockIndia);
        let printParamsObj = {
            outputFilePath: config.ledgerExchangeFile,
            commodityName: stockIndia.fundNickName,
            baseCurrency: stockIndia.baseCurrency,
            commodityPrice: stockRate
        }
        let printParams = new PrintParams(printParamsObj);
        printLedgerExchangeRow(printParams);
    });
    
}

main();