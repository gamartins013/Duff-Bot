import chalk from 'chalk';

export default  (text, color) => {
    return !color ? chalk.blueBright(text) : chalk.keyword(color)(text)
}