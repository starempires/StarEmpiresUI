import React, { Component } from 'react';
import { Layer } from 'react-konva';
import Sector from './Sector';
import Connections from './Connections';
import ContextMenu from './ContextMenu';
import InfoHover from './InfoHover';
import * as Constants from '../../Constants';

class Galaxy extends Component {

  constructor(props) {
     super(props);
     console.log(JSON.stringify(props));
     this.handleClick = this.handleClick.bind(this);
     this.handleDoubleClick = this.handleDoubleClick.bind(this);
     this.handleContextMenu = this.handleContextMenu.bind(this);
     this.handleMouseEnter = this.handleMouseEnter.bind(this);
     this.handleMouseLeave = this.handleMouseLeave.bind(this);
     this.handleMouseMove = this.handleMouseMove.bind(this);
//     this.handleClose = this.handleClose.bind(this);
     var sectors = this.buildSectors(props.turnData);
     var connections = this.computeConnections(props.turnData);
//     console.log("connections = " + connections);
     this.state = { contextMenuPosition: null, tooltipVisible: false, tooltipX: 0, tooltipY: 0, tooltipText: "",
                    contextMenuSectorData: null,
                    sectors: sectors, connections: connections };
  }

  computeConnections(turnData, radius)
  {
    var connections = [];
    if (turnData.connections) {
        //console.log("conns " + JSON.stringify(turnData.connections));
        var fromNames = Object.keys(turnData.connections);
        for (var i = 0; i < fromNames.length; i++) {
            var fromName = fromNames[i];
            const toNames = turnData.connections[fromName];
             for (var j = 0; j < toNames.length; j++) {
               var toName = toNames[j];

                var fromSector = turnData.sectors[fromName];
                var toSector = turnData.sectors[toName];
                var [fromx, fromy] = Constants.coordsToPosition(turnData.radius, fromSector.oblique, fromSector.y);
                var [tox, toy] = Constants.coordsToPosition(turnData.radius, toSector.oblique, toSector.y);
                connections.push([fromx, fromy, tox, toy]);
            }
        }
    }
    return connections;
  }

  buildSectors(turnData)
  {
     var sectors = []
     var radius = turnData.radius;
//     console.log("build sectors radius = " + radius);

     var oblique, y;
     var sectorData;
     for (y = radius; y >= 0; y--) {
          for (oblique = y - radius; oblique <= radius; oblique++) {
              const key = Constants.getCoordinateKey(oblique, y);
              sectorData = turnData.sectors[key];
//              console.log("sector " + key + " = " + JSON.stringify(sectorData));
              if (sectorData && sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
                  const sector = <Sector
                                    key={key}
                                    turnData={turnData}
                                    oblique={oblique} y={y}
                                    onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove}
                                    onClick={this.handleClick}
                                    onContextMenu={this.handleContextMenu}
                                />
                  sectors.push(sector);
              }
          }
     }

    for (y = -1; y >= -radius; y--) {
         for (oblique = -radius; oblique <= radius + y; oblique++) {
              const key = Constants.getCoordinateKey(oblique, y);
              sectorData = turnData.sectors[key];
              if (sectorData && sectorData.status !== Constants.SCAN_STATUS_TYPE.Unknown) {
                  const sector = <Sector
                                    key={key}
                                    turnData={turnData}
                                    oblique={oblique} y={y}
                                    onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove}
                                    onClick={this.handleClick}
                                    onContextMenu={this.handleContextMenu}
                                />
                  sectors.push(sector);
              }
         }
    }
    return sectors;
  }

  handleOptionSelected = option => {
    console.log("handleOptionSelected " + option);
    this.setState({ contextMenuPosition: null });
  };

  handleContextMenu = (e, sectorData) => {
  console.log("Enter handleContextMenu " + JSON.stringify(sectorData));
    e.evt.preventDefault(true); // NB!!!! Remember the ***TRUE***
    const mousePosition = e.target.getStage().getPointerPosition();
//    const x = mousePosition.x | 0;
//    const y = mousePosition.y | 0;
//    console.log("right click (button " + e.evt.button + ") = " + JSON.stringify(mousePosition) + ", x=" + x + ", y=" + y);
     this.setState({
            contextMenuPosition: mousePosition,
            contextMenuSectorData: sectorData
        });
  }

  handleClick = (e, sectorData) => {
    if (e.evt.button === 0) {
//        console.log("left click (button " + e.evt.button + ") = " + sectorData.oblique + "," + sectorData.y);
        this.props.onClick(e, sectorData);
//        this.setState({ contextMenuPosition: null, contextMenuSectorData: null });
    }
    else {
        //console.log("handleClick ignored");
    }
    e.cancelBubble = true;
  }

  handleDoubleClick = e => {
//      console.log("handleDoubleClick target = " + JSON.stringify(e) );
//      this.setState({isPaneOpen:true});
      this.props.onDblClick(e);
//      e.cancelBubble = true;
  };

  handleMouseEnter(x, y, coordText, text) {
//    console.log("Called Galaxy.handleMouseEnter state = " + " " + x + "," + y + "  " + text);
        this.setState({tooltipVisible: true, tooltipX: x, tooltipY:y, coordText: coordText, tooltipText: text } );
  }

   handleMouseMove(x, y) {
//  console.log("Enter handleMouseMove");
       if (this.state.tooltipVisible) {
           this.setState({tooltipX: x, tooltipY:y } );
       }
  }

   handleMouseLeave(e) {
    this.setState({tooltipVisible: false} );
  }

//  handleClose() {
//     this.setState({isPaneOpen:false});
//  }

  render() {
//  const width = (this.props.turnData.radius * 10 * Constants.RADIUS) + " px";
    return (
        <Layer onDblClick={this.handleDoubleClick}>
          {this.state.sectors}
          <Connections connections={this.state.connections} />

         <InfoHover
            visible={this.state.tooltipVisible} x={this.state.tooltipX} y={this.state.tooltipY }
             text ={this.state.tooltipText}
            />

          <ContextMenu
                position={this.state.contextMenuPosition}
                onOptionSelected={this.handleOptionSelected}
                sectorData={this.state.contextMenuSectorData}
              />
        </Layer>
    );
  }
}

export default Galaxy;