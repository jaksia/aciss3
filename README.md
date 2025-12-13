# AČISS 3

**Akustický Časový Informačný Systém Sústredenia v3**

Systém, ktorý je schopný automaticky zvolávať účastníkov sústredenia na program. Z praktických skúseností je potvrdené, že okrem ušetrenia vedúcich zo zvolávania, majú deti tentdenciu viac počúvať pri zvolávaní tento systém ako vedúcich.

Pôvodný AČISS je síce efektívny na zvolávanie účastníkov, ale má veľa nedostatkov, kvôli ktorým vie byť zložité ho efektívne používať. Niekedy po ceste existoval aj AČISS v2, ale ten sa použil iba na jednej akcii a aktuálne je (pravdepodobne) stratený.

Preto som vyrobil novú verzia AČISSu a to v3. Oproti pôvodnej verzii obsahuje napr. tieto vylepšenia:

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
  - _(neodporúčam nastavovať žiadnu aktivitu na noc zmeny času, to netuším ako skončí)_
- Upraviteľný zvuk pre začiatok/koniec hlásenia, zvolávačku a viacero ďalších

## Používanie

Vo všeobecnosti odporúčam používať lokálne hostovanú verziu, ale verejná vie slúžiť ako dobrá záloha alebo ak nie je čas/zariadenie na nastavenie serveru.

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

### Lokálne hostovaná verzia

- **Výhody:**
  - Funguje nezávisiac od dostupnosti/kvality internetu
  - O čosi rýchlejšie ovládanie a lepší výkon
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
1. Nakopíruj si súbory z tohto repa lokálne (odporúčam normálne `git clone`, ale aj stiahnu zip funguje)
2. Otvor si terminál v priečinku so súbormi tohto repa
3. Spusti `docker compose up`
   - Automaticky buildne AČISS, zapne ho spolu s databázou a NGINX ako reverse proxy pre ne
   - Ak spúšťaš AČISS po jeho aktualizácií, použi aj flag `--build`
   - Predvolene sa použije port 80, ak v tom je problém (napr. Windows), dá sa zmeniť
     - V riadku `- "0.0.0.0:80:80"` zmeň prvú `80` na port, cez ktorý má byť AČISS prístupný

4. Otvor v prehliadači `http://localhost/`
   - Ak si menil port, použi `http://localhost:PORT/`
   - Ak sa k tomu snažíš dostať cez iný PC, nahraď za `localhost` IP počítača, kde beží AČISS
