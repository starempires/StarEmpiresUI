  import * as Constants from '../../Constants';

  export const buildHoverText = (sectorData: any): string => {
      let text = "";
      if (sectorData) {
          text += buildCoordsText(sectorData);
          let objectsText = ""
          objectsText += buildWorldText(sectorData);
          objectsText += buildPortalHoverText(sectorData);
          objectsText += buildStormHoverText(sectorData);
          objectsText += buildShipsHoverText(sectorData);
          if (sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
              text += objectsText.length > 0 ? objectsText : "\nempty space";
          }
      }
      return text;
  }

  export const buildSectorText = (turnData: any, sectorData: any): string => {
     let text = "";
     if (sectorData) {
         text += "Sector " + buildCoordsText(sectorData);
         let objectsText = ""
         objectsText += buildWorldText(sectorData);
         objectsText += buildPortalText(sectorData);
         objectsText += buildStormText(sectorData);
         objectsText += buildShipsText(sectorData, turnData);
         if (sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
             text += objectsText.length > 0 ? objectsText : "\nempty space";
         }
     }
     return text;
  }

const buildCoordsText = (sectorData: any): string =>
  {
     let text = "(" + sectorData.oblique + "," + sectorData.y + ")";
     if (sectorData.status === Constants.SCAN_STATUS_TYPE.Stale) {
         if (sectorData.lastTurnScanned) {
             text += " [last scanned turn " + sectorData.lastTurnScanned + "]";
         }
         else {
             text += " [never scanned]";
         }
     }
     return text;
  }

 const buildStormText = (sectorData: any): string =>
  {
        let text = "";
        if (sectorData.storms) {
            if (sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
                sectorData.storms.forEach((storm: any) => {
                    text += "\n" + storm.name + " (" + (storm.rating > 0 ? ("intensity " + storm.rating + " ion storm") : "nebula") + ")";
                });
            }
        }
        return text;
  }

 const buildStormHoverText = (sectorData: any): string =>
  {
        let text = "";
        if (sectorData.storms) {
            if (sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
                const numStorms = sectorData.storms.length;
                if (numStorms > 1) {
                    let intensity = 0;
                    sectorData.storms.forEach((storm: any) => {
                        intensity += storm.rating;
                    });
                    text += "\n" + numStorms + " storms (total intensity " + intensity + ")";
                }
                else {
                    const storm = sectorData.storms[0];
                    text += "\n" + storm.name + " (" + (storm.rating > 0 ? ("intensity " + storm.rating + " ion storm") : "nebula") + ")";
                }
            }
        }
        return text;
  }

  const buildPortalHoverText = (sectorData: any): string =>
  {
      let text = "";
      const portals = sectorData.portals;
      if (portals) {
          portals.forEach((portal:any) => {
              text = "\n" + portal.name;
              switch (sectorData.status) {
                  case Constants.SCAN_STATUS_TYPE.Scanned:
                  case Constants.SCAN_STATUS_TYPE.Visible:
                       text += portal.collapsed ? " (collapsed)" : "";
                       break;
                  default:
                       break;
              }
              if (portal.navDataKnown) {
                  let connectionText = "";
                  if (portal.entrances?.length > 0) {
                      connectionText += plural(portal.entrances.length, "entrance");
                  }
                  if (connectionText.length > 0) {
                      connectionText += ", ";
                  }
                  if (portal.exits?.length > 0) {
                      connectionText += plural(portal.exits.length, "exit");
                  }
                  text += ": " + connectionText;
              }
          });
      }
      return text;
  }

  const buildPortalText = (sectorData: any): string =>
  {
      let text = "";
      const portals = sectorData.portals;
      if (portals) {
          portals.forEach((portal:any) => {
              text = "\n" + portal.name;
              switch (sectorData.status) {
                  case Constants.SCAN_STATUS_TYPE.Scanned:
                  case Constants.SCAN_STATUS_TYPE.Visible:
                       text += portal.collapsed ? " (collapsed)" : "";
                       break;
                  default:
                       break;
              }
              if (portal.navDataKnown) {
                  if (portal.entrances?.length > 0) {
                      text += "\n entrances: " + portal.entrances.sort().join(", ");
                  }
                  if (portal.exits?.length > 0) {
                      text += "\n exits: " + portal.exits.sort().join(", ");
                  }
              }
          });
      }
      return text;
  }

  const buildWorldText = (sectorData: any): string =>
  {
      let text = "";
      const world = sectorData.world;
      if (world) {
          const owner = world.owner ? world.owner : "unowned";
          const homeworld = world.homeworld ? " homeworld" : "";

          switch (sectorData.status) {
              case Constants.SCAN_STATUS_TYPE.Stale:
                   text = "\n" + world.name + ", production " +
                         " [" + owner + "]" +
                         ", production " + world.production;
                   break;
              case Constants.SCAN_STATUS_TYPE.Scanned:
                   text = "\n" + world.name + " [" + owner + homeworld + "]" +
                          ", production " + world.production;
                   break;
              case Constants.SCAN_STATUS_TYPE.Visible:
                   text = "\n" + world.name + " [" + owner + homeworld + "]" +
                          ", production " + world.production +
                          (world.stockpile ? ", stockpile " + world.stockpile : "") +
                          (world.prohibition ? ", " + world.prohibition : "");
                   break;
              default:
                   break;
          }
      }
      return text;
  }

  const plural = (count: number, noun: string): string => {
      return count + " " + noun + (count > 1 ? "s" : "");
  }

