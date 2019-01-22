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
    this.SIDES = 6;
    this.ROTATION = 30;
    this.STROKE_WIDTH = 1;
    this.RADIUS = 50;
    this.SHORT_SIDE = this.RADIUS / 2;
    this.LONG_SIDE = SQRT_THREE * this.RADIUS / 2;

    var galaxy = props.galaxy;
    var hexid = props.hexid;
    // console.log("Creating hex " + hexid);
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
      colors: this.getColors(props),
      bgUnknownColor: props.bgUnknownColor ? props.bgUnknownColor : '#000000',
      bgStaleColor: props.bgStaleColor ? props.bgStaleColor : '#666666',
      bgScannedColor: props.bgScannedColor ? props.bgScannedColor : '#cccccc',
      bgVisibleColor: props.bgVisibleColor ? props.bgVisibleColor : '#ffffff',

      textUnknownColor: props.textUnknownColor ? props.textUnknownColor : '#ffffff',
      textStaleColor: props.textStaleColor ? props.textStaleColor : '#ffffff',
      textScannedColor: props.textScannedColor ? props.textScannedColor : '#000000',
      textVisibleColor: props.textVisibleColor ? props.textVisibleColor : '#000000',
    };
    //console.log("(" +JSON.stringify(this.state.coord) + ") -> row,column = " +
    //             this.state.row+"," + this.state.column + " -> x,y= " +
    //             this.state.x+"," + this.state.y);

    /*
    console.log("colors = " + Object.entries(this.state.colors.bg));
    console.log("status = " + this.state.scanStatus);
    console.log("status color = " + this.state.colors.bg[this.state.scanStatus]);
    this.state.textColor = this.colors.textc[props.scanStatus];
    this.state.bgColor = this.colors.bgc[props.scanStatus];
    //this.state.textColor = this.getTextColorForScanStatus(props.scanStatus);
   */
    this.state.bgColor = this.state.colors.bg[this.state.scanStatus];
    this.state.textColor = this.state.colors.text[this.state.scanStatus];
    this.handleClick = this.handleClick.bind(this);
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

  getColors(props) {
    var colors = {};
    colors.bg = {};
    colors.text = {};

    colors.bg.unknown = '#000000';
    colors.bg.stale = '#666666';
    colors.bg.scanned = '#cccccc';
    colors.bg.visible = '#ffffff';

    colors.text.unknown = '#ffffff';
    colors.text.stale = '#ffffff';
    colors.text.scanned = '#000000';
    colors.text.visible = '#000000';

    if (props.colors) {
      if (props.colors.bg) {
        for (var color in props.colors.bg) {
          colors.bg[color] = props.colors.bg[color];
        }
      }
    }
    // console.log("colors=" + Object.entries(colors.bg));
    return colors;
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

    // var x = this.attrs.x;
    // var y = this.attrs.y;
    var shortSide = this.attrs.shortSide;
    var longSide = this.attrs.longSide;
    var radius = this.attrs.radius;
    var sector = this.attrs.sector;
    var galaxy = this.attrs.galaxy;
    // console.log("x,y= " + x + "," + y);
    // console.log("keys = " + Object.keys(this.attrs));
    // console.log("short, long = " + shortSide + "," + longSide);

    // draw coords
    var coordText = sector.oblique + "," + sector.y;
    context.rotate(100);
    context.font = '10px Calibri';
    context.textAlign = 'center';
    context.fillStyle = this.attrs.hexTextColor;
    context.fillText(coordText, 0, this.attrs.hexTextY);
    context.rotate(0);

    // draw world
    var worldName = sector.world;
    if (worldName) {
      var size = shortSide/2;
      context.beginPath();
      context.fillStyle = '#CCCCCC';
      context.strokeStyle = '#CCCCCC';
      context.arc(0, 0, size, 0, 2 * Math.PI, false);
      context.fill();
      context.stroke();
      context.closePath();
     
      var world = galaxy.worlds[worldName];
      // draw production
      context.textAlign = 'center';
      context.beginPath();
      context.font = '14px Calibri';
      context.strokeStyle = '#000000';
      context.strokeText(world.production, 0, 5);
      context.closePath();      

      // draw blockade/interdiction
      context.beginPath();
      context.strokeStyle = '#FF0000';
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
    }

    var portals = sector.portals;
    if (portals) {
      console.log("hex " + sector.oblique + "," + sector.y + " portals " + Object.values(portals));
      // if any portal collapsed, draw a smaller icon, else draw normal size
      var angleValue = 1;
      Object.values(portals).forEach((pname) => {
        var portal = galaxy.portals[pname];
        var collapsed = portal.collapsed;
        if (collapsed) {
          angleValue = 0.3;
        }
      });
      context.beginPath();
      context.moveTo(0, 0);
      for (var i = 0; i < 150; i++) {
        var angle = 0.1 * i;
        var x = (angleValue * angle) * Math.cos(angle);
        var y = (angleValue * angle) * Math.sin(angle);
        context.lineTo(x, y);
      }
      context.strokeStyle = "#009900";
      context.stroke();
      context.closePath();
    }

    // draw storm
    var storms = sector.storms;
    if (storms) {
      context.beginPath();
      context.strokeStyle = '#FF0000';
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


    // draw hex
    context.beginPath();
    context.strokeStyle = '#000000';
    context.moveTo(-shortSide, -longSide);
    context.lineTo(shortSide, -longSide);
    context.lineTo(radius, 0);
    context.lineTo(shortSide, longSide);
    context.lineTo(-shortSide, longSide);
    context.lineTo(-radius, 0);
    context.lineTo(-shortSide, -longSide);
    context.stroke();
    context.closePath();


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
      hexTextColor = { this.state.textColor }
      shortSide = { this.SHORT_SIDE }
      longSide = { this.LONG_SIDE }
      sides = { this.SIDES }
      rotation = { this.ROTATION }
      radius = { this.RADIUS }
      fill = { this.state.bgColor }
      sceneFunc = { this.sceneFunc }
      stroke = { 'black' }
      strokeWidth = { this.STROKE_WIDTH }
      onClick = { this.handleClick }
      />
    );
  }
}