Godmode Contract Library holds plug-and-play Godmode versions of smart contracts
deployed on Ethereum mainnet.

You can use this package to easily import GM contracts from individual (or all) protocols we support into your test suite.

## Usage

In your project that uses Godmode for testing, define the protocols that you
want to pull in via your `package.json` file

```json
  "godmode": {
    "protocols": [
      "Maker"
    ]
  }
```

Then run the following command to install the protocol's contracts into your project at `./build/protocols`
> Make sure you run the npx command from the same directory where your `package.json` lives.

```sh
npx install godmode
```
