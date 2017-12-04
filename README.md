# 2° gruppo esercitazioni

Esercitazioni del corso di Grafica Computerizzata  

### Gruppo
Bulzoni Federico  
Guerra Antonio  
Zambello Nicola  
  
  
  
## Setup e sviluppo
### Setup dell'ambiente di sviluppo
Assicuratevi di avere `node` e `yarn` installati.  
Per `node`, è richiesta una versione 8.x.x.
  
```bash
# Using Ubuntu

# Adding ppa refs and installing node
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

# Adding ppa refs and installing yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

sudo apt-get update && sudo apt-get -y install yarn
```

Una volta installato tutto, installate le dipendenze node nella root del progetto, dove è locato `package.json`:
```bash
yarn
```

### Compilare il codice ES
Il codice in ES6 ha bisogno di essere transpilato per essere eseguito su alcuni browser, quindi per sicurezza lo compiliamo con babel:

```bash
yarn build
```

E, mentre si sviluppa, lo si può mettere in watch sui *.js per compilare al salvataggio:
```bash
yarn watch
```

### Compilare il codice SASS
Gli stili CSS sono scritti in Sass, quindi per usarli bisogna compilare il Sass:
```bash
grunt compile
```

Si può tenere `grunt` in watch sui *.scss per compilarli al salvataggio:
```bash
grunt
```

### Editor e formattazione
Il codice viene formattato quando si committa tramite un hook che chiama `prettier` sui file JavaScript.  
Si consiglia un editor con un plugin per `prettier`, è molto più comodo. Bisogna però configurarlo adeguatamente per avere coerenza tra ciò che viene formattato dall'editor e ciò che viene poi formattato da prettier.
  
Per avviare `prettier` a mano:
```bash
yarn prettier-all
```

### Server di sviluppo
Per avviare il server di sviluppo per vedere i risultati, avviare `serve` tramite:
```bash
yarn start
```

   
## Pipeline di sviluppo
Per permettere a tutti di essere aggiornati sulle modifiche se non le si fa insieme, usiamo le Pull Request.  
Per iniziare modifiche, creiamo un branch:

```bash
git branch <nomeUtente_cosaStaiFacendo>
```
e ci spostiamo su di esso:
```bash
git checkout <nomeUtente_cosaStaiFacendo>
```

Quando si ha committato le modifiche e si ha fatto push su origin:
```bash
git add -u
git commit -m "<cosaStaiFacendo>"
git push -u origin <nomeUtente_cosaStaiFacendo>
```

Dall'interfaccia web di GitHub, quindi, si può creare una PR.  
Dal repo -> branches -> <nomeUtente_cosaStaiFacendo> -> Pull request

Aspettate quindi l'approvazione degli altri per revisione o comunque per presa visione delle modifiche.
