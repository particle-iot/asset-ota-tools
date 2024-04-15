const arg = require('arg');
const { ModuleInfo, removeModuleExtensions, listModuleExtensions } = require('binary-version-reader');
const fs = require('fs').promises;

let args = undefined

try {
  args = arg({
    // Types
    '--help': Boolean,
    '--verbose': arg.COUNT, // Counts the number of times --verbose is passed
    '--input': String, // --input <number> or --input=<number>
    '--output': String, // --output <string> or --output=<string>

    // Aliases
    '-v': '--verbose'
  });

  //console.log(args);

} catch (err) {
	if (err.code === 'ARG_UNKNOWN_OPTION') {
		console.log(err.message);
	} else {
		throw err;
	}
}

function showHelp() {
  console.log(`
  Usage:  --input <input file>
          --output <output file>
          --help Show this help
          <command> [options]

          Commands:
            strip --input blah --output blah 
            list --input blah
            version
  `);
}

async function checkInput() {
    //if input and output are missing, error. given individual error messages for each
    if (args['--input'] == undefined) {
      console.error('Input file is required. --input <file>');
      showHelp();
      //exit process with error -1
      process.exit(-1);
  }
}

async function checkOutput() {
    if (args['--output'] == undefined) {
      console.error('Output file is required. --output <file>');
      showHelp();
      //exit process with error -1
      process.exit(-1);
  }
}


async function stripAssets(input, output) {

      console.log('strip: Stripping assets from binary file')

      console.log(`Reading: ${input}`);
      const file = await fs.readFile(input);

      //print file size
      console.log(`File length read: ${file.length}`);

      const appWithAssets = Buffer.from(file);
      const appWithAssetsRemoved = await removeModuleExtensions({
          module: appWithAssets,
          exts: [ModuleInfo.ModuleInfoExtension.ASSET_DEPENDENCY]
      });

      console.log(`Writing: ${output}`);

      await fs.writeFile(output, appWithAssetsRemoved);
}


async function listAssets(input) {

  console.log('list: Listing assets in binary file')

  console.log(`Reading: ${input}`);
  const file = await fs.readFile(input);

  //print file size
  console.log(`File length read: ${file.length}`);

  const appWithAssets = Buffer.from(file);
  const assets = await listModuleExtensions({
      module: appWithAssets,
      exts: [ModuleInfo.ModuleInfoExtension.ASSET_DEPENDENCY]
  });

  //if no assets, print no assets
  if (assets.length === 0) {
      console.log('No assets found');
  }

  //loop over assets and print the name and length
  for (let i = 0; i < assets.length; i++) {
      //print: Name: <name> Length: <length>
      console.log(`Asset ${i}: ${assets[i].name} Length: ${assets[i].data.length}`);
  }
}


(async () => {

    console.log('particle-asset-ota-tools. Particle Inc, 2024')

    //if help is passed, show help
    if (args['--help']) {
        showHelp();
        return;
    }

    //check the command is valid and there is only one command
    if (args._.length !== 1) {
        console.error('Invalid command');
        showHelp();
        return;
    }

    const command = args._[0];

    //interpret the command
    if (command === 'strip') {
        //strip assets
        await checkInput();
        await checkOutput();

        await stripAssets(args['--input'], args['--output']);

    } else if (command === 'version') {
        //print version
        console.log("Version: 1.0.0")
    } else if (command === 'list') {
        //list assets
        await checkInput();

        await listAssets(args['--input']);

    } else {
        console.error('Invalid command');
        showHelp();
        return;
    }
})();
