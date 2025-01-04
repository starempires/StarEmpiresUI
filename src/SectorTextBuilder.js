  import React from 'react';
  import * as Constants from './Constants';

  export const buildSectorText = (turnData, sectorData) => {
     var text = "";
     if (sectorData) {
         text += buildCoordsText(sectorData);
         var objectsText = ""
         objectsText += buildWorldText(sectorData);
         objectsText += buildPortalText(sectorData);
         objectsText += buildStormText(sectorData);
         objectsText += buildShipsText(sectorData, turnData);
         text += objectsText.length > 0 ? objectsText : "\nempty space";
     }
     return text;
  }

const buildCoordsText = (sectorData) =>
  {
     var text = "Sector (" + sectorData.oblique + "," + sectorData.y + ")";
     if (sectorData.status == Constants.SCAN_STATUS_TYPE.Stale) {
         text += "[last scanned turn " + sectorData.lastTurnScanned + "]";
     }
     return text;
  }

 const buildStormText = (sectorData, turnData) =>
  {
        var text = "";
        if (sectorData.storm) {
            if (sectorData.status != Constants.SCAN_STATUS_TYPE.Unknown) {
                text = "\n" + (sectorData.storm.intensity > 0 ? ("ion storm (intensity " + sectorData.storm.intensity + ")") : "nebula");
            }
        }
        return text;
  }

  const buildPortalText = (sectorData, turnData) =>
  {
      var text = "";
      const portal = sectorData.portal;
      if (portal) {
          text = "\n" + portal.name;
          var exits = "";
          switch (sectorData.status) {
              case Constants.SCAN_STATUS_TYPE.Scanned:
              case Constants.SCAN_STATUS_TYPE.Visible:
                   text += portal.collapsed ? " (collapsed)" : "";
                   break;
              default:
                   break;
          }
          if (portal.navDataKnown && portal.exits) {
              text += ", exits: " + portal.exits.sort().join();
          }
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

const buildShipsText = (sectorData, turnData) => {
      var text = "";
      if (sectorData.ships) {
          var empiresPresent = Object.keys(sectorData.ships);
          empiresPresent.sort();
          text += "\n";
          for (var i = 0; i < empiresPresent.length; i++) {
               var empireName = empiresPresent[i];
               var empireShips = sectorData.ships[empireName];
               text += empireName + ": " + empireShips.count + " ship" + (empireShips.count > 1 ? "s" : "") +
                      ", " + empireShips.tonnage + " tonne" + (empireShips.tonnage > 1 ? "s": "") + "\n";
          }
      }
      return text;
  }