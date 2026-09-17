/*
 * Copyright (C) 2026 Khodok
 *
 * This file is part of Connect4 Game Solver.
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Der /guide-Essay auf Deutsch. Gleiche Struktur wie guide-en.js: Wer den
 * Leitfaden übersetzt, übersetzt Prosa und nie Markup.
 *
 * Terminologie: Allis' Arbeit von 1988 wurde nie übersetzt. Das allgemeine
 * Vokabular hat etablierte deutsche Entsprechungen und die werden verwendet
 * (ungerade/gerade Drohung, Zugzwang — ein deutsches Wort, das das Englische
 * entliehen hat —, Halbzug, Startspieler). Die acht VICTOR-Regeln sind
 * Wortschöpfungen der Arbeit: Der englische Name bleibt als Bezeichner stehen,
 * damit man ihn in der Literatur wiederfindet, und bei der ersten Nennung folgt
 * eine deutsche Entsprechung in Klammern.
 */

export default {
  seo: {
    title: 'Wie man Vier gewinnt gewinnt — der komplette Leitfaden',
    description:
      'Von den nackten Regeln zum gelösten Spiel: gerade und ungerade Felder, Drohungen, Allis’ Paarungsregeln und wie man den Sieg erzwingt. Jedes Diagramm ist eine echte Stellung mit einem vom Solver geprüften Plan.',
  },

  kicker: 'Der komplette Leitfaden',
  title: 'Wie man Vier&nbsp;gewinnt gewinnt, vom ersten Zug bis zum gelösten Spiel',
  sub: 'Vier gewinnt ist gelöst. Spielen beide Seiten perfekt, gewinnt der Startspieler. Diese Seite führt dich von den nackten Regeln bis zum Lesen eines Bretts, wie die Engine es liest, und jedes Diagramm unten ist eine echte Stellung, deren Plan aus derselben Beweismaschine stammt, die auch die App antreibt.',
  tocLabel: 'Inhalt',

  toc: [
    {id: 'solved', label: '1 · Das Spiel ist gelöst'},
    {id: 'understood', label: '2 · Ein Score erklärt nichts'},
    {id: 'parity', label: '3 · Gerade und ungerade Reihen'},
    {id: 'threats', label: '4 · Drohungen'},
    {id: 'develop', label: '5 · Wie man entwickelt'},
    {id: 'learn', label: '6 · Den Lernmodus lesen'},
    {id: 'rules', label: '7 · Felder beanspruchen'},
    {id: 'proof', label: '8 · Der Paarungsbeweis'},
    {id: 'winning', label: '9 · Den Sieg erzwingen'},
    {id: 'gm', label: '10 · Spielen wie ein Meister'},
  ],

  sections: [
    {
      id: 'solved',
      h2: '1 · Das Spiel ist längst gelöst',
      blocks: [
        {h3: 'Die Regeln, in einem Absatz'},
        {
          p: 'Vier gewinnt wird auf einem <strong>Brett mit 7 Spalten und 6 Reihen</strong> gespielt, also 42 Plätzen. Abwechselnd lässt man einen Stein in eine Spalte fallen, und er landet auf dem untersten freien Platz. Wer vier eigene Steine waagerecht, senkrecht oder diagonal in eine Reihe bringt, gewinnt. Füllen sich alle 42 Plätze ohne Viererreihe, endet die Partie remis.',
        },
        {p: 'Zwei Wörter tauchen auf jeder Seite über dieses Spiel auf:'},
        {
          ul: [
            '<strong>Feld</strong> ist das spieltheoretische Wort für einen Platz. Auf einem echten Brett sind die Löcher rund, aber die Literatur spricht von Feldern, und diese Seite tut es auch.',
            '<strong>Halbzug</strong> (englisch <em>ply</em>) ist ein einzelner fallender Stein, ein einzelner Zug eines einzelnen Spielers. Eine Partie dauert höchstens 42 Halbzüge. Bei perfektem Spiel schließt der Startspieler die Viererreihe im Halbzug&nbsp;41 und lässt genau einen Platz frei.',
          ],
        },
        {
          p: 'Ein 7×6-Brett enthält genau <strong>69 Viererreihen</strong>: 24 waagerechte, 21 senkrechte und 24 diagonale. Jede Idee auf dieser Seite läuft auf einen Kampf darum hinaus, welche dieser 69 Reihen jeder Spieler noch schließen kann.',
        },
        {h3: 'Und dieser Kampf hat eine bekannte Antwort'},
        {
          p: '1988 bewies Victor Allis, und James Allen bestätigte es mit einem unabhängigen Programm, dass auf dem Standardbrett der <strong>Startspieler den Sieg erzwingen kann</strong>, wenn er in der mittleren Spalte eröffnet. Alle 4,5&nbsp;Billionen erreichbaren Stellungen tragen einen exakten Wert.',
        },
        {
          p: 'Pascal&nbsp;Pons hat die moderne Fassung dieses Ergebnisses geschrieben, und sie läuft auf dieser Seite. Gib ihr eine beliebige Stellung und sie antwortet sofort: Sieg, Niederlage oder Remis, und in wie vielen Zügen. Die Zahl über jeder Spalte ist diese Antwort, keine Schätzung.',
        },
        {
          details: {
            summary: 'Die strenge Fassung: wie Pons’ Solver arbeitet',
            body: [
              'Die Engine durchläuft den Spielbaum mit <strong>Negamax und Alpha-Beta-Schnitt</strong>. Sie spielt Varianten aus, und sobald sie eine Antwort findet, die einen Zug widerlegt, verwirft sie den ganzen Zweig. Sie speichert das Brett als <strong>Bitboard</strong>, zwei 64-Bit-Zahlen, eine je Spieler, sodass das Prüfen auf eine Viererreihe und das Erzeugen der Züge nur eine Handvoll Bit-Operationen kosten. Eine <strong>Transpositionstabelle</strong> merkt sich bereits bewertete Stellungen, und eine <strong>Eröffnungsbibliothek</strong> hält den Wert jeder Stellung bis zu einer festen Tiefe bereit, sodass die ersten Züge gar keine Suche brauchen.',
              'Der Score kodiert den <em>Abstand zum Ende</em>. Eine Stellung mit +N bedeutet, dass der Gewinner die Vier mit N freien Feldern Vorsprung schließt: Je größer die Zahl, desto schneller der Sieg. Weil die mittleren Spalten zuerst probiert werden, schneidet Alpha-Beta gewaltige Teile des Baums weg, und genau deshalb löst dein Browser ein Spiel mit einer Billion Stellungen in Millisekunden.',
            ],
          },
        },
      ],
    },

    {
      id: 'understood',
      h2: '2 · Ein Score sagt, wer gewinnt, nie warum',
      blocks: [
        {
          p: 'Ein Score von +11 sagt dir, dass die Stellung gewonnen ist. Er sagt nichts darüber, welche Felder den Sieg tragen, und er hilft dir nicht, diesen Sieg an einem Sonntagnachmittag am echten Brett zu finden. Dafür brauchst du einen Plan, der klein genug ist, um in deinen Kopf zu passen.',
        },
        {
          p: 'Allis’ Programm <strong>VICTOR</strong> baut einen solchen Plan. Statt zu suchen, schließt es darauf, welche Felder jeder Spieler sicher bekommt, ganz gleich was der Gegner tut, und fügt diese Garantien zu einer <strong>Paarung</strong> zusammen: einem festen Plan, der auf jede Viererreihe antwortet, die der Gegner noch bauen könnte. Der Rest dieser Seite baut diese Theorie Idee für Idee auf, und die Schaltfläche „Den Plan zeigen“ unter jedem Brett zeigt VICTORs Paarung für genau diese Stellung, geprüft gegen den perfekten Solver.',
        },
      ],
    },

    {
      id: 'parity',
      h2: '3 · Das Geheimnis des Bretts: gerade und ungerade Reihen',
      blocks: [
        {
          p: 'Nummeriere die Reihen von unten mit 1 bis 6. Der Startspieler landet meist auf den ungeraden Reihen (1, 3, 5), der zweite Spieler auf den geraden (2, 4, 6). Dieser eine Satz steuert den Großteil der Strategie bei Vier gewinnt, und du kannst dich auf drei verschiedene Arten davon überzeugen.',
        },
        {h3: 'Erste Art: fülle eine Spalte und schau zu'},
        {
          p: 'Nimm eine leere Spalte und lass beide Spieler abwechselnd hineinspielen. Der erste nimmt Reihe 1, der zweite Reihe 2, der erste Reihe 3, und so weiter bis oben. Nichts zwingt beide Spieler, immer in derselben Spalte zu antworten, im Mittelspiel verbiegt sich das Muster also. Sobald das Brett enger wird und die Wartezüge ausgehen, setzt sich die Zählung wieder durch.',
        },
        {h3: 'Zweite Art: zähle, wem die Wartezüge ausgehen'},
        {
          p: 'Spät in der Partie sind die meisten Spalten vergiftet: Wer dort einwirft, schenkt dem Gegner ein Feld, das er haben will. Beide schieben in das, was übrig bleibt, und warten darauf, dass der andere einknickt. Schachspieler nennen das <em>Zugzwang</em>: ziehen zu müssen, obwohl jeder Zug schadet. Zählt man die freien Felder der noch lebenden Spalten, weiß man, wer zuerst einknickt, und wer einknickt, wirft einen Stein direkt unter das Gewinnfeld des Gegners.',
        },
        {h3: 'Dritte Art: die geraden Felder als Revier des zweiten Spielers'},
        {
          p: 'Der zweite Spieler kann auf jeden Stein antworten, indem er in derselben Spalte direkt darüber einwirft. Diese Antwort steht immer offen, und sie landet auf einer geraden Reihe, sobald der gegnerische Stein auf einer ungeraden gelandet ist. Wiederhole das, und der zweite Spieler sammelt gerade Felder umsonst ein, was jede Reihe tötet, die durch sie hindurchläuft. Zeige den Plan in der Remisstellung unten: Der zweite Spieler beansprucht elf gerade Felder und braucht sonst nichts.',
        },
        {
          diagram: {
            example: 'draw-claimeven',
            caption:
              'Der zweite Spieler hält das Remis, indem er die geraden Felder besitzt, und sonst nichts.',
          },
        },
      ],
    },

    {
      id: 'threats',
      h2: '4 · Drohungen: die Felder, die gewinnen',
      blocks: [
        {
          p: 'Eine <strong>Drohung</strong> ist ein freies Feld, das für dich eine Viererreihe schließen würde. Die Parität teilt Drohungen in zwei Sorten, und sie wiegen unterschiedlich schwer:',
        },
        {
          ul: [
            '<strong>Ungerade Drohungen</strong> liegen auf einer ungeraden Reihe und gehören zum Repertoire des Startspielers. Die Spalte, die eine trägt, behält darunter eine ungerade Zahl freier Felder, also übergibt die Endspielzählung dieses Feld dem Startspieler.',
            '<strong>Gerade Drohungen</strong> liegen auf einer geraden Reihe und gehören dem zweiten Spieler, der seine ganze Verteidigung ohnehin auf geraden Feldern aufbaut.',
          ],
        },
        {h3: 'Warum eine ungerade Drohung eine gerade schlägt'},
        {
          p: 'Stell dir eine Drohung des Startspielers auf Reihe 3 der Spalte&nbsp;b vor, der Rest des Bretts ist verriegelt. Keiner will Spalte&nbsp;b anfassen: Wer b2 spielt, lässt den anderen b3 nehmen. Beide Seiten verbrauchen ihre Wartezüge also anderswo, und diese Wartezüge gehen beim zweiten Spieler zuerst aus. Er spielt b2, der Startspieler nimmt b3 und gewinnt. Dreh die Parität um, und dieselbe Zählung läuft andersherum.',
        },
        {
          p: 'Zwei ungerade Drohungen heben sich auf, zwei gerade ebenso. Eine gerade Drohung des Startspielers gegen eine ungerade des zweiten Spielers endet remis. Ungerade gegen gerade zu zählen deckt den größten Teil des Abstands zwischen einem Anfänger und einem starken Vereinsspieler ab.',
        },
      ],
    },

    {
      id: 'develop',
      h2: '5 · Wie man entwickelt, wenn noch keine Regel greift',
      blocks: [
        {
          p: 'In den ersten rund zwölf Halbzügen greift keine VICTOR-Regel: Es liegen noch nicht genug Steine auf dem Brett, als dass ein vollständiger Paarungsbeweis existieren könnte. Der Solver kennt den richtigen Zug trotzdem, aber sein Grund ist positionell statt regelbasiert, und die App nennt das <em>einen Entwicklungszug</em>. Fünf Gewohnheiten lassen dich selbst einen finden.',
        },
        {h3: '1 · Fang in der Mitte an'},
        {
          p: 'Spalte&nbsp;4 gehört zu mehr möglichen Viererreihen als jede andere: 51 der 69 Reihen des Bretts laufen durch sie, nämlich alle 24 waagerechten, alle 24 diagonalen und 3 senkrechte. Danach kommen die Spalten 3 und 5, dann 2 und 6, dann die Ränder. Wenn dir nichts Besseres einfällt, kostet dich ein Zug Richtung Mitte selten etwas.',
        },
        {h3: '2 · Lande auf deiner Paritätsreihe'},
        {
          p: 'Bevor du einen Stein einwirfst, rechne aus, auf welcher Reihe er landet. Zähle die Steine, die schon in der Spalte liegen: Eine gerade Anzahl heißt, dein Stein landet auf einer ungeraden Reihe, eine ungerade Anzahl auf einer geraden. Als Startspieler ziele auf <strong>ungerade Reihen</strong> (1, 3, 5), als zweiter Spieler auf <strong>gerade Reihen</strong> (2, 4, 6). Auf der falschen Reihe zu landen schenkt deinem Gegner die Endspielzählung.',
        },
        {h3: '3 · Zähle die Reihen, die du öffnest'},
        {
          p: 'Zähle nach dem Einwurf, wie viele Viererreihen jetzt mindestens einen deiner Steine und keinen gegnerischen enthalten. Mehr ist besser. Der Lernmodus zeichnet dir das mit den <em>Chancen</em>-Markern (deine werdenden Drohungen) und den <em>Gefahr</em>-Markern (die des Gegners). Bei sonst gleichen Bedingungen ist ein Entwicklungszug, der drei neue Reihen öffnet, besser als einer, der nur eine öffnet.',
        },
        {h3: '4 · Achte darauf, was du herschenkst'},
        {
          p: 'Jeder Stein, den du setzt, ist eine Einladung, denn der nächste gegnerische Stein kann direkt darauf landen. Prüfe dieses Feld, bevor du dich festlegst. Gibt es ihm ein gerades Feld, das er haben wollte, oder öffnet es ihm eine Reihe, die ihm fehlte, dann suche eine andere Spalte.',
        },
        {h3: '5 · Verteile deine Drohungen über die Spalten'},
        {
          p: 'Zwei eigene Drohungen übereinander in einer Spalte heben sich auf: Der Gegner blockt einmal und tötet beide. Verteile sie. Anzustreben sind Stellungen, in denen dein Gegner an zwei Spalten gleichzeitig sein müsste.',
        },
        {
          details: {
            summary: 'Warum der Solver es trotzdem besser weiß als diese fünf Gewohnheiten',
            body: [
              'Die Gewohnheiten oben sind fundierte Vermutungen. Sie beschreiben, wie starke Stellungen üblicherweise aussehen, und garantieren nichts. Der Solver überspringt das alles: Er bewertet den vollständigen Spielbaum ab der Stellung vor dir und liefert den exakten Score jeder Spalte. Sagt er, Spalte&nbsp;4 steht bei +15 und Spalte&nbsp;1 bei +7, dann hat er jede Folgestellung beider gezählt und bestätigt, dass Spalte&nbsp;4 acht Halbzüge früher gewinnt. Die Heuristiken sind eine Abkürzung für Menschen; die Engine braucht sie nicht.',
            ],
          },
        },
      ],
    },

    {
      id: 'learn',
      h2: '6 · Den Lernmodus lesen',
      blocks: [
        {
          p: 'Der Lernmodus antwortet dir mit zwei getrennten Maschinen, und wer sie auseinanderhält, kann den Hinweisen viel leichter trauen.',
        },
        {
          p: 'Der Übungsmodus (<a href="/practice">die Übungen</a>) teilt dir eine Stellung aus, die um eine dieser Ideen herum gebaut ist, und bewertet die Spalte, die du wählst. Das ist der schnellste Weg herauszufinden, ob du die Marker so liest wie die Engine.',
        },
        {
          ul: [
            '<strong>Der Solver wählt die Spalte.</strong> Er liest das ganze Brett bei jedem Zug neu, bleibt also nach einem Patzer beider Seiten korrekt, und auch in Stellungen, die kein Theoriebuch abdeckt.',
            '<strong>Eine Regelschicht beschreibt diese Wahl in Worten</strong> und zeichnet die Marker. Sie arbeitet mit der Drohungsstruktur auf dem Brett, nicht mit der Suche.',
          ],
        },
        {
          p: 'Der Solver fragt die Regelschicht nie um Erlaubnis. Klingt ein Hinweis milde und sagt die Score-Leiste, die Stellung sei gewonnen, dann glaube dem Score.',
        },
        {h3: 'Wie die Karte ihr Wort wählt'},
        {
          p: 'Die Karte benennt <em>den Zug, den der Solver empfiehlt</em>, nie den, den du zuletzt gespielt hast. Sie führt diese Tests der Reihe nach auf der empfohlenen Spalte aus und hält beim ersten an, der greift:',
        },
        {
          ol: [
            '<strong>Ein Gewinnzug.</strong> Dort einzuwerfen schließt jetzt sofort deine Viererreihe.',
            '<strong>Eine Blockade.</strong> Dort einzuwerfen schließt die Viererreihe deines Gegners, du nimmst das Feld also vor ihm.',
            '<strong>Eine ungerade oder gerade Drohung.</strong> Nach dem Einwurf hältst du mindestens ein Drohfeld, das du vorher nicht hattest. Die Karte benennt die Parität, die dir nützt, ungerade beim Startspieler und gerade beim zweiten Spieler, und weicht auf die aufgetretene Drohung aus, wenn der Zug nur die andere Sorte erzeugt.',
            '<strong>Ein Claimeven.</strong> Es ist keine neue Drohung entstanden, und das Feld liegt auf einer geraden Reihe direkt über einem gegnerischen Stein. Nur der zweite Spieler sieht dieses Etikett, denn gerade Felder sind sein Werkzeug.',
            '<strong>Ein Entwicklungszug.</strong> Keiner der Tests oben hat gegriffen.',
          ],
        },
        {
          p: 'Weil die Tests der Reihe nach laufen, erscheint ein Zug, der eine Viererreihe blockt <em>und</em> eine ungerade Drohung aufbaut, als Blockade. Die Karte nennt dir den dringendsten Grund für den Zug, den Rest der Geschichte tragen die Marker auf dem Brett.',
        },
        {
          p: 'Ein Entwicklungszug ist ein starker Zug, dessen Grund noch keinen Namen hat. Die meisten der ersten zehn Halbzüge sind Entwicklungszüge, und der Solver weiß, welche davon gewinnen.',
        },
        {h3: 'Die Marker auf dem Brett'},
        {
          p: 'Drücke „Zeig es mir auf dem Brett“ und die Felder bekommen Zeichen. Das Steady-State-Diagramm in der Seitenleiste benutzt dasselbe Vokabular in klein.',
        },
        {
          legend: [
            {
              char: '✦',
              cls: 'g-win',
              term: 'Goldener Stern',
              desc: 'Auf diesem Feld entscheidet sich die Partie: Entweder schließt du hier deine Vier, oder dein Gegner hätte sie hier im nächsten Zug geschlossen.',
            },
            {
              char: '◎',
              cls: 'g-play',
              term: 'Doppelring',
              desc: 'Das empfohlene Landefeld. Liegen mehrere Spalten im Score gleichauf, bekommt jede einen, und jede davon ist in Ordnung.',
            },
            {
              char: '○',
              cls: 'g-opp',
              term: 'Dünner Ring',
              desc: 'Eine deiner Drohungen: ein freies Feld, das deine Vier schließt, falls du je dort einwerfen darfst.',
            },
            {
              char: '✕',
              cls: 'g-danger',
              term: 'Rotes Kreuz',
              desc: 'Eine Drohung des Gegners, auf die noch keine deiner Regeln antwortet. Zwei davon in Spalten, die du nicht beide abdecken kannst, so verliert man Partien.',
            },
            {
              char: '◌',
              cls: 'g-ctrl',
              term: 'Gestrichelter Ring',
              desc: 'Eine gegnerische Drohung, auf die eine Regel bereits antwortet, sie verlangt heute also keinen Zug von dir. Ihre Ruhe ist Absicht.',
            },
          ],
        },
        {
          p: 'Auch ganze Reihen werden umrandet, nicht nur das eine schließende Feld, damit du siehst, zu welcher Vier ein Marker gehört. Liegt ein Feld auf Reihen beider Seiten, gewinnt die Gefahrfarbe.',
        },
        {h3: 'Woher ein gestrichelter Ring kommt'},
        {
          p: 'Zwei Regeln erzeugen diesen ruhigen Marker, und beide lohnt es sich am echten Brett zu erkennen:',
        },
        {
          ul: [
            '<strong>Claimeven-Kontrolle.</strong> Die gegnerische Drohung liegt auf einem geraden Feld, das der zweite Spieler einsammelt, indem er darüber antwortet. Die Drohung existiert, und sie wird nie ihm gehören.',
            '<strong>Eine Baseinverse-Gabel.</strong> Der Gegner hat zwei Steine in einer Viererreihe, deren beide restliche Felder schon in diesem Zug spielbar sind, und diese zwei Felder liegen immer in verschiedenen Spalten. Er nimmt eines, du nimmst das andere, die Reihe stirbt also, wie er sich auch entscheidet.',
          ],
        },
        {h3: 'Den Plan zeigen'},
        {
          p: 'Die Plan-Schaltfläche erscheint, sobald der Beweiser einen vollständigen Beweis für die Stellung findet. Die Überschrift nennt, wer was erzwingen kann: einen Sieg für den Startspieler, einen Sieg für den zweiten Spieler oder das Halten des Remis durch den zweiten Spieler. Darunter benennt eine Zeile den <strong>Anker</strong>, also das, was den Ausgang erzwingt:',
        },
        {
          ul: [
            'Eine <strong>ungerade Drohung</strong> auf einem benannten Feld, die den Zugzwang in einen Sieg verwandelt.',
            'Eine <strong>sofortige</strong> Viererreihe, die gerade jetzt in einer benannten Spalte bereitsteht.',
            'Ein <strong>Aftereven</strong>, eine Reihe, die der zweite Spieler allein mit garantierten geraden Feldern schließt.',
            'Eine <strong>Drohungskombination</strong>, bei der zwei Felder gemeinsam eine ungerade Drohung erzwingen, wie der Gegner auch antwortet.',
          ],
        },
        {
          p: 'Unter dem Anker folgt die Regelliste, eine Zeile je Regel mit der Anzahl ihrer Verwendungen im Plan. Jede Regel hat ihr eigenes Zeichen und ihre Farbe, und die Felder, die sie reserviert, tragen dasselbe Zeichen auf dem Brett: Du kannst also jede Zeile der Liste zu dem Teil des Bretts zurückverfolgen, den sie regiert:',
        },
        {
          legend: [
            {
              char: '◆',
              cls: 'rule-claimeven',
              term: 'Claimeven (Geradanspruch)',
              desc: 'Nimm das gerade Feld über ihrem.',
            },
            {
              char: '■',
              cls: 'rule-baseinverse',
              term: 'Baseinverse (Grundinverse)',
              desc: 'Zwei spielbare Felder, und sie können nicht beide bekommen.',
            },
            {
              char: '▮',
              cls: 'rule-vertical',
              term: 'Vertical (Senkrechte)',
              desc: 'Antworte darüber, um die Spalte zu verweigern.',
            },
            {
              char: '▲',
              cls: 'rule-aftereven',
              term: 'Aftereven (Geradenfolge)',
              desc: 'Gerade Felder töten die Drohungen darüber.',
            },
            {
              char: '▽',
              cls: 'rule-lowinverse',
              term: 'Lowinverse (Tiefinverse)',
              desc: 'Zwei ungerade Felder, und du bekommst eines. Der Pfeil zeigt nach unten für „tief“.',
            },
            {
              char: '△',
              cls: 'rule-highinverse',
              term: 'Highinverse (Hochinverse)',
              desc: 'Kontrolliere drei Felder Höhe über zwei Spalten. Der Pfeil zeigt nach oben für „hoch“.',
            },
            {
              char: '◈',
              cls: 'rule-baseclaim',
              term: 'Baseclaim (Grundanspruch)',
              desc: 'Ein Anspruch plus eine Inverse, verankert auf der Grundreihe.',
            },
            {
              char: '●',
              cls: 'rule-before',
              term: 'Before (Vorwegnahme)',
              desc: 'Antworte darüber, damit du deine Vier zuerst schließt.',
            },
          ],
        },
        {
          p: 'Die letzte Zeile zählt, was der Plan abdeckt: die möglichen Viererreihen des Gegners, alle, ohne dass zwei Regeln um dasselbe Feld streiten. Streiche eine der beiden Hälften dieser Bedingung und der Beweis bricht zusammen, deshalb lohnt sich diese Zahl.',
        },
        {
          p: 'Keine Plan-Schaltfläche heißt, dass der Beweiser für diese Stellung keinen Beweis gefunden hat, also schweigt er. Er rät nie und behauptet nie ein Halten, dem der Solver widerspräche. Die Score-Leiste und der Worthinweis arbeiten in jedem Fall weiter.',
        },
      ],
    },

    {
      id: 'rules',
      h2: '7 · Felder beanspruchen: die Regeln hinter dem Plan',
      blocks: [
        {
          p: 'Jede VICTOR-Regel beantwortet eine einzige Frage: <em>Welche Felder bekomme ich garantiert, und welche gegnerischen Viererreihen tötet das?</em> Auswendiglernen ist unnötig. Nützlich ist, die Formen wiederzuerkennen.',
        },
        {h3: 'Claimeven, das Rückgrat'},
        {
          p: 'Zwei freie Felder übereinander in einer Spalte, das obere auf einer geraden Reihe. Nimmt der Gegner das untere, nimmst du sofort das gerade darüber. Das gerade Feld gehört also dir auf Zuruf, und jede Viererreihe, die hindurchläuft, stirbt. Die meisten Verteidigungspläne sind Claimevens mit ein paar angeschraubten Ausnahmen.',
        },
        {
          details: {
            summary: 'Allis’ formale Regel',
            body: [
              '<strong>Vorausgesetzt:</strong> zwei freie Felder direkt übereinander, das obere auf einer geraden Reihe.<br /><strong>Löst:</strong> alle Gruppen, die das obere Feld enthalten.',
            ],
          },
        },
        {h3: 'Der Rest der Familie'},
        {
          ul: [
            '<strong>Baseinverse</strong>: zwei Felder, beide in diesem Zug spielbar. Dein Gegner nimmt höchstens eines, du nimmst also das andere, und jede Viererreihe, die <em>beide</em> braucht, ist tot.',
            '<strong>Vertical</strong>: dasselbe Paar übereinander wie beim Claimeven, aber mit dem oberen Feld auf einer ungeraden Reihe. Du bekommst trotzdem eines der beiden.',
            '<strong>Lowinverse und Highinverse</strong>: zwei Spalten so kombiniert, dass sich die ungeraden Felder zu deinen Gunsten aufteilen.',
            '<strong>Aftereven</strong>: eine eigene Reihe, die du allein mit geraden Feldern schließt. Sie löscht außerdem jede Drohung, die über diesen Spalten liegt.',
            '<strong>Baseclaim</strong>: ein Anspruch plus eine Inverse, verankert auf der Grundreihe.',
            '<strong>Before</strong>: Du antwortest über einer unfertigen Reihe, um deine zuerst zu schließen.',
          ],
        },
        {
          p: 'Sieh mehrere von ihnen in einer einzigen Verteidigung zusammenarbeiten: eine Lowinverse, eine Senkrechte, drei „Before“-Gruppen und fünf Claimevens, alle miteinander verträglich:',
        },
        {
          diagram: {
            example: 'draw-inverse',
            caption: 'Eine gemischte Verteidigung: Lowinverse + Vertical + Before ×3 + Claimeven ×5.',
          },
        },
      ],
    },

    {
      id: 'proof',
      h2: '8 · Alles zusammensetzen: der Paarungsbeweis',
      blocks: [
        {
          p: 'Eine einzelne Regel beweist nichts. Die Stärke kommt aus ihrer <strong>Kombination</strong>. Wähle eine Menge von Regeln, die zusammen jede einzelne Viererreihe widerlegen, die der Gegner noch bauen könnte, und die nie dasselbe Feld zweimal beanspruchen: Dann kann dein Gegner nie vier verbinden. Du hältst schlimmstenfalls das Remis. Diese Menge von Regeln <em>ist</em> die Paarung.',
        },
        {
          p: 'Die zweite Bedingung, die Widerspruchsfreiheit, macht den Ärger. Manche Regeln sabotieren einander, und Allis hat eine vollständige Tabelle erstellt, welche Kombinationen gemeinsam bestehen. Diese Seite setzt jene Tabelle um und prüft anschließend jeden erzeugten Beweis gegen den perfekten Solver. Über Zehntausende von Stellungen hinweg hat er noch nie ein Remis oder einen Sieg behauptet, dem der Solver widersprochen hätte. Ein Plan, den du dir zeigen lässt, ist solide.',
        },
        {
          diagram: {
            example: 'draw-baseclaim',
            caption:
              'Baseclaim + Aftereven ×3 + Baseinverse decken jede Drohung ab: ein bewiesenes Halten.',
          },
        },
        {
          diagram: {
            example: 'draw-before',
            caption: 'Manchmal genügt ein einziges „Before“ samt Claimevens.',
          },
        },
      ],
    },

    {
      id: 'winning',
      h2: '9 · Den Sieg erzwingen',
      blocks: [
        {
          p: 'Ein Remis zu halten ist das Handwerk des Verteidigers. Ein Sieg braucht eine Zutat mehr: eine Drohung, auf die dein Gegner nie antworten kann.',
        },
        {h3: 'Startspieler: eine ungerade Drohung'},
        {
          p: 'Gib dem Startspieler eine stehende <strong>ungerade Drohung</strong>, und der Zugzwang erledigt den Rest. Dem Gegner gehen die sicheren Züge aus, er spielt unter die Drohung und übergibt das Gewinnfeld. Der Rest des Bretts ist reine Verteidigung mit denselben Paarungsregeln, der Gegner kommt also nie zuerst an. Der goldene Stern markiert die Drohung, auf der der ganze Sieg ruht:',
        },
        {
          diagram: {
            example: 'win-odd-baseinverse',
            caption:
              'Eine ungerade Drohung auf d3 erzwingt den Sieg; Baseinverse und sechs Claimevens halten den Rest.',
          },
        },
        {h3: 'Zweiter Spieler: ein Aftereven'},
        {
          p: 'Der zweite Spieler gewinnt, indem er diese Idee spiegelt. Enthält sein Verteidigungsplan ein <strong>Aftereven</strong>, eine Viererreihe, die er auf garantierten geraden Feldern schließt, dann antwortet er auf alles, was der Startspieler versucht, und vollendet nebenbei seine eigene Reihe. Die Sterne zeigen die geraden Felder, die ihm sicher sind:',
        },
        {
          diagram: {
            example: 'win-black-aftereven',
            caption:
              'Die geraden Felder b2–e2 gehören dem zweiten Spieler; sie zu schließen gewinnt die Partie.',
          },
        },
      ],
    },

    {
      id: 'gm',
      h2: '10 · Spielen wie ein Meister',
      blocks: [
        {p: 'Eine Checkliste, die du ans echte Brett mitnehmen kannst:'},
        {
          ol: [
            '<strong>Eröffne in der Mitte.</strong> Der ganze Sieg des Startspielers baut auf der mittleren Spalte auf, die die meisten Viererreihen berührt.',
            '<strong>Zähle ungerade gegen gerade.</strong> Als Startspieler jage ungerade Drohungen, als zweiter Spieler gerade. Wer die passende Sorte Drohung in einer freien Spalte hält, besitzt das Endspiel.',
            '<strong>In der Verteidigung nimm die geraden Felder.</strong> Direkt über dem gegnerischen Stein zu antworten beansprucht ein gerades Feld, ohne etwas zu kosten.',
            '<strong>Denke in Reihen statt in Zügen.</strong> Frage, welche Viererreihen dein Gegner noch bauen kann und ob du auf jede eine Antwort hast. Diese Frage <em>ist</em> die Paarung.',
            '<strong>Übe mit offenem Plan.</strong> Wechsle in den Lernmodus und nutze „Den Plan zeigen“, bis du vorhersagen kannst, was er sagen wird, bevor du ihn öffnest.',
            '<strong>Dann übe ohne ihn.</strong> Die Übungen teilen dir eine Stellung aus, nehmen deine Antwort entgegen und sagen dir, was der Solver gesehen hat und du nicht.',
          ],
        },
        {
          cta: [
            {to: '/practice', variant: 'accent', label: 'Mit den Übungen beginnen →'},
            {to: '/', variant: 'default', label: 'Das Brett öffnen'},
          ],
        },
      ],
    },
  ],

  footer:
    'Die Theorie hier stammt aus Victor Allis’ <em>A Knowledge-based Approach of Connect-Four</em> (1988), der perfekte Solver von Pascal Pons. Jede Paarung auf dieser Seite wird live erzeugt und gegen diesen Solver validiert.',
};
