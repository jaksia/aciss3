# AČISS 3

**Akustický Časový Informačný Systém Sústredenia v3**

Systém, ktorý je schopný automaticky zvolávať účastníkov sústredenia na program. Z praktických skúseností je potvrdené, že okrem ušetrenia vedúcich zo zvolávania, majú deti tentdenciu viac počúvať pri zvolávaní tento systém ako vedúcich.

Pôvodný AČISS je síce efektívny na zvolávanie účastníkov, ale má veľa nedostatkov, kvôli ktorým vie byť zložité ho efektívne používať. Niekedy po ceste existoval aj AČISS v2, ale ten sa použil iba na jednej akcii a aktuálne je (pravdepodobne) stratený.

Preto som vyrobil novú verziu AČISSu a to v3. Oproti pôvodnej verzii obsahuje napr. tieto vylepšenia:

- Zobraziteľný plán velej akcie (na štýl kalendáru)
  - S viditeľnými časmi hlásenia
- Ľubovoľne upraviteľné časy hlásení
- Hlásenie a upravovanie akcie/aktivít sa nemusí robiť cez jeden poćítač
  - Vie bežať na lokálnej sieti alebo cez zdieľaný server na internete
  - (vždy sa dá všetko robiť cez jeden PC)
  - Podpora viacerých hlásičov zapnutých naraz
  - Kontrola všetkých hlásičov naraz z admin rozhrania
    - Okamžité hlásenia pre desiatu/olovrant/druhú večeru, ...
- Vizuálne zobrazenie najbližšej aktivity pre účastníkov
  - Podporuje rôzne vizuály pre rôzne akcie
- Meškania aktivít
- Automaticky zvláda prechod z letného na zimný čas (alebo naopak)
  - _(úplne poriadne sa to dá otestovať najskôr koncom marca, dovtedy nezaručujem úplnú funkčnosť)_
  - _(neodporúčam nastavovať žiadnu aktivitu na noc zmeny času, to netuším ako skončí)_
- Upraviteľný zvuk pre začiatok/koniec hlásenia, zvolávačku a viacero ďalších
- Pre každú akciu sa dajú nastaviť rôzne lokality aktivít
  - Každá chata je iná napr. má dve spoločenské, ktoré treba rozlíšiť, práve na to je táto funkcia

## Používanie

Vo všeobecnosti **odporúčam používať lokálne hostovanú verziu**, ale verejná vie slúžiť ako dobrá záloha alebo ak nie je čas/zariadenie na nastavenie serveru.

V oboch prípadoch sa v ľavom dolnom rohu nachádza indikátor stacu spojenia. Ak je zelený, AČISS je pripojený k serveru a všetky zmeny sa budú okamžite prejavovať. Ak je oranžový, spojenie je aktuálne prerušené. AČISS sa bude pokúšať pripojiť znova a akonáhle sa to podarí, všetky vymeškané zmeny by sa mali prejaviť.

### Verejne hostovaná verzia

_Zatiaľ nie je dostupná._

- **Výhody:**
  - Stačí otvoriť stránku a vytvoriť akciu
  - Nevyžaduje hostovanie AČISS serveru
  - Môžeš využiť zvuky z iných akcií
- **Nevýhody:**
  - Vyžaduje aktívny internet
    - AČISS by mal zvládať krátkodobé výpadky alebo nestabilný internet, ale je to neideálne
  - Môže reagovať o niečo pomalšie na zmeny
  - Menej spoľahlivá

### Lokálne hostovaná verzia

- **Výhody:**
  - Funguje nezávisiac od dostupnosti/kvality internetu
  - O čosi rýchlejšie ovládanie, lepší výkon a väčšia spoľahlivosť
- **Nevýhody:**
  - Vyžaduje PC na ktorom bude bežať server AČISSu

#### Ako použiť

1. Zapni server podľa inštrukcií v sekcii [Spúšťanie](#spúšťanie)
2. Otvor v prehliadači `http://localhost/` (alebo IP počítača, kde beží AČISS)
3. Vytvor novú akciu, nastav jej zvuky a pridaj aktivity
   - Netreba na akcii používať heslo (za predpokladu, že k wifi nemajú prístup účastníci)

## Spúšťanie

Najjednoduchší spôsob ako spustiť AČISS je pomocou `docker`u.
AČISS by mal byť kompatibilný s hocičím na čom vie bežať Docker (aj Windows), ale testovaný bol iba na Linuxe.

0. Ak nemáš nainštalovaný Docker, nainštaluj si
1. Nakopíruj si najnovšiu verziu tohto repa
   - Odporúčam použiť `git clone` (resp. `git pull`, na aktualizovanie)
   - Prípadne si môžeš stiahnuť ZIP a rozbaliť ho ak nechceš používať `git`
2. Otvor si terminál v priečinku so súbormi tohto repa
3. Spusti `docker compose up`
   - _Ak si už niekedy AČISS spúšťal a chceš resetovať dáta, spusti najprv `docker compose down -v`_
   - Automaticky buildne AČISS, zapne ho spolu s databázou a NGINX ako reverse proxy pre ne
   - Ak spúšťaš AČISS po jeho aktualizácií, použi aj flag `--build`
   - Predvolene sa použije port 80, ak v tom je problém (napr. Windows), dá sa zmeniť
     - V riadku `- "0.0.0.0:80:80"` zmeň prvú `80` na port, cez ktorý má byť AČISS prístupný

4. Otvor v prehliadači `http://localhost/`
   - Ak si menil port, použi `http://localhost:PORT/`
   - Ak sa k tomu snažíš dostať cez iný PC, nahraď za `localhost` IP počítača, kde beží AČISS
     - Na Windows sa dá IP zistiť cez príkaz `ipconfig`, na Linuxe napr. cez `ip a` alebo `ifconfig`

## Kompatibilita

### Server

K tomuto nie je moc čo povedať, ak más rozumne novú verziu Dockeru, malo by to fungovať (pri vývoji bol použitý Docker v29). Ak nepoužívaš Docker, silne odporúčam použiť `pnpm` namiesto `npm`, lepšie zvláda závislosti. AČISS bol robený v Node.js v25 ale asi bude fungovať aj pár verzií hore/dole.

### Prehliadač

Väčšina častí AČISSu využíva už celkom zaužívané súčasti prehliadačov (od cca 2018). Jediný menší problém robi TailwindCSS, ktorý využíva `@layer`.
Ten aktuálne podporujú prakticky všetky prehliadače, ale iba od ~2022 (~2024 pre mobily), čiže na menej aktualizovaných systémoch vedia byť problémy so štýlmi.

Ak chceš použiť Internet Explorer, tak na to zabudni. Ak si nad tým vôbec uvažoval, asi je na čase, zvážiť tvoje životné rozhodnutia.
