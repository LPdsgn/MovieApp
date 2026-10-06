# Libreria di componenti e motore di stile per il port React Native

- **Data:** 2026-10-05
- **Contesto:** port di MoovieFinder su Expo, vedi [valutazione-porting.md](valutazione-porting.md). Le esigenze di UI vengono da [analisi-codebase.md](analisi-codebase.md).
- **Metodo:** documentazione ufficiale, README e registry su GitHub, metadati npm (versioni e date), tutto consultato in questa data.
- **Limiti:**
  - le stelle GitHub sono solo un indicatore approssimativo di adozione;
  - le prestazioni dichiarate dai produttori non sono verificate;
  - non è stato costruito un prototipo.

## Verdetto

**Uniwind (piano gratuito) + React Native Reusables, nella variante per Uniwind.** Come piano B, NativeWind v4 + React Native Reusables.

Per quest'app la libreria di componenti pesa poco. La parte che la distingue (mazzo di carte, bottoni skeuomorfici, animazione Pulse, transizioni) va scritta comunque a mano con Reanimated. I componenti standard che servono sono 8-10.

## 1. React Native Reusables vs gluestack-ui

|                   | React Native Reusables                                                                                                 | gluestack-ui                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Modello           | shadcn/ui per React Native: una CLI copia i componenti nel tuo progetto e il codice diventa tuo                        | Uguale: CLI e copia-incolla                                                                                       |
| Base              | `@rn-primitives`, un equivalente di Radix con accessibilità integrata                                                  | Componenti propri, più il sistema di varianti `tva()`                                                             |
| Motori di stile   | **Due varianti parallele, NativeWind v4 e Uniwind**, con gli stessi 32 componenti                                      | NativeWind v4, NativeWind v5 (il motore di punta della v5) e Uniwind*                                             |
| Componenti        | 32. Mancano toast, actionsheet e bottom sheet                                                                          | 40+, con actionsheet, toast e menu                                                                                |
| Stabilità         | CLI 0.7, primitives 1.4/1.5. Gli ultimi commit (luglio e settembre 2026) riguardano accessibilità, Reduce Motion e web | **3 major in meno di un anno**: v3 alpha (08/2025), v4 alpha (01/2026), v5 (06/2026). Prima ancora era NativeBase |
| Licenza e modello | MIT, ~8,7k ★                                                                                                           | MIT, ~5,3k ★, GeekyAnts con prodotti Pro e template a pagamento                                                   |

\* Le fonti di gluestack non sono coerenti fra loro. Il README della v5 cita NativeWind v5. Il documento interno `docs/uniwind-support.md` descrive componenti per NativeWind v4 e Uniwind generati da un unico sorgente.

Componenti di React Native Reusables (stessa lista per NativeWind e Uniwind): accordion, alert-dialog, alert, aspect-ratio, avatar, badge, button, card, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, icon, input, label, menubar, native-only-animated-view, popover, progress, radio-group, select, separator, skeleton, switch, tabs, text, textarea, toggle-group, toggle, tooltip.

**Per MoovieFinder vince React Native Reusables.** Tutto quello che serve c'è:

| Parte dell'app             | Componente                           |
| -------------------------- | ------------------------------------ |
| I 3 dialog di Storage      | `alert-dialog`                       |
| Filtro dello storico       | `dropdown-menu`                      |
| Piattaforme e impostazioni | `checkbox`, `toggle-group`, `switch` |
| Generi                     | `badge`                              |
| Foto del cast              | `avatar`                             |
| Caricamenti                | `skeleton`                           |
| About                      | `card`, `button`                     |
| Ricerca futura             | `input`                              |

Inoltre l'app attuale ha **zero accessibilità**, e queste primitives la portano già pronta. gluestack conviene solo se ti servono actionsheet o toast già fatti, ma il suo ritmo di rotture di compatibilità è un rischio.

## 2. NativeWind v4 vs NativeWind v5 vs Uniwind

|           | NativeWind v4                                                                 | NativeWind v5                                                                                    | Uniwind                                                                                                                     |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Tailwind  | 3                                                                             | 4                                                                                                | 4                                                                                                                           |
| Stato     | **Stabile**: 4.2.7, patch del 14/09/2026                                      | **RC0** del 13/09/2026, "not intended for production use". In preview dal 24/09/2025             | **Stabile**: 1.12.2 del 05/10/2026, release ogni 2-4 settimane                                                              |
| Requisiti | Preset Babel                                                                  | RN ≥ 0.81, Expo SDK ≥ 54, Reanimated 4, versioni pinnate (`react-native-css` RC, `lightningcss`) | Solo Tailwind 4 e config Metro. Niente preset Babel, funziona anche in Expo Go                                              |
| Futuro    | Verrà sostituito dalla v5, e la migrazione toglie `cssInterop` e `remapProps` | È il futuro di NativeWind, ma non ancora                                                         | Ha una guida di migrazione da NativeWind                                                                                    |
| Costo     | MIT                                                                           | MIT                                                                                              | MIT gratuito. Il Pro costa da 99 $/postazione/anno (zero re-render, Reanimated via `className`, transizioni di tema native) |
| Chi lo fa | Il team NativeWind (~8,1k ★, 59 issue aperte)                                 | Lo stesso                                                                                        | Il team di Unistyles (fra i contributor c'è jpudysz). ~1,7k ★, 6 issue aperte                                               |

In sintesi:

- **NativeWind v4:** è la scelta più collaudata, ma su un progetto nuovo a ottobre 2026 significa partire su Tailwind 3 con una migrazione già in programma.
- **NativeWind v5:** il suo stesso team lo sconsiglia in produzione. Dopo un anno di preview i tempi per la versione stabile non sono prevedibili.
- **Uniwind:** è stabile, è su Tailwind 4, è più semplice da configurare ed entrambe le librerie di componenti lo supportano. Il "2× più veloce di NativeWind" lo dichiarano loro: non è verificato. Il Pro non serve a quest'app:
  - le animazioni del mazzo si scrivono direttamente con Reanimated;
  - l'app ha solo il tema scuro, quindi le transizioni di tema sono inutili.

  Il rischio è la community più piccola: si trovano meno risposte già pronte.

## Prossimo passo consigliato

Un giorno di prova tecnica: Expo + Uniwind + i 3-4 componenti di React Native Reusables più una carta che si muove con lo swipe. Se qualcosa non torna, passare a NativeWind v4 costa poco, perché React Native Reusables ha lo stesso codice in entrambe le varianti.

## Fonti

- [React Native Reusables (GitHub)](https://github.com/founded-labs/react-native-reusables)
- [gluestack-ui (GitHub)](https://github.com/gluestack/gluestack-ui) · [gluestack.io](https://gluestack.io/)
- [NativeWind v5: installazione e requisiti](https://www.nativewind.dev/v5/getting-started/installation) · [NativeWind v5](https://www.nativewind.dev/v5/) · [NativeWind (GitHub)](https://github.com/nativewind/nativewind)
- [Uniwind: documentazione](https://docs.uniwind.dev/) · [Uniwind: quickstart](https://docs.uniwind.dev/quickstart.md) · [Uniwind: prezzi](https://uniwind.dev/pricing) · [Uniwind (GitHub)](https://github.com/uni-stack/uniwind)
