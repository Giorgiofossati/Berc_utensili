**definizione categorie e sottocategorie.** rappresentano le categorie e sottocategorie del database.

-Tipologia: (Lista)
    -Fresa
    -Punta 
    -Inserto 
    -Maschio 
    -Spaccamaschio 
    -Alesatore 
    -Lamatore 
    -Svasatore 
    -Smussatore 
    -Tracciatore
    -Inserto

-Forma: (Lista)
    -Candela
    -Inserti
    -Torica
    -Sferica
    -Disco
    -Pettine
    -Karnasch

-Diametro. (string)
-Diametro nominale. (float)
-Raggio. (float)
-Passo. (float)
-Tolleranza (string)
-Lunghezza. (float)
-Angolo. (string)
-Rotazione. (Dx, Sx) (lista)
-Materiale. (string)
-Rivestimento. (lista)
    -Diamante
    -Nuda
-Stato. (Lista)
    -Nuovo 
    -Usato
    -Riaffilato
-Ubicazione. (lista)
    -EXTREMA3
    -ALESATORI
    -BELOTTIC1
    -BELOTTIC2
    -BELOTTIC3
    -BELOTTIC4
    -BELOTTIC5
    -BELOTTIC7
    -BELOTTIC8
    -DIAMANTATE 1
    -DIAMANTATE 2
    -DIAMANTATE1
    -DUCATI
    -EXTREMA1
    -EXTREMA2
    -EXTREMA3
    -EXTREMA4
    -FRESA METALLI 1 
    -FRESA METALLI1
    -FRESA METALLI2
    -FRESE METALLI1
    -FRESE METALLI2
    -INSERTI FRESA
    -INSERTI FRESE
    -MARCO
    -MASCHI
    -MASCHI A
    -MASCHI EG
    -PETTINI 
    -POLLEDRI
    -PUNTE 1.6 PANNELLI
    -PUNTE1 
    -PUNTE1.6 PANNELLI
    -PUNTE2
    -PUNTE3
    -RIAFFILATE1
    -SMUSSATORI
    -TASTATORI

-Progetto. (string)
-Codice (string) ex: “BRCLxxx”
-Serial Number (string) ex: “221006315”
-Fornitore 
    -4C MILLS
    -ARMOR
    -B 
    -BASS
    -BETA
    -BF
    -BURZONI
    -CARMON
    -CARMEX
    -CASAPPA
    -CERATIZIT
    -CERIN
    -DC
    -DIAEDGE
    -DORMER
    -DSN
    -EG
    -EMUGE
    -FAPIL
    -FIMU
    -FRANCO
    -GAIT
    -GRANLUND
    -GUHRING
    -GWGW
    -HANITA
    -HARTNER
    -HEULE
    -HOFFMAN
    -HTTART
    -HUFSCHMIED
    -HZ
    -IG UTENSILI
    -ILIX
    -BERCELLA
    -JONGEN
    -KOMET
    -LAU
    -LTEC
    -MFM
    -NOVATEA
    -OMAL
    -OSG
    -OSSOLANA
    -PEPPER
    -POLLEDRI
    -RAFF
    -REAMER
    -RECOIL
    -RENISHAW
    -RIME
    -SANDVIK
    -SC ROUTER
    -SECO
    -SIMTEK
    -SPPW
    -STOCK
    -TRED
    -TAEGUTEC
    -TAM
    -TECHNO
    -TESI
    -TKN
    -TNF
    -TSCHORN 
    -TUNGALOY
    -TUNIT
    -UOP
    -VARTEX
    -WSG
    -WST
    -YAMAHA
    -YG1
    -YIG
    -ZORLINE

-Quantità. (int)
-Lavorazione. (Lista)
    -Fresatura
    -Foratura
    -Filettatura
    -Tastatore 
    -Lamatura
    -Tornitura
-Sistema di misura: (Lista)
    -Metrico
    -Americano
    -EG
-Alias (string)
-Check (string)


---------------------------------------
---------------------------------------

**Segui sempre queste regole per la Catalogazzione:**

-Se la riga non rispetta le regole metti questi utensili nel file "Da Verificare".
-in Alias riporta sempre la descrizione del prodotto

Ordine delle operazioni:
    -1: Estrai la Tipologia
    -2: Estrai Forma
    -3: Estrai Diametro
    -4: Estrai Diametro Nominale
    -5: Estrai Raggio
    -6: Estrai Materiale
    -7: Estrai Rivestimento
    -8: Estrai Stato
    -9: Estrai Ubicazione
    -10: Estrai Codice
    -11: Estrai Serial Number
    -12: Estrai Fornitore
    -13: Estrai Quantità
    -14: Estrai Lavorazione
    -15: Estrai Sistema di misura
    -16: Estrai Alias
    -17: Estrai Rotazione
    -18: Estrai Tolleranza
    -19: Estrai Passo
    -20: Estrai Angolo
    -21: Componi i dati di ("Tipologia" + "Forma" + "Diametro" + "Raggio" + "Angolo" + "Materiale" + "Rivestimento" ) confronta questa stringa parola per parola con il campo descrizione originale e se trovi parole in più mettile in Check.
    ----------------------

