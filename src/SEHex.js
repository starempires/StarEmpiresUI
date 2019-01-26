import React from 'react';
import {
  Shape
} from 'react-konva';

const SQRT_THREE = Math.sqrt(3);

export class Hex extends React.Component {
  constructor(props) {
    super(props);
    this.X_OFFSET = 0;
    this.Y_OFFSET = 0;
    this.STROKE_WIDTH = 1;
    this.RADIUS = 50;
    this.SHORT_SIDE = this.RADIUS / 2;
    this.LONG_SIDE = SQRT_THREE * this.RADIUS / 2;

    var galaxy = props.galaxy;
    var hexid = props.hexid;
    console.log("Creating hex " + hexid);
    var sector = galaxy.sectors[hexid];
    //console.log("radius, short, long = " + this.RADIUS + "," + this.SHORT_SIDE + "," + this.LONG_SIDE);
    this.state = {
      row: props.row,
      column: props.column,
      x: (this.getXCount(props.column)) * this.RADIUS + ((props.column % 2) * this.SHORT_SIDE) + this.X_OFFSET,
      y: ((props.row + 1) * this.LONG_SIDE) + this.Y_OFFSET,

      galaxy: galaxy,
      hexid: hexid,
      sector: sector,
    };
    //console.log("(" +JSON.stringify(this.state.coord) + ") -> row,column = " +
    //             this.state.row+"," + this.state.column + " -> x,y= " +
    //             this.state.x+"," + this.state.y);
    // this.handleClick = this.handleClick.bind(this);
    // this.handleMouseMove = this.handleMouseMove.bind(this);
    // this.handleMouseOut = this.handleMouseOut.bind(this);
  }

  getXCount(column) {
    if (column < 2) {
      return column + 1;
    } else {
      return this.getXCount(column - 2) + 3;
    }
  }

  handleHexMouseMove(event) {
    var x = this.state.x;
    var y = this.state.y;
    this.refs.tooltip.position({
      x: x + 5,
      y: y + 5
    });
    this.refs.tooltip.text(JSON.stringify(this.state.coord));
    console.log(JSON.stringify(this.refs.tooltip));
    this.refs.tooltip.show();
    //tooltipLayer.batchDraw();
  }

  handleClick = (e) => {
    var sector = e.target.attrs.sector;
    var coordText = sector.oblique + "," + sector.y;
    console.log("hex click on " + coordText);
  };

  componentDidMount() {
    console.log("hex did mount");
  }

