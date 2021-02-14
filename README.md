![GodMode Logo](https://godmode-public-assets.s3.amazonaws.com/godmode_logo.jpg)


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

## Development

Start by installing dependencies:
```
npm install
```

Then to add a new protocol:
1. Create a directory called `<new-protocol-name>` under the appropriate EVM version ("byzantium"|"constantinople"|"istanbul")
1. Add the required Solidity files to the directory
1. **IMPORTANT!!** Prefix the GM-ified contracts with `GM` (e.g. GMDai)
1. Run the compile command
```
npm run compile
```
5. Check that the `<new-protocol-name>.json` file includes the ABI and bytecode of the GM contracts
6. Check that the `protocols.txt` file includes the name of the protocol you added
