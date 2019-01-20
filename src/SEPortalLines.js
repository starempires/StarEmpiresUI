import React from 'react';
import { Line } from 'react-konva';

const SQRT_THREE = Math.sqrt(3);

export class PortalLines extends React.Component {

   constructor(props) {
    super(props);
    console.log("PortalLines constructor");
    this.RADIUS = 30;
    this.SHORT_SIDE = this.RADIUS / 2;
    this.LONG_SIDE = SQRT_THREE * this.RADIUS /2;
    this.X_OFFSET = 0;
    this.Y_OFFSET = 0
    this.state = {
      galaxy: props.galaxy,
      lines: null,
      listening: false
    };
  } 
 
  componentDidMount() {
    var portals = this.state.galaxy.portals;
    var sectors = this.state.galaxy.sectors;
    var connections = {};
    var lines = [];
    var i, e;
    // build map of connections among all portals
    for (var portal in portals) {
      console.log("portal " + portal);
      var p = portals[portal];
      var sector = p.sector;
      for (i = 0; i < p.entrances.length; i++) {
        e = p.entrances[i];
        console.log("entrance " + e);
        connections[sector] = portals[e].sector;
      }
      for (i = 0; i < p.exits.length; i++) {
        e = p.exits[i];
        console.log("exit " + e);
        connections[portals[e].sector] = sector;
      }
    }

    // draw line for each connection
    var key = 0;
    for (var k in connections) {
      var points = [];
      var v = connections[k];
      console.log("connections " + k + " -> " + v);
      var from = sectors[k];
      var to = sectors[v];
      console.log("from sector = " + from);
      var row = from.row;
      var col = from.column;

      var x1 = (this.getXCount(col)) * this.RADIUS + ((col % 2) * this.SHORT_SIDE) + this.X_OFFSET;
      var y1 = ((row + 1) * this.LONG_SIDE) + this.Y_OFFSET;
      console.log("from sector x,y = " + x1 + "," + y1);

      row = to.row;
      col = to.column;
      var x2 = (this.getXCount(col)) * this.RADIUS + ((col % 2) * this.SHORT_SIDE) + this.X_OFFSET;
      var y2 = ((row + 1) * this.LONG_SIDE) + this.Y_OFFSET;
      points.push(x1, y1, x2, y2);
      console.log("portal line points = " + points);
      var line = < Line
         points = { points }
         stroke = { 'red' }
         strokeWidth = { 2 }
         key = { key++ }
        />  ;
      lines.push(line);
    }
    this.setState({
      lines: lines
    });
  }
 
  getXCount(column) {
    if (column < 2) {
      return column + 1;
    } else {
      return this.getXCount(column - 2) + 3;
    }
  }
 
  render() {
    return (
      <React.Fragment>{this.state.lines}</React.Fragment>
    );
  }
}
