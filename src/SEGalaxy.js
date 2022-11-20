import React from 'react';
import './index.css';
import { Konva, Stage, Layer,Rect,Text,Group } from 'react-konva';
import { Hex} from './SEHex';
import { PortalLines} from './SEPortalLines';
import { SEInfoPopup } from './SEInfoPopup';

export class Galaxy extends React.Component {
  constructor(props) {
    super(props);
    console.log("Galaxy constructor");
    var galaxy = props.data;
    var hexes = this.buildHexes(galaxy);
    this.state = {
        json:JSON.stringify(galaxy, null, 2),
        galaxy: galaxy,
        hexes:hexes,
        ttx:0,
        tty:0,
        ttvisible:false,
        tttext:null,
        clickx:0,
        clicky:0,
        clickvisible:false,
        clicksector:null,
        clicktext:null,
        menux:0,
        menuy:0,
        menuvisible:false,
        menutext:null,
    } 
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    console.log("error = " + error);
    console.log("info = " + info);
  }  

  componentDidMount() {
    console.log("Galaxy did mount");
  }

  buildHexes(galaxy) {
     var hexes = [];
    var key = 0;
    var radius = 1;
    var cols = 2 * radius + 1;
    var oblique;
    var y;
    var row;
    var column;
    var hex;
    var hexid;  

    for (y = radius; y >= 0; y--) {
         for (oblique = y - radius; oblique <= radius; oblique++) {
              hexid = (oblique < 0 ? "n" + -oblique : oblique) + "_" + (y < 0 ? "n" + y: y);
              row = -2 * y+ oblique + 2 * radius;
              column = oblique + Math.floor(cols / 2);
              // console.log("Creating hex " + oblique + "," + y + " id = " + hexid);
              hex = <Hex 
                        key = {key++}
                        row = {row}
                        hexid = {hexid}
                        column = {column}
                        galaxy = {galaxy}
                        listening = {true}
                        mouseEnterFn = {this.galaxyMouseEnter}
                        mouseOutFn = {this.galaxyMouseOut}
                        onClickFn = {this.galaxyClick}
                    />
              hexes.push(hex);    
         }
     }

     for (y = -1; y >= -radius; y--) {
          for (oblique = -radius; oblique <= radius + y; oblique++) {
              hexid = (oblique < 0 ? "n" + -oblique : oblique) + "_" + (y < 0 ? "n" + -y: y);
               row = -2 * y+ oblique + 2 * radius;
               column = oblique + Math.floor(cols / 2);
              //  console.log("Creating hex " + oblique + "," + y + " id = " + hexid);
               hex = <Hex 
                         key = {key++}
                         row = {row}
                         hexid = {hexid}
                         column = {column}
                         galaxy = {galaxy}
                         listening = {true}
                        mouseEnterFn = {this.galaxyMouseEnter}
                        mouseOutFn = {this.galaxyMouseOut}
                        onClickFn = {this.galaxyClick}
                    />
               hexes.push(hex);    
          }
     }
     console.log("Created " + hexes.length + " hexes");
     return hexes; 
  }

  getSectorText(sector, galaxy) {
    var sectorText = "";
    if (sector) {
      var hexOb = sector.oblique;
      var hexY = sector.y;
      sectorText = hexOb + "," + hexY;
      var worldName = sector.world;
      if (worldName) {
        var world = galaxy.worlds[worldName];
        var production = world.production;
        sectorText += " " + worldName + "(" + production + ")";
      }
    }
    return sectorText;
  }

  galaxyMouseEnter = (e) => {
        // console.log("galaxy xy " + x + ", " + y);
    // console.log("galaxy e " + JSON.stringify(e));
    var sector = e.target.attrs.sector;
    if (sector) {
        var sectorText = this.getSectorText(sector, e.target.attrs.galaxy);
        var x = e.target.attrs.x;
        var y = e.target.attrs.y;
        this.setState({ttx:x + 20, tty:y + 20, ttvisible: true, tttext:sectorText});
        // console.log("galaxy enter coord " + sectorText);
    }
  }

  galaxyMouseOut = (e) => {
    // var sector = e.target.attrs.sector;
    // if (sector) {
    //     var hex_ob = sector.oblique;
    //     var hex_y = sector.y;
    //    console.log("galaxy leave coord " + hex_ob + ", hex_y " + hex_y);
       this.setState({ttvisible:false});
    // }    
  }

  galaxyClick = (e) => {
    //     for (var name in e.evt) {
    //         console.log(name + " = " + e.evt[name]);
    // }
    var sector = e.target.attrs.sector;
    var button = e.evt.button;
    if (sector === undefined || sector === this.state.clicksector) {
       this.setState({
          clickvisible: false,
          ttvisible: false
        });
    }
    else {
        var sectorText = this.getSectorText(sector, e.target.attrs.galaxy);
        var x = e.target.attrs.x;
        var y = e.target.attrs.y;
        if (button === 0) {
            this.setState({
              clickx: x + 20,
              clicky: y + 20,
              clickvisible: true,
              clicktext: sectorText,
              clicksector: sector
            });
        }
        else {
            this.setState({
              menux: x + 20,
              menuy: y + 20,
              menuvisible: true,
              menutext: sectorText,
              menusector: sector
            });
        }     
    }
  }

  render()
  {
    if (this.state.hexes == null) {
      return (<Layer></Layer> ) 
    }

    return(
      <Stage width={500} height={500} scaleX={1.0} scaleY={1.0} >
      <Layer>
       {this.state.hexes}
      </Layer>
      <Layer>
        <PortalLines galaxy={this.state.galaxy} /> 
      </Layer>
      <Layer>
        <Group>
        <Rect fill={'#ddd'} stroke={'#555'}
                 height={50} width={200}
               x={this.state.clickx} y={this.state.clicky} 
               visible={this.state.clickvisible}
                onClick={this.galaxyClick}
               />               
         <Text fill={'black'}
                 padding={10} fontSize={12}
                fontFamily={'Calibri'}
                 align={'left'}
                 width={200}
                 height={50}
                x={this.state.clickx} y={this.state.clicky} 
                visible={this.state.clickvisible}
                onClick={this.galaxyClick}
                text={this.state.clicktext}/>              

          <Rect fill={'#ddd'} stroke={'#555'}
                 height={50} width={200}
               x={this.state.menux} y={this.state.menuy} 
               visible={this.state.menuvisible}
                onClick={this.galaxyClick}
               />               
         <Text fill={'black'}
                 padding={10} fontSize={12}
                fontFamily={'Calibri'}
                 align={'left'}
                 width={200}
                 height={50}
                x={this.state.menux} y={this.state.menuy} 
                visible={this.state.menuvisible}
                onClick={this.galaxyClick}
                text={'menu'}/>              


        <Rect fill={'#ddd'} stroke={'#555'}
                 height={50} width={200}
               x={this.state.ttx} y={this.state.tty} 
               visible={this.state.ttvisible}
                listening = {false}
               />
         <Text fill={'black'}
                 padding={10} fontSize={12}
                fontFamily={'Calibri'}
                 align={'left'}
                 width={200}
                 height={50}
                x={this.state.ttx} y={this.state.tty} 
                visible={this.state.ttvisible}
                listening = {false}
                text={this.state.tttext}/>
          </Group>  
      </Layer>
      </Stage>
    )
  }
}