import  { fetchJson, fetchBase64 } from './fetcher.js';

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(arr) {
    let j, x;
    for (let i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }

    return arr;
}

/**
 * Create wanted meme
 * @param  {String} imageUrl
 */
const makeWanted = async (imageUrl, crime) => new Promise((resolve, reject) => {
    var topText     = encodeURIComponent('Procurado(a)');
    var bottomText  = encodeURIComponent(crime); // 'Ligue: 190';
    var linkAPI = `https://api.memegen.link/images/custom/${topText}/${bottomText}.png?background=${imageUrl}`;
    fetchBase64(linkAPI, 'image/png')
        .then((result) => resolve(result))
        .catch((err) => reject(err))
});


 /**
 *
 * @param  {String} query
 *
 */
const sreddit = async (reddit) => new Promise((resolve, reject) => {
     fetchJson('https://meme-api.herokuapp.com/gimme/' + reddit + '/')
       .then((rest) => {
           resolve(rest.url)
        })
       .catch((errr) => {
           reject(errr)
       })
});

const randomMember = async (client, botNumber, groupMembers) => {
    let $member     = false;
    let $attempts	= 0;

	groupMembers = shuffle(groupMembers);
    
    for await (let random of groupMembers) {
        if ($attempts >= 10) {
            random	= false;
            break;
        }
        ++$attempts;

        // Se retornar undefined, fala que não tem ninguem procurado no grupo
        if (typeof random == 'undefined') {
            continue;
        }

        // Não seleciona o bot
        if (botNumber == random.id) {
            continue;
        }

        // O procurado ta sem foto, vamos fazer um segundo sorteio
        let profilePic		= await client.getProfilePicFromServer(random.id)
            .catch(() => {});
        if (profilePic == '' || profilePic == undefined) {
            continue;
        } else {
            // Achou a princesinha aqui, vamos parar!
			$member	= random;
            break;
        }
    }

    return $member;
};

export default{
    randomMember,
    makeWanted,
    sreddit,
}