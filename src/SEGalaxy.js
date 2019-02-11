import React from 'react';
import './index.css';
import { Stage, Layer,Rect,Text,Group } from 'react-konva';
import { Hex} from './SEHex';
import { PortalLines} from './SEPortalLines';

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
        tttext:null
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
   
                    />
               hexes.push(hex);    
          }
     }
     console.log("Created " + hexes.length + " hexes");
     return hexes; 
  }

  galaxyMouseEnter = (e) => {
        // console.log("galaxy xy " + x + ", " + y);
    // console.log("galaxy e " + JSON.stringify(e));
    var sector = e.target.attrs.sector;
    if (sector) {
        var hex_ob = sector.oblique;
        var hex_y = sector.y;
        var x = e.target.attrs.x;
        var y = e.target.attrs.y;
        var tttext = hex_ob + "," + hex_y;
        this.setState({ttx:x + 20, tty:y + 20, ttvisible: true, tttext:tttext});
        console.log("galaxy enter coord " + hex_ob + ", hex_y " + hex_y);
    }
    // console.log("galaxy screen x " + e.screenX + ", y " + e.screenY);
    // console.log("galaxy target " + e.relatedTarget);
  }

  galaxyMouseOut = (e) => {
    var sector = e.target.attrs.sector;
    if (sector) {
        var hex_ob = sector.oblique;
        var hex_y = sector.y;
       console.log("galaxy leave coord " + hex_ob + ", hex_y " + hex_y);
       this.setState({ttvisible:false});
    }    
  }

  render()
  {
    console.log("galaxy render");

    if (this.state.hexes == null) {
      return (<Layer></Layer> ) 
    }

    var text = "<span color='red'>foo</span>";
    const data = [{ name: 'Tanner Linsley', age: 26},
                  {name: 'Jason Maurer', age: 23 }];
    const columns = [{ Header: 'Name', accessor: 'name' }, 
                     { Header: 'Age', accessor: 'age',
               Cell: props => <span className='number'>{props.value}</span> }];
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
                 height={70} width={50}
               x={this.state.ttx} y={this.state.tty} 
               visible={this.state.ttvisible}
               />
         <Text fill={'black'}
                 padding={10} fontSize={12}
                fontFamily={'Calibri'}
                 align={'left'}
                 width={70}
                 height={50}
                x={this.state.ttx} y={this.state.tty} 
                visible={this.state.ttvisible}
                text={this.state.tttext}/>
          </Group>  
      </Layer>
      </Stage>
    )
  }
}