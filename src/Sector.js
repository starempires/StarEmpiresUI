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
import {buildSectorText} from './SectorTextBuilder';

class Sector extends Component {

  constructor(props) {
     super(props);
     var turnData = this.props.turnData;
     var [xpos, ypos] = Constants.coordsToPosition(turnData.radius, this.props.oblique, this.props.y);
     const sectorKey = Constants.getCoordinateKey(this.props.oblique, this.props.y);
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

//     const hoverText = this.buildHoverText(turnData, sectorData);
     const hoverText = buildSectorText(turnData, sectorData);

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