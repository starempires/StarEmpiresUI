  import * as Constants from '../../Constants';

  export const buildSectorText = (turnData, sectorData) => {
     var text = "";
     if (sectorData) {
         text += buildCoordsText(sectorData);
         var objectsText = ""
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

const buildCoordsText = (sectorData) =>
  {
     var text = "(" + sectorData.oblique + "," + sectorData.y + ")";
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

 const buildStormText = (sectorData, turnData) =>
  {
        var text = "";
        if (sectorData.storms) {
            if (sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
                sectorData.storms.forEach(storm => {
                    text += "\n" + storm.name + " (" + (storm.rating > 0 ? ("intensity " + storm.rating + " ion storm") : "nebula") + ")";
                });
            }
        }
        return text;
  }

  const buildPortalText = (sectorData, turnData) =>
  {
      var text = "";
      const portals = sectorData.portals;
      if (portals) {
          portals.forEach(portal => {
              text = "\n" + portal.name;
              switch (sectorData.status) {
                  case Constants.SCAN_STATUS_TYPE.Scanned:
                  case Constants.SCAN_STATUS_TYPE.Visible:
                       text += portal.collapsed ? " (collapsed)" : "";
                       break;
                  default:
                       break;
              }
              if (portal.navDataKnown && portal.exits) {
                  text += ", exits: " + portal.exits.sort().join(", ");
              }
          });
      }
      return text;
  }

  const buildWorldText = (sectorData, turnData) =>
  {
      var text = "";
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
const formatShipStats = (ship, turnData) => {
   var text = "";
   if (ship.owner === turnData.name || turnData.shipClasses[ship.shipClass]) {
       text += "  " + ship.name + " (" + ship.shipClass + "/" + ship.hull +
                            ", g/e/s " +
                            (ship.opGuns ? ship.opGuns : 0) + "/" +
                            (ship.opEngines ? ship.opEngines: 0) + "/" +
                            (ship.opScan ? ship.opScan : 0) +
                            ", dp " + ship.dpRemaining + ")\n";
   }
   else {
       text += "  " + ship.name + " (" + ship.shipClass +
                            "/" + ship.hull + " " +
                            ship.tonnage + " tonne" + (ship.tonnage > 1 ? "s": "") + ")\n";
   }
   return text;
}

const buildShipsText = (sectorData, turnData) => {
      var text = "";
      if (sectorData.ships) {
          var empiresPresent = Object.keys(sectorData.ships);
          empiresPresent.sort();
          empiresPresent.filter(item => item !== turnData.name).unshift(turnData.name);
          text += "\n";
          empiresPresent.forEach((e) => {
                text += e + ":\n";
               var empireShips = sectorData.ships[e].ships;
//               console.log( "empireShips = " + JSON.stringify(empireShips));
               for (const shipName in empireShips) {
                    var ship = empireShips[shipName];
                    text += formatShipStats(ship, turnData);
               };
          });
      }
      if (sectorData.unidentifiedShipCount > 0) {
          text += "\n";
          text += sectorData.unidentifiedShipCount + " unidentified ship" + (sectorData.unidentifiedShipCount > 1 ? "s": "") +
                  " (" + sectorData.unidentifiedShipTonnage + " tonne" + (sectorData.unidentifiedShipTonnage > 1 ? "s": "") + ")\n";
      }
      return text;
  }