-Tipologia:
    - Se in descrizione trovi "FRESA" controlla:
        - Se la parola "FRESA" è la prima parola allora è Fresa.
        esempio: Fresa a inserti > Fresa
        - Se "FRESA" non è la prima parola allora controlla se ci sono altre parole prima di "FRESA". 

    - Se in descrizione trovi "PUNTA" allora è Punta

    - Se in descrizione trovi "INSERTO" o "INSERTI" allora controlla:
        - Se in descrizione trovi "INSERTI" o "INSERTO" e queste vengono prima di "FRESA" allora è Inserto

    - Se in descrizione trovi "MASCHIO" allora è Maschio
    - Se in descrizione trovi "SPACCAMASCHIO" allora è Spaccamaschio
    - Se in descrizione trovi "ALESATORE" allora è Alesatore
    - Se in descrizione trovi "LAMATORE" allora è Lamatore
    - Se in descrizione trovi "SVASATORE" allora è Svasatore
    - Se in descrizione trovi "SMUSSATORE" allora è Smussatore
    - Se in descrizione trovi "TRACCIATORE" allora è Tracciatore

-Forma:
    - Se non trovi indicato la forma allora è Fresa a Candela se tipol0ogia = fresa

   -Regole per le frese:
        -Se diametro == (Raggio*2) allora è sferica
        -Se no è Torica
        -Se in descrizione non trovi ne R ne D allora è Candela

-Diametro nominale:
    -Estrai da Misura
    -Dove trovi "D" + un numero quello è il diametro nominale.
    -Quando trovi "M" quello è il diametro di un Maschio o Pettine, prendi solo il numero.

-Diametro.
    - è il Diametro che trovi nella descrizione esempio: "M6" o "D4" se metrico o "10/32" se in pollici quindi Americano o EG".
    - Mettilo come stringa ad esempio: M6 o D6 

-Raggio:
    -Se Fresa torica allora Raggio = R"" della descrizione es: "R0.2" o "R02"
    -Se non presente calcola il raggio da diametro D/2

-Passo:
    -Solitamente il passo è indicato solo per tipologia Maschio o Pettine
    -Il passo è in descrizione e solitamente si trova dopo il diametro esempio: "M6X0,75" il passo è 0,75

-Tolleranza:
    -Se specificat in descrizione è simile a "H7"
    -Controlla che non corrisponda ad altra categoria tipo "M6" o "D6"

-Lunghezza:
    -lascia vuoto

-Angolo:
    - Estrai il valore dell'angolo indicato come numero seguito dal simbolo gradi (es: "90°", "120°"). Di solito presente in svasatori, smussatori e punte.


-Rotazione:
    - Se in descrizione trovi "SX" allora è Sx
    - Se in descrizione trovi "DX" allora è Dx
    - Se in descrizione non trovi ne "SX" ne "DX" allora è Dx

Materiale:
    - il materiale lo trovi in "Tipologia" del file di input oppure lo devi estrarre dalla descrizione togliendo tutte le altre categorie, esempio: "MASCHIO M6,5X0,75 HSSE" il materiale è HSSE
    - Se in descrizione trovi "METALLO DURO" allora è Metallo Duro
    - Se in descrizione trovi "VHM" allora è VHM
    - Se in descrizione trovi "MDI" allora è MDI
    - Se in descrizione trovi "HSSE" allora è HSSE
    - Se in descrizione trovi "HSS" allora è HSS
    - Se in descrizione trovi "DIAMANTATA" allora è Diamante

Rivestimento:
    - il rivestimento lo devi estrarre dalla descrizione può essere:
        - Nuda
        - Diamante o diamantata
        - "K"+numero ex:"K20"
        - "KP"+numero ex:"KP60"

-Codice (string)
    -riporta la colonna "PN BRC"
    -esempio: “BRCLxxx”

-Serial Number (string)
    -Riporta colonna "Serial Number"
    -eSEMPIO: “221006315”

-Lavorazione.
    -Fresatura se tipologia è FRESA
    -Foratura se tipologia PUNTA
    -Filettatura se tipologia Maschio o Pettine
    -Tastatura Se tipologia tastaore
    -Lamatura se tipologia lamatore
    -Tornitura se in descrizione comapre tornitura

-Sistema di misura:
    -Metrico se trovi solo "M" o "D"
    -Americano 
    -
-Alias (string)
    -in Alias riporta sempre la descrizione del prodotto











