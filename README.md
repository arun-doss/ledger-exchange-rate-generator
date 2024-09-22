### Ledger Exchange Rate Generator
A Expense Rate Generator for Ledger which can be scheduled to run periodically to append the records to your ledger file.


### Current Features:
It currently features:

1. Currecy Exchange for currencies in this [link]() provided by [FreeCurrencyAPI](). You also have to generate a free api key key from this [link]().
2. Exchange Rates for standard rate currencies with respect to usd. Most suitable for currencies from GCC region like QAR, AED, SAR etc.,
3. Daily Rates for Indian Mutual Funds using [mfapi.in](https://www.mfapi.in/). You have to find your API code by searching name of Mutual Fund.
4. Daily Rates for India Stock prices

The config file is self explanatory. 

### Setup:

1. Download the latest executable file from the [releases](https://github.com/arun-doss/ledger-exchange-rate-generator/releases) page.
2.  
    - Download/Copy the file to your directory
    ```
        curl https://github.com/arun-doss/ledger-exchange-rate-generator/releases/download/ledger-exchange-rate-generator/ledger-exchange-rate-generator_1.0-linux-x64
    ```
    - In Linux make the ledger-exchange-rate-generator* file as executable
    ```
        chmod +x ledger-exchange-rate-generator_1.0-linux-x64
    ```
    - Download the sample config.json file in the same driectory
    ```
        curl https://raw.githubusercontent.com/arun-doss/ledger-exchange-rate-generator/refs/heads/master/config.json
    ```
    - Edit the config.json to match your needs
    - Run the ledger-exchange-rate-generator* file

3. Schedule the script to run daily, hourly etc., based on your needs using cron or Windows Scheduler.

### Build generation:

To generate builds from the project, run the below command from project directory. The executable will be generated in the releases folder.

```
npm run distribute
```
