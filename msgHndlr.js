const { decryptMedia } = require("@open-wa/wa-decrypt");
const fs = require("fs-extra");
const axios = require("axios");
const moment = require("moment-timezone");
const color = require("./lib/colors");
const { helpers } = require("./lib/help");
const path = require("path");
require("dotenv/config");
const botName = "Duff-Bot";
const http = require("http");
const https = require("https");
const urlParse = require("url").parse;
const ytdl = require("ytdl-core");
const googleTTS = require("google-tts-api"); // CommonJS
const dialogflow = require("dialogflow");
const config = require("./config/config");
const ffmpeg = require("fluent-ffmpeg");
var search = require("youtube-search");
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
const calendar = require ('./media/calendar/calendar.json')

moment.tz.setDefault("America/Sao_Paulo").locale("pt-br");

const credentials = {
  client_email: config.GOOGLE_CLIENT_EMAIL,
  private_key: config.GOOGLE_PRIVATE_KEY,
};

const sessionClient = new dialogflow.SessionsClient({
  projectId: config.GOOGLE_PROJECT_ID,
  credentials,
});

const bannedUsers = [
  "5521976607557@c.us", // Albarran
];
const silenceBannedUsers = [
  "555591441492-1588522560@g.us", // Code Monkey
];

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function sendToDialogFlow(msg, session, params) {
  let textToDialogFlow = msg;
  try {
    const sessionPath = sessionClient.sessionPath(
      config.GOOGLE_PROJECT_ID,
      session
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: textToDialogFlow,
          languageCode: config.DF_LANGUAGE_CODE,
        },
      },
      queryParams: {
        payload: {
          data: params,
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    console.log("INTENT ENCONTRADO: ", result.intent.displayName);
    let defaultResponses = [];

    if (result.action !== "input.unknown") {
      result.fulfillmentMessages.forEach((element) => {
        defaultResponses.push(element);
      });
    }

    if (defaultResponses.length === 0) {
      result.fulfillmentMessages.forEach((element) => {
        if (element.platform === "PLATFORM_UNSPECIFIED") {
          defaultResponses.push(element);
        }
      });
    }

    result.fulfillmentMessages = defaultResponses;

    return result;
  } catch (e) {
    console.log("error");
    console.log(e);
  }
}

module.exports = msgHandler = async (client, message) => {
  try {
    const {
      id,
      from,
      t,
      sender,
      isGroupMsg,
      chat,
      caption,
      isMedia,
      mimetype,
      quotedMsg,
    } = message;
    let { body } = message;
    const { formattedTitle } = chat;
    let { pushname, verifiedName } = sender;
    pushname = pushname || verifiedName;
    const commands = caption || body || "";
    const falas = commands.toLowerCase();
    const command = commands.toLowerCase().split(" ")[0] || "";
    const args = commands.split(" ");

    if (silenceBannedUsers.includes(chat.id)) {
      return;
    }

    console.log("----------------------------------------");
    const msgs = (message) => {
      if (command.startsWith("!")) {
        if (message.length >= 10) {
          return `${message.substr(0, 15)}`;
        } else {
          return `${message}`;
        }
      }
    };

    const mess = {
      wait: "⏳ Fazendo figurinha...",
      error: {
        St: "[❗] Envie uma imagem com uma legenda *!s* ou marque a imagem que já foi enviada",
      },
    };

    const time = moment(t * 1000).format("DD/MM HH:mm:ss");
    const botNumber = await client.getHostNumber();
    const blockNumber = await client.getBlockedIds();
    const groupId = isGroupMsg ? chat.groupMetadata.id : "";
    const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : "";
    const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false;
    const isBotGroupAdmins = isGroupMsg
      ? groupAdmins.includes(botNumber + "@c.us")
      : false;
    const ownerNumber = ["5511968905353@c.us", "5511968905353"]; // replace with your whatsapp number
    const isQuotedImage = quotedMsg && quotedMsg.type == "image";
    const isQuotedVideo = quotedMsg && quotedMsg.type == "video";
    

    const isBlocked = blockNumber.includes(sender.id);
    const uaOverride =
      "WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36";

    // pegar mensagens que comecem com "!" e mostrar no console.
    if (!isGroupMsg && command.startsWith("!"))
      console.log(
        "\x1b[1;31m~\x1b[1;37m>",
        "[\x1b[1;32mEXEC\x1b[1;37m]",
        time,
        color(msgs(command)),
        "from",
        color(pushname)
      );

    if (isGroupMsg && command.startsWith("!"))
      console.log(
        "\x1b[1;31m~\x1b[1;37m>",
        "[\x1b[1;32mEXEC\x1b[1;37m]",
        time,
        color(msgs(command)),
        "from",
        color(pushname),
        "in",
        color(formattedTitle)
      );

    if (isGroupMsg && !command.startsWith("!"))
      console.log(
        "\x1b[1;33m~\x1b[1;37m>",
        "[\x1b[1;31mMSG\x1b[1;37m]",
        time,
        color(body),
        "from",
        color(pushname),
        "in",
        color(formattedTitle)
      );
    if (isBlocked) return;
    console.log("FROM 		===>", color(pushname));
    console.log("FROM_ID 	===>", chat.id);
    console.log("ARGUMENTOS	===>", color(args));
    console.log("FALAS 		===>", color(falas));
    console.log("COMANDO 	===>", color(command));

    // verificação se o usuário pegou digitou alguma mensagem que comece com "!" e se foi banido
    if (command.startsWith("!") && bannedUsers.includes(chat.id)) {
      await client.sendText(
        from,
        "*_Você foi banido, não pode usar o bot. :(_*",
        id
      );
      console.log("USUÁRIO BANIDO!");
      return;
    }

    let objeto = JSON.parse(
      await fs.readFileSync("./lib/dialogflowActive.json", {
        encoding: "utf8",
        flag: "r",
      })
    );

    if (objeto?.ativo == "true") {
      const payload = await sendToDialogFlow(falas, from, "params");
      const responses = payload?.fulfillmentMessages;

      console.log("RECEBEU DIALOGFLOW ======>", payload);
      for (const response of responses) {
        let randomIndex = Math.floor(
          Math.random() * response?.text?.text.length
        );
        await client.reply(from, `${response?.text?.text[randomIndex]}`, id);
      }
    }

    switch (falas) {
      case "help":
        await client.sendText(from, helpers.help);
        break;

      case "toca o berrante":
        await client.sendFile(
          from,
          "./media/audios/berrante.mpeg",
          "Toca o berrante seu moço",
          "AAAAAAAAAUHHH",
          id
        );
        break;

      case "vamos acordar":
        await client.sendFile(
          from,
          "./media/audios/vamoacordar.mpeg",
          "Vamos acordar porra",
          "AAAAAAAAAUHHH",
          id
        );
        break;

      case "xofana":
        await client.sendFile(
          from,
          "./media/img/xofana.jpeg",
          "xofana",
          `Fala ${pushname}`,
          id
        );
        break;

      case "gui":
        await client.sendFile(
          from,
          "./media/img/gui.jpg",
          "gui",
          `Hm... ${pushname}`,
          id
        );
        break;

      case "camila":
        await client.sendFile(
          from,
          "./media/img/catCamila.jpeg",
          "camila",
          `Oia o bolotinha ${pushname}`,
          id
        );
        break;

      case "sara":
      case "saromba":
        await client.sendReplyWithMentions(
          from,
          "RESPONDE AI  @5511961582676",
          id
        );
        break;

      case "gava":
        await client.sendFile(
          from,
          "./media/img/gava.jpg",
          "gava",
          `bó pra academia ${pushname} ?`,
          id
        );
        break;

      case "bot":
        await client.sendFile(
          from,
          "./media/img/opa.jpeg",
          "duff",
          `Opaa, diga ai meu patrão ${pushname}`,
          id
        );
        break;
      case "xofs":
        await client.sendReplyWithMentions(
          from,
          "não fala comigo, estou de férias!! @5511944781750",
          id
        );
        break;

      case "teteu":
        await client.sendReplyWithMentions(
          from,
          "fala comigo mô @5519971269828",
          id
        );
        break;
      case "tia":
        await client.sendReplyWithMentions(
          from,
          `Oi sobrinho ${pushname}, fala com a tia @5519981134103`,
          id
        );
        break;

      case "bom dia":
        await client.sendFile(
          from,
          "./media/img/trabaia.jpg",
          "duff",
          `Bom dia ${pushname}`,
          id
        ); 
        break;


      case "boa tarde":
        await client.reply(from, `Boa tarde ${pushname}!`, id);
        break;

      case "boa noite":
        await client.sendFile(
          from,
          "./media/img/amimir.jpg",
          "duff",
          `Boa noite ${pushname}`,
          id
        );
        break;

      case "sextou":
        if (moment().format("dddd") == "sexta-feira") {
          await client.reply(from, "ôpa, bora??", id);
          // const gif1 = await fs.readFileSync("./media/sexto.webp", {
          //   encoding: "base64",
          // });
          // await client.sendImageAsSticker(
          //   from,
          //   `data:image/gif;base64,${gif1.toString("base64")}`
          // );
        } else {
          await client.reply(
            from,
            `Uai, hoje ainda e ${moment().format(
              "dddd"
            )} e você já ta procurando sexta-feira?....`,
            id
          );
        }

        break;
    }

    command.replaceAll("_", "");
    command.replaceAll("*", "");
    command.replaceAll("`", "");
    switch (command) {
      case "!tts":
        if (args.length === 1)
          return client.reply(from, "Como eu vou adivinhar o devo buscar?", id);
        let string = body.split(" ").slice(1).join(" ");
        console.log("TTS STRING => ", string);
        if (string.length >= 200) {
          client.reply(from, `Porra bisho q treco grande, quer me bugar??`, id);
          break;
        }
        url = await googleTTS.getAudioUrl(`${string}`, {
          lang: "pt_BR",
          slow: false,
          host: "https://translate.google.com",
        });

        const dest = await path.resolve(__dirname, "./media/to/translate.mp3"); // file destination
        await downloadFile(url, dest);
        await client.sendFile(
          from,
          "./media/to/translate.mp3",
          "translate",
          "AAAAAAAAAUHHH",
          id
        );
        break;

      case "!play":
        try {
          var YD = new YoutubeMp3Downloader({
            ffmpegPath: "C:/ffmpeg/bin/ffmpeg", // FFmpeg binary location
            outputPath: "./media/ytDown", // Output file location (default: the home directory)
            youtubeVideoQuality: "highestaudio", // Desired video quality (default: highestaudio)
            queueParallelism: 2, // Download parallelism (default: 1)
            progressTimeout: 2000, // Interval in ms for the progress reports (default: 1000)
            allowWebm: false, // Enable download from WebM sources (default: false)
          });

          var opts = {
            maxResults: 1,
            key: "AIzaSyARsUt7mpnrM__x-uA95qkKAArXop6j2Bo",
          };

          const pesq = args.slice(1).join(" ");
          search(pesq, opts, async function (err, results) {
            if (err) return console.log(err);
            console.log(results);

            YD.download(results[0].id, results[0].id + ".mp3");
            client.reply(from, "Estou procurando o vídeo", id);
            client.reply(
              from,
              `
      Seu video é esse?
Titulo: ${results[0].title}
Link:  ${results[0].link}
Canal: ${results[0].channelTitle}
      `,
              id
            );

            YD.on("finished", function (err, data) {
              client.sendPtt(from, `./media/ytDown/${results[0].id}.mp3`, id);
              console.log(JSON.stringify(data));
            });

            YD.on("error", function (error) {
              client.reply(from, "Não consegui baixar o video vei", id);
              console.log(error);
            });

            console.log("Enviando");
          });
        } catch (e) {
          console.log(e);
          client.reply(from, `ERRO A\n${e}`, id);
        }
        break;

      case "!clima":
        if (args.length === 1)
          return client.reply(
            from,
            "Ainda não adivinho coisas... preciso saber a cidade também",
            id
          );

        if (typeof args[1] == "undefined") {
          return await client.reply(from, `Coloca um . antes da cidade`, id);
        }

        let cidade = body.split(".");
        console.log(typeof cidade[1]);

        if (typeof cidade[1] !== "undefined") {
          if (cidade[1].length == 0)
            return client.reply(from, "Preciso de uma cidade...", id);

          await client.reply(
            from,
            `Verificando com São Pedro como está o clima em ${cidade[1]}... pera um pouco`,
            id
          );

          let clima = await axios.get(
            `https://weather.contrateumdev.com.br/api/weather/city/?city=${encodeURI(
              cidade[1]
            )}`
          );

          if (clima?.data?.cod == "404")
            return await client.reply(
              from,
              `Uai... ${clima?.data?.message}`,
              id
            );

          await client.sendText(
            from,
            `*Temperatura:* ${clima?.data?.main?.temp} ºC \n*Sensação térmica:* ${clima?.data?.main?.feels_like} ºC \n*Temperatura mínima:* ${clima?.data?.main?.temp_min} ºC \n*Temperatura máxima:* ${clima?.data?.main?.temp_max} ºC \n*Pressão atmosférica:* ${clima?.data?.main?.pressure}\n*Umidade:* ${clima?.data?.main?.humidity}%
----------------------\n${clima?.data?.name} - lat: ${clima?.data?.coord?.lat} lon: ${clima?.data?.coord?.lon}
                `
          );
        } else {
          return client.reply(from, "Preciso de uma cidade...", id);
        }

        break;

      case "!s":
        if (isMedia || isQuotedImage || isQuotedVideo) {
          client.reply(from, "ovo fazer a figurinha...", id);

          var encryptMedia =
            isQuotedImage || isQuotedVideo ? quotedMsg : message;
          var _mimetype =
            isQuotedImage || isQuotedVideo ? quotedMsg.mimetype : mimetype;
          var mediaData = await decryptMedia(encryptMedia, uaOverride);

          if (_mimetype === "video/mp4" || _mimetype === "image/gif") {
            if (encryptMedia.duration < 30) {
              var imageBase64 = `data:${_mimetype};base64,${mediaData.toString(
                "base64"
              )}`;
              await client
                .sendMp4AsSticker(from, imageBase64, null, {
                  stickerMetadata: true,
                  author: botName,
                  pack: "PackDo" + botName,
                  fps: 10,
                  square: "512",
                  loop: 0,
                })
                .then(() => {
                  client.reply(from, "Pega aqui sua figurinha!", id);
                })
                .catch((err) => {
                  console.log(err);
                  client.reply(from, "Desculpe, o arquivo é muito grande!", id);
                });
            } else {
              await client.reply(
                from,
                "Pô cara, tu tem que me mandar algo ai de no máximo 30 segundos!",
                id
              );
            }
          } else {
            var imageBase64 = `data:${_mimetype};base64,${mediaData.toString(
              "base64"
            )}`;
            await client
              .sendImageAsSticker(from, imageBase64, {
                author: "Duff-Bot",
                pack: "Pack do Duff",
                keepScale: true,
              })
              .then(() => {
                client.reply(from, "Pega aqui sua figurinha!", id);
              })
              .catch((err) => {
                console.log(err);
                client.reply(from, "Desculpe, o arquivo é muito grande!", id);
              });
          }
        }
        break;

      case "!menu":
        const helpMode = args[1];

        if (!helpMode) {
          await client.sendText(from, helpers.help);
        } else {
          //helpMode == 'audios' && await client.sendText(from, helpers.helpAudios);
          //helpMode == 'figurinhas' && await client.sendText(from, helpers.helpFigurinhas);
          //helpMode == 'papo' && await client.sendText(from, helpers.helpPapo);
          //helpMode == 'outros' && await client.sendText(from, helpers.helpOutros);
          //helpMode == 'grupos' && await client.sendText(from, helpers.helpGrupos);
          //helpMode == 'consultas' && await client.sendText(from, helpers.helpConsultas);
        }
        break;
    }
  } catch (err) {
    await client.sendText(`Puts, deu merda... Erro: ${err}`);

    console.log(color("[ERROR]", "red"), err);
    client.kill().then((a) => console.log(a));
  }
};
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const info = urlParse(url);
    const httpClient = info.protocol === "https:" ? https : http;
    const options = {
      host: info.host,
      path: info.path,
      headers: {
        "user-agent": "WHAT_EVER",
      },
    };

    httpClient
      .get(options, (res) => {
        // check status code
        if (res.statusCode !== 200) {
          const msg = `request to ${url} failed, status code = ${res.statusCode} (${res.statusMessage})`;
          reject(new Error(msg));
          return;
        }

        const file = fs.createWriteStream(dest);
        file.on("finish", function () {
          // close() is async, call resolve after close completes.
          file.close(resolve);
        });
        file.on("error", function (err) {
          // Delete the file async. (But we don't check the result)
          fs.unlink(dest);
          reject(err);
        });

        res.pipe(file);
      })
      .on("error", reject)
      .end();
  });
}
