import chalk from 'chalk';
import minimist from 'minimist';
import 'source-map-support/register';
import validatePackageName from 'validate-npm-package-name';

import { TemplateFilePaths } from '.';
import chooseTemplate from './chooseTemplate';
import generateApp, { TemplateWriter } from './generateApp';
import GeneratorError from './GeneratorError';
export * from './helpers';
export * from './generateApp';

export interface Template {
  files: TemplateFilePaths;
  title: string;
  workspaces?: boolean;
  dependencies?: string[];
  devDependencies?: string[];
}

const showUsage = (command: string): void => {
  console.log(`Usage: ${chalk.cyan(command)} ${chalk.green('app_name[@optional_template_id]')}`);
  console.log(`  ${chalk.yellow('--help')}  Show help`);
};

const validateAppName = (appName: string): void => {
  const validationResult = validatePackageName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(`${chalk.green(appName)} is not a valid package name`);
    for (const error of validationResult.errors || []) {
      console.error('  - ' + chalk.red(error));
    }
    for (const warning of validationResult.warnings || []) {
      console.warn('  - ' + chalk.red(warning));
    }
    process.exit(1);
  }
};

interface TemplateMap {
  [id: string]: Template;
}

const run = async (templateMap: TemplateMap, templateWriter: TemplateWriter, args: any): Promise<ProjectInfo> => {
  try {
    const [appName, argTemplateId] = args._[0].split('@');
    validateAppName(appName);
    let templateId = argTemplateId;
    if (!templateId) {
      templateId = await chooseTemplate(Object.keys(templateMap).map(key => templateMap[key].title));
    }
    const template = templateMap[templateId];
    if (!template) {
      throw new GeneratorError(`Template ${chalk.blueBright('@' + templateId)} not found`);
    }
    return await generateApp(appName, templateId, template, templateWriter);
  } catch (e) {
    if (e.name === 'GeneratorError') {
      console.error(e.message);
    } else {
      console.error(e);
    }
  }
};

export interface ProjectInfo {
  appName: string;
  templateId: string;
}

export default (templates: Template[], templateWriter: TemplateWriter, command: string): Promise<ProjectInfo> => {
  const templateList = templates.map(template => ({ ...template, id: template.title.split(':')[0].substring(1) }));
  const templateMap = templateList.reduce((result, item) => ({ ...result, [item.id]: item }), {});

  const args = minimist(process.argv.slice(2));

  if (args.help) {
    showUsage(command);
    process.exit(0);
  } else if (args._.length < 1) {
    showUsage(command);
    console.log(`${chalk.green('app_name')} argument is required`);
    process.exit(1);
  } else {
    return run(templateMap, templateWriter, args);
  }
};
