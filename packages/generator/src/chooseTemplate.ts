import fuzzy from 'fuzzy';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', autocomplete);

export default async (values: string[]): Promise<string> => {
  const questions = [
    {
      type: 'autocomplete',
      name: 'template',
      message: 'Choose template',
      source: (answers, input) => {
        input = input || '';
        return new Promise(resolve => {
          const result = fuzzy.filter(input, values);
          resolve(result.map(el => el.original));
        });
      }
    }
  ];

  const results = await inquirer.prompt(questions);
  const templateId = results.template.split(':')[0].substring(1);

  return templateId;
};
