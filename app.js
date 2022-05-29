// const { create, Client, decryptMedia, ev, SimpleListener, smartUserAgent, NotificationLanguage } = require('@open-wa/wa-automate')
// const msgHandler = require('./msgHndlr')
// const options = require('./config/options')
// const { help } = require('./lib/help')
import { Client, create } from "@open-wa/wa-automate";
import options from "./config/options.js";
import msgHandler from "./msgHndlr.js";

const start = async (client = new Client()) => {
  console.log("[SERVER] Servidor iniciado!");

  client.onStateChanged((state) => {
    console.log("[Status do cliente]", state);
    if (state === "CONFLICT" || state === "UNLAUNCHED") client.forceRefocus();
  });

  // listening on message
  client.onMessage(async (message) => {
    client.getAmountOfLoadedMessages().then((msg) => {
      if (msg >= 3000) {
        client.cutMsgCache();
      }
    });

    msgHandler(client, message);
  });
};

create(options(true, start))
  .then((client) => start(client))
  .catch((error) => console.log(error));
