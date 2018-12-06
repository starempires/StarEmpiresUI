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
    this.RADIUS = 30;
    this.SHORT_SIDE = this.RADIUS / 2;
    this.LONG_SIDE = SQRT_THREE * this.RADIUS / 2;

    // console.log("Creating hex " + props.hexid);
    //console.log("radius, short, long = " + this.RADIUS + "," + this.SHORT_SIDE + "," + this.LONG_SIDE);
    this.state = {
      row: props.row,
      column: props.column,
      x: (this.getXCount(props.column)) * this.RADIUS + ((props.column % 2) * this.SHORT_SIDE) + this.X_OFFSET,
      y: ((props.row + 1) * this.LONG_SIDE) + this.Y_OFFSET,

      sector: props.sector,
      ships: props.ships,
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
    // console.log("height = " + this.refs.textitem.textHeight);
    // console.log("width = " + this.refs.textitem.textWidth);
    // console.log("x,y = " + this.refs.textitem.x + "," + this.refs.textitem.y);
  }

  sf(context) {

    // var x = this.attrs.x;
    // var y = this.attrs.y;
    var shortSide = this.attrs.shortSide;
    var longSide = this.attrs.longSide;
    var radius = this.attrs.radius;
    var sector = this.attrs.sector;
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
    var world = sector.world;
    if (world) {
      context.beginPath();
      context.moveTo(0, 0)
      context.fillStyle = '#000000';
      context.arc(0, 0, 3, 0, 3 * Math.PI, false);
      context.fill();
      context.stroke();
      context.closePath();
    }

    var portals = sector.portals;
    if (portals) {
      console.log("hex " + sector.oblique + "," + sector.y + " portals " + Object.values(portals));
      context.beginPath();
      context.moveTo(0, 0);
      for (var i = 0; i < 120; i++) {
        var angle = 0.1 * i;
        var x = 0 + (1 + 1 * angle) * Math.cos(angle);
        var y = 0 + (1 + 1 * angle) * Math.sin(angle);
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
    return ( <Shape x = {x} 
                    y = {y} 
                    sector = {this.state.sector} 
                    hexText = {hexText} 
                    hexTextY = {hexTextY} 
                    hexTextColor = { this.state.textColor }
                    shortSide = { this.SHORT_SIDE }
                    longSide = { this.LONG_SIDE }
                    sides = { this.SIDES }
                    rotation = { this.ROTATION }
                    radius = { this.RADIUS }
                    fill = { this.state.bgColor }
                    sceneFunc = { this.sf }
                    stroke = { 'black' }
                    strokeWidth = { this.STROKE_WIDTH }
                    onClick = { this.handleClick }
              />
    );
  }
}