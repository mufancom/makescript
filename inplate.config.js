const {Project} = require('ts-morph');

const MAKESCRIPT_CONFIG_FILE_PATH = 'packages/makescript/src/program/config.ts';
const MAKESCRIPT_CONFIG_INTERFACE_NAME = 'JSONConfigFile';

const MAKESCRIPT_AGENT_CONFIG_PATH =
  'packages/makescript-agent/src/program/config.ts';
const MAKESCRIPT_AGENT_CONFIG_INTERFACE_NAME = 'JSONConfigFile';

module.exports = {
  'README.md': {
    data: {
      makescriptConfigTypeText: getMakeScriptConfigTypeText(
        MAKESCRIPT_CONFIG_FILE_PATH,
        MAKESCRIPT_CONFIG_INTERFACE_NAME,
      ),
      agentConfigTypeText: getMakeScriptConfigTypeText(
        MAKESCRIPT_AGENT_CONFIG_PATH,
        MAKESCRIPT_AGENT_CONFIG_INTERFACE_NAME,
      ),
    },
  },
};

function getMakeScriptConfigTypeText(filePath, interfaceName) {
  return new Project()
    .addSourceFileAtPath(filePath)
    .getSourceFile(filePath)
    .getInterface(interfaceName)
    .print();
}
