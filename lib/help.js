const showAll = `*Ver tudo?*
Manda um _!help_`;

function help() {
	return `
	*=== Áudios do BOT! ===*

	▫️ toca o berrante
	▫️ vamos acordar

*=== Outros comandos do BOT! ===*

	▫️ !clima .sua cidade
	▫️ !tts isso converte texto em audio

*=== Figurinhas do BOT! ===*

	▫️ Figurinha / gif:
  	Mande uma foto e digite _!s_ na legenda

*=== Bater-papo do BOT! ===*

	▫️ sextou
	▫️ bom dia 
	▫️ boa tarde 
	▫️ boa noite 
	
	`

}

const helpers = {
	help: help(),
	helpAudios: helpAudios(),
	helpFigurinhas: helpFigurinhas(),
	helpPapo: helpPapo(),
	helpOutros: helpOutros(),
	helpGrupos: helpGrupos(),
	helpConsultas: helpConsultas(),
	readme: readme()
}

function helpAudios() {
	return `
*=== Áudios do BOT! ===*

▫️ toca o berrante
▫️ vamos acordar

${showAll}`;
}

function helpFigurinhas() {
	return `
*=== Figurinhas do BOT! ===*

▫️ Figurinha / gif:
  Mande uma foto e digite _!s_ na legenda

${showAll}`;
}

function helpPapo() {
	return `
*=== Bater-papo do BOT! ===*

▫️ sextou
▫️ bom dia 
▫️ boa tarde 
▫️ boa noite 
▫️ bot

${showAll}`;
}

function helpOutros() {
	return `
*=== Outros comandos do BOT! ===*

▫️ !clima .sua cidade
▫️ !tts isso converte texto em audio

${showAll}`;
}

function helpGrupos() {
	return `

${showAll}`;
}

function helpConsultas() {
	return 

}

function readme() {
	return `
`;
}
exports.helpers = helpers;
