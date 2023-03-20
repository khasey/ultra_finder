const fs = require('fs');
const https = require('https');
const { SingleBar } = require('cli-progress');

const Red = "\x1b[31m"
const Green = "\x1b[32m"
const PURPLE = "\x1b[35m"
const Reset = "\x1b[0m"

const filename = process.argv[2];
const options = { timeout: 2000 };
const urls = fs.readFileSync(filename, 'utf-8').split('\n');

const header = "|                   _   _ _  _____ ___    ___                    |\n"+
               "|                  | | | | ||_   _| _ )  / _ |                   |\n"+
               "|                  | |_| | |__| | |   / / _| |                   |\n"+
               "|                  |____/|____|_| |_|_)/_/ |_|                   | \n"+
               "------------------------------------------------------------------ \n"+
               "--------------------- / THE ULTRA FINDER / ----------------------- \n"+
               "------------------------------------------------------------------ ";           


console.log(Green + header + Reset);

const bar = new SingleBar({
  format: 'Testing URLs |' + Green + '{bar}' + Reset + '| {percentage}% | {value}/{total}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true
});

bar.start(urls.length, 0);

// fonction pour passer à l'URL suivante
async function testUrl(url) {
  url = url.trim();
  try {
    const urlObj = new URL('https://' + url);
  } catch (err) {
    return;
  }

  try {
    // Test de .git/config
    const suffix = '/.git/config';
    const reqGit = https.get('https://' + url + suffix, (resp) => {
      let git = '';

      resp.on('data', (c) => {
        git += c;
      });

      resp.on('end', () => {
        if (git.includes('[core]')) {
          console.log('\n' + Green + `${url} ---- / FIND GIT / ----` + Reset);
        } else {
          //console.log(Red + `${url} ---- / NOTHING / ----` + Reset);
        }
      });
    });

    reqGit.on('error', (err) => {
      //console.error(`Erreur lors de la requête GET vers ${url}: ${err.message}`);
    });

    reqGit.setTimeout(8000, () => {
      reqGit.destroy();
    });

    await new Promise((resolve) => {
      reqGit.on('close', resolve);
    });

    const suffix2 = '/.env';
    const reqEnv = https.get('https://' + url + suffix2, (resp) => {
      let env = '';

      resp.on('data', (c) => {
        env += c;
      });

      resp.on('end', () => {
        if (env.codePointAt === 200) {
          console.log(Green + `${url} ---- / FIND ENV / ----` + Reset);
        } else {
          //console.log(Red + `${url} ---- / NOTHING / ----` + Reset);
        }
      });
    });

    reqEnv.on('error', (err) => {
      //console.error(`Erreur lors de la requête GET vers ${url}: ${err.message}`);
    });

    reqEnv.setTimeout(8000, () => {
      reqEnv.destroy();
    });

    await new Promise((resolve) => {
      reqEnv.on('close', resolve);
    });


    // Test de Firebase
    const reqFirebase = https.get('https://' + url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (data.includes('firebase-init.js') || data.includes('firebase.js') || data.includes('firebaseConfig')) {
          console.log('\n' + PURPLE + `${url} ---- / FIND FIREBASE / ----` + Reset); 
        } else {
          //console.log(Red + `${url} ---- / NOTHING / ----` + Reset);
        }
      });
    });

    reqFirebase.on('error', (err) => {
      //console.error(`Erreur lors de la requête GET vers ${url}: ${err.message}`);
    });

    reqFirebase.setTimeout(3000, () => {
      reqFirebase.destroy();
    });

    await new Promise((resolve) => {
      reqFirebase.on('close', resolve);
    });
  } catch (err) {
    //console.error(`Erreur lors de la requête GET vers ${url}: ${err.message}`);
  }
}

// tester chaque URL
(async () => {
  let i = 0;
    for (const url of urls) {
    await testUrl(url);
    i++;
    bar.update(i);
  }
  bar.stop();
})();