const formatShipStats = (ship: any, turnData: any): string => {
   let text = "";
   const foundShip = turnData.shipClasses.find((shipClass:any) => shipClass.name === ship.shipClass);
   if (foundShip) {
       text += "  ";
       if (ship.carrier != null) {
           text += " +";
       }
       text += ship.name + " (" + ship.shipClass + "/" + ship.hull +
                            ", g/e/s " +
                            (ship.opGuns ? ship.opGuns : 0) + "/" +
                            (ship.opEngines ? ship.opEngines: 0) + "/" +
                            (ship.opScan ? ship.opScan : 0) +
                            ", dp " + ship.dpRemaining + "/" + ship.dp +
                            ", OR " + Math.round(ship.opRating * 100) + "%" +
                            ", r " + (ship.racks ? ship.emptyRacks + "/" + ship.racks : "0/0") +
                            ", t " + ship.tonnage +
                            ")\n";
   }
   else {
       text += "  " + ship.name + " (" + ship.shipClass +
                            "/" + ship.hull + " " +
                            plural(ship.tonnage, "tonne") + ")\n";
   }
   return text;
}

const sortShips = (ships: any[]): any[] => {
    const carrierMap: { [carrierName: string]: any[] } = {};

    const independentShips: any[] = [];

    // Group ships by whether they're loaded into a carrier
    Object.values(ships).forEach((ship) => {
        if (ship.carrier) {
            if (!carrierMap[ship.carrier]) {
                carrierMap[ship.carrier] = [];
            }
            carrierMap[ship.carrier].push(ship);
        } else {
            independentShips.push(ship);
        }
    });

    // Sort independent ships alphabetically
    independentShips.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    // Sort loaded ships alphabetically within each carrier group
    Object.values(carrierMap).forEach(group =>
        group.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        )
    );

    // Build final list: each carrier followed by its loaded ships
    const result: any[] = [];
    independentShips.forEach((ship) => {
        result.push(ship);
        if (carrierMap[ship.name]) {
            result.push(...carrierMap[ship.name]);
        }
    });

    return result;
};
const buildShipsText = (sectorData: any, turnData: any): string => {
      let text = "";
      if (sectorData.ships) {
          let empiresPresent = Object.keys(sectorData.ships);
          empiresPresent.sort();
          text += "\n";
          empiresPresent.forEach((e) => {
               text += e + " ships:\n";
               let empireShips = sectorData.ships[e].ships;
               let sortedShips = sortShips(empireShips);
               for (const ship of sortedShips) {
                    text += formatShipStats(ship, turnData);
               };
          });
      }
      if (sectorData.unidentifiedShipCount > 0) {
          text += "\n";
          text += plural(sectorData.unidentifiedShipCount, "unidentified ship") +
                  " (" + plural(sectorData.unidentifiedShipTonnage, "tonne") + ")\n";
      }
      return text;
  }

const buildShipsHoverText = (sectorData: any): string => {
      let text = "";
      if (sectorData.ships) {
          let empiresPresent = Object.keys(sectorData.ships);
          empiresPresent.sort();
          text += "\n";
          empiresPresent.forEach((e) => {
                text += e + ": ";
                text += plural(sectorData.ships[e].count, "ship") + ", " +
                        plural(sectorData.ships[e].tonnage, " tonne") + "\n";
          });
      }
      if (sectorData.unidentifiedShipCount > 0) {
          text += "\n";
          text += plural(sectorData.unidentifiedShipCount, "unidentified ship") +
                  ", " + plural(sectorData.unidentifiedShipTonnage, " tonne") + "\n";
      }
      return text;
  }