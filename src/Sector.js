import React, { Component } from 'react';
import Konva from 'konva';
import { Group } from 'react-konva';
import Coords from './Coords';
import World from './World';
import Portal from './Portal';
import Border from './Border';
import Hex from './Hex';
import ShipDots from './ShipDots';
import * as Constants from './Constants';

class Sector extends Component {

  constructor(props) {
     super(props);
     var turnData = this.props.turnData;
     var [xpos, ypos] = Constants.coordsToPosition(turnData.radius, this.props.oblique, this.props.y);
     var sectorKey = (this.props.oblique < 0 ? "n" : "") + Math.abs(this.props.oblique) + "_" + (this.props.y < 0 ? "n" : "") + Math.abs(this.props.y);
//     console.log("construct sectior " + this.props.oblique + ", " + this.props.y);
     var sectorData = turnData.sectors[sectorKey];
     const scanColor = Constants.SECTOR_STATUS_COLOR_MAP.get(sectorData.scanStatus);
//    console.log("Sector lookup color " + this.props.scanStatus + " scan color = " + scanColor);
//    console.log("Sector " + scanStatus === Constants.SECTOR_STATUS_TYPE.Visible);
     const coordsText = sectorData.oblique + "," + sectorData.y;
     const coordsColor = Constants.COORDS_STATUS_COLOR_MAP.get(sectorData.scanStatus);
     var borderType = Constants.BORDER_TYPE.Regular;

     if (sectorData.storm) {
         borderType = sectorData.storm.intensity > 0 ? Constants.BORDER_TYPE.Storm : Constants.BORDER_TYPE.Nebula;
     }

     var worldColor;
     var prohibition;
     const world = sectorData.world;
     if (world) {
           if (world.owner) {
               worldColor = this.props.turnData.colors[world.owner];
               prohibition = world.prohibition;
           }
           else {
               worldColor = this.props.turnData.colors["unowned"];
           }
     }

     const portal = sectorData.portal

     var shipDotColors;
     if (sectorData.ships) {
         var empiresPresent = Object.keys(sectorData.ships);
         if (world) {
             var index = empiresPresent.indexOf(world.owner);
               if (index > -1) {
                   empiresPresent.splice(index, 1);
               }
               shipDotColors = empiresPresent.map((e) => turnData.colors[e]);
          }
           console.log(coordsText + ", empireColors = " + shipDotColors);
     }

     const hoverText = this.buildHoverText(turnData, sectorData);

//     console.log(coordsText + " border = " + borderType);
     this.state = { scanColor: scanColor, coordsText: coordsText, borderType: borderType, coordsColor: coordsColor,
                    world: world, portal: portal, shipDotColors: shipDotColors,
                    xpos: xpos, ypos: ypos,
                    sectorData: sectorData,
                    hoverText: hoverText,
                    unidentifiedShips: sectorData.unidentifiedShipCount ? sectorData.unidentifiedShipCount : 0,
                    worldColor: worldColor, prohibition: prohibition};
//    console.log("Sector.render props = " + JSON.stringify(this.props));
//    console.log("Sector.render state = " + JSON.stringify(this.state));
  }

  buildHoverText(turnData, sectorData) {
     var text = "";
     text += this.buildCoordsText(sectorData) + "\n";
     if (sectorData.world) {
         text += this.buildWorldText(sectorData) + "\n";
     }
     else if (sectorData.portal) {
         text += this.buildPortalText(sectorData) + "\n";
     }
     else {
         text += "empty space\n";
     }
     text += this.buildStormText(sectorData);
     text += this.buildShipsText(sectorData, turnData);
     return text;
  }

  buildCoordsText(sectorData)
  {
     var text = "(" + sectorData.oblique + "," + sectorData.y + ")";
     if (sectorData.scanStatus == Constants.SCAN_STATUS_TYPE.Stale) {
         text += "[last scanned turn " + sectorData.lastTurnScanned + "]";
     }
     return text;
  }

  buildStormText(sectorData, turnData)
  {
        var text = "";
        if (sectorData.storm) {
            if (sectorData.scanStatus != Constants.SCAN_STATUS_TYPE.Unknown) {
                text = sectorData.storm.intensity > 0 ? ("ion storm (intensity " + sectorData.storm.intensity + ")") : "nebula";
            }
        }
        return text;
  }

  buildPortalText(sectorData, turnData)
  {
      var text = "";
      const portal = sectorData.portal;
      if (portal) {
          text = portal.name;
          var exits = "";
          switch (sectorData.scanStatus) {
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

  buildWorldText(sectorData, turnData)
  {
      var text = "";
      const world = sectorData.world;
      if (world) {
          const owner = world.owner ? world.owner : "unowned";
          const homeworld = world.homeworld ? " homeworld" : "";

          switch (sectorData.scanStatus) {
              case Constants.SCAN_STATUS_TYPE.Stale:
                  text = world.name + ", production " +
                         " [" + owner + "]" +
                         ", production " + world.production;
                  break;
              case Constants.SCAN_STATUS_TYPE.Scanned:
                   text = world.name + " [" + owner + homeworld + "]" +
                          ", production " + world.production;
                   break;
              case Constants.SCAN_STATUS_TYPE.Visible:
                   text = world.name + " [" + owner + homeworld + "]" +
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

  buildShipsText(sectorData, turnData) {
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

    handleMouseEnter = e => {
        const mousePosition = e.target.getStage().getPointerPosition();
//        console.log("mouse enter " + mousePosition.x);
        this.props.onMouseEnter(mousePosition.x, mousePosition.y, this.state.hoverText);
      }

      handleMouseMove = e => {
        const mousePosition = e.target.getStage().getPointerPosition();
         this.props.onMouseMove(mousePosition.x, mousePosition.y);
      }

      handleMouseLeave = e => {
        this.props.onMouseLeave(e);
      }

      handleClick = e => {
        this.props.onClick(e, this.state.sectorData);
      }

      handleContextMenu = e => {
        this.props.onContextMenu(e, this.state.sectorData);
      }

  render() {
    const xpos = this.state.xpos;
    const ypos = this.state.ypos;
//    console.log(this.state.coordsText + " state = " + JSON.stringify(this.state));

    return (
        <Group
               onClick={this.handleClick}
               onContextMenu={this.handleContextMenu}
               onMouseEnter={this.handleMouseEnter}
               onMouseLeave={this.handleMouseLeave}
               onMouseMove={this.handleMouseMove}
        >
              <Hex color={this.state.scanColor} x={xpos} y={ypos} />
              <Coords x={xpos} y={ypos} text={this.state.coordsText} color={this.state.coordsColor}/>
              {this.state.world && <World x={xpos} y={ypos}
                   color={this.state.worldColor}
                   production={this.state.world.production}
                   prohibition={this.state.prohibition}
                   border={this.state.world.homeworld}
                   /> }
              {this.state.portal && <Portal x={xpos} y={ypos} collapsed={this.state.portal.collapsed}/> }
              <ShipDots x={xpos} y={ypos} unidentifiedShips={this.state.unidentifiedShips}
                        shipDotColors={this.state.shipDotColors}
                      />
              <Border x={xpos} y={ypos} type={this.state.borderType} />
        </Group>
    );
  }
}

export default Sector;