import React from 'react';
import './index.css';
import { Stage, Layer } from 'react-konva';
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
   
                    />
               hexes.push(hex);    
          }
     }
    console.log("Created " + hexes.length + " hexes");
   return hexes; 
  }

  render()
  {
    
    console.log("galaxy render");

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
      </Stage>
    )
  }
}