  sceneFunc(context) {

    var shortSide = this.attrs.shortSide;
    var longSide = this.attrs.longSide;
    var radius = this.attrs.radius;
    var sector = this.attrs.sector;
    var galaxy = this.attrs.galaxy;
    var colors = galaxy.colors;
    var scanStatus = sector.scanStatus;
    var bgColor = colors[scanStatus];
    var textColor = '#ffffff';
    if (scanStatus === 'visible' || scanStatus === 'scanned') {
        textColor = '#000000';
    }
    // console.log("x,y= " + x + "," + y);
    // console.log("keys = " + Object.keys(this.attrs));
 
    
    // draw hex
    context.beginPath();
    context.strokeStyle = '#000000';
    context.fillStyle = bgColor;
    context.moveTo(-shortSide, -longSide);
    context.lineTo(shortSide, -longSide);
    context.lineTo(radius, 0);
    context.lineTo(shortSide, longSide);
    context.lineTo(-shortSide, longSide);
    context.lineTo(-radius, 0);
    context.lineTo(-shortSide, -longSide);
    context.closePath();
    context.stroke();
    context.fill();
    
    // draw coords
    var coordText = sector.oblique + "," + sector.y;
    context.font = '14px Calibri';
    context.textAlign = 'center';
    context.fillStyle = textColor;
    context.fillText(coordText, 0, this.attrs.hexTextY);

    // draw world
    var worldName = sector.world;
    if (worldName) {
      var world = galaxy.worlds[worldName];

      // draw blockade/interdiction
      context.beginPath();
      context.strokeStyle = colors['prohibition'];
      if (world.prohibition !== undefined) {
          context.moveTo(-shortSide, -shortSide);
          context.lineTo(shortSide, shortSide);
          context.stroke();
      }
      if (world.prohibition === 'interdicted') {
          context.moveTo(shortSide, -shortSide);
          context.lineTo(-shortSide, shortSide);
          context.stroke();
      }       
      context.closePath();      

      var owner = world.owner;
      var worldcolor;
      if (scanStatus === 'stale') {
          worldcolor = colors['staleworld'];
      }
      else if (owner === undefined) {
          worldcolor = colors['unowned'];
      }
      else {
          worldcolor = colors[owner];
      }

      var size = shortSide/2;
      context.beginPath();
      context.fillStyle = worldcolor;
      context.strokeStyle = worldcolor;
      context.arc(0, 0, size, 0, 2 * Math.PI, false);
      context.fill();
      context.stroke();
      context.closePath();
     
      // draw production
      context.textAlign = 'center';
      context.beginPath();
      context.font = '14px Calibri';
      context.strokeStyle = colors['text'];
      context.strokeText(world.production, 0, 5);
      context.closePath();      
    }

    var portals = sector.portals;
    if (portals) {
      // console.log("hex " + sector.oblique + "," + sector.y + " portals " + Object.values(portals));
      // if any portal collapsed, draw a smaller icon, else draw normal size
      var angleValue = 1;
      var portalColor = colors['portal'];
      Object.values(portals).forEach((pname) => {
        var portal = galaxy.portals[pname];
        var collapsed = portal.collapsed;
        if (collapsed) {
          portalColor = colors['collapsed'];
          angleValue = 0.3;
        }
      });
      context.beginPath();
      context.strokeStyle = portalColor;
      context.moveTo(0, 0);
      for (var i = 0; i < 150; i++) {
        var angle = 0.1 * i;
        var px = (angleValue * angle) * Math.cos(angle);
        var py = (angleValue * angle) * Math.sin(angle);
        context.lineTo(px, py);
      }
      context.stroke();
      context.closePath();
    }

    // draw storm
    var storms = sector.storms;
    if (storms) {
      context.beginPath();
      context.strokeStyle = colors['storm'];
      context.moveTo(-shortSide + 1, -longSide + 1);
      context.lineTo(shortSide - 1, -longSide + 1);
      context.lineTo(radius - 1, 0);
      context.lineTo(shortSide - 1, longSide - 1);
      context.lineTo(-shortSide + 1, longSide - 1);
      context.lineTo(-radius + 1, 0);
      context.lineTo(-shortSide + 1, -longSide + 1);
      context.stroke();
      context.closePath();
    }

    //seem to need this at the end to get colors above to show
    // context.beginPath();
    // context.strokeStyle = '#000000';
    // context.stroke();
    // context.closePath();

    // draw ship dots
    if (scanStatus === 'visible') {
      var ships = sector.ships;
      if (ships) {
        var empires = Object.keys(ships).sort();
        var num = empires.length;
        console.log("ships %o %d", empires, num);
        var maxdots = 6;
        var sx = -shortSide;
        var sy = shortSide + 2;
        var h = 6,
          w = 6;
        var gap = 3;
        for (i = 0; i < maxdots; i++) {
          if (i === maxdots - 1 && maxdots < num) {
            context.beginPath();
            context.strokeStyle = colors['text'];
            context.moveTo(sx, sy + h / 2);
            context.lineTo(sx + w, sy + h / 2);
            context.moveTo(sx + w / 2, sy);
            context.lineTo(sx + w / 2, sy + h);
            context.stroke();
            context.closePath();
          } else {
            var e = empires[i];
            context.fillStyle = colors[e]
            context.fillRect(sx, sy, w, h);
            sx += w + gap;
          }
        }
      }
    }

    context.fillStrokeShape(this);
  }

  render() {
    var x = this.state.x;
    var y = this.state.y;
    var hexText = this.state.coord;
    var hexTextY = -this.RADIUS * 0.5; // this would be better based on the height of the font
    return ( <Shape 
      x = { x }
      y = { y }
      sector = { this.state.sector }
      galaxy = { this.state.galaxy }
      hexText = { hexText }
      hexTextY = { hexTextY }
      shortSide = { this.SHORT_SIDE }
      longSide = { this.LONG_SIDE }
      radius = { this.RADIUS }
      sceneFunc = { this.sceneFunc }
      // stroke = { 'black' }
      // strokeWidth = { this.STROKE_WIDTH }
      onClick = { this.handleClick }
      />
    );
  }
}