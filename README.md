Godmode Contract Library holds plug-and-play Godmode versions of smart contracts
deployed on Ethereum mainnet.

You can use this package to easily import individual (or all) GM contracts into
your test suite.

## Usage

In your project that uses Godmode for testing, define the GM contracts that you
want to pull in via your `package.json` file

```json
  "godmode": {
    "contracts": [
      "GMDai"
    ]
  }
```

Then run the following command to install those contracts into your project at `./build/contracts`
> Make sure you run the npx command from the same directory where your `package.json` lives.

```sh
npx install godmode
```
